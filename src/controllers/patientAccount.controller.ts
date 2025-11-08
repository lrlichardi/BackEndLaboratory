import { Request, Response } from 'express';
import { prisma } from '../prisma.js';

export async function getAccountSummary(req: Request, res: Response) {
  const { id: patientId } = req.params;

  // suma cargos
  const { _sum: chargeSum } = await prisma.patientAccountEntry.aggregate({
    where: { patientId, kind: 'CHARGE' },
    _sum: { amount: true },
  });
  // suma pagos
  const { _sum: paySum } = await prisma.patientAccountEntry.aggregate({
    where: { patientId, kind: 'PAYMENT' },
    _sum: { amount: true },
  });

  const totalCharged = Number(chargeSum.amount ?? 0);
  const totalPaid    = Number(paySum.amount ?? 0);
  const balance      = totalCharged - totalPaid;

  res.json({
    patientId,
    total: totalCharged,       // total facturado
    pagado: totalPaid,         // total abonado
    saldoDeudor: balance,      // lo que debe
    tieneDeuda: balance > 0,
  });
}

export async function listEntries(req: Request, res: Response) {
  const { id: patientId } = req.params;
  const entries = await prisma.patientAccountEntry.findMany({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
    include: {
      testOrder: { select: { id: true, orderNumber: true } },
      orderItem: { select: { id: true } },
    },
  });
  res.json(entries);
}

export async function createEntry(req: Request, res: Response) {
  const { id: patientId } = req.params;
  const { kind, amount, description, testOrderId, orderItemId } = req.body;

  if (!['CHARGE', 'PAYMENT', 'ADJUSTMENT'].includes(kind)) {
    return res.status(400).json({ error: 'kind inválido' });
  }
  const n = Number(amount);
  if (!Number.isFinite(n) || n <= 0) {
    return res.status(400).json({ error: 'amount debe ser > 0' });
  }

  const entry = await prisma.patientAccountEntry.create({
    data: {
      patientId,
      kind,
      amount: n,
      description: description || null,
      testOrderId: testOrderId || null,
      orderItemId: orderItemId || null,
    },
  });
  res.status(201).json(entry);
}
