// Smoke test de la cadena determinista (sin APIs externas):
//   Validar Formulario -> Preparar Motor -> Convertir Ciudades a IATA
// Simula los globals de n8n y ejecuta cada nodo en orden con el input de ejemplo.
const fs = require('fs');
const path = require('path');

const DIR = __dirname;
const input = JSON.parse(
  fs.readFileSync(path.join(DIR, '..', 'examples', 'input-formulario.json'), 'utf8')
);

// --- Simulacion de globals de n8n ---
const staticStore = {};
function makeCtx(items) {
  return {
    $input: { first: () => ({ json: items }) },
    $getWorkflowStaticData: () => staticStore,
  };
}

function runNode(file, items) {
  let code = fs.readFileSync(path.join(DIR, file), 'utf8');
  code = code.replace('[̀-ͯ]', '[\\u0300-\\u036f]');
  const ctx = makeCtx(items);
  // Los nodos terminan con `return [...]` -> envolvemos para capturarlo.
  const wrapped = new Function(
    '$input', '$getWorkflowStaticData',
    'return (function(){' + code + '})()'
  );
  return wrapped(ctx.$input, ctx.$getWorkflowStaticData);
}

// 1) Validar Formulario
let out = runNode('01_validar_formulario.js', input);
console.log('== Validar Formulario ==');
console.log('  _error:', out[0].json._error);
console.log('  session_id:', out[0].json.session_id);
if (out[0].json._error) { console.log('  ERROR:', out[0].json.error_detail); process.exit(1); }

// 2) Preparar Motor (recibe el json del paso anterior)
out = runNode('04_preparar_motor.js', out[0].json);
console.log('== Preparar Motor ==');
console.log('  steps_to_run:', out[0].json.steps_to_run);
console.log('  segments:', JSON.stringify(out[0].json.segments));
console.log('  unique_destinations:', JSON.stringify(out[0].json.unique_destinations));

// 3) Convertir Ciudades a IATA
out = runNode('05_convertir_iata.js', out[0].json);
const b = out[0].json.session_state.travel_brief;
console.log('== Convertir Ciudades a IATA ==');
console.log('  origin_city_iata:', b.origin_city_iata);
console.log('  destination_city_iata:', b.destination_city_iata);
console.log('  destination_city_ll:', b.destination_city_ll);
console.log('  destination_airport_name:', b.destination_airport_name);

// Asserts minimos
const ok =
  b.origin_city_iata === 'AMS' &&
  b.destination_city_iata === 'CDG' &&
  b.destination_city_ll === '@48.8566,2.3522,15z' &&
  b.destination_airport_name === 'Paris Charles de Gaulle Airport';
console.log('\nRESULTADO:', ok ? 'PASS' : 'FAIL');
process.exit(ok ? 0 : 1);
