# Inyecta el codigo de los 7 nodos Code en el workflow JSON.
# Mapea node id -> fichero .js. Reescribe jsCode preservando el resto del JSON.
import json, os, sys

BASE = os.path.dirname(os.path.abspath(__file__))
WF = os.path.normpath(os.path.join(BASE, "..", "workflows", "Planificador_de_Viajes_v24.json"))

# node id -> fichero de codigo
MAPPING = {
    "7910aa3a-4994-477d-857e-31144c07d076": "01_validar_formulario.js",   # Validar Formulario
    "fe789212-3e11-4a97-89c2-c7fec6b6f734": "02_cargar_sesion.js",        # Cargar Sesion
    "4bb10817-f1c1-49ab-ae83-38970320fba0": "03_parsear_refinamiento.js", # Parsear Refinamiento
    "547ebc1d-2bfd-4ed8-8f57-cd052f907f42": "04_preparar_motor.js",       # Preparar Motor Planificador
    "da350887-d5b9-43c5-ba76-dd8ca4009fe9": "05_convertir_iata.js",       # Convertir Ciudades a IATA
    "e0f9b080-430e-4487-a408-1c04d5c49ff0": "06_validar_output.js",       # Validar Output del Planificador
    "token-logger-v24": "07_logger_metricas.js",                          # Logger - Tokens y Metricas
}

def load_code(fname):
    p = os.path.join(BASE, fname)
    with open(p, "r", encoding="utf-8") as f:
        code = f.read()
    # Normalizar el rango de combining marks a escape unicode robusto.
    # (en 05 se usa para quitar acentos)
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

with open(WF, "w", encoding="utf-8") as f:
    json.dump(wf, f, ensure_ascii=False, indent=2)

print(f"\nEscrito: {WF}")
print(f"Total nodos con codigo inyectado: {len(found)}/7")
