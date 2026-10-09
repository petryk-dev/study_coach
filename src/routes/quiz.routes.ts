import { Router } from 'express';
import { requireAuth } from '../middlewares/requireAuth';
import { quizLimiter } from '../middlewares/rateLimit';
import { deckIdParamSchema, quizIdParamSchema, submitQuizSchema } from '../schemas/quiz.schema';
import { validate } from '../middlewares/validate';
import * as quiz from '../services/quiz.service';
import { HttpError } from '../utils/httpError';

const router = Router();

router.use(requireAuth);

// Generate a quiz for a deck; difficulty adapts to the user's recent scores
router.post('/:deckId', quizLimiter, async (req, res) => {
  const params = deckIdParamSchema.safeParse(req.params);
  if (!params.success) throw new HttpError(400, 'Invalid deck id', 'VALIDATION_ERROR');

  res.status(201).json(await quiz.createQuiz(req.userId!, params.data.deckId));
});

// Check answers: { answers: [1, 3, 0, ...] }, one option index per question
router.post('/:quizId/submit', validate(submitQuizSchema), async (req, res) => {
  const params = quizIdParamSchema.safeParse(req.params);
  if (!params.success) throw new HttpError(400, 'Invalid quiz id', 'VALIDATION_ERROR');

  res.json(await quiz.submitQuiz(req.userId!, params.data.quizId, req.body.answers));
});

export default router;
