import cron from 'node-cron';
import prisma from '../services/db';
import { getOrCreatePlan } from '../services/plan.service';
import { sendPushes, type PushMessage } from '../services/push';
import { deleteAbandonedQuizzes } from '../services/quiz.service';
import { APP_TIMEZONE } from '../utils/date';
import { log, logError } from '../utils/logger';

/**
 * Builds today's plan for each user and sends it as a notification. One user at a time,
 * because each new plan may call Groq. Errors are caught per user, so one broken plan
 * doesn't stop everyone else's notification. Users with nothing to do aren't notified.
 */
export async function sendDailyPlans(
  users: { id: number; push_token: string | null }[],
  send: (messages: PushMessage[]) => Promise<void> = sendPushes,
): Promise<number> {
  const messages: PushMessage[] = [];

  for (const user of users) {
    if (!user.push_token) continue;
    try {
      const plan = await getOrCreatePlan(user.id);
      if ((plan.tasks as unknown[]).length === 0) continue; // nothing to do → don't bother them
      messages.push({
        to: user.push_token,
        userId: user.id,
        title: "Today's study plan",
        body: plan.headline,
        data: { screen: 'home' }, // the app can open Home when tapped
      });
    } catch (err) {
      logError(`[daily] plan failed for user ${user.id}`, err);
    }
  }

  await send(messages);
  return messages.length;
}

/** Deletes data that's no longer useful. */
export async function runHousekeeping() {
  const now = new Date();
  const [quizzes, codes, tokens] = [
    await deleteAbandonedQuizzes(now),
    (await prisma.email_codes.deleteMany({ where: { expires_at: { lt: now } } })).count,
    (await prisma.refresh_tokens.deleteMany({ where: { expires_at: { lt: now } } })).count,
  ];
  return { quizzes, codes, tokens };
}

export async function runDailyJob(): Promise<void> {
  const started = Date.now();
  const users = await prisma.users.findMany({
    where: { email_verified: true, push_token: { not: null } },
    select: { id: true, push_token: true },
  });

  const sent = await sendDailyPlans(users);
  const removed = await runHousekeeping();

  log(
    `[daily] ${sent} notifications for ${users.length} users with push tokens; removed ${removed.quizzes} abandoned quizzes, ` +
      `${removed.codes} expired codes, ${removed.tokens} expired refresh tokens (${Date.now() - started}ms)`,
  );
}

/** Schedules the job at 7:00 Prague time. Set ENABLE_DAILY_JOB=false to turn it off (e.g. on extra servers). */
export function startDailyJob(): void {
  if (process.env.ENABLE_DAILY_JOB === 'false') {
    log('[daily] job disabled (ENABLE_DAILY_JOB=false)');
    return;
  }

  // Without timezone, "7:00" would be the server's time: 9:00 in Prague on a UTC host in summer
  cron.schedule(
    '0 7 * * *',
    () => {
      runDailyJob().catch((err) => logError('[daily] job crashed', err));
    },
    { timezone: APP_TIMEZONE, name: 'daily-plan', noOverlap: true },
  );
  log(`[daily] job scheduled for 07:00 ${APP_TIMEZONE}`);
}
