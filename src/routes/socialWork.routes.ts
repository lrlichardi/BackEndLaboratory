import { Router } from 'express';
import {
  listSocialWorks,
  createSocialWork,
  updateSocialWork,
  deleteSocialWork,
} from '../controllers/socialWork.controller.js';

const router = Router();

/** GET /api/social-works?query=&page=1&pageSize=10 */
router.get('/', listSocialWorks);

/** POST /api/social-works  { name } */
router.post('/', createSocialWork);

/** PUT /api/social-works/:id */
router.put('/:id', updateSocialWork);

/** DELETE /api/social-works/:id */
router.delete('/:id', deleteSocialWork);

export default router;
