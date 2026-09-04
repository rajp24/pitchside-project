import { redis } from './_lib/redis.js';
import { serializeCookie } from './_lib/cookies.js';
import { createSession, SESSION_COOKIE, SESSION_TTL_SECONDS } from './_lib/session.js';

const RATE_LIMIT_MAX_ATTEMPTS = 5;
const RATE_LIMIT_WINDOW_SECONDS = 15 * 60;

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const ip = getClientIp(req);
  const rateLimitKey = `loginattempts:${ip}`;
  const attempts = await redis.incr(rateLimitKey);
  if (attempts === 1) {
    await redis.expire(rateLimitKey, RATE_LIMIT_WINDOW_SECONDS);
  }
  if (attempts > RATE_LIMIT_MAX_ATTEMPTS) {
    return res.status(429).json({ error: 'Too many attempts. Try again later.' });
  }

  const adminPassword = process.env.ADMIN_PASSWORD;
  if (!adminPassword) {
    return res.status(500).json({ error: 'Server not configured' });
  }

  const password = req.body?.password;
  if (typeof password !== 'string' || password !== adminPassword) {
    return res.status(401).json({ error: 'Invalid password' });
  }

  const token = await createSession();
  res.setHeader(
    'Set-Cookie',
    serializeCookie(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: SESSION_TTL_SECONDS,
    })
  );
  return res.status(200).json({ ok: true });
}
