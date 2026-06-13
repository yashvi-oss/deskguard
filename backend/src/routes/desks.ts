import { Router } from 'express';
import { deskController } from '../controllers/deskController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// All routes require authentication
router.use(authMiddleware);

// Get live desk map
router.get('/map', deskController.getDesksMap);

// Get free desks
router.get('/free', deskController.getFreDesks);

// Get desk details
router.get('/:desk_id', deskController.getDeskDetails);

export default router;
