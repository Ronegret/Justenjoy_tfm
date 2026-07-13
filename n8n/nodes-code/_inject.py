# Inyecta el codigo de los 10 nodos Code en el workflow JSON.
# Mapea node id -> fichero .js. Reescribe jsCode preservando el resto del JSON.
import json, os, sys

BASE = os.path.dirname(os.path.abspath(__file__))
WF = os.path.normpath(os.path.join(BASE, "..", "workflows", "Planificador_de_Viajes_v31.json"))

# node id -> fichero de codigo (v31: 10 nodos Code)
MAPPING = {
    "94c95d64-a5fb-46b0-bea8-c3e6aff1270e": "01_validar_formulario.js",         # Validar Formulario
    "235a7f02-02ae-4810-9f57-e5e45f6d6a5e": "02_cargar_sesion.js",              # Cargar Sesion
    "ca6616e1-c7df-475b-adb9-d9b2b6fc239f": "03_parsear_refinamiento.js",       # Parsear Refinamiento
    "79243b99-4ac0-4361-ac54-41de13a58592": "04_preparar_motor.js",            # Preparar Motor Planificador
    "f2a55acc-8110-45df-a556-16e877c9cf6a": "05_convertir_iata.js",            # Convertir Ciudades a IATA
    "b3090e29-796b-4fce-8efa-df5c679f2027": "06_validar_output.js",            # Validar Output del Planificador
    "c4006e0e-bb5b-4ec9-ae38-0e561f6fbd21": "07_logger_metricas.js",           # Logger - Tokens y Metricas
    "preparar-payload-supabase": "08_preparar_payload_supabase.js",            # Preparar Payload Supabase
    "extraer-record-supabase": "09_extraer_record.js",                        # Extraer Record
    "enriquecer-coordenadas": "10_enriquecer_coordenadas.js",                 # Enriquecer Coordenadas (OpenStreetMap)
}

def load_code(fname):
    p = os.path.join(BASE, fname)
    with open(p, "r", encoding="utf-8") as f:
        code = f.read()
    # El pre-commit end-of-file-fixer garantiza un salto de linea final en cada .js,
    # pero el campo jsCode de n8n no lo lleva: lo quitamos para un round-trip exacto.
    code = code.rstrip("\n")
    # Normalizar el rango de combining marks a escape unicode robusto (defensivo:
    # si algun nodo vuelve a normalizar acentos con [̀-ͯ] literal, lo escapamos).
    code = code.replace("[̀-ͯ]", "[\\u0300-\\u036f]")
    return code

with open(WF, "r", encoding="utf-8") as f:
    wf = json.load(f)

found = set()
for node in wf.get("nodes", []):
    nid = node.get("id")
    if nid in MAPPING:
        code = load_code(MAPPING[nid])
        node.setdefault("parameters", {})["jsCode"] = code
        found.add(nid)
        print(f"  [OK] {node.get('name')}  <-  {MAPPING[nid]}  ({len(code)} chars)")

missing = set(MAPPING) - found
if missing:
    print("FALTAN nodos por id:", missing, file=sys.stderr)
    sys.exit(1)

with open(WF, "w", encoding="utf-8", newline="\n") as f:
    json.dump(wf, f, ensure_ascii=False, indent=2)
    f.write("\n")  # preserva el salto de linea final (round-trip identico)

print(f"\nEscrito: {WF}")
print(f"Total nodos con codigo inyectado: {len(found)}/{len(MAPPING)}")
