import express from 'express';
import multer from 'multer';
import { protect, isAdmin } from '../middleware/authMiddleware.js';
import { sendBroadcastEmail } from '../controllers/emailController.js';
import { approveFacilityAccess } from '../controllers/approvalController.js';
// import { createFacility } from '../controllers/facilityController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Admin-only system-wide actions
router.post('/broadcast-email', protect, isAdmin, upload.single('attachment'), sendBroadcastEmail);
router.post('/approve-facility', protect, isAdmin, approveFacilityAccess);
// router.post('/facilities', protect, isAdmin, createFacility); // Optional future use

export default router;