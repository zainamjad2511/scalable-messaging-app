export const config = {
  supabaseUrl: process.env.SUPABASE_URL!,
  supabaseKey: process.env.SUPABASE_ANON_KEY!,
  port: Number(process.env.PORT ?? 4000),
  nodeId: process.env.NODE_ID ?? "node-1",
};

if (!config.supabaseUrl || !config.supabaseKey) {
  throw new Error("Missing SUPABASE_URL or SUPABASE_ANON_KEY environment variables");
}
