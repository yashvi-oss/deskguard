import { Router } from 'express';
import { sessionController } from '../controllers/sessionController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Check-in (student scans QR code)
router.post('/checkin', sessionController.checkIn);

// Go away (take a break)
router.post('/:session_id/away', sessionController.goAway);

// Come back from away
router.post('/:session_id/back', sessionController.comeBack);

// Check-out (leave desk)
router.post('/:session_id/checkout', sessionController.checkOut);

// Respond to "Still here?" prompt
router.post('/:session_id/respond-prompt', sessionController.respondToPrompt);

// Get current session info
router.get('/me/current', sessionController.getCurrentSession);

export default router;
