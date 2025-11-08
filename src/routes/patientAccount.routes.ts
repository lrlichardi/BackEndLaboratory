import { Router } from 'express';
import { getAccountSummary, listEntries, createEntry } from '../controllers/patientAccount.controller.js';

const r = Router();

// Montar bajo /api/patients
r.get('/:id/account', getAccountSummary);
r.get('/:id/account/entries', listEntries);
r.post('/:id/account/entries', createEntry);

export default r;
