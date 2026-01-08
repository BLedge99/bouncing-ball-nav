import { Router } from 'express';
import {
  getPosition,
  savePosition,
} from '../controllers/positionController.js';

const router = Router();

router.get('/position/:userId', getPosition);
router.post('/position/:userId', savePosition);

export default router;
