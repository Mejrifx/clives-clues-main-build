-- NUCLEAR OPTION: Complete function rebuild
-- This will COMPLETELY destroy and recreate all functions
-- Run this ONLY if the diagnostic shows problems

-- STEP 1: NUCLEAR DESTRUCTION - Drop ALL possible function versions
DROP FUNCTION IF EXISTS public.unlock_blog CASCADE;
DROP FUNCTION IF EXISTS public.has_unlocked_blog CASCADE;
DROP FUNCTION IF EXISTS unlock_blog CASCADE;
DROP FUNCTION IF EXISTS has_unlocked_blog CASCADE;

-- Drop with all possible argument combinations
DROP FUNCTION IF EXISTS public.unlock_blog(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.unlock_blog(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.unlock_blog(blog_id UUID) CASCADE;
DROP FUNCTION IF EXISTS public.unlock_blog(blog_id UUID, score INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.unlock_blog(p_blog_id UUID, p_score INTEGER) CASCADE;

DROP FUNCTION IF EXISTS public.has_unlocked_blog(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.has_unlocked_blog(blog_id UUID) CASCADE;
DROP FUNCTION IF EXISTS public.has_unlocked_blog(p_blog_id UUID) CASCADE;

-- STEP 2: CLEAN RECREATION - Parameter names match frontend, internal vars avoid conflicts
CREATE OR REPLACE FUNCTION public.has_unlocked_blog(blog_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  target_blog_uuid UUID := blog_id;
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.unlocked_blogs ub
    WHERE ub.user_id = auth.uid() 
    AND ub.blog_id = target_blog_uuid
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.unlock_blog(blog_id UUID, score INTEGER)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  target_blog_uuid UUID := blog_id;
  target_game_score INTEGER := score;
BEGIN
  -- Validate blog exists
  IF NOT EXISTS (SELECT 1 FROM public.posts WHERE id = target_blog_uuid) THEN
    RAISE EXCEPTION 'Blog post with ID % does not exist', target_blog_uuid;
  END IF;
  
  -- Validate authentication
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to unlock blogs';
  END IF;
  
  -- Insert unlock record using internal variables
  INSERT INTO public.unlocked_blogs (user_id, blog_id, game_score)
  VALUES (auth.uid(), target_blog_uuid, target_game_score)
  ON CONFLICT (user_id, blog_id) DO NOTHING;
  
  RETURN true;
END;
$$;

-- STEP 3: Grant necessary permissions
GRANT EXECUTE ON FUNCTION public.has_unlocked_blog(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_blog(UUID, INTEGER) TO authenticated; 