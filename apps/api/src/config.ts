export const config = {
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_ANON_KEY!,
  port: Number(process.env.PORT ?? 4000),
  nodeId: process.env.NODE_ID ?? "node-1",
  /** When set (e.g. Docker), API connects to Redis for cross-replica pub/sub. Omit for single-process local dev. */
  redisUrl: process.env.REDIS_URL?.trim() || undefined,
};

if (!config.supabaseUrl || !config.supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables");
}
