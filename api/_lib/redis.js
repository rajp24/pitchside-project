import { Redis } from '@upstash/redis';

// Vercel's Upstash Marketplace integration has used a couple of different
// env var prefixes over time (KV_REST_API_* from the old "Vercel KV" name,
// UPSTASH_REDIS_REST_* from the newer generic Upstash integration). Accept
// either so this doesn't silently break depending on how it was installed.
const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

if (!url || !token) {
  throw new Error(
    'Missing Upstash Redis credentials. Provision Upstash Redis for this project ' +
      '(vercel install, or Storage tab in the Vercel dashboard) so KV_REST_API_URL/TOKEN ' +
      'or UPSTASH_REDIS_REST_URL/TOKEN are set.'
  );
}

export const redis = new Redis({ url, token });
