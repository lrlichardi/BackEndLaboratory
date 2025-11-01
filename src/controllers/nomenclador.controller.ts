import { Request, Response } from 'express';
import { prisma } from '../prisma.js';

export async function listAllNomenclador(_req: Request, res: Response) {
  const rows = await prisma.nomenclador.findMany({
    select: { codigo: true, determinacion: true, ub: true },
    orderBy: { codigo: 'asc' }, // si codigo es Int; si es String, igual vale
  });
  // cache 5 minutos (opcional)
  res.set('Cache-Control', 'public, max-age=300');
  res.json({ rows, total: rows.length });
}
