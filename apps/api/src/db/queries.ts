import { StoredMessage } from "@repo/types";
import { supabase } from "./supabase";

/**
 * Calls insert_message RPC to save a message and return the saved data
 */
export async function saveMessage(
  username: string,
  content: string,
  nodeId: string,
  recipient?: string
): Promise<StoredMessage> {
  const { data, error } = await supabase.rpc("insert_message", {
    p_username: username,
    p_content: content,
    p_node_id: nodeId,
    p_recipient_username: recipient || null,
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
    recipient_username: row.recipient_username,
  };
}

/**
 * Loads the latest N messages for history (global or DM)
 */
export async function getChatHistory(requester: string, target: string, limit = 50): Promise<StoredMessage[]> {
  const { data, error } = await supabase.rpc("get_chat_history", {
    p_requester: requester,
    p_target: target,
    p_limit: limit,
  });

  if (error) {
    throw new Error(`Failed to load history: ${error.message}`);
  }

  // Reverse so older is first
  return (data || []).reverse().map((row: any) => ({
    id: row.id,
    userId: row.user_id,
    username: row.username,
    content: row.content,
    nodeId: row.node_id,
    createdAt: row.created_at,
    recipient_username: row.recipient_username,
  }));
}
