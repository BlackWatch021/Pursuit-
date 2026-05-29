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
};

if (!process.env.JWT_SECRET) {
  console.warn(
    '[config] JWT_SECRET is not set — using an insecure dev secret. Set JWT_SECRET in backend/.env before real use.',
  );
}
