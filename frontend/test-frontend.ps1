# test-frontend.ps1 - Comprobaciones rapidas del frontend Just Enjoy
#
# Encadena:
#   Paso 2 - Calidad: typecheck (tsc) + lint (eslint)
#   Paso 4 - Seguridad: pruebas de auth via curl contra la app corriendo
#
# Uso:
#   .\test-frontend.ps1                 # autodetecta el puerto (3000/3001)
#   .\test-frontend.ps1 -BaseUrl http://localhost:3005
#   .\test-frontend.ps1 -SkipQuality    # solo pruebas de seguridad
#   .\test-frontend.ps1 -SkipSecurity   # solo calidad
#
# El verde/rojo de SEGURIDAD significa seguro/inseguro:
#   los ROJOS son las vulnerabilidades actuales; cuando se arregle la auth,
#   deberian pasar a verde. Reejecuta este script para comprobarlo.

param(
    [string]$BaseUrl = "",
    [switch]$SkipQuality,
    [switch]$SkipSecurity
)

$ErrorActionPreference = "Continue"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Definition
Set-Location $ScriptDir

# ---- Helpers de salida ----
$script:pass = 0
$script:fail = 0
$script:warn = 0

function Write-Head { param($m) Write-Host "`n==== $m ====" -ForegroundColor Cyan }
function Write-Pass { param($m) Write-Host "  [ OK ] $m" -ForegroundColor Green; $script:pass++ }
function Write-Fail { param($m) Write-Host "  [FAIL] $m" -ForegroundColor Red;   $script:fail++ }
function Write-Warn { param($m) Write-Host "  [WARN] $m" -ForegroundColor Yellow; $script:warn++ }
function Write-Info { param($m) Write-Host "         $m" -ForegroundColor DarkGray }

# curl.exe es un ejecutable, no le afecta la execution policy de PowerShell
$curl = "curl.exe"

function Get-HttpCode {
    param($Method = "GET", $Url, $Cookie = $null, $BodyFile = $null)
    $args = @("-s", "-o", "NUL", "-w", "%{http_code}", "--max-time", "10", "-X", $Method)
    if ($Cookie)   { $args += @("--cookie", $Cookie) }
    if ($BodyFile) { $args += @("-H", "Content-Type: application/json", "-d", "@$BodyFile") }
    $args += $Url
    return (& $curl @args)
}

# =====================================================================
# PASO 2 - CALIDAD
# =====================================================================
if (-not $SkipQuality) {
    Write-Head "PASO 2 - Calidad (typecheck + lint)"

    Write-Host "  Ejecutando tsc --noEmit ..." -ForegroundColor DarkGray
    & npx.cmd tsc --noEmit 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) { Write-Pass "TypeScript: sin errores de tipos" }
    else { Write-Fail "TypeScript: hay errores de tipos (revisa con: npx tsc --noEmit)" }

    Write-Host "  Ejecutando eslint ..." -ForegroundColor DarkGray
    $lintOut = & npx.cmd eslint . 2>&1
    $lintExit = $LASTEXITCODE
    $errCount  = ([regex]::Matches(($lintOut -join "`n"), "\berror\b")).Count
    $warnCount = ([regex]::Matches(($lintOut -join "`n"), "\bwarning\b")).Count
    if ($lintExit -eq 0) {
        Write-Pass "ESLint: limpio"
    } else {
        # Los errores de ESLint NO bloquean 'next build' en Next 16, por eso es WARN
        Write-Warn "ESLint: $errCount errores / $warnCount warnings (no bloquean el build, pero conviene corregir)"
        Write-Info "Detalle: npx eslint ."
    }
} else {
    Write-Host "`n(Calidad omitida con -SkipQuality)" -ForegroundColor DarkGray
}

