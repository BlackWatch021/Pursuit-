import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import { config } from './config';
import { connectDB } from './db';
import { requireAuth } from './middleware/auth';
import { errorHandler, HttpError, notFound } from './middleware/error';
import authRouter from './routes/auth';
import boardsRouter from './routes/boards';
import dashboardRouter from './routes/dashboard';
import itemsRouter from './routes/items';
import remindersRouter from './routes/reminders';
import { asyncHandler } from './utils/asyncHandler';
import { runReminderCheck, startReminderNotifier } from './utils/reminderNotifier';

async function main() {
  await connectDB();
  startReminderNotifier();

  const app = express();
  // Behind a hosting proxy (Render/Railway/etc.) so req.ip is the real client
  // IP — required for per-IP rate limiting to work correctly.
  if (config.isProd) app.set('trust proxy', 1);
  app.use(cors({ origin: config.clientOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());

  app.get('/health', (_req, res) => res.json({ ok: true }));

  // External cron trigger — lets a free scheduler (cron-job.org, etc.) run the
  // due-reminder check on hosts that sleep when idle. Guarded by CRON_SECRET;
  // disabled (503) when that env var is unset. Accepts the secret via the
  // `x-cron-secret` header, an `Authorization: Bearer` header, or a `?key=` query.
  app.post(
    '/api/internal/run-reminders',
    asyncHandler(async (req, res) => {
      if (!config.cronSecret) throw new HttpError(503, 'Cron endpoint disabled (set CRON_SECRET)');
      const provided =
        req.get('x-cron-secret') ||
        req.get('authorization')?.replace(/^Bearer\s+/i, '') ||
        (req.query.key as string | undefined);
      if (provided !== config.cronSecret) throw new HttpError(401, 'Unauthorized');
      const sent = await runReminderCheck();
      res.json({ ok: true, sent });
    }),
  );

  app.use('/api/auth', authRouter);
  app.use('/api/boards', requireAuth, boardsRouter);
  app.use('/api/items', requireAuth, itemsRouter);
  app.use('/api/reminders', requireAuth, remindersRouter);
  app.use('/api/dashboard', requireAuth, dashboardRouter);

  app.use(notFound);
  app.use(errorHandler);

  app.listen(config.port, () => {
    console.log(`[server] Pursuit API listening on http://localhost:${config.port}`);
    console.log(`[server] Allowing CORS from ${config.clientOrigin}`);
  });
}

main().catch((err) => {
  console.error('[server] Failed to start:', err);
  process.exit(1);
});
