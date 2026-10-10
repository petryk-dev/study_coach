import { Router } from 'express';
import { requireAuth } from '../middlewares/requireAuth';
import { clearPushToken, savePushToken } from '../services/user.service';

const router = Router();

router.use(requireAuth);

// Save this device's Expo push token: { token: "ExponentPushToken[...]" }
router.post('/push-token', async (req, res) => {
  await savePushToken(req.userId!, req.body?.token);
  res.status(204).end();
});

// Stop notifications for this account (the app calls this on logout)
router.delete('/push-token', async (req, res) => {
  await clearPushToken(req.userId!);
  res.status(204).end();
});

export default router;
