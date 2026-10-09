import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import swaggerUi from 'swagger-ui-express';
import { requestLogger } from './middlewares/requestLogger';
import { errorHandler } from './middlewares/errorHandler';
import authRoutes from './routes/auth.routes';
import deckRoutes from './routes/deck.routes';
import reviewRoutes from './routes/review.routes';
import quizRoutes from './routes/quiz.routes';
import cardRoutes from './routes/card.routes';
import { openApiSpec } from './docs/openapi';
import { log } from './utils/logger';

const app = express();
const PORT = Number(process.env.PORT) || 3006;

// Number of proxies in front of the app, so rate limits see the real client IP
if (process.env.TRUST_PROXY) app.set('trust proxy', Number(process.env.TRUST_PROXY));

app.use(cors());
// Notes for deck generation can be up to 30k characters
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/auth', authRoutes);
app.use('/decks', deckRoutes);
app.use('/review', reviewRoutes);
app.use('/quiz', quizRoutes);
app.use('/cards', cardRoutes);

// API docs: Swagger UI at /docs, raw OpenAPI spec at /docs.json
app.get('/docs.json', (_req, res) => {
  res.json(openApiSpec);
});
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openApiSpec, { customSiteTitle: 'Study Coach API' }));

app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

app.use(errorHandler);

app.listen(PORT, () => {
  log(`Server running on http://localhost:${PORT}`);
  log(`API docs at http://localhost:${PORT}/docs`);
});
