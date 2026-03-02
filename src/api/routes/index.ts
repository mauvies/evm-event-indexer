import { Router as createRouter, type Router } from 'express';
import { getFeesCollectedEvents } from './feesCollected';

const router: Router = createRouter();

router.get('/fees-collected', getFeesCollectedEvents);

export default router;
