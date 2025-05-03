import express from 'express';
import { protect, admin } from '../middleware/authMiddleware.js';
import {
  getUsers,
  approveUser,
  makeAdmin,
  deleteUser,
} from '../controllers/authController.js';
import User from '../models/userModel.js'; // ✅ add this

const router = express.Router();

// Admin only routes
router.get('/', protect, admin, getUsers);
router.put('/approve/:id', protect, admin, approveUser);
router.put('/make-admin/:id', protect, admin, makeAdmin);
router.delete('/:id', protect, admin, deleteUser);

// Current user profile
router.get('/me', protect, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  res.json(user);
});

export default router;
