-- COMPLETE NUCLEAR RESET: Wipe everything and start fresh
-- This will remove ALL unlock blog functionality and rebuild it simply

-- STEP 1: COMPLETE DESTRUCTION - Remove ALL related functions
DROP FUNCTION IF EXISTS public.unlock_blog CASCADE;
DROP FUNCTION IF EXISTS public.unlock_blog_v2 CASCADE;
DROP FUNCTION IF EXISTS public.unlock_blog_v3 CASCADE;
DROP FUNCTION IF EXISTS public.unlock_blog_v4 CASCADE;
DROP FUNCTION IF EXISTS public.has_unlocked_blog CASCADE;
DROP FUNCTION IF EXISTS public.test_auth_context CASCADE;

-- Also try without schema prefix
DROP FUNCTION IF EXISTS unlock_blog CASCADE;
DROP FUNCTION IF EXISTS unlock_blog_v2 CASCADE;
DROP FUNCTION IF EXISTS unlock_blog_v3 CASCADE;
DROP FUNCTION IF EXISTS unlock_blog_v4 CASCADE;
DROP FUNCTION IF EXISTS has_unlocked_blog CASCADE;

-- STEP 2: CLEAN SLATE - Create the simplest possible functions
-- Simple unlock function - no fancy auth context, just direct insert
CREATE FUNCTION public.unlock_blog(blog_id UUID, score INTEGER)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
    current_user_uuid UUID;
BEGIN
    -- Get current user from Supabase auth
    current_user_uuid := auth.uid();
    
    -- Debug: Log what we're working with
    RAISE NOTICE 'Function called with blog_id: %, score: %, auth.uid(): %', blog_id, score, current_user_uuid;
    
    -- If no auth context, return error immediately
    IF current_user_uuid IS NULL THEN
        result := json_build_object(
            'success', false,
            'error', 'No authentication context - auth.uid() returned NULL'
        );
        RETURN result;
    END IF;
    
    -- Check if blog exists
    IF NOT EXISTS (SELECT 1 FROM public.posts WHERE id = blog_id) THEN
        result := json_build_object(
            'success', false,
            'error', 'Blog post does not exist'
        );
        RETURN result;
    END IF;
    
    -- Try to insert with explicit transaction control
    BEGIN
        -- Temporarily disable RLS for this operation
        PERFORM set_config('row_security', 'off', true);
        
        -- Insert the unlock record
        INSERT INTO public.unlocked_blogs (user_id, blog_id, game_score)
        VALUES (current_user_uuid, blog_id, score)
        ON CONFLICT (user_id, blog_id) DO NOTHING;
        
        -- Re-enable RLS
        PERFORM set_config('row_security', 'on', true);
        
        result := json_build_object(
            'success', true,
            'message', 'Blog unlocked successfully'
        );
        
    EXCEPTION WHEN OTHERS THEN
        -- Re-enable RLS even if error occurs
        PERFORM set_config('row_security', 'on', true);
        
        result := json_build_object(
            'success', false,
            'error', 'Database error: ' || SQLERRM
        );
    END;
    
    RETURN result;
END;
$$;

-- Simple check function
CREATE FUNCTION public.has_unlocked_blog(blog_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_user_uuid UUID;
BEGIN
    current_user_uuid := auth.uid();
    
    -- If no auth, return false
    IF current_user_uuid IS NULL THEN
        RETURN false;
    END IF;
    
    -- Temporarily disable RLS for this check
    PERFORM set_config('row_security', 'off', true);
    
    -- Check if unlock record exists
    RETURN EXISTS (
        SELECT 1 FROM public.unlocked_blogs 
        WHERE user_id = current_user_uuid AND blog_id = has_unlocked_blog.blog_id
    );
    
    -- Re-enable RLS
    PERFORM set_config('row_security', 'on', true);
    
EXCEPTION WHEN OTHERS THEN
    -- Re-enable RLS even if error occurs
    PERFORM set_config('row_security', 'on', true);
    RETURN false;
END;
$$;

-- Test the functions
SELECT public.unlock_blog('15db5bec-babb-4b4c-80ee-8c00c4d12345'::UUID, 100);
SELECT public.has_unlocked_blog('15db5bec-babb-4b4c-80ee-8c00c4d12345'::UUID); 