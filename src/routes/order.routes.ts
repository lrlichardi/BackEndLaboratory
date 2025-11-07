import { Router } from 'express';
import { deleteOrder, updateOrderStatus, listOrders, createOrder, getOrder, updateAnalytesBulk } from '../controllers/order.controller.js';
import { generateOrderReport } from '../controllers/report.controller.js';

const r = Router();
r.get('/', listOrders);
r.get('/:id', getOrder);
r.post('/', createOrder);
r.put('/:id/status', updateOrderStatus);
r.put('/:orderId/analytes/bulk', updateAnalytesBulk);
r.delete('/:id', deleteOrder);  
r.get('/:orderId/report', generateOrderReport);                   
export default r;
