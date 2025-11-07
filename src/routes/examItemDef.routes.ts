import { Router } from 'express';
import { listExamItems, createExamItem, updateExamItem, deleteExamItem } from '../controllers/examItemDef.controller.js';
const r = Router();

r.get('/', listExamItems);        // ?code=660042
r.post('/', createExamItem);      // body { code, key, label, unit, kind, sortOrder }
r.put('/:id', updateExamItem);
r.delete('/:id', deleteExamItem);

export default r;
