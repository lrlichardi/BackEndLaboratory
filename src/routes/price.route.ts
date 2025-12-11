import { Router } from 'express';
import { getPriceFactor, updatePriceFactor } from '../controllers/price.controller.js';

const router = Router();

router.get('/price-factor', getPriceFactor);
router.put('/price-factor', updatePriceFactor);

export default router;