import { Router } from 'express';
import { validate } from '../middlewares/validate';
import { requireAuth } from '../middlewares/requireAuth';
import { cardIdSchema, dueQuerySchema, reviewSchema } from '../schemas/review.schema';
import * as review from '../services/review.service';
import { HttpError } from '../utils/httpError';

const router = Router();

router.use(requireAuth);

// Cards to study today; optional ?deckId= limits it to one deck
router.get('/due', async (req, res) => {
  const query = dueQuerySchema.safeParse(req.query);
  if (!query.success) throw new HttpError(400, 'Invalid deckId', 'VALIDATION_ERROR');

  res.json({ cards: await review.getDueCards(req.userId!, query.data.deckId) });
});

// Grade a card: { grade: 0 | 1 | 2 | 3 }
router.post('/:cardId', validate(reviewSchema), async (req, res) => {
  const params = cardIdSchema.safeParse(req.params);
  if (!params.success) throw new HttpError(400, 'Invalid card id', 'VALIDATION_ERROR');

  res.json(await review.reviewCard(req.userId!, params.data.cardId, req.body.grade));
});

export default router;
