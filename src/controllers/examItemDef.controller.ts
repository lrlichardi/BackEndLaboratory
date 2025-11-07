import { Request, Response } from 'express';
import { prisma } from '../prisma.js';

// Busca (o crea) el ExamType por código; intenta traer nombre/UB desde Nomenclador si existe
async function ensureExamTypeByCode(code: string) {
  
  let et = await prisma.examType.findUnique({
    where: { code },
    select: { id: true, code: true, name: true, isPanel: true },
  });
  console.log("estoy et", et)
  
  if (et && et != null) return et;

  // Si no existe ExamType, PRIMERO verificar que exista en Nomenclador
  const n = await prisma.nomenclador.findUnique({ 
    where: { codigo: Number(code) } 
  }).catch(() => null);
  
  console.log("estoy es n", n)
  
  // Si tampoco existe en Nomenclador, lanzar error
  if (!n) {
    throw new Error(`El código ${code} no existe en el Nomenclador`);
  }

  // Solo crear si existe en Nomenclador
  const name = n.determinacion ?? `Estudio ${code}`;

  et = await prisma.examType.create({
    data: { code, name, isPanel: true },
    select: { id: true, code: true, name: true, isPanel: true },
  });
  
  return et;
}

export async function listExamItems(req: Request, res: Response) {
  try {
    const code = String(req.query.code || '').trim();
    if (!/^\d{5,7}$/.test(code)) {
      return res.status(400).json({ error: 'Parámetro code inválido' });
    }

    const et = await ensureExamTypeByCode(code);

    const items = await prisma.examItemDef.findMany({
      where: { examTypeId: et.id },
      orderBy: [{ sortOrder: 'asc' }],
    });

    res.json({ examType: et, items });
  } catch (error: any) {
    res.status(404).json({ error: error.message || 'Código no encontrado' });
  }
}

export async function createExamItem(req: Request, res: Response) {
  try {
    const { code, key, label, unit, kind, sortOrder, refText } = req.body || {};
    if (!code || !key || !label) {
      return res.status(400).json({ error: 'code, key y label son requeridos' });
    }

    const et = await ensureExamTypeByCode(String(code));
    
    const exists = await prisma.examItemDef.findFirst({ 
      where: { examTypeId: et.id, key } 
    });
    
    if (exists) {
      return res.status(409).json({ 
        error: `Ya existe un ítem con key "${key}" para el código ${code}` 
      });
    }

    const created = await prisma.examItemDef.create({
      data: {
        examTypeId: et.id,
        key,
        label,
        unit: unit || null,
        kind: (kind || 'NUMERIC').toUpperCase(),
        sortOrder: Number.isFinite(sortOrder) ? sortOrder : 0,
        refText: (refText?.trim?.() || null),
      },
    });
    
    res.status(201).json(created);
  } catch (error: any) {
    res.status(404).json({ error: error.message || 'Código no encontrado' });
  }
}

// PUT /api/exam-item-def/:id
export async function updateExamItem(req: Request, res: Response) {
  const { id } = req.params;
  const { key, label, unit, kind, sortOrder, refText } = req.body || {};
  const updated = await prisma.examItemDef.update({
    where: { id },
    data: {
      key: key ?? undefined,
      label: label ?? undefined,
      unit: unit ?? undefined,
      kind: kind ? String(kind).toUpperCase() : undefined,
      sortOrder: Number.isFinite(sortOrder) ? sortOrder : undefined,
      refText: refText !== undefined ? (refText?.trim?.() || null) : undefined,
    },
  });
  res.json(updated);
}

// DELETE /api/exam-item-def/:id
export async function deleteExamItem(req: Request, res: Response) {
  const { id } = req.params;
  await prisma.examItemDef.delete({ where: { id } });
  res.status(204).end();
}
