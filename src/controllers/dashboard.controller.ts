import { Request, Response } from 'express';
import { prisma } from '../prisma.js';

function getMonthRange(monthParam?: string) {
  const now = new Date();

  let year = now.getFullYear();
  let monthIndex = now.getMonth(); // 0-11

  if (monthParam && /^\d{4}-\d{2}$/.test(monthParam)) {
    const [yStr, mStr] = monthParam.split('-');
    const y = Number(yStr);
    const m = Number(mStr);
    if (Number.isFinite(y) && Number.isFinite(m) && m >= 1 && m <= 12) {
      year = y;
      monthIndex = m - 1;
    }
  }

  const from = new Date(year, monthIndex, 1, 0, 0, 0, 0);
  const to = new Date(year, monthIndex + 1, 1, 0, 0, 0, 0);

  return { from, to };
}

function classifyMethodPay(methodPay: string | null | undefined) {
  const raw = (methodPay ?? '').trim().toUpperCase();

  if (!raw) {
    return {
      label: 'Sin definir',
      hasSocial: false,
      isParticularOnly: false,
      isMixed: false,
    };
  }

  if (raw === 'PARTICULAR') {
    return {
      label: 'Particular',
      hasSocial: false,
      isParticularOnly: true,
      isMixed: false,
    };
  }

  if (raw === 'OBRA SOCIAL') {
    return {
      label: 'Obra social',
      hasSocial: true,
      isParticularOnly: false,
      isMixed: false,
    };
  }

  if (raw === 'OBRA SOCIAL + PARTICULAR') {
    return {
      label: 'Obra social + particular',
      hasSocial: true,
      isParticularOnly: false,
      isMixed: true,
    };
  }

  const hasSocial = raw.includes('OBRA') && raw.includes('SOCIAL');
  const isParticularOnly = raw.includes('PARTICULAR') && !hasSocial;
  const isMixed = hasSocial && raw.includes('PARTICULAR');

  const label = isMixed
    ? 'Obra social + particular'
    : hasSocial
    ? 'Obra social'
    : isParticularOnly
    ? 'Particular'
    : 'Otro';

  return { label, hasSocial, isParticularOnly, isMixed };
}

export async function getDashboard(req: Request, res: Response) {
  try {
    const monthParam = (req.query.month as string | undefined) || undefined;
    const { from, to } = getMonthRange(monthParam);

    // 1) Movimientos de cuenta del mes: solo CHARGE = "análisis" cobrados
    const charges = await prisma.patientAccountEntry.findMany({
      where: {
        kind: 'CHARGE',
        createdAt: {
          gte: from,
          lt: to,
        },
      },
      include: {
        // 👇 usamos la relación que ya tenés en patientAccount.controller.ts
        testOrder: {
          select: {
            id: true,
            methodPay: true,
          },
        },
      },
    });

    const totalAnalysesMonth = charges.length;

    let totalPrivateAnalyses = 0;      
    let totalSocialWorkAnalyses = 0;   
    let totalAmountCents = 0;

    // Mapa por "tipo de pago" (no por obra social específica)
    const bySocialWork = new Map<
      string,
      { analysesCount: number; amountCents: number }
    >();

    for (const ch of charges) {
      totalAmountCents += ch.amountCents;

      const classification = classifyMethodPay(ch.testOrder?.methodPay || null);

      if (classification.isParticularOnly) {
        totalPrivateAnalyses++;
      }

      if (classification.hasSocial) {
        // OBRA SOCIAL o OBRA SOCIAL + PARTICULAR
        totalSocialWorkAnalyses++;
      }

      const key = classification.label;

      const current = bySocialWork.get(key) ?? {
        analysesCount: 0,
        amountCents: 0,
      };

      current.analysesCount += 1;
      current.amountCents += ch.amountCents;

      bySocialWork.set(key, current);
    }

    const analysesBySocialWork = Array.from(bySocialWork.entries()).map(
      ([socialWorkName, { analysesCount, amountCents }]) => ({
        socialWorkName,               // 'Particular', 'Obra social', 'Obra social + particular', 'Sin definir', etc.
        analysesCount,
        amount: amountCents / 100,    // pesos
      }),
    );

    // 2) Evolución histórica por mes: usamos también CHARGE como proxy de "análisis"
    const allCharges = await prisma.patientAccountEntry.findMany({
      where: { kind: 'CHARGE' },
      select: { createdAt: true },
    });

    const perMonthMap = new Map<string, number>();

    for (const ch of allCharges) {
      const d =
        ch.createdAt instanceof Date ? ch.createdAt : new Date(ch.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      perMonthMap.set(key, (perMonthMap.get(key) || 0) + 1);
    }

    const analysesPerMonth = Array.from(perMonthMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const responseBody = {
      summary: {
        totalAnalysesMonth,
        totalPrivateAnalyses,
        totalSocialWorkAnalyses,
        totalAmountExpected: totalAmountCents / 100, // pesos
      },
      analysesPerMonth,
      analysesBySocialWork,
    };

    res.json(responseBody);
  } catch (err) {
    console.error('Error en getDashboard:', err);
    res.status(500).json({ error: 'No se pudo obtener el dashboard' });
  }
}
