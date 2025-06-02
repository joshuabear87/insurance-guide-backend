import express from 'express';
import { protect, isAdmin } from '../middleware/authMiddleware.js';
import {
  getUsers,
  makeAdmin,
  demoteUser,
  deleteUser,
  updateUserByAdmin,
} from '../controllers/userController.js';
import { approveUser } from '../controllers/approvalController.js'

const router = express.Router();

// Admin-only user management
router.get('/', protect, isAdmin, getUsers);
router.put('/approve/:id', protect, isAdmin, approveUser);
router.put('/make-admin/:id', protect, isAdmin, makeAdmin);
router.put('/demote/:id', protect, isAdmin, demoteUser);
router.put('/:id', protect, isAdmin, updateUserByAdmin);
router.delete('/:id', protect, isAdmin, deleteUser);

export default router;