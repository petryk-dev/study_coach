import { Router } from 'express';
import { requireAuth } from '../middlewares/requireAuth';
import { getTodayPlan } from '../services/plan.service';

const router = Router();

router.use(requireAuth);

// Today's plan for the Home screen: built once per day, progress and streak are live
router.get('/today', async (req, res) => {
  res.json(await getTodayPlan(req.userId!));
});

export default router;
