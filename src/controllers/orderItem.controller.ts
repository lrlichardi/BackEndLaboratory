import { Request, Response } from 'express';
import { prisma } from '../prisma.js';

// PUT /api/order-items/:id/result
// body: { value: string, unit?: string, refRange?: string }
export async function upsertResult(req: Request, res: Response) {
  const { id } = req.params; // orderItemId
  const { value, unit, refRange } = req.body || {};
  if (!value || !String(value).trim()) {
    return res.status(400).json({ error: 'value requerido' });
  }

  const item = await prisma.orderItem.findUnique({ where: { id } });
  if (!item) return res.status(404).json({ error: 'Item no encontrado' });

  const saved = await prisma.result.upsert({
    where: { orderItemId: id },
    update: { value: String(value), unit: unit || null, refRange: refRange || null },
    create: { orderItemId: id, value: String(value), unit: unit || null, refRange: refRange || null },
  });

  res.json(saved);
}
