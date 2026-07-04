# verify.ps1 — Script de verificacion local para Just Enjoy
# Entorno: Windows nativo (PowerShell 5.1+)
#
# Uso: .\verify.ps1
# Ejecuta este script ANTES de hacer commit (la definicion de hecho lo exige).
# Sale con codigo 0 si todo pasa; codigo 1 si algo falla.

$ErrorActionPreference = 'Stop'
$failed = $false

function Write-Step { param($msg) Write-Host "`n==> $msg" -ForegroundColor Cyan }
function Write-OK   { param($msg) Write-Host "    [OK] $msg" -ForegroundColor Green }
function Write-FAIL { param($msg) Write-Host "    [FAIL] $msg" -ForegroundColor Red; $script:failed = $true }
function Write-SKIP { param($msg) Write-Host "    [SKIP] $msg" -ForegroundColor Yellow }
function Write-WARN { param($msg) Write-Host "    [WARN] $msg" -ForegroundColor Yellow }

# ── Paso 1: Verificar que ningun .env esta SIN ignorar por git ────────────────
# Tener un .env local es el flujo normal (el README indica: cp .env.example .env).
# Lo que NO debe pasar es que ese .env sea rastreable por git. Comprobamos eso,
# no su mera existencia. Si git no esta disponible o no hay repo, se hace SKIP
# (no es concluyente) en vez de FAIL, igual que el Paso 2.
Write-Step "Comprobando que los ficheros .env esten ignorados por git"

$envFiles = Get-ChildItem -Path . -Filter ".env" -Recurse -Force -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch '\\node_modules\\' -and $_.Name -ne '.env.example' }

if ($envFiles.Count -eq 0) {
    Write-OK "No hay ficheros .env en el directorio de trabajo"
} else {
    # git puede no estar en el PATH; lo envolvemos como en el Paso 2 para no
    # abortar el script entero ($ErrorActionPreference='Stop').
    try {
        foreach ($envFile in $envFiles) {
            # git check-ignore --quiet sale con:
            #   0   -> la ruta esta ignorada (OK)
            #   1   -> NO esta ignorada (riesgo real -> FAIL)
            #   128 -> no es un repo git / error de git (no es concluyente -> SKIP)
            $null = git check-ignore --quiet -- $envFile.FullName 2>$null
            switch ($LASTEXITCODE) {
                0 { Write-OK "$($envFile.Name) existe pero esta ignorado por git" }
                1 {
                    Write-FAIL "$($envFile.Name) NO esta ignorado por git (riesgo de commitear secretos):"
                    Write-Host "      $($envFile.FullName)" -ForegroundColor Red
                    Write-Host "      Anadelo a .gitignore antes de continuar." -ForegroundColor Red
                }
                default {
                    Write-SKIP "$($envFile.Name): git no pudo comprobar el ignore (codigo $LASTEXITCODE; repo no inicializado?)"
                }
            }
        }
    } catch {
        Write-SKIP "No se pudo ejecutar git (puede que no este instalado o el repo no este inicializado)"
    }
}

# ── Paso 2: Verificar que .env no esta en git staging ─────────────────────────
Write-Step "Comprobando que .env no esta en el staging de git"

try {
    $staged = git diff --cached --name-only 2>$null
    $envStaged = $staged | Where-Object { $_ -match '\.env$' -and $_ -notmatch '\.env\.example' }
    if ($envStaged) {
        Write-FAIL "Fichero .env detectado en staging de git. Retiralo con: git reset HEAD .env"
    } else {
        Write-OK "Ningun .env en staging"
    }
} catch {
    Write-SKIP "No se pudo ejecutar git (puede que el repo no este inicializado aun)"
}

# ── Paso 3: Validar que los JSONs de n8n son validos ─────────────────────────
Write-Step "Validando JSON de workflows n8n"

$jsonFiles = Get-ChildItem -Path "n8n/workflows" -Filter "*.json" -ErrorAction SilentlyContinue
if ($jsonFiles.Count -eq 0) {
    Write-SKIP "No hay workflows JSON en n8n/workflows/ todavia"
} else {
    foreach ($file in $jsonFiles) {
        try {
            $content = Get-Content $file.FullName -Raw -Encoding UTF8
            $null = $content | ConvertFrom-Json
            Write-OK "$($file.Name) es JSON valido"
        } catch {
            Write-FAIL "$($file.Name) tiene JSON invalido: $($_.Exception.Message)"
        }
    }
}

# ── Paso 4: Verificar que .env.example existe ─────────────────────────────────
Write-Step "Comprobando .env.example"

