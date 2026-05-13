-- Step 5 (Phase 3): replace SELECT-then-INSERT with INSERT ... ON CONFLICT for concurrent safety.
-- Apply in Supabase: SQL Editor → New query → paste → Run (existing projects that already ran schema.sql).

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
