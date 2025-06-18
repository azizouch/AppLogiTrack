-- Improved functions to delete auth user with better error handling
-- Run these in your Supabase SQL Editor

-- Drop existing functions first
DROP FUNCTION IF EXISTS delete_auth_user(UUID);
DROP FUNCTION IF EXISTS delete_auth_user_simple(UUID);

-- Main function with detailed return messages
CREATE OR REPLACE FUNCTION delete_auth_user(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
  current_user_role TEXT;
  auth_user_exists BOOLEAN;
BEGIN
  -- Check if auth user exists first
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = user_id) INTO auth_user_exists;
  
  IF NOT auth_user_exists THEN
    RETURN 'WARNING: No auth user found with ID ' || user_id::text;
  END IF;

  -- Get current user's role
  SELECT role INTO current_user_role
  FROM utilisateurs 
  WHERE auth_id = auth.uid();
  
  -- Check if current user is admin
  IF current_user_role != 'Admin' THEN
    RETURN 'ERROR: Admin privileges required. Current role: ' || COALESCE(current_user_role, 'Unknown');
  END IF;

  -- Delete the auth user
  DELETE FROM auth.users WHERE id = user_id;
  
  -- Check how many rows were affected
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  IF deleted_count > 0 THEN
    RETURN 'SUCCESS: Auth user deleted successfully';
  ELSE
    RETURN 'ERROR: Failed to delete auth user (no rows affected)';
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM;
END;
$$;

-- Simple version without admin check (for testing)
CREATE OR REPLACE FUNCTION delete_auth_user_simple(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
  auth_user_exists BOOLEAN;
BEGIN
  -- Check if auth user exists first
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = user_id) INTO auth_user_exists;
  
  IF NOT auth_user_exists THEN
    RETURN 'WARNING: No auth user found with ID ' || user_id::text;
  END IF;

  -- Delete the auth user
  DELETE FROM auth.users WHERE id = user_id;
  
  -- Check how many rows were affected
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  IF deleted_count > 0 THEN
    RETURN 'SUCCESS: Auth user deleted successfully';
  ELSE
    RETURN 'ERROR: Failed to delete auth user (no rows affected)';
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM;
END;
$$;

-- Helper function to check if auth user exists
CREATE OR REPLACE FUNCTION check_auth_user_exists(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count
  FROM auth.users 
  WHERE id = user_id;
  
  RETURN user_count > 0;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION delete_auth_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_auth_user_simple(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_auth_user_exists(UUID) TO authenticated;

-- Test queries (replace with actual UUIDs from your database)
-- SELECT check_auth_user_exists('your-auth-user-id-here');
-- SELECT delete_auth_user_simple('your-auth-user-id-here');
