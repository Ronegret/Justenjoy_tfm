# AGENTS.md — Contrato del repositorio Just Enjoy

> Este fichero es el punto de entrada para cualquier agente IA que trabaje en
> este repositorio. Léelo COMPLETO antes de tocar nada.
>
> **Modelo de agente:** agente único.
> **Idioma del proyecto:** español (documentación y mensajes de commit).
> **Artefactos técnicos** (nombres de variables, rutas, JSON): inglés.

---

## 0. Antes de empezar

### 0.1 Carga de contexto base
1. Lee este fichero (`AGENTS.md`) completo.
2. Ejecuta el script de verificación: `.\verify.ps1`
3. Identifica el tipo de tarea (ver tabla 0.2).

### 0.2 Carga adicional por tipo de tarea

| Tipo de tarea | Ficheros adicionales a leer |
|---|---|
| Nueva funcionalidad | `docs/SPEC_TEMPLATE.md` + spec aprobada en `docs/specs/` + `docs/ARCHITECTURE.md` |
| Bug | Solo el fichero afectado y sus tests |
| Refactor | `docs/ARCHITECTURE.md` + ficheros afectados |
| Docs | El fichero a actualizar + `README.md` |
| Workflow n8n | `n8n/docs/Planificador_Viajes_v24_Arquitectura.md` + el JSON del workflow |

Regla: ante la duda, carga menos. No leas todo el repo antes de preguntar.

### 0.3 Señal de contexto degradado
Si llevas más de 15 intercambios sin releer este fichero, avísalo, vuelve a
leerlo, confirma que tu contexto es coherente y reanuda.

---

## 1. Mapa del repositorio

| Ruta | Qué contiene | Cuándo leerlo |
|---|---|---|
| `n8n/workflows/` | JSONs de workflows de n8n (versionados) | Siempre que toques la lógica del planificador |
| `n8n/docs/` | Documentación de arquitectura de cada workflow | Al trabajar en n8n |
| `n8n/examples/` | JSONs de entrada/salida de ejemplo para testing | Al probar el workflow |
| `frontend/` | Portal web del viajero (pendiente de añadir) | Cuando llegue el código frontend |
| `botpress/` | Configuración del agente conversacional (pendiente) | Cuando llegue el código Botpress |
| `docs/ARCHITECTURE.md` | Visión general del sistema completo | Al arrancar cualquier tarea nueva |
| `docs/adr/` | Registro de decisiones de arquitectura | Al evaluar decisiones técnicas |
| `docs/specs/` | Especificaciones aprobadas de funcionalidades | Antes de codificar cualquier feature |
| `.env.example` | Plantilla de variables de entorno | Al configurar una instancia nueva |
| `verify.ps1` | Script de verificación local (Windows) | Antes de cada commit |
| `CONTRIBUTING.md` | Flujo de ramas, PRs, política de IA | Al contribuir cambios |

---

## 2. Comandos esenciales

```powershell
# Verificación antes de commitear (OBLIGATORIO)
.\verify.ps1

# Instalar el guardián de secretos (una sola vez por máquina)
pip install pre-commit
pre-commit install

# Ejecutar todos los hooks manualmente
pre-commit run --all-files

# Validar JSON de workflow manualmente
Get-Content n8n/workflows/Planificador_de_Viajes_v24.json | ConvertFrom-Json
```

> **Frontend / Botpress:** los comandos de lint, tests y build se añadirán aquí
> cuando llegue ese código. Por ahora `[COMPLETAR-INFO]`.

---

## 3. Restricciones

### 3.1 Puedes sin aprobación
- Crear ramas `feature/*`, `fix/*`, `chore/*`, `docs/*`
- Editar dentro del scope de la tarea acordada
- Añadir o corregir tests
- Refactorizar dentro del scope (sin cambiar la API pública)
- Actualizar documentación

### 3.2 Necesitas aprobación humana ANTES de empezar
- Instalar o eliminar dependencias
- Tocar la configuración de CI
- Añadir o cambiar la estructura del workflow n8n (nodos nuevos, conexiones)
- Cambiar el contrato de la API (webhooks, campos del JSON de entrada/salida)
- Modificar `.github/CODEOWNERS`
- Cualquier acción sobre datos reales de clientes

> La aprobación se pide **antes de codificar**, no solo antes de mergear.
> Un plan aprobado no equivale a aprobación del contrato de API salvo que
> el humano lo confirme explícitamente.

### 3.3 Nunca
- Push directo a `main`
- Commitear secretos, claves de API, tokens, URLs de ngrok con token
- Force push fuera de `feature/*`
- Modificar tests para que pasen sin entender por qué fallaban
- Escribir tests que aserten la salida actual del código en vez del comportamiento esperado
- Empezar una funcionalidad nueva sin spec aprobada (excepción: cambios triviales)
- Hardcodear la URL de ngrok en código versionado

---

## 4. Flujo de funcionalidad nueva (Spec-Driven Development)

Ninguna funcionalidad se codifica sin spec aprobada:

1. Recibir la idea en lenguaje natural
2. Generar spec usando `docs/SPEC_TEMPLATE.md`
   - Qué hace / qué NO hace
   - Flujo de usuario paso a paso
   - Qué puede salir mal
   - Qué partes del repo toca
   - Decisiones a confirmar
   - Sin código ni nombres de funciones todavía
3. **Esperar validación humana** — el silencio NO es aprobación; no codifiques mientras esperas
4. Codificar contra la spec aprobada; si algo la contradice, PARA y consulta
5. Guardar spec implementada en `docs/specs/YYYY-MM-DD-nombre.md`

---

## 5. Si te bloqueas

