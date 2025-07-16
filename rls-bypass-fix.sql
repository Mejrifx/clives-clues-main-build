-- RLS BYPASS FIX: The issue is RLS policies blocking the SECURITY DEFINER function
-- Solution: Create function that properly handles RLS context

-- First, let's create a function that bypasses RLS entirely
CREATE OR REPLACE FUNCTION public.unlock_blog_v3(blog_id UUID, score INTEGER, calling_user_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  -- Validate blog exists
  IF NOT EXISTS (SELECT 1 FROM public.posts WHERE id = blog_id) THEN
    RAISE EXCEPTION 'Blog post with ID % does not exist', blog_id;
  END IF;
  
  -- Validate calling user ID
  IF calling_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to unlock blogs';
  END IF;
  
  -- Bypass RLS by temporarily disabling it for this function
  SET LOCAL row_security = off;
  
  -- Insert unlock record using the passed user ID
  INSERT INTO public.unlocked_blogs (user_id, blog_id, game_score)
  VALUES (calling_user_id, blog_id, score)
  ON CONFLICT (user_id, blog_id) DO NOTHING;
  
  -- Re-enable RLS
  SET LOCAL row_security = on;
  
  RETURN true;
END;
$$;

-- Alternative approach: Create function that sets auth context properly
CREATE OR REPLACE FUNCTION public.unlock_blog_v4(blog_id UUID, score INTEGER)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY INVOKER  -- Run as calling user, not postgres
AS $$
DECLARE
  current_user_id UUID := auth.uid();
BEGIN
  -- Validate authentication
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to unlock blogs';
  END IF;
  
  -- Validate blog exists
  IF NOT EXISTS (SELECT 1 FROM public.posts WHERE id = blog_id) THEN
    RAISE EXCEPTION 'Blog post with ID % does not exist', blog_id;
  END IF;
  
  -- Insert unlock record (RLS policies will work correctly with SECURITY INVOKER)
  INSERT INTO public.unlocked_blogs (user_id, blog_id, game_score)
  VALUES (current_user_id, blog_id, score)
  ON CONFLICT (user_id, blog_id) DO NOTHING;
  
  RETURN true;
END;
$$;

-- Test which approach works
-- V3 test (with explicit user ID)
-- SELECT public.unlock_blog_v3('15db5bec-babb-4b4c-80ee-8c00c4d12345'::UUID, 100, '8b2e5ddf-2007-4cd2-8f8b-57706d417b5e'::UUID);

-- V4 test (should still show auth error in SQL Editor, but will work from frontend)
-- SELECT public.unlock_blog_v4('15db5bec-babb-4b4c-80ee-8c00c4d12345'::UUID, 100); 