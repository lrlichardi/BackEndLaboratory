import { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { patientCreateSchema, patientUpdateSchema } from '../validators/patient.js';

export async function listPatients(req: Request, res: Response) {
  const query = (req.query.query as string | undefined) || '';
  const page = Number(req.query.page || 1);
  const pageSize = Math.min(Number(req.query.pageSize || 20), 100);
  const skip = (page - 1) * pageSize;

 const where = query
  ? {
      OR: [
        { firstName: { contains: query } },
        { lastName:  { contains: query } },
        { dni:       { contains: query } },
        { email:     { contains: query } },
      ],
    }
  : {};

  const [data, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.patient.count({ where }),
  ]);

  res.json({ data, total, page, pageSize });
}

export async function getPatient(req: Request, res: Response) {
  const { id } = req.params;
  const p = await prisma.patient.findUnique({ where: { id } });
  if (!p) return res.status(404).json({ error: 'Paciente no encontrado' });
  res.json(p);
}

export async function createPatient(req: Request, res: Response) {
  const parse = patientCreateSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });

  try {
    const created = await prisma.patient.create({ data: parse.data as any });
    res.status(201).json(created);
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return res.status(409).json({ error: 'DNI o Email ya se encuentra registrado' });
    }
    throw e;
  }
}

export async function updatePatient(req: Request, res: Response) {
  const { id } = req.params;
  const parse = patientUpdateSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: parse.error.flatten() });
  try {
    const updated = await prisma.patient.update({
      where: { id },
      data: parse.data as any,
    });
  
    res.status(201).json({ ok: true, message: 'Paciente modificado', data: updated });
  } catch (e: any) {
    if (e?.code === 'P2025') {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    if (e?.code === 'P2002') {
      return res.status(409).json({ error: 'DNI o Email ya en uso por otro paciente' });
    }
    throw e;
  }
}

export async function deletePatient(req: Request, res: Response) {
  const { id } = req.params;
  try {
    await prisma.patient.delete({ where: { id } });
    res.status(204).send();
  } catch (e: any) {
    if (e?.code === 'P2025') {
      return res.status(404).json({ error: 'Paciente no encontrado' });
    }
    throw e;
  }
}
