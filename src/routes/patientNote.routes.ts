import { Router } from 'express';
import {
  listPatientNotes,
  createPatientNote,
  getPatientNote,
  updatePatientNote,
  deletePatientNote,
} from '../controllers/patientNote.controller.js';

const router = Router();

// Listar todas las notas de un paciente
// GET /api/patient-notes/patient/:patientId
router.get('/patient/:patientId', listPatientNotes);

// Crear nota para un paciente
// POST /api/patient-notes/patient/:patientId
router.post('/patient/:patientId', createPatientNote);

// Obtener una nota específica
// GET /api/patient-notes/:id
router.get('/:id', getPatientNote);

// Actualizar una nota
// PUT /api/patient-notes/:id
router.put('/:id', updatePatientNote);

// Borrar una nota
// DELETE /api/patient-notes/:id
router.delete('/:id', deletePatientNote);

export default router;
