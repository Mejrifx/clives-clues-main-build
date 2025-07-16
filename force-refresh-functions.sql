-- Force refresh Supabase function cache
-- Try creating with slightly different name first, then rename

-- Create a temporary function with a different name
CREATE OR REPLACE FUNCTION public.unlock_blog_v2(blog_id UUID, score INTEGER)
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

-- Test the V2 function
SELECT public.unlock_blog_v2('15db5bec-babb-4b4c-80ee-8c00c4d12345'::UUID, 100);

-- If V2 works, drop old function and rename V2
-- DROP FUNCTION public.unlock_blog(UUID, INTEGER);
-- ALTER FUNCTION public.unlock_blog_v2(UUID, INTEGER) RENAME TO unlock_blog; 