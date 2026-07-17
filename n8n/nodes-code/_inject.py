# Inyecta el codigo de los 10 nodos Code en el workflow JSON.
# Mapea node id -> fichero .js. Reescribe jsCode preservando el resto del JSON.
import json, os, sys

BASE = os.path.dirname(os.path.abspath(__file__))
WF = os.path.normpath(os.path.join(BASE, "..", "workflows", "Planificador de Viajes — v32.json"))

# node id -> fichero de codigo (v32: 10 nodos Code; ids regenerados al duplicar
# el workflow en la UI de n8n para crear v32, aunque el codigo/nombre no cambiara)
MAPPING = {
    "f3246815-6929-420b-b8d2-517beb73f7b0": "01_validar_formulario.js",         # Validar Formulario
    "e969f06a-89e5-462c-a26c-72e14420db67": "02_cargar_sesion.js",              # Cargar Sesion
    "840155c0-6bf5-45bd-a878-b5f44892e79e": "03_parsear_refinamiento.js",       # Parsear Refinamiento
    "f7616af5-ff36-4427-8668-3ebc61f814a2": "04_preparar_motor.js",            # Preparar Motor Planificador
    "290bb48e-0ed1-4ad1-a7ca-3c075fae11f1": "05_convertir_iata.js",            # Convertir Ciudades a IATA
    "c04d4861-df7c-4fe1-917d-e7139b1c5265": "06_validar_output.js",            # Validar Output del Planificador
    "78da760c-dfe3-43cd-b265-84fa2f49cb6a": "07_logger_metricas.js",           # Logger - Tokens y Metricas
    "30860731-1907-48c8-b66e-dcee5ddd7786": "08_preparar_payload_supabase.js",  # Preparar Payload Supabase
    "1a188734-fdd0-419d-aefc-af2f34601888": "09_extraer_record.js",            # Extraer Record
    "fc303a17-cf1b-4e57-8c1b-d7b712415a0d": "10_enriquecer_coordenadas.js",     # Enriquecer Coordenadas (OpenStreetMap)
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
