import { CHAT_PRESENCE_TTL_SECONDS, CHAT_PRESENCE_USERS_ZSET_KEY } from "./constants";
import { getRedisPublisher } from "./bridge";

function normalized(username: string): string {
  return username.toLowerCase();
}

/**
 * Cluster-wide “who is online” uses a Redis ZSET with TTL-like semantics:
 * - member: normalized username
 * - score: expiry epoch seconds
 *
 * This avoids permanent ghost users after replica crashes: entries expire naturally.
 */

function expiryScore(nowSeconds: number): number {
  return nowSeconds + CHAT_PRESENCE_TTL_SECONDS;
}

function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/** Refresh presence expiry (call on join and on ping). No-op if Redis is disabled. */
export async function refreshGlobalPresence(username: string): Promise<void> {
  const pub = getRedisPublisher();
  if (!pub) return;
  const now = nowSeconds();
  await pub.zadd(CHAT_PRESENCE_USERS_ZSET_KEY, expiryScore(now), normalized(username));
}

export async function releaseGlobalPresence(username: string): Promise<void> {
  const pub = getRedisPublisher();
  if (!pub) return;
  await pub.zrem(CHAT_PRESENCE_USERS_ZSET_KEY, normalized(username));
}

/** `null` when Redis is disabled — use local `connectionManager` snapshot instead. */
export async function getGlobalPresenceSnapshot(): Promise<{ usernames: string[]; count: number } | null> {
  const pub = getRedisPublisher();
  if (!pub) return null;
  const now = nowSeconds();

  // Prune expired entries then return current view.
  // Using MULTI keeps the view consistent enough for welcome/count semantics.
  const res = (await pub
    .multi()
    .zremrangebyscore(CHAT_PRESENCE_USERS_ZSET_KEY, "-inf", String(now))
    .zrangebyscore(CHAT_PRESENCE_USERS_ZSET_KEY, String(now + 1), "+inf")
    .zcount(CHAT_PRESENCE_USERS_ZSET_KEY, String(now + 1), "+inf")
    .exec()) as unknown;

  // ioredis exec() returns [[err, result], ...]
  const rows = Array.isArray(res) ? (res as Array<[unknown, unknown]>) : [];
  const usernames = (rows[1]?.[1] as string[] | undefined) ?? [];
  const count = Number(rows[2]?.[1] ?? usernames.length);
  usernames.sort((a, b) => a.localeCompare(b));
  return { usernames, count };
}
