-- Fix ambiguous column references in database functions
-- Drop existing functions and recreate with properly qualified column names

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.has_unlocked_blog(UUID);
DROP FUNCTION IF EXISTS public.unlock_blog(UUID, INTEGER);

-- Function to check if user has unlocked a specific blog
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
CREATE FUNCTION public.unlock_blog(blog_id UUID, score INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  -- First check if the blog post exists
  IF NOT EXISTS (SELECT 1 FROM public.posts WHERE id = unlock_blog.blog_id) THEN
    RAISE EXCEPTION 'Blog post with ID % does not exist', unlock_blog.blog_id;
  END IF;
  
  -- Check if user is authenticated
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'User must be authenticated to unlock blogs';
  END IF;
  
  -- Insert the unlock record
  INSERT INTO public.unlocked_blogs (user_id, blog_id, game_score)
  VALUES (auth.uid(), unlock_blog.blog_id, unlock_blog.score)
  ON CONFLICT (user_id, blog_id) DO NOTHING;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 