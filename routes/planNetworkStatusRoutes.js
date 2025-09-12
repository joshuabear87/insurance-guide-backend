// routes/planNetworkStatusRoutes.js
import { Router } from 'express';
import {
  listStatuses,
  createStatus,
  updateStatus,
  deleteStatus,
} from '../controllers/planNetworkStatusController.js';

const router = Router();

router.get('/', listStatuses);
router.post('/', createStatus);
router.patch('/:id([0-9a-fA-F]{24})', updateStatus);
router.delete('/:id([0-9a-fA-F]{24})', deleteStatus);

export default router;
