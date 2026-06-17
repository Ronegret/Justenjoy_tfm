# Guía de contribución — Just Enjoy

Bienvenido al repositorio de **Just Enjoy** (TFM Grupo 7).
Lee esta guía antes de hacer tu primera contribución.

---

## Configuración inicial (una sola vez por máquina)

```powershell
# 1. Clonar el repositorio (solo la primera vez)
git clone https://github.com/enriqueizquierdo-lab/TFM_G7_Just_Enjoy.git
cd TFM_G7_Just_Enjoy

# 2. Copiar las variables de entorno
cp .env.example .env
# Edita .env con tus claves reales (NUNCA commitees este fichero)

# 3. Configurar git para Windows (evita problemas de saltos de línea)
git config --global core.autocrlf input

# 4. Instalar gitleaks (el guardián de secretos) — TODOS, uses el antivirus que uses
#    En Windows:
winget install Gitleaks.Gitleaks --source winget
#    En macOS:  brew install gitleaks
#    En Linux:  ver https://github.com/gitleaks/gitleaks#installing
# Reinicia la terminal para que 'gitleaks' quede en el PATH

# 5. Instalar y activar pre-commit
pip install pre-commit
pre-commit install
```

> Si `python` abre la Microsoft Store en lugar de ejecutarse, instala Python desde
> [python.org](https://www.python.org/downloads/) y asegúrate de marcar
> "Add Python to PATH" durante la instalación.

> ℹ️ **Por qué gitleaks se instala aparte (aplica a todo el equipo):**
> El hook de gitleaks está configurado como binario nativo (`language: system` en
> `.pre-commit-config.yaml`), así que **cada persona debe tener `gitleaks` instalado**
> (paso 4 de arriba), independientemente de su antivirus. Se decidió así porque es
> la única configuración que funciona por igual para todos: con o sin antivirus que
> inspeccione SSL. La instalación nativa es un único comando y no se cuelga.

> ⚠️ **Solo si tu antivirus inspecciona SSL (Norton 360, ESET, Kaspersky…):**
> Puede que `git`, `pip` o `pre-commit install` fallen con `CERTIFICATE_VERIFY_FAILED`.
> Si te ocurre, sigue la sección **"Antivirus que inspecciona SSL"** al final de este
> documento. **Si no tienes ese tipo de antivirus, ignora esa sección: no la necesitas.**
>
> Nota: los hooks universales de `pre-commit-hooks` (validar JSON/YAML, detectar
> claves privadas) se descargan por Python; con un antivirus que rompa el SSL pueden
> fallar. El guardián principal (**gitleaks**) es nativo y no depende de eso, y
> `verify.ps1` valida los JSON igualmente.

---

## Política de ramas (Git Flow)

Este repo usa **Git Flow** con dos ramas permanentes y ramas de trabajo de vida corta:

```
main      ←── solo se mergea desde develop (releases estables)
develop   ←── rama de integración; aquí se mergean todas las features
features  ←── salen de develop y se mergean de vuelta a develop
```

### Rama `main` (producción)
- **Nadie hace push directo a `main`**, nunca.
- **La ÚNICA rama que puede mergearse a `main` es `develop`.** Ninguna feature va directa a `main`.
- Representa el estado estable/entregable del proyecto.

### Rama `develop` (integración)
- **Nadie hace push directo a `develop`.**
- Todas las features entran por Pull Request con al menos **1 aprobación** de otro integrante.
- Los PR se mergean solo cuando `verify.ps1` pasa en local.

### Ramas de trabajo
Crea una rama **desde `develop`** por cada tarea. Usa el prefijo adecuado:

```
feature/nombre-descriptivo    # Nueva funcionalidad
fix/nombre-del-bug            # Corrección de error
docs/lo-que-se-documenta      # Solo documentación
chore/tarea-de-mantenimiento  # Dependencias, configuración
```

Ejemplo:
```powershell
git checkout develop && git pull
git checkout -b feature/portal-viajero-login
```

### Flujo completo de un cambio

```
1. Crea tu rama desde develop actualizado:
   git checkout develop && git pull && git checkout -b feature/mi-tarea

2. Desarrolla y commitea con frecuencia:
   git add -p          # Revisa qué añades (evita añadir .env por error)
   .\verify.ps1        # Pasa la verificación
   git commit -m "feat: descripcion en espanol"

3. Sube tu rama:
   git push -u origin feature/mi-tarea

4. Abre un Pull Request en GitHub contra develop (NO contra main).
   Usa la plantilla de PR y completa el checklist.

5. Solicita revisión a otro integrante del grupo.

6. Tras la aprobación, el autor del PR hace el merge a develop.

7. Release: cuando develop está estable y se quiere entregar, se abre
   un PR develop -> main (esta es la única vía hacia main).
```

---

## Mensajes de commit

Formato: `tipo: descripcion breve en imperativo (en español)`

| Prefijo | Cuándo usarlo |
|---|---|
| `feat:` | Nueva funcionalidad |
| `fix:` | Corrección de bug |
| `docs:` | Solo cambios de documentación |
| `chore:` | Mantenimiento, dependencias, configuración |
| `test:` | Añadir o corregir tests/ejemplos |
| `refactor:` | Refactor sin cambio de comportamiento |

Ejemplos:
```
feat: añadir soporte para viajes multi-destino en el planificador
fix: corregir conversion de ciudad a codigo IATA para ciudades con tilde
docs: actualizar arquitectura con nuevo nodo Google Maps Directions
chore: actualizar version de gitleaks en pre-commit
```

---

## Contribuir con IA

Si usas un agente IA (Claude, Copilot, ChatGPT, etc.) para generar o revisar código:

1. **Lee primero `AGENTS.md`** — es el contrato del repo para agentes IA.
2. Lee `docs/ARCHITECTURE.md` y los ADRs relevantes antes de pedir cambios estructurales.
3. **El autor del PR es responsable del código**, sea cual sea su origen.
4. Marca el título del PR con `[AI-generated]` si la mayor parte del código fue generado por IA.
5. Completa el checklist de IA de la plantilla del PR.
6. Valida con datos reales que el comportamiento es el esperado.

---

## Política de dependencias

Antes de añadir una dependencia nueva al proyecto:
1. Comunícalo al grupo (crea un issue o discútelo en el PR).
2. Verifica que existe en el registro oficial (npm, PyPI, etc.) con actividad reciente.
3. Justifica por qué es necesaria frente a lo que ya existe en el proyecto.
4. Ejecuta `npm audit` o `pip-audit` tras instalar.

---

## Branch protection en GitHub

> ⚠️ **LIMITACIÓN CONOCIDA (verificado 2026-06-16):** GitHub **NO aplica** branch
> protection (ni *rulesets* ni *classic branch protection*) en repos **privados de
> cuentas personales gratuitas**. Al crear cualquier regla aparece el aviso
> *"Your rules won't be enforced on this private repository until you move to a
> GitHub Team or Enterprise organization account"*. Por tanto, **NO crees reglas
> aquí**: serían decorativas y darían una falsa sensación de seguridad.

### Cómo se protege el flujo HOY (sin protección mecánica)

La política Git Flow se cumple por **disciplina de equipo + CI**, no por bloqueo de GitHub:

- **CI gitleaks** (`.github/workflows/secret-scan.yml`) — corre en **cada push** y es la
  única barrera mecánica activa contra secretos. Esto sí funciona en repos privados.
- **pre-commit local** (gitleaks) — bloquea secretos antes del commit en cada máquina.
- **Acuerdo del equipo** — nadie hace push directo a `main` ni `develop`; todo entra
  por PR con 1 aprobación; solo `develop` se mergea a `main`. Se vigila en la revisión.
- **Default branch = `develop`** (`Settings > General > Default branch`): esto SÍ se
  puede configurar y hace que los PRs de features apunten a `develop` por defecto.

### Ruta de upgrade (si se quiere protección mecánica, gratis)

La limitación es de cuentas **personales**, no de organizaciones. Opciones sin coste:

1. **Mover el repo a una GitHub Organization (plan Free):** los *rulesets* SÍ se
   aplican en repos privados **de organización** aunque sea plan Free. Es la vía
   recomendada si se necesita forzar PR+aprobación mecánicamente.
2. **Hacer el repo público:** la protección clásica/rulesets se aplica en repos
   públicos gratuitos. Solo al entregar el TFM y tras verificar que no hay secretos
   en el histórico (gitleaks ya escanea todo el historial en CI).

Si se migra a Organization, configurar entonces para `main` **y** `develop`:
Require a pull request before merging · Require approvals (1) · Dismiss stale approvals.

---

## Resolución de conflictos de saltos de línea (CRLF/LF)

Si ves diff con solo cambios de `^M` o problemas de saltos de línea:

```powershell
# Restablecer todos los ficheros con la normalización correcta
git rm --cached -r .
git reset --hard
```

Asegúrate de tener `git config --global core.autocrlf input` configurado.

---

## Antivirus que inspecciona SSL (Norton, ESET, Kaspersky…)

> **¿Necesitas esta sección?** Solo si al usar `git`, `pip`, `winget` o `pre-commit`
> te aparece el error `CERTIFICATE_VERIFY_FAILED`. **Si no te aparece, sáltatela
> entera** — no todos los miembros del equipo tienen este problema; depende del
> antivirus de cada uno.

Si tu antivirus inspecciona el tráfico HTTPS, herramientas como `git`, `pip`,
`winget` o `node` pueden fallar con `CERTIFICATE_VERIFY_FAILED`, porque el antivirus
sustituye el certificado real de cada web por uno propio que esas herramientas no
reconocen.

**Solución (probada con Norton 360):** crear un "bundle" de certificados que combine
los certificados estándar con el del antivirus, y decirle a las herramientas que lo usen.

```powershell
# 1. Exportar el certificado raíz del antivirus (ajusta el thumbprint al tuyo;
#    búscalo con: Get-ChildItem Cert:\CurrentUser\Root | Where Subject -like "*Norton*")
$certDir = "$HOME\certs"; New-Item -ItemType Directory -Force $certDir | Out-Null
$cert = Get-ChildItem Cert:\CurrentUser\Root | Where-Object { $_.Subject -like "*Norton*" } | Select-Object -First 1
$bytes = $cert.Export('Cert')
$b64 = [Convert]::ToBase64String($bytes, 'InsertLineBreaks')
Set-Content "$certDir\norton-root.pem" (@('-----BEGIN CERTIFICATE-----') + $b64 + @('-----END CERTIFICATE-----')) -Encoding ascii

# 2. Combinar con el bundle estándar de certifi (lo trae Python)
$certifi = python -c "import certifi; print(certifi.where())"
Copy-Item $certifi "$certDir\ca-bundle-norton.pem" -Force
Get-Content "$certDir\norton-root.pem" | Add-Content "$certDir\ca-bundle-norton.pem" -Encoding ascii

# 3. Configurar git, pip y variables de entorno para usar el bundle combinado
$bundle = "$certDir\ca-bundle-norton.pem"
git config --global http.sslCAInfo $bundle
pip config set global.cert $bundle
[Environment]::SetEnvironmentVariable("REQUESTS_CA_BUNDLE", $bundle, "User")
[Environment]::SetEnvironmentVariable("SSL_CERT_FILE",     $bundle, "User")
[Environment]::SetEnvironmentVariable("NODE_EXTRA_CA_CERTS", $bundle, "User")
# Reinicia la terminal para que las variables surtan efecto.
```

> **Nota:** el certificado de Norton está mal formado para Python 3.13 (su extensión
> "Basic Constraints" no está marcada como crítica), así que la descarga de gitleaks
> por pre-commit seguirá fallando aunque hagas lo anterior. Por eso gitleaks se
> instala con `winget` (binario nativo) — ver "Configuración inicial" arriba.
> El bundle resuelve `git`/`pip`, que es lo que más se usa.
