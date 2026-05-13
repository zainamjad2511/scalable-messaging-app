import Redis from "ioredis";
import { CHAT_EVENTS_CHANNEL } from "./constants";
import type { RedisChatEventEnvelope } from "./types";

let publisher: Redis | null = null;
let subscriber: Redis | null = null;

let onChatEvent: (envelope: RedisChatEventEnvelope) => void = (envelope) => {
  console.log(`[redis] event kind=${envelope.kind} source=${envelope.sourceNodeId}`);
};

export function setChatEventHandler(handler: (envelope: RedisChatEventEnvelope) => void): void {
  onChatEvent = handler;
}

function parseEnvelope(raw: string): RedisChatEventEnvelope | null {
  try {
    const data = JSON.parse(raw) as unknown;
    if (!data || typeof data !== "object" || Array.isArray(data)) return null;
    const o = data as Record<string, unknown>;
    if (typeof o.sourceNodeId !== "string" || typeof o.kind !== "string") return null;
    return {
      sourceNodeId: o.sourceNodeId,
      kind: o.kind,
      payload: o.payload,
    };
  } catch {
    return null;
  }
}

const redisClientOptions = {
  lazyConnect: true,
  /** Required for subscriber connections (ioredis pub/sub). */
  maxRetriesPerRequest: null,
} as const;

/**
 * Two connections: publishing blocks the connection in subscribe mode, so
 * subscriber uses a dedicated client.
 */
export async function startRedisBridge(url: string): Promise<void> {
  await stopRedisBridge();

  const pub = new Redis(url, redisClientOptions);
  const sub = new Redis(url, redisClientOptions);

  const logErr = (role: string) => (err: Error) => {
    console.error(`[redis][${role}]`, err.message);
  };
  pub.on("error", logErr("publisher"));
  sub.on("error", logErr("subscriber"));

  try {
    await pub.connect();
    await sub.connect();
    await sub.subscribe(CHAT_EVENTS_CHANNEL);
    sub.on("message", (_channel, message) => {
      const envelope = parseEnvelope(message);
      if (!envelope) {
        console.warn("[redis] dropped malformed message:", message.slice(0, 200));
        return;
      }
      onChatEvent(envelope);
    });
    publisher = pub;
    subscriber = sub;
    console.log(`[redis] connected; subscribed to ${CHAT_EVENTS_CHANNEL}`);
  } catch (err) {
    pub.removeAllListeners();
    sub.removeAllListeners();
    await pub.quit().catch(() => undefined);
    await sub.quit().catch(() => undefined);
    throw err;
  }
}

export async function stopRedisBridge(): Promise<void> {
  const pub = publisher;
  const sub = subscriber;
  publisher = null;
  subscriber = null;

  if (sub) {
    sub.removeAllListeners();
    try {
      await sub.unsubscribe(CHAT_EVENTS_CHANNEL);
    } catch {
      /* ignore */
    }
    await sub.quit().catch(() => undefined);
  }
  if (pub) {
    pub.removeAllListeners();
    await pub.quit().catch(() => undefined);
  }
}

export function isRedisBridgeActive(): boolean {
  return publisher !== null && subscriber !== null;
}

/** For presence SET / SCARD (publisher connection only; not in subscribe mode). */
export function getRedisPublisher(): Redis | null {
  return publisher;
}

/** No-op when Redis is disabled or not started. Returns subscriber count from Redis (0 if disabled). */
export async function publishChatEvent(envelope: RedisChatEventEnvelope): Promise<number> {
  if (!publisher) return 0;
  return publisher.publish(CHAT_EVENTS_CHANNEL, JSON.stringify(envelope));
}
