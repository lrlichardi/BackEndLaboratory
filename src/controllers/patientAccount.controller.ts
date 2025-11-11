// src/controllers/patientAccount.controller.ts
import { Request, Response } from 'express'
import { prisma } from '../prisma'


type Kind = 'CHARGE' | 'PAYMENT' | 'ADJUSTMENT'


// Convierte "1234.56" -> 123456; "1.2" -> 120; también acepta número
function toCents(input: string | number): number {
  const n = typeof input === 'number' ? input : Number(String(input).replace(/,/g, ''))
  if (!Number.isFinite(n)) throw new Error('Monto inválido')
  return Math.round(n * 100)
}


// Helper: asegura que testOrderId / orderItemId pertenecen al paciente
async function validateOwnership(patientId: string, testOrderId?: string | null, orderItemId?: string | null) {
  let orderIdFromItem: string | null = null


  if (testOrderId) {
    const order = await prisma.testOrder.findUnique({ select: { id: true, patientId: true }, where: { id: testOrderId } })
    if (!order) throw new Error('testOrderId inexistente')
    if (order.patientId !== patientId) throw new Error('La orden no pertenece al paciente')
  }


  if (orderItemId) {
    const item = await prisma.orderItem.findUnique({
      where: { id: orderItemId },
      select: { id: true, orderId: true, order: { select: { patientId: true } } },
    })
    if (!item) throw new Error('orderItemId inexistente')
    if (item.order.patientId !== patientId) throw new Error('El ítem no pertenece al paciente')
    orderIdFromItem = item.orderId
  }


  if (testOrderId && orderItemId) {
    // coherencia: el ítem debe ser de esa misma orden
    const item = await prisma.orderItem.findUnique({ where: { id: orderItemId }, select: { orderId: true } })
    if (item && item.orderId !== testOrderId) throw new Error('El ítem no corresponde a la orden indicada')
  }


  return { orderIdFromItem }
}


export async function getAccountSummary(req: Request, res: Response) {
  const { id: patientId } = req.params


  // Sumas por tipo
  const [sumCharge, sumPayment, sumAdj] = await Promise.all([
    prisma.patientAccountEntry.aggregate({ where: { patientId, kind: 'CHARGE' }, _sum: { amountCents: true } }),
    prisma.patientAccountEntry.aggregate({ where: { patientId, kind: 'PAYMENT' }, _sum: { amountCents: true } }),
    prisma.patientAccountEntry.aggregate({ where: { patientId, kind: 'ADJUSTMENT' }, _sum: { amountCents: true } }),
  ])


  const charged = Number(sumCharge._sum.amountCents ?? 0)
  const paid = Number(sumPayment._sum.amountCents ?? 0)
  const adjusted = Number(sumAdj._sum.amountCents ?? 0) // puede ser + o -
  const balance = charged - paid + adjusted

  res.json({
    patientId,
    total: charged,
    pagado: paid,
    ajustes: adjusted,
    saldoDeudor: balance,
    tieneDeuda: balance > 0,
  })
}


export async function listEntries(req: Request, res: Response) {
  const { id: patientId } = req.params
  const entries = await prisma.patientAccountEntry.findMany({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
    include: {
      testOrder: { select: { id: true, orderNumber: true } },
      orderItem: { select: { id: true } },
    },
  })
  res.json(entries)
}


export async function createEntry(req: Request, res: Response) {
  const { id: patientId } = req.params
  const { kind, amount, description, testOrderId, orderItemId } = req.body as {
    kind: Kind; amount: number | string; description?: string; testOrderId?: string | null; orderItemId?: string | null
  }


  if (!['CHARGE', 'PAYMENT', 'ADJUSTMENT'].includes(kind)) {
    return res.status(400).json({ error: 'kind inválido' })
  }


  let cents: number
  try { cents = toCents(amount) } catch (e: any) { return res.status(400).json({ error: e.message }) }


  if (kind !== 'ADJUSTMENT' && cents <= 0) {
    return res.status(400).json({ error: 'amount debe ser > 0' })
  }
  if (kind === 'ADJUSTMENT' && cents === 0) {
    return res.status(400).json({ error: 'El ajuste no puede ser 0' })
  }


  try {
    await validateOwnership(patientId, testOrderId, orderItemId)


    const entry = await prisma.patientAccountEntry.create({
      data: {
        patientId,
        kind,
        amountCents: cents,
        description: description?.trim() || null,
        testOrderId: testOrderId || null,
        orderItemId: orderItemId || null,
      },
    })


    res.status(201).json(entry)
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'No se pudo crear el movimiento' })
  }
}


export async function deleteEntry(req: Request, res: Response) {
  const { id: patientId, entryId } = req.params as { id: string; entryId: string }
  // simple guard: el movimiento debe ser del paciente
  const exists = await prisma.patientAccountEntry.findUnique({ where: { id: entryId }, select: { patientId: true } })
  if (!exists || exists.patientId !== patientId) return res.status(404).json({ error: 'Movimiento no encontrado' })


  await prisma.patientAccountEntry.delete({ where: { id: entryId } })
  res.status(204).end()
}