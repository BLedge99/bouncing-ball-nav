import { Router } from 'express';
import { getHealth, updateHealth, initializeHealth } from '../controllers/healthController.js';

const router = Router();

router.get('/health/:userId', getHealth);
router.put('/health/:userId', updateHealth);
router.post('/health/:userId/init', initializeHealth);

export default router;
