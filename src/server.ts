// src/server.ts
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import patientRouter from './routes/patient.routes.js';
import orderRoutes from './routes/order.routes.js';
import orderItemRoutes from './routes/orderItem.routes.js';
import nomencladorRoutes from './routes/nomenclador.routes.js';
import examItemDefRoutes from './routes/examItemDef.routes.js';
import doctorRoutes from './routes/doctor.routes.js';
import socialWorkRouter from './controllers/socialWork.controller';
import patientAccountRoutes from './routes/patientAccount.routes.js';

import { prismaReady } from './prisma.js'; 

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

// Esperar init de Prisma/SQLite antes de aceptar requests (TLA soportado por tsx)
await prismaReady; // 👈 importante

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use(morgan('dev'));

// Rutas
app.use('/api/patients', patientRouter);
app.use('/api/orders', orderRoutes);
app.use('/api/order-items', orderItemRoutes);
app.use('/api/nomenclador', nomencladorRoutes);
app.use('/api/exam-item-def', examItemDefRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/social-works', socialWorkRouter);
app.use('/api/patients', patientAccountRoutes);

// Manejo de errores
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error(err);
  if (res.headersSent) return;
  res.status(500).json({ ok: false, error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
