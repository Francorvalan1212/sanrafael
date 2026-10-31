import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { loadEnv } from 'vite';

const env = loadEnv('production', process.cwd(), '');
const failures = [];
const placeholders = /TU-PROYECTO|tu-anon-key|TU_FORM_ID|YOUR_|REPLACE/i;
const exampleEnv = existsSync('.env.example')
  ? Object.fromEntries(readFileSync('.env.example', 'utf8').split(/\r?\n/)
    .filter(line => /^\s*[^#=]+=/.test(line))
    .map(line => { const [name, ...value] = line.split('='); return [name.trim(), value.join('=').trim()]; }))
  : {};

function requireHttpsUrl(name) {
  const value = env[name];
  if (!value || value === exampleEnv[name] || placeholders.test(value)) {
    failures.push(`${name} falta o conserva un valor de ejemplo.`);
    return;
  }

  try {
    if (new URL(value).protocol !== 'https:') failures.push(`${name} debe usar HTTPS.`);
  } catch {
    failures.push(`${name} no es una URL válida.`);
  }
}

function isPublicSupabaseKey(value) {
  if (!value || placeholders.test(value)) return false;
  if (value.startsWith('sb_publishable_')) return true;

  try {
    const payload = JSON.parse(Buffer.from(value.split('.')[1], 'base64url').toString());
    return payload.role === 'anon';
  } catch {
    return false;
  }
}

requireHttpsUrl('VITE_SUPABASE_URL');
requireHttpsUrl('VITE_ACCESS_REQUEST_FORM_URL');

if (!isPublicSupabaseKey(env.VITE_SUPABASE_ANON_KEY)) {
  failures.push('VITE_SUPABASE_ANON_KEY debe ser una clave pública anon/publishable válida, nunca service_role.');
}

if (env.VITE_GOOGLE_MAPS_KEY && placeholders.test(env.VITE_GOOGLE_MAPS_KEY)) {
  failures.push('VITE_GOOGLE_MAPS_KEY conserva un valor de ejemplo.');
}

for (const name of Object.keys(env)) {
  if (/^VITE_.*(SERVICE_ROLE|SECRET|PRIVATE|PASSWORD)/i.test(name)) {
    failures.push(`${name} no debe exponerse al navegador.`);
  }
}

for (const path of ['public/_headers', 'public/robots.txt', 'public/sitemap.xml', 'supabase/schema.sql', 'supabase/security-hardening.sql']) {
  if (!existsSync(path)) failures.push(`Falta el archivo requerido: ${path}.`);
}

const htmlPath = join('dist', 'index.html');
if (!existsSync(htmlPath)) {
  failures.push('Falta dist/index.html. Ejecutá npm run build antes de la revisión final.');
} else {
  const html = readFileSync(htmlPath, 'utf8');
  const assets = [...html.matchAll(/(?:src|href)="\/(assets\/[^\"]+)"/g)].map(match => match[1]);
  if (!assets.some(asset => asset.endsWith('.js')) || !assets.some(asset => asset.endsWith('.css'))) {
    failures.push('El HTML de producción no referencia los bundles de JavaScript y CSS.');
  }
  for (const asset of assets) {
    if (!existsSync(join('dist', asset))) failures.push(`Falta el asset compilado: ${asset}.`);
  }
}

const assetsDirectory = join('dist', 'assets');
if (existsSync(assetsDirectory)) {
  const bundles = readdirSync(assetsDirectory).filter(name => name.endsWith('.js'));
  const demoTitles = ['Cachumba en vivo', 'Noche Carpera', 'Gran Gala de Ballet'];
  for (const bundle of bundles) {
    const content = readFileSync(join(assetsDirectory, bundle), 'utf8');
    for (const title of demoTitles) {
      if (content.includes(title)) failures.push(`Un evento de demostración llegó al bundle de producción: ${title}.`);
    }
  }
}

if (failures.length) {
  console.error('Revisión de salida no superada:');
  failures.forEach(failure => console.error(`- ${failure}`));
  process.exitCode = 1;
} else {
  console.log('Configuración de lanzamiento válida. No se mostraron valores secretos.');
}