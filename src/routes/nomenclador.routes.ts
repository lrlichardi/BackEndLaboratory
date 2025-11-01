import { Router } from 'express';
import { listAllNomenclador } from '../controllers/nomenclador.controller.js';

const r = Router();
r.get('/all', listAllNomenclador); // <-- trae todo
export default r;