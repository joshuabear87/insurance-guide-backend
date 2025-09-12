// routes/planPolicyRoutes.js
import { Router } from 'express';
import {
  listPlanPolicies,
  getPlanPolicy,
  createPlanPolicy,
  updatePlanPolicy,
  deletePlanPolicy,
} from '../controllers/planPolicyController.js';

const router = Router();

router.get('/', listPlanPolicies);
router.post('/', createPlanPolicy);
router.get('/:id([0-9a-fA-F]{24})', getPlanPolicy);
router.patch('/:id([0-9a-fA-F]{24})', updatePlanPolicy);
router.delete('/:id([0-9a-fA-F]{24})', deletePlanPolicy);

export default router;
