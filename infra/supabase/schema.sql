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

-- Function to get or create user (atomic operation)
CREATE OR REPLACE FUNCTION get_or_create_user(p_username TEXT)
RETURNS UUID AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Try to get existing user
  SELECT id INTO v_user_id FROM users WHERE username = p_username;
  
  -- If not found, create new user
  IF v_user_id IS NULL THEN
    INSERT INTO users (username) VALUES (p_username)
    RETURNING id INTO v_user_id;
  ELSE
    -- Update last_seen
    UPDATE users SET last_seen = NOW() WHERE id = v_user_id;
  END IF;
  
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
