import dotenv from 'dotenv';

dotenv.config();

const isProd = process.env.NODE_ENV === 'production';

export const config = {
  isProd,
  port: Number(process.env.PORT) || 4000,
  mongoUri: process.env.MONGODB_URI || '',
  jwtSecret: process.env.JWT_SECRET || 'dev-insecure-secret-change-me',
  jwtExpiresInSeconds: 60 * 60 * 24 * 7, // 7 days
  clientOrigin: process.env.CLIENT_ORIGIN || 'http://localhost:3000',
  cookieName: process.env.COOKIE_NAME || 'pursuit_token',
  // SMTP (e.g. Gmail). When unset, emails are logged to the console instead of sent.
  smtp: {
    host: process.env.SMTP_HOST || '',
    port: Number(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.EMAIL_FROM || 'Pursuit <no-reply@pursuit.app>',
  },
  otpTtlMinutes: 10,
  // Email-reminder scheduler: how often to check, and how far back to look so a
  // first run never floods the inbox with ancient overdue reminders.
  reminderCheckMinutes: Number(process.env.REMINDER_CHECK_MINUTES) || 15,
  reminderLookbackDays: Number(process.env.REMINDER_LOOKBACK_DAYS) || 3,
};

if (!process.env.JWT_SECRET) {
  console.warn(
    '[config] JWT_SECRET is not set — using an insecure dev secret. Set JWT_SECRET in backend/.env before real use.',
  );
}
