-- Fix ambiguous column references in database functions
-- Drop existing functions and recreate with properly qualified column names

-- Drop existing functions first
DROP FUNCTION IF EXISTS public.has_unlocked_blog(UUID);
DROP FUNCTION IF EXISTS public.unlock_blog(UUID, INTEGER);

-- Function to check if user has unlocked a specific blog
CREATE FUNCTION public.has_unlocked_blog(p_blog_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.unlocked_blogs ub
    WHERE ub.user_id = auth.uid() AND ub.blog_id = p_blog_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unlock a blog for a user
CREATE FUNCTION public.unlock_blog(p_blog_id UUID, p_score INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.unlocked_blogs (user_id, blog_id, game_score)
  VALUES (auth.uid(), p_blog_id, p_score)
  ON CONFLICT (user_id, blog_id) DO NOTHING;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 