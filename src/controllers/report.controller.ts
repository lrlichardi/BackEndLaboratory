import { Request, Response } from 'express';
import PDFDocument from 'pdfkit';
import { prisma } from '../prisma.js';

export async function generateOrderReport(req: Request, res: Response) {
    const { orderId } = req.params;

    function calculateAge(birthDate: Date): number {
        const today = new Date();
        const birth = new Date(birthDate);
        let age = today.getFullYear() - birth.getFullYear();
        const monthDiff = today.getMonth() - birth.getMonth();

        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
            age--;
        }

        return age;
    }

    try {
        const order = await prisma.testOrder.findUnique({
            where: { id: orderId },
            include: {
                patient: true,
                doctor: true,
                items: {
                    include: {
                        examType: true,
                        analytes: {
                            include: { itemDef: true },
                            orderBy: { itemDef: { sortOrder: 'asc' } }
                        }
                    }
                }
            }
        });

        if (!order) return res.status(404).json({ error: 'Orden no encontrada' });

        const doc = new PDFDocument({ margin: 50 });

        // Headers
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=informe-${order.orderNumber}.pdf`);

        doc.pipe(res);
        const age = calculateAge(order.patient.birthDate);
        // Logo y encabezado
        doc.fontSize(20)
            .fillColor('#000000')
            .text('Laboratorio Clínico', { align: 'center' })
            .text('Bioquimica Perez Maria Fatima', { align: 'center' })
            .text('MAT. PROF. Nº ', { align: 'center' });
        doc.fontSize(10)
            .fillColor('#000000')
            .text('AV. SANTO CRISTO 571 BANDA RIO SALI', { align: 'center' })
            .text('CEL: 3816526258', { align: 'center' });

        const left = doc.page.margins.left;
        const right = doc.page.margins.right;
        const width = doc.page.width;
        const y = doc.y + 10;
        doc.strokeColor('#000000ff')
            .lineWidth(3)
            .moveTo(left, y)
            .lineTo(width - right, y)
            .stroke();

        doc.moveDown();
        // Datos del paciente
        doc.fontSize(12)
            .fillColor('#000000')
            .text(`Paciente: ${order.patient.lastName}, ${order.patient.firstName}`)
            .text(`DNI: ${order.patient.dni}`)
            .text(`Edad: ${age} años`)
            .text(`Sexo: ${order.patient.sex}`)
            .text(`Fecha: ${new Date(order.createdAt).toLocaleDateString('es-AR')}`)
            .text(`Médico: ${order.doctor?.fullName || '—'}`);
        doc.moveDown();

        // Resultados
        doc.fontSize(14)
            .fillColor('#000000')
            .text('RESULTADOS', { underline: true });
        doc.moveDown();

        for (const item of order.items) {
            // Nombre del estudio
            doc.fontSize(12)
                .fillColor('#000000')
                .text(item.examType.name, { underline: true });

            for (const analyte of item.analytes) {
                const value = analyte.valueNum ?? analyte.valueText ?? '—';
                const unit = analyte.unit || analyte.itemDef.unit || '';
                const refText = analyte.itemDef.refText || '';

                // Nombre del ítem y valor
                doc.fontSize(10)
                    .fillColor('#000000')
                    .text(`  ${analyte.itemDef.label}: ${value} ${unit}`);

                // Rango de referencia en gris
                doc.fontSize(9)
                    .fillColor('#666666')
                    .text(`    Rango ref: ${refText}`);
            }
            doc.moveDown();
        }

        // Notas si existen
        if (order.notes) {
            doc.moveDown();
            doc.fontSize(11)
                .fillColor('#000000')
                .text('Observaciones:', { underline: true });
            doc.fontSize(10)
                .fillColor('#333333')
                .text(order.notes);
        }

        doc.end();
    } catch (error: any) {
        console.error('Error generando reporte:', error);
        res.status(500).json({ error: 'Error generando el informe' });
    }
}