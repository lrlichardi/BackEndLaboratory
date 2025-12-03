import { Router } from 'express';
import { listExamItems, createExamItem, updateExamItem, deleteExamItem } from '../controllers/examItemDef.controller.js';
const r = Router();

r.get('/', listExamItems);      
r.post('/', createExamItem);      
r.put('/:id', updateExamItem);
r.delete('/:id', deleteExamItem);

export default r;
