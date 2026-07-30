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
const okCadena =
  b.origin_city_iata === 'AMS' &&
  b.destination_city_iata === 'CDG' &&
  b.destination_city_ll === '@48.8566,2.3522,15z' &&
  b.destination_airport_name === 'Paris Charles de Gaulle Airport';

// 4) El titular (PII) NO puede llegar al motor planificador
// El prompt del agente serializa entero el session_state que sale de Preparar
// Motor, asi que un holder ahi acaba en OpenAI. Debe sobrevivir en la salida de
// Validar Formulario (lo necesita la rama de plan_holders) y desaparecer en la de
// Preparar Motor. Se inyecta aqui y no en examples/input-formulario.json para no
// meter datos de contacto en un fichero de ejemplo.
const inputConTitular = {
  ...input,
  holder: {
    first_name: 'Test',
    last_name: 'Titular',
    phone: '+34600000000',
    email: 'titular@example.com',
    consent_at: '2026-07-30T10:00:00.000Z',
    consent_version: 'v1'
  }
};
const val = runNode('01_validar_formulario.js', inputConTitular)[0].json;
const motor = runNode('04_preparar_motor.js', val)[0].json;
const holderEnValidar = val.session_state.travel_brief.holder;
const serializadoMotor = JSON.stringify(motor);
console.log('\n== Titular (PII) ==');
console.log('  pasa por Validar Formulario (plan_holders):', !!holderEnValidar);
console.log('  presente en session_state de Preparar Motor:', 'holder' in motor.session_state.travel_brief);
console.log('  aparece el email en TODA la salida del motor:', serializadoMotor.includes('titular@example.com'));
const okTitular =
  !!holderEnValidar &&
  !('holder' in motor.session_state.travel_brief) &&
  !('holder' in motor.travel_brief) &&
  !serializadoMotor.includes('titular@example.com');

// 5) 'New Delhi' (valor del chip de India) resuelve IATA **y** GPS
// Estaba solo en cityToIata: el ll salia null y la busqueda de actividades perdia
// el ancla que el system prompt marca como CRITICA.
const inputDelhi = { ...input, destination_city: ['New Delhi'] };
const delhi = runNode(
  '05_convertir_iata.js',
  runNode('04_preparar_motor.js', runNode('01_validar_formulario.js', inputDelhi)[0].json)[0].json
)[0].json.session_state.travel_brief;
console.log('\n== New Delhi ==');
console.log('  destination_city_iata:', delhi.destination_city_iata);
console.log('  destination_city_ll:', delhi.destination_city_ll);
const okDelhi =
  delhi.destination_city_iata === 'DEL' &&
  delhi.destination_city_ll === '@28.6139,77.2090,15z';

const ok = okCadena && okTitular && okDelhi;
console.log('\nRESULTADO:', ok ? 'PASS' : 'FAIL');
if (!ok) {
  console.log('  cadena IATA:', okCadena ? 'PASS' : 'FAIL');
  console.log('  titular fuera del motor:', okTitular ? 'PASS' : 'FAIL');
  console.log('  New Delhi:', okDelhi ? 'PASS' : 'FAIL');
}
process.exit(ok ? 0 : 1);
