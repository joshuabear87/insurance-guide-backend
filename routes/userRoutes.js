import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import { getUsers, approveUser, makeAdmin, deleteUser } from '../controllers/authController.js';

const router = express.Router();

// Admin only routes
router.get('/', protect, admin, getUsers);
router.put('/approve/:id', protect, admin, approveUser);
router.put('/make-admin/:id', protect, admin, makeAdmin);
router.delete('/:id', protect, admin, deleteUser);

export default router;
