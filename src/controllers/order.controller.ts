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
      patient: {
        select: { id: true, firstName: true, lastName: true, dni: true },
      },
      items: {
        include: {
          examType: true,
          analytes: { include: { itemDef: true } },
          results: true,
        },
      },
    },
  });

  res.json(data);
}

export async function getOrder(req: Request, res: Response) {
  const { id } = req.params;

  const baseInclude = {
    doctor: true,
    patient: true,
    items: {
      include: {
        examType: true,
        analytes: { include: { itemDef: true } },
      },
    },
  } as const;

  let order = await prisma.testOrder.findUnique({
    where: { id },
    include: baseInclude,
  });
  if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

  // Asegurá analytes en cada item (lazy, por si no se crearon al generar la orden)
  for (const item of order.items) {
    const defs = await prisma.examItemDef.findMany({
      where: { examTypeId: item.examTypeId },
      orderBy: { sortOrder: 'asc' },
    });

    const missing = defs.filter(d => !item.analytes.some(a => a.itemDefId === d.id));
    if (missing.length) {
      await prisma.$transaction(
        missing.map(d =>
          prisma.orderItemAnalyte.create({
            data: {
              orderItemId: item.id,
              itemDefId: d.id,
              unit: d.unit || null, // snapshot básico
            },
          }),
        ),
      );
    }
  }

  // recarga la orden con analytes ya completos
  order = await prisma.testOrder.findUnique({
    where: { id },
    include: baseInclude,
  });

  res.json(order);
}


export async function createOrder(req: Request, res: Response) {
  const { patientId, orderNumber, title, doctorId, examCodes, notes } = req.body || {};
  if (!patientId || !Array.isArray(examCodes) || examCodes.length === 0) {
    return res.status(400).json({ error: 'patientId y examCodes[] son requeridos' });
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
      } catch { }
      if (!nombre && /^\d+$/.test(code)) {
        const asInt = Number(code);
        try {
          // si tu Nomenclador.codigo es Int:

          const n2 = await prisma.nomenclador.findUnique({ where: { codigo: asInt } });
          if (n2) nombre = n2.determinacion;
        } catch { }
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
      items: { include: { examType: true, results: true } },
      patient: { select: { id: true, firstName: true, lastName: true, dni: true } },
    },
  });

  res.status(201).json(created);
}

export async function updateOrderStatus(req: Request, res: Response) {
  const { id } = req.params;
  const status = String(req.body?.status || '').toUpperCase();

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

export async function patchOrder(req: Request, res: Response) {
  const { id } = req.params;
  const { orderNumber, title, doctorId, notes } = req.body;

  const exists = await prisma.testOrder.findUnique({ where: { id } });
  if (!exists) return res.status(404).json({ error: 'Orden no encontrada' });

  const updated = await prisma.testOrder.update({
    where: { id },
    data: {
      orderNumber: orderNumber || undefined,
      title: title || undefined,
      doctorId: doctorId || undefined,
      notes: notes || undefined,

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

export async function deleteOrderItem(req: Request, res: Response) {
  const { itemId } = req.params;

  const exists = await prisma.orderItem.findUnique({
    where: { id: itemId },
    include: { order: true }
  });

  if (!exists) {
    return res.status(404).json({ error: 'Item no encontrado' });
  }

  // Eliminar en cascada: primero analytes y results, luego el item
  await prisma.$transaction([
    prisma.orderItemAnalyte.deleteMany({ where: { orderItemId: itemId } }),
    prisma.result.deleteMany({ where: { orderItemId: itemId } }),
    prisma.orderItem.delete({ where: { id: itemId } }),
  ]);
  return res.status(200).json({
    ok: true,
    message: 'Item borrado',
    deletedItemId: itemId,
    orderId: exists.orderId,
  });
}

export async function updateAnalytesBulk(req: Request, res: Response) {
  const { orderId } = req.params;
  const { updates } = req.body as {
    updates: { orderItemId: string; analyteId: string; value: any }[];
  };

  if (!Array.isArray(updates) || updates.length === 0) {
    return res.status(400).json({ error: 'Lista de updates vacía' });
  }

  // Traemos analytes con sus itemDef para decidir NUMERIC/TEXT y validar pertenencia
  const analyteIds = updates.map(u => u.analyteId);
  const existing = await prisma.orderItemAnalyte.findMany({
    where: { id: { in: analyteIds } },
    include: { itemDef: true, orderItem: true },
  });

  const existingMap = new Map(existing.map(a => [a.id, a]));

  const ops = updates.map(({ orderItemId, analyteId, value }) => {
    const a = existingMap.get(analyteId);
    if (!a || a.orderItemId !== orderItemId || a.orderItem.orderId !== orderId) {
      throw new Error(`Analyte inválido: ${analyteId}`);
    }
    const kind = (a.itemDef.kind || 'NUMERIC').toUpperCase();
    const data: any = {};
    if (value === null || value === '') {
      data.valueNum = null;
      data.valueText = null;
      data.status = 'PENDING';
    } else if (kind === 'NUMERIC') {
      const num = Number(value);
      if (!Number.isFinite(num)) throw new Error(`Valor numérico inválido para ${a.itemDef.label}`);
      data.valueNum = num;
      data.valueText = null;
      data.status = 'DONE';
    } else {
      data.valueText = String(value);
      data.valueNum = null;
      data.status = 'DONE';
    }
    return prisma.orderItemAnalyte.update({ where: { id: analyteId }, data });
  });

  await prisma.$transaction(ops);
  res.json({ ok: true, count: ops.length });
}

export async function addItemsByCodes(req: Request, res: Response) {
  const { id } = req.params;
  const { codes } = req.body;

  if (!Array.isArray(codes)) {
    return res.status(400).json({ error: 'codes debe ser un array' });
  }

  const order = await prisma.testOrder.findUnique({ where: { id } });
  if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

  // Similar a createOrder: buscar/crear ExamType por código
  const examTypeIds: string[] = [];
  for (const code of codes) {
    let et = await prisma.examType.findUnique({ where: { code } });
    if (!et) {
      et = await prisma.examType.create({
        data: { code, name: `Estudio ${code}` },
      });
    }
    examTypeIds.push(et.id);
  }

  // Crear los items
  await prisma.orderItem.createMany({
    data: examTypeIds.map(examTypeId => ({
      orderId: id,
      examTypeId,
    })),
  });

  res.json({ ok: true, added: examTypeIds.length });
}


export async function checkOrderNumber(req: Request, res: Response) {
  const orderNumber = String(req.query.orderNumber || '').trim();
  const excludeId = req.query.excludeId ? String(req.query.excludeId) : null;
  if (!orderNumber) return res.status(400).json({ error: 'orderNumber requerido' });

  const exists = await prisma.testOrder.findFirst({
    where: {
      orderNumber,
      ...(excludeId ? { NOT: { id: excludeId } } : {}),
    },
    select: { id: true },
  });

  return res.json({ exists: !!exists });
}