1. Relee `docs/ARCHITECTURE.md` y los ADRs relevantes antes de inventar un workaround
2. Documenta el bloqueo con detalle (qué intentaste, qué falló, qué necesitas)
3. Para y espera; no silencies errores con try/catch vacíos

---

## 6. Política de dependencias

Antes de añadir una dependencia nueva:
1. Verifica que existe en el registro oficial (npm, PyPI, etc.)
2. Comprueba actividad reciente (>18 meses sin publicar = alerta)
3. Justifica frente a alternativas existentes
4. Ejecuta audit tras instalar (`npm audit` / `pip-audit`)
5. Paquetes con <1000 descargas semanales (npm) o equivalente requieren aprobación humana

---

## 7. Decisiones arquitectónicas

Ver `docs/adr/README.md` para el proceso y la lista de ADRs.
Los ADRs documentan el **por qué** de las decisiones; no copies su contenido aquí.

---

## 8. Modelo de agente

Este repositorio opera en modo **agente único**. No hay orquestación multi-agente.

Para tareas de exploración intensiva (leer documentación extensa de n8n, revisar
múltiples ficheros JSON), el agente puede delegar en subagentes efímeros con modelo
más ligero (exploración → Haiku, implementación → Sonnet) mientras el sistema sigue
siendo agente único. Esto ahorra tokens sin añadir complejidad de coordinación.

---

## 9. Definición de hecho

**Ejecuta estos pasos ANTES de proponer o hacer `git commit`:**

1. **Verificación en verde:** ejecutar `.\verify.ps1` y confirmar que pasa.
   Si falla, PARA y resuelve. No commitees sobre rojo.

2. **Test que cubre el cambio:** si añades o modificas un webhook, un campo del
   JSON de entrada/salida, o una rama de lógica del workflow, debe existir al menos
   un ejemplo de entrada/salida en `n8n/examples/` que lo valide.
   Un cambio de contrato sin ejemplo documentado no está hecho.

3. **Sin secretos ni dependencias sin justificar** (ver §6).

4. **Sin errores silenciados** — ningún `catch {}` vacío ni `|| true` permanente (ver §5).

5. **Docs actualizadas si cambió la arquitectura o el contrato:**
   Si tocaste nodos del workflow, el contrato JSON de entrada/salida, o la
   arquitectura general, actualiza `docs/ARCHITECTURE.md` y/o
   `n8n/docs/Planificador_Viajes_v24_Arquitectura.md` en el mismo commit.

6. **Commit conforme a la convención:** mensaje en **español**, en imperativo,
   con prefijo de tipo:
   - `feat:` nueva funcionalidad
   - `fix:` corrección de bug
   - `docs:` solo documentación
   - `chore:` tareas de mantenimiento, dependencias
   - `test:` añadir o corregir tests
   - `refactor:` refactor sin cambio de comportamiento

Si algún punto no se cumple, complétalo ANTES de commitear; no dejes el cierre "para después".

---

`/code-review` sobre el diff antes del PR es **obligatorio pero sin gate automático**
(ver §10): no lo listes como gate, no lo marques como "recomendado" — es obligatorio y sin red.

---

### 9.1 Si tocas X, actualiza Y

| Si tocas... | Actualiza también... | Requiere... |
|---|---|---|
| Contrato JSON entrada/salida del webhook | `docs/ARCHITECTURE.md` + ejemplo en `n8n/examples/` | Aprobación previa |
| Nodos o conexiones del workflow n8n | `n8n/docs/Planificador_Viajes_v24_Arquitectura.md` | Aprobación previa |
| Variables de entorno nuevas | `.env.example` | — |
| Nuevas dependencias | Auditoría de seguridad + CONTRIBUTING.md §Dependencias | Aprobación previa |
| Estructura de carpetas | Este fichero §1 + README.md | — |

---

## 10. Mejora del arnés

**Reglas promovidas a gate automático** (el tooling lo verifica sin depender de memoria):
- Detección de secretos en CI (gitleaks en GitHub Actions, `.github/workflows/secret-scan.yml`)
  → corre en cada push/PR a `main`, independiente de la máquina de quien sube. Es el gate fuerte.
- Detección de secretos en local (gitleaks vía pre-commit, binario nativo) → primera línea,
  pero depende de que cada persona lo tenga instalado; el gate real es el de CI.
- JSON válido en workflows (verificación en `verify.ps1`)
- No push directo a `main` (branch protection en GitHub — configurar manualmente, ver CONTRIBUTING.md)

**Reglas obligatorias sin gate** (dependen de disciplina; son el punto de fuga conocido):
- `/code-review` antes del PR
- Coherencia entre workflow y documentación de arquitectura
- Spec aprobada antes de codificar features

Si una regla sin gate se viola repetidamente, no la workaroundees: regístrala como
issue y propón elevarla a gate. Las reglas que se violan siempre deben subir a CI o hooks; si no, sobran.

---

## 11. Ficheros estables vs volátiles

**Estables** (cargar una vez, no modificar durante el trabajo):
`AGENTS.md`, `docs/ARCHITECTURE.md`, `docs/SPEC_TEMPLATE.md`, `CONTRIBUTING.md`

**Volátiles** (cambian durante la sesión):
specs activas en `docs/specs/`, JSONs de workflows en edición, código del frontend

No mezcles estable y volátil en el mismo fichero.

---

## Comportamiento esperado del agente

- Confirmar antes de borrar ficheros, hacer migraciones o tocar CI
- Ediciones quirúrgicas: cambiar solo lo necesario, no refactorizar sin acuerdo
- Listar los ficheros modificados y el motivo al final de cada tarea
- Preguntar ante cualquier ambigüedad antes de asumir
- No silenciar errores — si algo falla, reportarlo con contexto
- Responder y documentar siempre en **español**
- Mensajes de commit en español, en imperativo, con prefijo de tipo