# =====================================================================
# PASO 4 - SEGURIDAD
# =====================================================================
if (-not $SkipSecurity) {
    Write-Head "PASO 4 - Seguridad (auth via curl)"

    # --- Detectar la app corriendo ---
    $candidates = @()
    if ($BaseUrl) { $candidates += $BaseUrl } else { $candidates += @("http://localhost:3000", "http://localhost:3001") }

    $target = $null
    foreach ($c in $candidates) {
        $code = Get-HttpCode -Url "$c/login"
        if ($code -eq "200") { $target = $c; break }
    }

    if (-not $target) {
        Write-Warn "No se encontro la app corriendo en $($candidates -join ', ')."
        Write-Info "Arranca primero en otra terminal:  npm run dev   (o npm start tras npm run build)"
        Write-Info "O indica la URL:  .\test-frontend.ps1 -BaseUrl http://localhost:PUERTO"
    } else {
        Write-Info "App detectada en $target"

        # Cuerpo de ejemplo para /api/plan-trip
        $body = '{"destination":"Lisboa","budget":"low","origin":"Madrid","dates":{"start":"2026-09-01","end":"2026-09-04","flexible":false},"travelers":{"adults":1,"children":0},"style":["culture"],"pace":"medium","restrictions":[]}'
        $bodyFile = Join-Path $env:TEMP "je_plan_body.json"
        Set-Content -Path $bodyFile -Value $body -Encoding UTF8 -NoNewline

        # 1) El proxy protege rutas sin cookie -> se espera 307 (redirect a /login)
        $c1 = Get-HttpCode -Url "$target/dashboard"
        if ($c1 -eq "307") { Write-Pass "Proxy activo: /dashboard sin cookie redirige (307)" }
        else { Write-Fail "Proxy NO protege /dashboard sin cookie (codigo $c1, se esperaba 307)" }

        # 2) BYPASS: cookie inventada -> SEGURO seria 307; INSEGURO es 200
        $c2 = Get-HttpCode -Url "$target/dashboard" -Cookie "justenjoy-session=falso-no-verificado"
        if ($c2 -eq "307") { Write-Pass "Sin bypass: cookie falsa es rechazada (307)" }
        elseif ($c2 -eq "200") { Write-Fail "BYPASS DE AUTH: cookie inventada entra a /dashboard (200)" }
        else { Write-Warn "/dashboard con cookie falsa devolvio codigo inesperado: $c2" }

        # 3) El endpoint de sesion NO debe acunar sesion con token invalido
        $tokFile = Join-Path $env:TEMP "je_token_body.json"
        Set-Content -Path $tokFile -Value '{"idToken":"esto-no-es-un-jwt-de-firebase"}' -Encoding UTF8 -NoNewline
        $c3 = Get-HttpCode -Method "POST" -Url "$target/api/auth/session" -BodyFile $tokFile
        if ($c3 -eq "401" -or $c3 -eq "403") { Write-Pass "Sesion: token invalido rechazado ($c3)" }
        elseif ($c3 -eq "200") { Write-Fail "ORACULO DE COOKIES: /api/auth/session acuna sesion con token falso (200)" }
        else { Write-Warn "/api/auth/session con token falso devolvio: $c3" }

        # 4) La API de planificacion NO debe responder sin autenticacion
        $c4 = Get-HttpCode -Method "POST" -Url "$target/api/plan-trip" -BodyFile $bodyFile
        if ($c4 -eq "401" -or $c4 -eq "403") { Write-Pass "API protegida: /api/plan-trip exige auth ($c4)" }
        elseif ($c4 -eq "200") { Write-Fail "API ABIERTA: /api/plan-trip responde sin autenticacion (200)" }
        else { Write-Warn "/api/plan-trip sin auth devolvio: $c4" }

        Remove-Item $bodyFile, $tokFile -ErrorAction SilentlyContinue
    }
} else {
    Write-Host "`n(Seguridad omitida con -SkipSecurity)" -ForegroundColor DarkGray
}

# =====================================================================
# RESUMEN
# =====================================================================
Write-Host "`n==== RESUMEN ====" -ForegroundColor Cyan
Write-Host "  OK:   $script:pass" -ForegroundColor Green
Write-Host "  FAIL: $script:fail" -ForegroundColor Red
Write-Host "  WARN: $script:warn" -ForegroundColor Yellow

if ($script:fail -gt 0) {
    Write-Host "`nHay $script:fail comprobacion(es) en rojo." -ForegroundColor Red
    Write-Host "En SEGURIDAD, cada rojo es una vulnerabilidad a corregir (auth). Reejecuta tras el fix." -ForegroundColor Red
    exit 1
} else {
    Write-Host "`nTodo en verde (sin FAIL)." -ForegroundColor Green
    exit 0
}
