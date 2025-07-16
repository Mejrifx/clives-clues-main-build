-- Fix ambiguous column references in database functions
-- This migration completely replaces any existing function definitions

-- Drop ALL possible versions of these functions to ensure clean slate
DROP FUNCTION IF EXISTS public.has_unlocked_blog(UUID);
DROP FUNCTION IF EXISTS public.unlock_blog(UUID, INTEGER);
DROP FUNCTION IF EXISTS public.has_unlocked_blog(blog_id UUID);
DROP FUNCTION IF EXISTS public.unlock_blog(blog_id UUID, score INTEGER);

-- Function to check if user has unlocked a specific blog
-- Parameter name matches frontend call, avoid ambiguity with table alias
CREATE FUNCTION public.has_unlocked_blog(blog_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.unlocked_blogs ub
    WHERE ub.user_id = auth.uid() AND ub.blog_id = has_unlocked_blog.blog_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unlock a blog for a user  
-- Parameter names match frontend call, avoid ambiguity with local variables
CREATE FUNCTION public.unlock_blog(blog_id UUID, score INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  target_blog_id UUID := blog_id;
  target_score INTEGER := score;
BEGIN
  -- First check if the blog post exists
  IF NOT EXISTS (SELECT 1 FROM public.posts WHERE id = target_blog_id) THEN
    RAISE EXCEPTION 'Blog post with ID % does not exist', target_blog_id;
  END IF;
  
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to unlock blogs';
  END IF;
  
  -- Insert the unlock record using local variables to avoid ambiguity
  INSERT INTO public.unlocked_blogs (user_id, blog_id, game_score)
  VALUES (auth.uid(), target_blog_id, target_score)
  ON CONFLICT (user_id, blog_id) DO NOTHING;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 