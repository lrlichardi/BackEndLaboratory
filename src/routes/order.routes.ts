import { Router } from 'express';
import {
  listOrders,
  getOrder,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  patchOrder,
  deleteOrderItem,
  updateAnalytesBulk,
  addItemsByCodes,
  checkOrderNumber
} from '../controllers/order.controller.js';

const router = Router();

// Rutas de órdenes
router.get('/', listOrders);
router.get('/:id', getOrder);
router.post('/', createOrder);
router.patch('/:id', patchOrder);  
router.put('/:id/status', updateOrderStatus);
router.delete('/:id', deleteOrder);
router.get('/orders/check-number', checkOrderNumber);
// Rutas de items
router.delete('/items/:itemId', deleteOrderItem);  
router.post('/:id/items:addByCodes', addItemsByCodes); 

// Rutas de analytes
router.put('/:orderId/analytes/bulk', updateAnalytesBulk);

export default router;