if (Test-Path ".env.example") {
    Write-OK ".env.example existe"
} else {
    Write-FAIL ".env.example no encontrado (necesario para documentar variables)"
}

# ── Paso 5: Verificar que el guardian de secretos (gitleaks) ESTA ACTIVO ──────
# No basta con que pre-commit este instalado como herramienta: el hook debe estar
# REGISTRADO en este repo (.git/hooks/pre-commit). Sin eso, gitleaks no se dispara
# en los commits y la proteccion de secretos no existe. Comprobamos lo que importa.
Write-Step "Comprobando el guardian de secretos (gitleaks via pre-commit)"

$precommitOk = $false
$toolPresent = $null -ne (Get-Command pre-commit -ErrorAction SilentlyContinue)
$hookPath = ".git/hooks/pre-commit"
$hookInstalled = (Test-Path $hookPath) -and (Select-String -Path $hookPath -Pattern "pre-commit" -Quiet -ErrorAction SilentlyContinue)

if (-not $toolPresent) {
    Write-FAIL "pre-commit NO esta instalado. El guardian de secretos esta INACTIVO."
    Write-Host "         Instalalo con: pip install pre-commit && pre-commit install" -ForegroundColor Red
} elseif (-not $hookInstalled) {
    Write-FAIL "pre-commit esta instalado PERO el hook NO esta activado en este repo."
    Write-Host "         gitleaks NO bloqueara secretos hasta que ejecutes: pre-commit install" -ForegroundColor Red
} else {
    Write-OK "Guardian de secretos activo (hook pre-commit registrado en el repo)"
    $precommitOk = $true
}

# ── Paso 6: Calidad del frontend (typecheck duro + lint informativo) ──────────
# `tsc --noEmit` es GATE DURO: hoy pasa limpio y atrapa regresiones de tipos.
# `npm run lint` es INFORMATIVO (WARN): hay deuda de ESLint conocida que NO bloquea
# `next build` (Next 16) y que se esta reduciendo; cuando el lint quede limpio,
# eleva ese bloque a Write-FAIL (gate duro). `next build` queda fuera por lentitud
# (comprobacion manual: cd frontend; npm run build).
Write-Step "Comprobando la calidad del frontend (typecheck + lint)"

$frontendDir = "frontend"
if (-not (Test-Path $frontendDir)) {
    Write-SKIP "No existe el directorio frontend/ (nada que comprobar aqui)"
} elseif (-not (Test-Path (Join-Path $frontendDir "node_modules"))) {
    Write-SKIP "frontend/node_modules no instalado. Ejecuta 'npm install' en frontend/ (se omite la calidad)"
} elseif ($null -eq (Get-Command npx -ErrorAction SilentlyContinue)) {
    Write-SKIP "npx no esta en el PATH; no se pueden ejecutar tsc/eslint"
} else {
    Push-Location $frontendDir
    try {
        # Typecheck: gate duro
        & npx tsc --noEmit 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-OK "TypeScript: sin errores de tipos (tsc --noEmit)"
        } else {
            Write-FAIL "TypeScript: hay errores de tipos. Revisa con: cd frontend; npx tsc --noEmit"
        }

        # Lint: informativo, no bloquea (deuda conocida)
        if ($null -ne (Get-Command npm -ErrorAction SilentlyContinue)) {
            $lintOut = & npm run --silent lint 2>&1
            if ($LASTEXITCODE -eq 0) {
                Write-OK "ESLint: limpio"
            } else {
                $joined = ($lintOut -join "`n")
                $errCount  = ([regex]::Matches($joined, "\berror\b")).Count
                $warnCount = ([regex]::Matches($joined, "\bwarning\b")).Count
                Write-WARN "ESLint: $errCount errores / $warnCount warnings (deuda conocida; no bloquea el gate). Detalle: cd frontend; npm run lint"
            }
        } else {
            Write-SKIP "npm no esta en el PATH; se omite el lint del frontend"
        }
    } finally {
        Pop-Location
    }
}

# ── Resultado final ───────────────────────────────────────────────────────────
Write-Host ""
if ($failed) {
    Write-Host "==> VERIFICACION FALLIDA. Corrige los errores antes de commitear." -ForegroundColor Red
    exit 1
} else {
    Write-Host "==> VERIFICACION CORRECTA." -ForegroundColor Green
    if (-not $precommitOk) {
        Write-Host "    Recuerda instalar pre-commit para activar el guardarian de secretos." -ForegroundColor Yellow
    }
    exit 0
}
