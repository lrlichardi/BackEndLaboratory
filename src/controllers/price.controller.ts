import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PRICE_CONFIG_ID = 1;

export async function getPriceFactor(req: Request, res: Response) {
  try {
    const row = await prisma.priceConfig.findUnique({
      where: { id: PRICE_CONFIG_ID },
    });

    // Si todavía no existe, devolvemos 1 como valor por defecto
    const factor = row?.factor ?? 1;

    res.json({ factor }); // factor es un number (int)
  } catch (err) {
    console.error('getPriceFactor error', err);
    res.status(500).json({ message: 'Error obteniendo factor de precio' });
  }
}

export async function updatePriceFactor(req: Request, res: Response) {
  try {
    const { factor } = req.body;

    // Validamos que sea número entero positivo
    if (
      typeof factor !== 'number' ||
      !Number.isInteger(factor) ||
      factor <= 0
    ) {
      return res.status(400).json({ message: 'factor inválido' });
    }

    const row = await prisma.priceConfig.upsert({
      where: { id: PRICE_CONFIG_ID },
      update: { factor },
      create: { id: PRICE_CONFIG_ID, factor },
    });

    res.json({ factor: row.factor });
  } catch (err) {
    console.error('updatePriceFactor error', err);
    res.status(500).json({ message: 'Error actualizando factor de precio' });
  }
}
