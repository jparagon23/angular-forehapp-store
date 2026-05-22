// Uso: node scripts/seed-shipping-zones.js <TOKEN_JWT>
// El token se obtiene iniciando sesión como admin (DevTools > Application > LocalStorage > token)
//
// El script:
//  1. Consulta el catálogo de ubicaciones para resolver los nombres de ciudad a IDs
//  2. Crea las zonas de envío usando cityIds (no strings)

const BASE_URL = 'https://forehappp-store-production.up.railway.app/api/v1';

const TOKEN = process.argv[2];
if (!TOKEN) {
  console.error('Falta el token JWT. Uso: node scripts/seed-shipping-zones.js <TOKEN>');
  process.exit(1);
}

// Definición de zonas con nombres de ciudad — se resuelven a IDs antes de crear
const ZONE_DEFS = [
  {
    name: 'Bogotá',
    cityNames: ['Bogotá', 'Soacha', 'Chía', 'Cajicá', 'Zipaquirá'],
    cost: 8000,
    isDefault: false,
  },
  {
    name: 'Medellín y Área Metropolitana',
    cityNames: ['Medellín', 'Bello', 'Itagüí', 'Envigado', 'Sabaneta', 'La Estrella', 'Copacabana'],
    cost: 10000,
    isDefault: false,
  },
  {
    name: 'Cali',
    cityNames: ['Cali', 'Palmira', 'Yumbo', 'Jamundí'],
    cost: 10000,
    isDefault: false,
  },
  {
    name: 'Barranquilla',
    cityNames: ['Barranquilla', 'Soledad', 'Malambo'],
    cost: 12000,
    isDefault: false,
  },
  {
    name: 'Bucaramanga',
    cityNames: ['Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta'],
    cost: 12000,
    isDefault: false,
  },
  {
    name: 'Cartagena',
    cityNames: ['Cartagena'],
    cost: 14000,
    isDefault: false,
  },
  {
    name: 'Eje Cafetero',
    cityNames: ['Pereira', 'Armenia', 'Manizales', 'Dosquebradas', 'Santa Rosa de Cabal'],
    cost: 12000,
    isDefault: false,
  },
  {
    name: 'Cúcuta',
    cityNames: ['Cúcuta', 'Villa del Rosario', 'Los Patios'],
    cost: 14000,
    isDefault: false,
  },
  {
    name: 'Ibagué y Tolima',
    cityNames: ['Ibagué', 'Espinal', 'Honda'],
    cost: 14000,
    isDefault: false,
  },
  {
    name: 'Santa Marta y Valledupar',
    cityNames: ['Santa Marta', 'Valledupar'],
    cost: 14000,
    isDefault: false,
  },
  {
    name: 'Pasto y Nariño',
    cityNames: ['Pasto', 'Ipiales', 'Tumaco'],
    cost: 16000,
    isDefault: false,
  },
  {
    name: 'Resto del país',
    cityNames: [],
    cost: 18000,
    isDefault: true,
  },
];

async function get(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`GET ${url} → HTTP ${res.status}`);
  return res.json();
}

async function post(url, body) {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${TOKEN}` },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`HTTP ${res.status}: ${err}`);
  }
  return res.json();
}

async function buildCityIndex() {
  console.log('\n  Consultando catálogo de ubicaciones...');
  const countries = await get(`${BASE_URL}/locations/countries`);
  const colombia  = countries.find(c => c.code === 'CO' || c.name.toLowerCase().includes('colombia'));
  if (!colombia) throw new Error('No se encontró Colombia en el catálogo. ¿Está seeded el catálogo?');

  const states = await get(`${BASE_URL}/locations/countries/${colombia.id}/states`);
  console.log(`  Colombia (id=${colombia.id}) — ${states.length} departamentos`);

  const cityIndex = new Map(); // nombre normalizado → { id, name }

  for (const state of states) {
    const cities = await get(`${BASE_URL}/locations/states/${state.id}/cities`);
    for (const city of cities) {
      const key = city.name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
      cityIndex.set(key, city);
      cityIndex.set(city.name.toLowerCase(), city); // también con tilde exacto
    }
  }
  console.log(`  Índice construido con ${cityIndex.size} entradas de ciudad.\n`);
  return cityIndex;
}

function resolveCity(name, index) {
  const key1 = name.toLowerCase();
  const key2 = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  return index.get(key1) ?? index.get(key2) ?? null;
}

async function main() {
  let cityIndex;
  try {
    cityIndex = await buildCityIndex();
  } catch (e) {
    console.error(`\n  ✗ No se pudo cargar el catálogo de ubicaciones: ${e.message}`);
    console.error('    Asegúrate de haber sembrado los países/departamentos/ciudades primero.\n');
    process.exit(1);
  }

  console.log(`Creando ${ZONE_DEFS.length} zonas de envío en ${BASE_URL}\n`);
  let ok = 0, fail = 0;

  for (const def of ZONE_DEFS) {
    const cityIds = [];
    const notFound = [];

    for (const cityName of def.cityNames) {
      const city = resolveCity(cityName, cityIndex);
      if (city) {
        cityIds.push(city.id);
      } else {
        notFound.push(cityName);
      }
    }

    if (notFound.length) {
      console.warn(`  ⚠  ${def.name}: ciudades no encontradas en catálogo → ${notFound.join(', ')}`);
    }

    try {
      const created = await post(`${BASE_URL}/admin/shipping-zones`, {
        name:      def.name,
        cityIds,
        cost:      def.cost,
        isDefault: def.isDefault,
      });
      const cityLabel = def.isDefault ? '(por defecto)' : `${cityIds.length} ciudades`;
      console.log(`  ✓  [${String(created.id).padStart(3)}] ${def.name} — $${def.cost.toLocaleString('es-CO')} COP — ${cityLabel}`);
      ok++;
    } catch (e) {
      console.error(`  ✗  ${def.name}: ${e.message}`);
      fail++;
    }
  }

  console.log(`\nResumen: ${ok} creadas, ${fail} errores.\n`);
}

main();
