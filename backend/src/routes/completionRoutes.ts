import { Router } from 'express';
import {
  getCompletion,
  saveCompletion,
} from '../controllers/completionController.js';

const router = Router();

router.get('/completion/:userId', getCompletion);
router.post('/completion/:userId', saveCompletion);

export default router;
