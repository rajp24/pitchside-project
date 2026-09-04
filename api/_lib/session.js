import { randomBytes } from 'node:crypto';
import { redis } from './redis.js';
import { parseCookies } from './cookies.js';

export const SESSION_COOKIE = 'psd_session';
export const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days

export async function createSession() {
  const token = randomBytes(32).toString('hex');
  await redis.set(`session:${token}`, '1', { ex: SESSION_TTL_SECONDS });
  return token;
}

export async function isValidSession(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (!token) return false;
  const exists = await redis.get(`session:${token}`);
  return exists != null;
}

export async function destroySession(req) {
  const token = parseCookies(req)[SESSION_COOKIE];
  if (token) await redis.del(`session:${token}`);
}
