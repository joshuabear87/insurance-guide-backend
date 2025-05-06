import express from 'express';
import multer from 'multer';
import { protect } from '../middleware/authMiddleware.js';
import { sendBroadcastEmail } from '../controllers/authController.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() }); // file stored in memory

router.post('/broadcast-email', protect, upload.single('attachment'), sendBroadcastEmail);

export default router;
