import { Router, type Request } from 'express';
import { validate } from '../middlewares/validate';
import { requireAuth } from '../middlewares/requireAuth';
import { generateLimiter } from '../middlewares/rateLimit';
import { createDeckSchema, deckIdSchema } from '../schemas/deck.schema';
import * as decks from '../services/deck.service';
import { HttpError } from '../utils/httpError';

const router = Router();

// Every deck route needs a logged-in user
router.use(requireAuth);

function deckId(req: Request): number {
  const result = deckIdSchema.safeParse(req.params);
  if (!result.success) throw new HttpError(400, 'Invalid deck id', 'VALIDATION_ERROR');
  return result.data.id;
}

// Generate cards + summary from notes and save them as a deck (takes a few seconds)
router.post('/', generateLimiter, validate(createDeckSchema), async (req, res) => {
  res.status(201).json({ deck: await decks.createDeck(req.userId!, req.body) });
});

router.get('/', async (req, res) => {
  res.json({ decks: await decks.listDecks(req.userId!) });
});

router.get('/:id', async (req, res) => {
  res.json(await decks.getDeck(req.userId!, deckId(req)));
});

router.delete('/:id', async (req, res) => {
  await decks.deleteDeck(req.userId!, deckId(req));
  res.status(204).end();
});

export default router;
