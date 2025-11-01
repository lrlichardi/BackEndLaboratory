import { Router } from 'express';
import { deleteOrder, updateOrderStatus, listOrders, createOrder, getOrder } from '../controllers/order.controller.js';

const r = Router();
r.get('/', listOrders);
r.get('/:id', getOrder);
r.post('/', createOrder);
r.put('/:id/status', updateOrderStatus);
r.delete('/:id', deleteOrder);                     // 👈 nuevo
export default r;
