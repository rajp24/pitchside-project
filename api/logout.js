import { serializeCookie } from './_lib/cookies.js';
import { destroySession, SESSION_COOKIE } from './_lib/session.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  await destroySession(req);

  res.setHeader(
    'Set-Cookie',
    serializeCookie(SESSION_COOKIE, '', {
      httpOnly: true,
      secure: true,
      sameSite: 'Strict',
      maxAge: 0,
    })
  );
  return res.status(200).json({ ok: true });
}
