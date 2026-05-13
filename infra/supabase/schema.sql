-- ============================================
-- USERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster username lookups
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

-- ============================================
-- MESSAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  node_id TEXT,  -- Which backend node processed this message
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);

-- ============================================
-- ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS POLICIES - Allow all operations for now
-- ============================================
DROP POLICY IF EXISTS "Allow all users read access" ON users;
CREATE POLICY "Allow all users read access" ON users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all users insert access" ON users;
CREATE POLICY "Allow all users insert access" ON users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow all users update access" ON users;
CREATE POLICY "Allow all users update access" ON users FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow all users read messages" ON messages;
CREATE POLICY "Allow all users read messages" ON messages FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow all users insert messages" ON messages;
CREATE POLICY "Allow all users insert messages" ON messages FOR INSERT WITH CHECK (true);

-- ============================================
-- FUNCTIONS FOR ATOMIC OPERATIONS
-- ============================================

-- Returns user id; safe under concurrent first-time creates (single statement, unique on username).
CREATE OR REPLACE FUNCTION get_or_create_user(p_username TEXT)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  INSERT INTO users (username)
  VALUES (p_username)
  ON CONFLICT (username) DO UPDATE
  SET last_seen = NOW()
  RETURNING id INTO v_user_id;

  RETURN v_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to insert message atomically
CREATE OR REPLACE FUNCTION insert_message(
  p_username TEXT,
  p_content TEXT,
  p_node_id TEXT DEFAULT NULL
)
RETURNS TABLE(
  message_id UUID,
  user_id UUID,
  username TEXT,
  content TEXT,
  node_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
DECLARE
  v_user_id UUID;
  v_message_id UUID;
BEGIN
  -- Get or create user (atomic)
  v_user_id := get_or_create_user(p_username);
  
  -- Insert message
  INSERT INTO messages (user_id, username, content, node_id)
  VALUES (v_user_id, p_username, p_content, p_node_id)
  RETURNING id INTO v_message_id;
  
  -- Return the message data
  RETURN QUERY
  SELECT 
    m.id,
    m.user_id,
    m.username,
    m.content,
    m.node_id,
    m.created_at
  FROM messages m
  WHERE m.id = v_message_id;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- SPRINT 4: DIRECT MESSAGES ENHANCEMENT
-- ============================================

-- Add recipient column for private messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS recipient_username TEXT DEFAULT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON messages(recipient_username);

-- Drop previous insert_message since signature is changing
DROP FUNCTION IF EXISTS insert_message(TEXT, TEXT, TEXT);

-- Recreate with recipient_username support
CREATE OR REPLACE FUNCTION insert_message(
  p_username TEXT,
  p_content TEXT,
  p_node_id TEXT DEFAULT NULL,
  p_recipient_username TEXT DEFAULT NULL
)
RETURNS TABLE(
  message_id UUID,
  user_id UUID,
  username TEXT,
  content TEXT,
  node_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  recipient_username TEXT
) AS $$
DECLARE
  v_user_id UUID;
  v_message_id UUID;
BEGIN
  v_user_id := get_or_create_user(p_username);
  
  INSERT INTO messages (user_id, username, content, node_id, recipient_username)
  VALUES (v_user_id, p_username, p_content, p_node_id, p_recipient_username)
  RETURNING id INTO v_message_id;
  
  RETURN QUERY
  SELECT m.id, m.user_id, m.username, m.content, m.node_id, m.created_at, m.recipient_username
  FROM messages m WHERE m.id = v_message_id;
END;
$$ LANGUAGE plpgsql;

-- Fetch history dynamically depending on global or DM context
CREATE OR REPLACE FUNCTION get_chat_history(
  p_requester TEXT,
  p_target TEXT,
  p_limit INT DEFAULT 50
)
RETURNS TABLE(
  id UUID,
  user_id UUID,
  username TEXT,
  content TEXT,
  node_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE,
  recipient_username TEXT
) AS $$
BEGIN
  IF p_target = 'global' THEN
    -- Global chat query
    RETURN QUERY
    SELECT m.id, m.user_id, m.username, m.content, m.node_id, m.created_at, m.recipient_username
    FROM messages m
    WHERE m.recipient_username IS NULL
    ORDER BY m.created_at DESC
    LIMIT p_limit;
  ELSE
    -- Private DM query between two users
    RETURN QUERY
    SELECT m.id, m.user_id, m.username, m.content, m.node_id, m.created_at, m.recipient_username
    FROM messages m
    WHERE 
      (m.username = p_requester AND m.recipient_username = p_target)
      OR 
      (m.username = p_target AND m.recipient_username = p_requester)
    ORDER BY m.created_at DESC
    LIMIT p_limit;
  END IF;
END;
$$ LANGUAGE plpgsql;

