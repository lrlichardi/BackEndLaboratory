import { Router } from 'express';
import { listOrders, createOrder, getOrder } from '../controllers/order.controller.js';
const r = Router();
r.get('/', listOrders);
r.get('/:id', getOrder);
r.post('/', createOrder);
export default r;