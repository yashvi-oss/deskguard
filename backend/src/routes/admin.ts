import { Router } from 'express';
import { adminController } from '../controllers/adminController';
import { authMiddleware, librarianOnly } from '../middleware/auth';

const router = Router();

// All admin routes require authentication and librarian role
router.use(authMiddleware);
router.use(librarianOnly);

// Get abandoned desks
router.get('/desks/abandoned', adminController.getAbandonedDesks);

// Manually reset a desk
router.post('/desks/:desk_id/reset', adminController.resetDesk);

// Get dashboard stats
router.get('/dashboard/stats', adminController.getDashboardStats);

export default router;
