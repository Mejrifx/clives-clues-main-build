-- SURGICAL WIPE: Identify and drop ALL unlock_blog functions individually
-- The previous wipe failed because functions have different signatures

-- STEP 1: Identify ALL unlock_blog functions with their exact signatures
SELECT 
    p.oid,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as signature,
    pg_get_functiondef(p.oid) as full_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname = 'unlock_blog'
AND n.nspname = 'public';

-- STEP 2: Drop each function by its exact signature
-- We'll use a procedure to dynamically drop all of them

DO $$
DECLARE
    func_record RECORD;
    drop_sql TEXT;
BEGIN
    -- Loop through all unlock_blog functions
    FOR func_record IN 
        SELECT 
            p.oid,
            p.proname,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname = 'unlock_blog'
        AND n.nspname = 'public'
    LOOP
        -- Build the drop statement with exact signature
        drop_sql := 'DROP FUNCTION public.unlock_blog(' || func_record.args || ') CASCADE';
        
        -- Execute the drop
        RAISE NOTICE 'Dropping: %', drop_sql;
        EXECUTE drop_sql;
    END LOOP;
    
    -- Also drop other related functions
    FOR func_record IN 
        SELECT 
            p.oid,
            p.proname,
            pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE p.proname IN ('has_unlocked_blog', 'unlock_blog_v2', 'unlock_blog_v3', 'unlock_blog_v4', 'test_auth_context')
        AND n.nspname = 'public'
    LOOP
        -- Build the drop statement with exact signature
        drop_sql := 'DROP FUNCTION public.' || func_record.proname || '(' || func_record.args || ') CASCADE';
        
        -- Execute the drop
        RAISE NOTICE 'Dropping: %', drop_sql;
        EXECUTE drop_sql;
    END LOOP;
END $$;

-- STEP 3: Verify all functions are gone
SELECT 
    p.proname as remaining_function,
    pg_get_function_identity_arguments(p.oid) as signature
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('unlock_blog', 'has_unlocked_blog', 'unlock_blog_v2', 'unlock_blog_v3', 'unlock_blog_v4')
AND n.nspname = 'public';

-- STEP 4: Create the new clean functions
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

-- STEP 5: Test the new functions
SELECT public.unlock_blog('15db5bec-babb-4b4c-80ee-8c00c4d12345'::UUID, 100); 