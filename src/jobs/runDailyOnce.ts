// Runs the daily job once, right now: npm run job:daily
// Careful: it sends real notifications to every user with a push token.
import 'dotenv/config';
import prisma from '../services/db';
import { runDailyJob } from './daily';

runDailyJob()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
