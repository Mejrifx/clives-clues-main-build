-- SURGICAL FIX: Remove the specific bad function
-- We know there are TWO unlock_blog functions, we need to remove the bad one

-- First, let's see all functions with their OIDs to identify them uniquely
SELECT 
    p.oid,
    p.proname,
    pg_get_function_arguments(p.oid) as arguments,
    LENGTH(p.prosrc) as source_length,
    CASE 
        WHEN p.prosrc LIKE '%target_blog_uuid%' THEN 'GOOD (with target_blog_uuid)'
        WHEN p.prosrc LIKE '%VALUES (user_id, blog_id, score)%' THEN 'BAD (ambiguous columns)'
        ELSE 'UNKNOWN'
    END as function_type
FROM pg_proc p
WHERE p.proname = 'unlock_blog'
AND p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- Drop the bad function specifically by finding its exact signature
-- This should identify and drop only the problematic one
DO $$
DECLARE
    func_oid OID;
BEGIN
    -- Find the OID of the bad function (the one with ambiguous columns)
    SELECT p.oid INTO func_oid
    FROM pg_proc p
    WHERE p.proname = 'unlock_blog'
    AND p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public')
    AND p.prosrc LIKE '%VALUES (user_id, blog_id, score)%'
    LIMIT 1;
    
    -- Drop that specific function by OID
    IF func_oid IS NOT NULL THEN
        EXECUTE 'DROP FUNCTION ' || func_oid::regprocedure;
        RAISE NOTICE 'Dropped bad unlock_blog function with OID %', func_oid;
    ELSE
        RAISE NOTICE 'Bad function not found';
    END IF;
END $$;

-- Verify only one function remains
SELECT 
    p.proname,
    pg_get_function_arguments(p.oid) as arguments,
    CASE 
        WHEN p.prosrc LIKE '%target_blog_uuid%' THEN 'GOOD (with target_blog_uuid)'
        ELSE 'UNEXPECTED'
    END as function_type
FROM pg_proc p
WHERE p.proname = 'unlock_blog'
AND p.pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public'); 