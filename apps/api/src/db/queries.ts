import { StoredMessage } from "@repo/types";
import { supabase } from "./supabase";

/**
 * Calls insert_message RPC to save a message and return the saved data
 */
export async function saveMessage(
  username: string,
  content: string,
  nodeId: string
): Promise<StoredMessage> {
  const { data, error } = await supabase.rpc("insert_message", {
    p_username: username,
    p_content: content,
    p_node_id: nodeId,
  });

  if (error || !data || data.length === 0) {
    throw new Error(`Failed to save message: ${error?.message || "Unknown error"}`);
  }

  const row = data[0];
  return {
    id: row.message_id,
    userId: row.user_id,
    username: row.username,
    content: row.content,
    nodeId: row.node_id,
    createdAt: row.created_at,
  };
}

/**
 * Loads the latest N messages for history
 */
export async function getRecentMessages(limit = 50): Promise<StoredMessage[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to load history: ${error.message}`);
  }

  // Reverse so older is first
  return (data || []).reverse().map((row) => ({
    id: row.id,
    userId: row.user_id,
    username: row.username,
    content: row.content,
    nodeId: row.node_id,
    createdAt: row.created_at,
  }));
}
