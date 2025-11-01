import { Request, Response } from 'express';
import { prisma } from '../prisma.js';

const ORDER_STATUS = ['PENDING', 'COMPLETED', 'CANCELED'] as const;
export type OrderStatus = typeof ORDER_STATUS[number];

export async function listOrders(req: Request, res: Response) {
  const patientId = String(req.query.patientId || '');
  if (!patientId) return res.status(400).json({ error: 'patientId requerido' });

  const data = await prisma.testOrder.findMany({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
    include: {
      doctor: true,
      items: { include: { examType: true, result: true } },
      patient: { select: { id: true, firstName: true, lastName: true, dni: true } },
    },
  });
  res.json(data);
}

export async function getOrder(req: Request, res: Response) {
  const { id } = req.params;
  const order = await prisma.testOrder.findUnique({
    where: { id },
    include: {
      doctor: true,
      items: { include: { examType: true, result: true } },
      patient: { select: { id: true, firstName: true, lastName: true, dni: true } },
    },
  });
  if (!order) return res.status(404).json({ error: 'Orden no encontrada' });
  res.json(order);
}

/**
 * Body:
 * {
 *   patientId: string,
 *   orderNumber?: string,
 *   title?: string,
 *   doctorName?: string,  // crea/reutiliza Doctor
 *   examCodes: string[],  // códigos de nomenclador
 *   notes?: string
 * }
 */
export async function createOrder(req: Request, res: Response) {
  const { patientId, orderNumber, title, doctorName, examCodes, notes } = req.body || {};
  if (!patientId || !Array.isArray(examCodes) || examCodes.length === 0) {
    return res.status(400).json({ error: 'patientId y examCodes[] son requeridos' });
  }

  // doctor opcional: findOrCreate por nombre
  let doctorId: string | undefined = undefined;
  if (doctorName && String(doctorName).trim()) {
    const full = String(doctorName).trim();
    const existing = await prisma.doctor.findFirst({ where: { fullName: full } });
    doctorId = existing
      ? existing.id
      : (await prisma.doctor.create({ data: { fullName: full } })).id;
  }

  // Asegurar ExamType por cada code (busca nombre en Nomenclador si existe)
  const examTypeIds: string[] = [];
  for (const raw of examCodes) {
    const code = String(raw ?? '').trim();
    if (!code) continue;

    let et = await prisma.examType.findUnique({ where: { code } });
    if (!et) {
      let nombre: string | null = null;
      try {
        // si tu Nomenclador.codigo es String:
        const n1 = await prisma.nomenclador.findUnique({ where: { codigo: code as any } as any });
        if (n1) nombre = n1.determinacion;
      } catch {}
      if (!nombre && /^\d+$/.test(code)) {
        const asInt = Number(code);
        try {
          // si tu Nomenclador.codigo es Int:
      
          const n2 = await prisma.nomenclador.findUnique({ where: { codigo: asInt } });
          if (n2) nombre = n2.determinacion;
        } catch {}
      }
      et = await prisma.examType.create({
        data: { code, name: nombre ?? `Estudio ${code}` },
      });
    }
    examTypeIds.push(et.id);
  }

  const created = await prisma.testOrder.create({
    data: {
      patientId,
      orderNumber: orderNumber || null,
      title: title || null,
      doctorId: doctorId || null,
      notes: notes || null,
      items: { create: examTypeIds.map((id) => ({ examTypeId: id })) },
    },
    include: {
      doctor: true,
      items: { include: { examType: true, result: true } },
      patient: { select: { id: true, firstName: true, lastName: true, dni: true } },
    },
  });

  res.status(201).json(created);
}

export async function updateOrderStatus(req: Request, res: Response) {
  const { id } = req.params;
  const status = String(req.body?.status || '').toUpperCase();
  
console.log(status)
  if (!ORDER_STATUS.includes(status as OrderStatus)) {
    console.log(ORDER_STATUS.includes(status as OrderStatus))
    return res.status(400).json({ error: 'Estado inválido. Use PENDING | COMPLETED | CANCELED' });
  }

  const exists = await prisma.testOrder.findUnique({ where: { id } });
  if (!exists) return res.status(404).json({ error: 'Orden no encontrada' });
 
  const updated = await prisma.testOrder.update({
    where: { id },
    data: { status },
    select: {
      id: true, status: true, orderNumber: true, title: true, notes: true,
      createdAt: true, patientId: true, doctorId: true,
    },
  });

  res.json(updated);
}

export async function deleteOrder(req: Request, res: Response) {
  const { id } = req.params;

  const exists = await prisma.testOrder.findUnique({ where: { id } });
  if (!exists) return res.status(404).json({ error: 'Orden no encontrada' });

  await prisma.$transaction([
    prisma.result.deleteMany({ where: { orderItem: { orderId: id } } }),
    prisma.orderItem.deleteMany({ where: { orderId: id } }),
    prisma.sample.deleteMany({ where: { orderId: id } }),
    prisma.testOrder.delete({ where: { id } }),
  ]);

  res.status(204).end();
}
