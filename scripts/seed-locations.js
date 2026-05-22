// Uso: node scripts/seed-locations.js <TOKEN_JWT>
// Siembra Colombia → 32 departamentos → principales ciudades
// Requiere rol STORE_ADMIN en el backend.

const BASE_URL = 'https://forehappp-store-production.up.railway.app/api/v1';

const TOKEN = process.argv[2];
if (!TOKEN) {
  console.error('Falta el token JWT. Uso: node scripts/seed-locations.js <TOKEN>');
  process.exit(1);
}

const COLOMBIA = {
  name: 'Colombia',
  code: 'CO',
  states: [
    { name: 'Amazonas',          cities: ['Leticia', 'Puerto Nariño'] },
    { name: 'Antioquia',         cities: ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Sabaneta', 'La Estrella', 'Copacabana', 'Rionegro', 'Apartadó'] },
    { name: 'Arauca',            cities: ['Arauca', 'Saravena'] },
    { name: 'Atlántico',         cities: ['Barranquilla', 'Soledad', 'Malambo', 'Puerto Colombia'] },
    { name: 'Bolívar',           cities: ['Cartagena', 'Magangué', 'El Carmen de Bolívar'] },
    { name: 'Boyacá',            cities: ['Tunja', 'Duitama', 'Sogamoso', 'Chiquinquirá'] },
    { name: 'Caldas',            cities: ['Manizales', 'La Dorada', 'Chinchiná'] },
    { name: 'Caquetá',           cities: ['Florencia', 'San Vicente del Caguán'] },
    { name: 'Casanare',          cities: ['Yopal', 'Aguazul', 'Villanueva'] },
    { name: 'Cauca',             cities: ['Popayán', 'Santander de Quilichao', 'Puerto Tejada'] },
    { name: 'Cesar',             cities: ['Valledupar', 'Aguachica', 'Codazzi'] },
    { name: 'Chocó',             cities: ['Quibdó', 'Istmina'] },
    { name: 'Córdoba',           cities: ['Montería', 'Lorica', 'Sahagún'] },
    { name: 'Cundinamarca',      cities: ['Bogotá', 'Soacha', 'Chía', 'Cajicá', 'Zipaquirá', 'Facatativá', 'Mosquera', 'Fusagasugá', 'Madrid', 'Funza'] },
    { name: 'Guainía',           cities: ['Inírida'] },
    { name: 'Guaviare',          cities: ['San José del Guaviare'] },
    { name: 'Huila',             cities: ['Neiva', 'Pitalito', 'Garzón'] },
    { name: 'La Guajira',        cities: ['Riohacha', 'Maicao', 'Uribia'] },
    { name: 'Magdalena',         cities: ['Santa Marta', 'Ciénaga', 'Fundación'] },
    { name: 'Meta',              cities: ['Villavicencio', 'Acacías', 'Granada'] },
    { name: 'Nariño',            cities: ['Pasto', 'Ipiales', 'Tumaco', 'Túquerres'] },
    { name: 'Norte de Santander',cities: ['Cúcuta', 'Villa del Rosario', 'Los Patios', 'Ocaña'] },
    { name: 'Putumayo',          cities: ['Mocoa', 'Puerto Asís'] },
    { name: 'Quindío',           cities: ['Armenia', 'Calarcá', 'Montenegro'] },
    { name: 'Risaralda',         cities: ['Pereira', 'Dosquebradas', 'Santa Rosa de Cabal'] },
    { name: 'San Andrés',        cities: ['San Andrés', 'Providencia'] },
    { name: 'Santander',         cities: ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta', 'Barrancabermeja'] },
    { name: 'Sucre',             cities: ['Sincelejo', 'Corozal'] },
    { name: 'Tolima',            cities: ['Ibagué', 'Espinal', 'Honda', 'Melgar'] },
    { name: 'Valle del Cauca',   cities: ['Cali', 'Palmira', 'Yumbo', 'Jamundí', 'Buenaventura', 'Cartago', 'Tuluá', 'Buga'] },
    { name: 'Vaupés',            cities: ['Mitú'] },
    { name: 'Vichada',           cities: ['Puerto Carreño'] },
  ],
};

async function post(url, body, auth = false) {
  const headers = { 'Content-Type': 'application/json' };
  if (auth) headers['Authorization'] = `Bearer ${TOKEN}`;
  const res = await fetch(url, { method: 'POST', headers, body: JSON.stringify(body) });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`HTTP ${res.status}: ${txt}`);
  }
  return res.json();
}

async function main() {
  console.log(`\nSembrando catálogo de ubicaciones en ${BASE_URL}\n`);

  // 1. Crear país
  let country;
  try {
    country = await post(`${BASE_URL}/locations/countries`, { name: COLOMBIA.name, code: COLOMBIA.code }, true);
    console.log(`  ✓ País: ${country.name} (id=${country.id})`);
  } catch (e) {
    console.error(`  ✗ País ${COLOMBIA.name}: ${e.message}`);
    process.exit(1);
  }

  let statesOk = 0, citiesOk = 0, statesFail = 0, citiesFail = 0;

  // 2. Crear departamentos y ciudades
  for (const stateDef of COLOMBIA.states) {
    let state;
    try {
      state = await post(`${BASE_URL}/locations/states`, { name: stateDef.name, countryId: country.id }, true);
      statesOk++;
      process.stdout.write(`  ✓ ${stateDef.name} (id=${state.id})`);
    } catch (e) {
      console.error(`\n  ✗ Departamento ${stateDef.name}: ${e.message}`);
      statesFail++;
      continue;
    }

    for (const cityName of stateDef.cities) {
      try {
        await post(`${BASE_URL}/locations/cities`, { name: cityName, stateId: state.id }, true);
        process.stdout.write('.');
        citiesOk++;
      } catch (e) {
        process.stdout.write('✗');
        citiesFail++;
      }
    }
    console.log();
  }

  console.log(`\nResumen:`);
  console.log(`  Departamentos: ${statesOk} creados, ${statesFail} errores`);
  console.log(`  Ciudades:      ${citiesOk} creadas, ${citiesFail} errores\n`);
  console.log('Ahora puedes correr: node scripts/seed-shipping-zones.js <TOKEN>\n');
}

main();
