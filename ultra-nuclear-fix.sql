-- ULTRA-NUCLEAR: Target specific function signatures
-- This will drop each function variant individually

-- Drop all possible function signatures individually
DROP FUNCTION IF EXISTS public.unlock_blog(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.unlock_blog(blog_id UUID, score INTEGER) CASCADE;  
DROP FUNCTION IF EXISTS public.unlock_blog(p_blog_id UUID, p_score INTEGER) CASCADE;
DROP FUNCTION IF EXISTS public.unlock_blog(input_blog_id UUID, input_score INTEGER) CASCADE;

DROP FUNCTION IF EXISTS public.has_unlocked_blog(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.has_unlocked_blog(blog_id UUID) CASCADE;
DROP FUNCTION IF EXISTS public.has_unlocked_blog(p_blog_id UUID) CASCADE;
DROP FUNCTION IF EXISTS public.has_unlocked_blog(input_blog_id UUID) CASCADE;

-- Also try dropping without schema prefix
DROP FUNCTION IF EXISTS unlock_blog(UUID, INTEGER) CASCADE;
DROP FUNCTION IF EXISTS unlock_blog(blog_id UUID, score INTEGER) CASCADE;
DROP FUNCTION IF EXISTS has_unlocked_blog(UUID) CASCADE;
DROP FUNCTION IF EXISTS has_unlocked_blog(blog_id UUID) CASCADE;

-- Now create the ONLY correct function
CREATE FUNCTION public.unlock_blog(blog_id UUID, score INTEGER)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  target_blog_uuid UUID := blog_id;
  target_game_score INTEGER := score;
  current_user_id UUID := auth.uid();
BEGIN
  -- Validate authentication FIRST
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to unlock blogs';
  END IF;
  
  -- Validate blog exists
  IF NOT EXISTS (SELECT 1 FROM public.posts WHERE id = target_blog_uuid) THEN
    RAISE EXCEPTION 'Blog post with ID % does not exist', target_blog_uuid;
  END IF;
  
  -- Insert unlock record using completely unambiguous variable names
  INSERT INTO public.unlocked_blogs (user_id, blog_id, game_score)
  VALUES (current_user_id, target_blog_uuid, target_game_score)
  ON CONFLICT (user_id, blog_id) DO NOTHING;
  
  RETURN true;
END;
$$;

CREATE FUNCTION public.has_unlocked_blog(blog_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
  target_blog_uuid UUID := blog_id;
  current_user_id UUID := auth.uid();
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.unlocked_blogs ub
    WHERE ub.user_id = current_user_id 
    AND ub.blog_id = target_blog_uuid
  );
END;
$$; 