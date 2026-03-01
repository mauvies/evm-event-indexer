import { Router } from 'express';
import { getFeesCollectedEvents } from './feesCollected';

const router = Router();

router.get('/fees-collected', getFeesCollectedEvents);

export default router;
