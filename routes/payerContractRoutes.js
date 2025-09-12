// routes/payerContractRoutes.js
import { Router } from 'express';
import {
  listPayerContracts,
  getPayerContract,
  createPayerContract,
  updatePayerContract,
  deletePayerContract,
} from '../controllers/payerContractController.js';

const router = Router();

router.get('/', listPayerContracts);
router.post('/', createPayerContract);
router.get('/:id([0-9a-fA-F]{24})', getPayerContract);
router.patch('/:id([0-9a-fA-F]{24})', updatePayerContract);
router.delete('/:id([0-9a-fA-F]{24})', deletePayerContract);

export default router;
