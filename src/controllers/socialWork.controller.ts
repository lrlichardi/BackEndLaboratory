import type { Request, Response } from 'express';
import { prisma } from '../prisma.js';

/** GET /api/social-works?query=&page=1&pageSize=10 */
export async function listSocialWorks(req: Request, res: Response) {
  const query = String(req.query.query || '').trim();
  const page = Math.max(1, Number(req.query.page || 1));
  const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || 10)));

  const where = query
    ? { name: { contains: query, mode: 'insensitive' as const } }
    : {};

  const [total, data] = await Promise.all([
    prisma.socialWork.count({ where }),
    prisma.socialWork.findMany({
      where,
      orderBy: { name: 'asc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);

  res.json({ data, total });
}

/** POST /api/social-works  { name } */
export async function createSocialWork(req: Request, res: Response) {
  const name = String(req.body?.name || '').trim();
  if (!name) {
    return res.status(400).json({ message: 'El nombre es obligatorio' });
  }

  try {
    const created = await prisma.socialWork.create({ data: { name } });
    res.status(201).json({ message: 'Obra Social creada', data: created });
  } catch (e: any) {
    if (e.code === 'P2002') {
      return res
        .status(409)
        .json({ message: 'Ya existe una Obra Social con ese nombre' });
    }
    res.status(500).json({ message: 'No se pudo crear' });
  }
}

/** PUT /api/social-works/:id */
export async function updateSocialWork(req: Request, res: Response) {
  const id = String(req.params.id);
  const name = String(req.body?.name || '').trim();

  if (!name) {
    return res.status(400).json({ message: 'El nombre es obligatorio' });
  }

  try {
    const updated = await prisma.socialWork.update({
      where: { id },
      data: { name },
    });
    res.json({ message: 'Obra Social actualizada', data: updated });
  } catch (e: any) {
    if (e.code === 'P2002') {
      return res
        .status(409)
        .json({ message: 'Ya existe una Obra Social con ese nombre' });
    }
    if (e.code === 'P2025') {
      return res.status(404).json({ message: 'No encontrada' });
    }
    res.status(500).json({ message: 'No se pudo actualizar' });
  }
}

/** DELETE /api/social-works/:id */
export async function deleteSocialWork(req: Request, res: Response) {
  const id = String(req.params.id);
  try {
    await prisma.socialWork.delete({ where: { id } });
    res.json({ message: 'Obra Social eliminada' });
  } catch (e: any) {
    if (e.code === 'P2025') {
      return res.status(404).json({ message: 'No encontrada' });
    }
    res.status(500).json({ message: 'No se pudo eliminar' });
  }
}
