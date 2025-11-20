import { Request, Response } from 'express';
import { prisma } from '../prisma.js';

// GET /api/patient-notes/patient/:patientId
export async function listPatientNotes(req: Request, res: Response) {
  const { patientId } = req.params;

  const notes = await prisma.patientNote.findMany({
    where: { patientId },
    orderBy: { createdAt: 'desc' },
  });

  res.json(notes);
}

// POST /api/patient-notes/patient/:patientId
export async function createPatientNote(req: Request, res: Response) {
  const { patientId } = req.params;
  const { text } = req.body as { text?: string };

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'El texto de la nota es obligatorio' });
  }

  // opcional: verificar que el paciente exista
  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true },
  });

  if (!patient) {
    return res.status(404).json({ error: 'Paciente no encontrado' });
  }

  const note = await prisma.patientNote.create({
    data: {
      patientId,
      text: text.trim(),
    },
  });

  res.status(201).json(note);
}

// GET /api/patient-notes/:id
export async function getPatientNote(req: Request, res: Response) {
  const { id } = req.params;

  const note = await prisma.patientNote.findUnique({ where: { id } });
  if (!note) return res.status(404).json({ error: 'Nota no encontrada' });

  res.json(note);
}

// PUT /api/patient-notes/:id
export async function updatePatientNote(req: Request, res: Response) {
  const { id } = req.params;
  const { text } = req.body as { text?: string };

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'El texto de la nota es obligatorio' });
  }

  try {
    const updated = await prisma.patientNote.update({
      where: { id },
      data: { text: text.trim() },
    });
    res.json(updated);
  } catch {
    res.status(404).json({ error: 'Nota no encontrada' });
  }
}

// DELETE /api/patient-notes/:id
export async function deletePatientNote(req: Request, res: Response) {
  const { id } = req.params;

  try {
    await prisma.patientNote.delete({ where: { id } });
    res.status(204).end();
  } catch {
    res.status(404).json({ error: 'Nota no encontrada' });
  }
}
