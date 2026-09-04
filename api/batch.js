import { redis } from './_lib/redis.js';
import { isValidSession } from './_lib/session.js';

const KEY = 'batch:remaining';

export default async function handler(req, res) {
  if (req.method === 'GET') {
    const raw = await redis.get(KEY);
    const remaining = Number.isInteger(raw) ? raw : 0;
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=60');
    return res.status(200).json({ remaining });
  }

  if (req.method === 'POST') {
    const authed = await isValidSession(req);
    if (!authed) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const remaining = req.body?.remaining;
    if (!Number.isInteger(remaining) || remaining < 0 || remaining > 999) {
      return res.status(400).json({ error: 'remaining must be an integer between 0 and 999' });
    }

    await redis.set(KEY, remaining);
    return res.status(200).json({ remaining });
  }

  res.setHeader('Allow', 'GET, POST');
  return res.status(405).json({ error: 'Method not allowed' });
}
