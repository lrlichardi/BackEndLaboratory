import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import patientRouter from './routes/patient.routes.js';
import orderRoutes from './routes/order.routes.js';
import orderItemRoutes from './routes/orderItem.routes.js';
import nomencladorRoutes from './routes/nomenclador.routes.js';
import examItemDefRoutes from './routes/examItemDef.routes.js';

const app = express();
const PORT = process.env.PORT ? Number(process.env.PORT) : 4000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({ origin: CORS_ORIGIN }));
app.use(express.json());
app.use(morgan('dev'));

// Salud
app.get('/api/health', (_, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

// Rutas
app.use('/api/patients', patientRouter);
app.use('/api/orders', orderRoutes);  
app.use('/api/order-items', orderItemRoutes);
app.use('/api/nomenclador', nomencladorRoutes);
app.use('/api/exam-item-def', examItemDefRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => {
  console.log(`API escuchando en http://localhost:${PORT}`);
});
