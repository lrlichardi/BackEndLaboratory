import { Router } from 'express';
import {
  listDoctors,
  getDoctor,
  createDoctor,
  updateDoctor,
  deleteDoctor,
} from '../controllers/doctor.controller.js';

const router = Router();

// GET /api/doctors?q=alice
router.get('/', listDoctors);

// GET /api/doctors/:id
router.get('/:id', getDoctor);

// POST /api/doctors
router.post('/', createDoctor);

// PUT /api/doctors/:id
router.put('/:id', updateDoctor);

// DELETE /api/doctors/:id
router.delete('/:id', deleteDoctor);

export default router;
