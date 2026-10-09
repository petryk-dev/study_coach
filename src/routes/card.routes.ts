import { Router, type Request } from 'express';
import { requireAuth } from '../middlewares/requireAuth';
import { validate } from '../middlewares/validate';
import { explainLimiter } from '../middlewares/rateLimit';
import { cardIdParamSchema, updateCardSchema } from '../schemas/card.schema';
import * as cards from '../services/card.service';
import { HttpError } from '../utils/httpError';

const router = Router();

router.use(requireAuth);

function cardId(req: Request): number {
  const result = cardIdParamSchema.safeParse(req.params);
  if (!result.success) throw new HttpError(400, 'Invalid card id', 'VALIDATION_ERROR');
  return result.data.id;
}

// "Explain this simply" on the answer side of a card (cached after the first time)
router.post('/:id/explain', explainLimiter, async (req, res) => {
  res.json(await cards.explainCard(req.userId!, cardId(req)));
});

// Edit a card's front and/or back
router.put('/:id', validate(updateCardSchema), async (req, res) => {
  res.json({ card: await cards.updateCard(req.userId!, cardId(req), req.body) });
});

export default router;
