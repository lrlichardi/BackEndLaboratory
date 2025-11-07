// src/prisma.ts
import { PrismaClient } from '@prisma/client';

const g = globalThis as unknown as {
  prisma?: PrismaClient;
  prismaReady?: Promise<PrismaClient>;
};

export const prisma =
  g.prisma ??
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

function isSQLiteUrl(url: string | undefined) {
  if (!url) return false;
  return url.startsWith('file:') || url.includes('sqlite');
}

async function initSqlitePragmas() {
  if (!isSQLiteUrl(process.env.DATABASE_URL)) return;

  await prisma.$connect();

  // PRAGMA que pueden devolver filas → usar queryRaw
  try {
    await prisma.$queryRawUnsafe(`PRAGMA foreign_keys = ON;`);
  } catch (e: any) {
    console.warn('[SQLite] No pude activar foreign_keys:', e?.message || e);
  }

  try {
    await prisma.$queryRawUnsafe(`PRAGMA busy_timeout = 5000;`);
  } catch (e: any) {
    console.warn('[SQLite] No pude setear busy_timeout:', e?.message || e);
  }

  // journal_mode (devuelve fila). Intentá poner WAL si no lo está
  try {
    const cur = await prisma.$queryRawUnsafe<{ journal_mode: string }[]>(`PRAGMA journal_mode;`);
    const current = String(cur?.[0]?.journal_mode || '').toLowerCase();

    if (current !== 'wal') {
      // puede fallar si hay otro proceso usando la DB: logueamos y seguimos
      try {
        const set = await prisma.$queryRawUnsafe<{ journal_mode: string }[]>(
          `PRAGMA journal_mode = WAL;`
        );
        const now = String(set?.[0]?.journal_mode || '').toLowerCase();
        if (now !== 'wal') {
          console.warn('[SQLite] journal_mode no quedó en WAL (actual:', now, ')');
        }
      } catch (e: any) {
        console.warn('[SQLite] No pude setear journal_mode=WAL (DB en uso?):', e?.message || e);
      }
    }
  } catch (e: any) {
    console.warn('[SQLite] No pude consultar/ajustar journal_mode:', e?.message || e);
  }
}

export const prismaReady =
  g.prismaReady ??
  (async () => {
    await initSqlitePragmas();
    return prisma;
  })();

// Reutilizar cliente en dev (hot-reload)
if (process.env.NODE_ENV !== 'production') {
  g.prisma = prisma;
  g.prismaReady = prismaReady;
}
