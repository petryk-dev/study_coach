import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { requestLogger } from './middlewares/requestLogger';
import { errorHandler } from './middlewares/errorHandler';
import { log } from './utils/logger';

const app = express();
const PORT = Number(process.env.PORT) || 3006;

app.use(cors());
app.use(express.json());
app.use(requestLogger);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(PORT, () => {
  log(`Server running on http://localhost:${PORT}`);
});
