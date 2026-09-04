import { Redis } from '@upstash/redis';

// This project's Upstash integration provisions KV_-prefixed env vars, not
// the UPSTASH_REDIS_REST_* names @upstash/redis's Redis.fromEnv() looks
// for — so the client is built explicitly instead of via fromEnv().
// KV_REST_API_READ_ONLY_TOKEN exists too, but /api/batch writes, so the
// full KV_REST_API_TOKEN is required here, not the read-only one.
const REQUIRED_ENV_VARS = ['KV_REST_API_URL', 'KV_REST_API_TOKEN'];

// Call this at the top of any handler that touches `redis` and bail out
// with a named 500 if it returns non-null — a missing/undefined url or
// token otherwise fails inside the Redis client with an opaque error.
export function missingRedisEnvVar() {
  return REQUIRED_ENV_VARS.find((name) => !process.env[name]) || null;
}

export const redis = new Redis({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});
