import { Request, Response } from 'express';
import { prisma } from '../prisma.js';
import { Prisma } from '@prisma/client';
import { fi } from 'zod/v4/locales';

// '' -> null (para poder "vaciar" campos opcionales)
function toNull(v: unknown): string | null {
  const s = (v ?? '').toString().trim();
  return s === '' ? null : s;
}

export async function listDoctors(req: Request, res: Response) {
  try {
    const q = (req.query.q as string | undefined)?.trim();
    const where = q
      ? {
          OR: [
            { fullName:       { contains: q, mode: 'insensitive' } },
            { licenseNumber:  { contains: q, mode: 'insensitive' } },
            { phone:          { contains: q, mode: 'insensitive' } },
            { email:          { contains: q, mode: 'insensitive' } },
          ],
        }
      : undefined;

    const doctors = await prisma.doctor.findMany({
      where,
      orderBy: { fullName: 'asc' },
    });
    res.json(doctors);
  } catch (err) {
    console.error('listDoctors error:', err);
    res.status(500).json({ error: 'Error listando doctores' });
  }
}

export async function getDoctor(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const doctor = await prisma.doctor.findUnique({ where: { id } });
    if (!doctor) return res.status(404).json({ error: 'Doctor no encontrado' });
    res.json(doctor);
  } catch (err) {
    console.error('getDoctor error:', err);
    res.status(500).json({ error: 'Error obteniendo doctor' });
  }
}

export async function createDoctor(req: Request, res: Response) {
  try {
    const { fullName, licenseNumber, phone, email } = req.body as {
      fullName?: string;
      licenseNumber?: string | null;
      phone?: string | null;
      email?: string | null;
    };
    
    if (!fullName || !fullName.trim()) {
      return res.status(400).json({ error: 'El nombre es obligatorio' });
    }

    const created = await prisma.doctor.create({
      data: {
        fullName: fullName.trim(),
        licenseNumber: toNull(licenseNumber),
        phone: toNull(phone),
        email: toNull(email),
      },
    });

    return res.status(201).json(created);
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
      // unique constraint fail
      // @prisma/client expone err.meta?.target con el/los campos
      return res.status(409).json({ error: `Datos duplicados en campo(s): ${err.meta?.target ?? 'único'}` });
    }
    console.error('createDoctor error:', err);
    res.status(500).json({ error: 'Error creando doctor' });
  }
}

export async function updateDoctor(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { fullName, licenseNumber, phone, email } = req.body as {
      fullName?: string;
      licenseNumber?: string | null;
      phone?: string | null;
      email?: string | null;
    };
    
    // Construir data solo con lo provisto
    const data: Prisma.DoctorUpdateInput = {};
    if (fullName !== undefined)      data.fullName      = fullName.trim();
    if (licenseNumber !== undefined) data.licenseNumber = toNull(licenseNumber);
    if (phone !== undefined)         data.phone         = toNull(phone);
    if (email !== undefined)         data.email         = toNull(email);

    const updated = await prisma.doctor.update({ where: { id }, data });
    console.log('updateDoctor updated:', updated);
    return res.status(200).json(updated);
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      if (err.code === 'P2002') {
        return res.status(409).json({ error: `Datos duplicados en campo(s): ${err.meta?.target ?? 'único'}` });
      }
      if (err.code === 'P2025') {
        return res.status(404).json({ error: 'Doctor no encontrado' });
      }
    }
    console.error('updateDoctor error:', err);
    res.status(500).json({ error: 'Error actualizando doctor' });
  }
}

export async function deleteDoctor(req: Request, res: Response) {
  try {
    const { id } = req.params;

    // Evitar borrar si tiene órdenes asociadas
    const orders = await prisma.testOrder.count({ where: { doctorId: id } });
    if (orders > 0) {
      return res.status(409).json({ error: 'No se puede eliminar: el doctor tiene órdenes asociadas' });
    }

    await prisma.doctor.delete({ where: { id } });
    return res.json({ message: 'Doctor eliminado' });
  } catch (err: any) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2025') {
      return res.status(404).json({ error: 'Doctor no encontrado' });
    }
    console.error('deleteDoctor error:', err);
    res.status(500).json({ error: 'Error eliminando doctor' });
  }
}
