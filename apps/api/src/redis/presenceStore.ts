import { CHAT_PRESENCE_USERS_SET_KEY } from "./constants";
import { getRedisPublisher } from "./bridge";

function normalized(username: string): string {
  return username.toLowerCase();
}

/**
 * Cluster-wide “who is online” uses Redis SET `CHAT_PRESENCE_USERS_SET_KEY`.
 * If an API process dies without running disconnect, SREM never runs and that username can stay
 * in the set until Redis is flushed or the key is edited — same-session re-login is then rejected.
 */

/**
 * Atomically reserve this username in the cluster-wide online set (SADD).
 * Returns false if the username is already present (another live session or stale entry after a crash).
 */
export async function tryClaimGlobalPresence(username: string): Promise<boolean> {
  const pub = getRedisPublisher();
  if (!pub) return true;
  const added = await pub.sadd(CHAT_PRESENCE_USERS_SET_KEY, normalized(username));
  return added === 1;
}

export async function releaseGlobalPresence(username: string): Promise<void> {
  const pub = getRedisPublisher();
  if (!pub) return;
  await pub.srem(CHAT_PRESENCE_USERS_SET_KEY, normalized(username));
}

/** `null` when Redis is disabled — use local `connectionManager` snapshot instead. */
export async function getGlobalPresenceSnapshot(): Promise<{ usernames: string[]; count: number } | null> {
  const pub = getRedisPublisher();
  if (!pub) return null;
  const [members, count] = await Promise.all([
    pub.smembers(CHAT_PRESENCE_USERS_SET_KEY),
    pub.scard(CHAT_PRESENCE_USERS_SET_KEY),
  ]);
  members.sort((a, b) => a.localeCompare(b));
  return { usernames: members, count };
}
