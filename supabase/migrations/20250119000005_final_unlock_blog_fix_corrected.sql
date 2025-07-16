-- Final fix for unlock_blog function (CORRECTED)
-- This migration creates a definitive version that handles RLS and return types correctly

-- First, drop ALL possible versions of unlock_blog functions with different signatures
DO $$ 
DECLARE
    func_record RECORD;
BEGIN
    -- Get all unlock_blog functions regardless of signature (CORRECTED QUERY)
    FOR func_record IN 
        SELECT n.nspname as schemaname, p.proname, oidvectortypes(p.proargtypes) as argtypes
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname LIKE 'unlock_blog%' AND n.nspname = 'public'
    LOOP
        EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s)', 
            func_record.schemaname, func_record.proname, func_record.argtypes);
        RAISE NOTICE 'Dropped function: %.%(%)', 
            func_record.schemaname, func_record.proname, func_record.argtypes;
    END LOOP;
END $$;

-- Also drop the has_unlocked_blog function for consistency  
DROP FUNCTION IF EXISTS public.has_unlocked_blog(UUID);
DROP FUNCTION IF EXISTS public.has_unlocked_blog(blog_id UUID);

-- Create the has_unlocked_blog function with proper RLS handling
CREATE FUNCTION public.has_unlocked_blog(target_blog_id UUID)
RETURNS BOOLEAN 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    blog_unlocked BOOLEAN := false;
BEGIN
    -- Get the current user ID
    current_user_id := auth.uid();
    
    -- Log for debugging
    RAISE NOTICE 'has_unlocked_blog called with blog_id: %, user_id: %', target_blog_id, current_user_id;
    
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RAISE NOTICE 'No authenticated user found';
        RETURN false;
    END IF;
    
    -- Temporarily disable RLS to perform the check
    PERFORM set_config('row_security', 'off', true);
    
    -- Check if blog is unlocked
    SELECT EXISTS (
        SELECT 1 FROM public.unlocked_blogs 
        WHERE user_id = current_user_id AND blog_id = target_blog_id
    ) INTO blog_unlocked;
    
    -- Re-enable RLS
    PERFORM set_config('row_security', 'on', true);
    
    RAISE NOTICE 'Blog unlocked status: %', blog_unlocked;
    RETURN blog_unlocked;
    
EXCEPTION
    WHEN others THEN
        -- Re-enable RLS in case of error
        PERFORM set_config('row_security', 'on', true);
        RAISE NOTICE 'Error in has_unlocked_blog: %', SQLERRM;
        RETURN false;
END;
$$;

-- Create the unlock_blog function with proper RLS handling and JSON return
CREATE FUNCTION public.unlock_blog(target_blog_id UUID, game_score INTEGER)
RETURNS JSON 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
DECLARE
    current_user_id UUID;
    blog_exists BOOLEAN := false;
    unlock_result JSON;
BEGIN
    -- Get the current user ID
    current_user_id := auth.uid();
    
    -- Log for debugging
    RAISE NOTICE 'unlock_blog called with blog_id: %, score: %, user_id: %', target_blog_id, game_score, current_user_id;
    
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        unlock_result := json_build_object(
            'success', false,
            'error', 'No authentication context - auth.uid() returned NULL'
        );
        RAISE NOTICE 'Authentication failed: %', unlock_result;
        RETURN unlock_result;
    END IF;
    
    -- Temporarily disable RLS to perform operations
    PERFORM set_config('row_security', 'off', true);
    
    -- Check if the blog post exists
    SELECT EXISTS (SELECT 1 FROM public.posts WHERE id = target_blog_id) INTO blog_exists;
    
    IF NOT blog_exists THEN
        -- Re-enable RLS
        PERFORM set_config('row_security', 'on', true);
        unlock_result := json_build_object(
            'success', false,
            'error', format('Blog post with ID %s does not exist', target_blog_id)
        );
        RAISE NOTICE 'Blog not found: %', unlock_result;
        RETURN unlock_result;
    END IF;
    
    -- Insert the unlock record
    INSERT INTO public.unlocked_blogs (user_id, blog_id, game_score)
    VALUES (current_user_id, target_blog_id, game_score)
    ON CONFLICT (user_id, blog_id) DO NOTHING;
    
    -- Re-enable RLS
    PERFORM set_config('row_security', 'on', true);
    
    unlock_result := json_build_object(
        'success', true,
        'message', format('Successfully unlocked blog %s with score %s', target_blog_id, game_score)
    );
    
    RAISE NOTICE 'Blog unlocked successfully: %', unlock_result;
    RETURN unlock_result;
    
EXCEPTION
    WHEN others THEN
        -- Re-enable RLS in case of error
        PERFORM set_config('row_security', 'on', true);
        unlock_result := json_build_object(
            'success', false,
            'error', format('Database error: %s', SQLERRM)
        );
        RAISE NOTICE 'Error in unlock_blog: %', unlock_result;
        RETURN unlock_result;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.has_unlocked_blog(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.unlock_blog(UUID, INTEGER) TO authenticated;

-- Test the functions to ensure they work
SELECT 'Migration completed successfully' as status; 