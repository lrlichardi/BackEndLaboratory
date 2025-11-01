/* eslint-disable no-console */
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { parse } = require('csv-parse/sync') as {
  parse: (input: string, opts?: any) => any[];
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const argCsv = process.argv.find(a => a.startsWith('--csv='))?.split('=')[1];
const CSV_PATH =
  argCsv ||
  process.env.NOMENCLADOR_CSV ||
  path.resolve(__dirname, '../../prisma/data/nomenclador.csv');

const prisma = new PrismaClient();

function toNumber(v: any): number | null {
  const s = String(v ?? '').trim();
  if (!s) return null;
  const n = parseFloat(s.replace(',', '.'));
  return Number.isFinite(n) ? n : null;
}

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error('❌ No se encuentra el CSV en:', CSV_PATH);
    console.error('Usa --csv="ruta/archivo.csv" o setea NOMENCLADOR_CSV.');
    process.exit(1);
  }

  // Lee como UTF-8 (quita BOM si existe)
  let text = fs.readFileSync(CSV_PATH, 'utf8');
  if (text.charCodeAt(0) === 0xfeff) text = text.slice(1);

  // 🔎 Detecta delimitador: coma o punto y coma
  const headerLine = (text.split(/\r?\n/).find(l => l.trim().length > 0) ?? '');
  const commas = (headerLine.match(/,/g) || []).length;
  const semis  = (headerLine.match(/;/g) || []).length;
  const delimiter = semis > commas ? ';' : ',';

  const rows = parse(text, {
    columns: true,
    skip_empty_lines: true,
    delimiter,     // 👈 string (',' o ';'), no RegExp
    trim: true,
  });

  const ops = [];
  for (const r of rows) {
    const codigo = toNumber(r.codigo ?? r.CODIGO);
    const determinacion = String(r.determinacion ?? r.DETERMINACION ?? '').trim();
    const ubNum = toNumber(r.ub ?? r.UB);

    if (!codigo || !determinacion || ubNum === null) {
      console.warn('⚠️ Fila inválida (omitida):', r);
      continue;
    }

    ops.push(
      prisma.nomenclador.upsert({
        where: { codigo },
        update: { determinacion, ub: ubNum },
        create: { codigo, determinacion, ub: ubNum },
      }),
    );
  }

  console.log(`📄 Importando ${ops.length} filas...`);

  const chunk = 500;
  for (let i = 0; i < ops.length; i += chunk) {
    await prisma.$transaction(ops.slice(i, i + chunk));
    console.log(`  ✓ ${Math.min(i + chunk, ops.length)} / ${ops.length}`);
  }

  const count = await prisma.nomenclador.count();
  console.log(`✅ Listo. Total en Nomenclador: ${count}`);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
