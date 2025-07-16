-- AUTH CONTEXT DIAGNOSTIC
-- Check what auth.uid() actually returns in different contexts

-- Test 1: Check what auth.uid() returns directly
SELECT 
    auth.uid() as auth_uid,
    auth.jwt() as auth_jwt,
    current_user as pg_user,
    session_user as session_user;

-- Test 2: Check if there are any auth-related issues
SELECT 
    CASE 
        WHEN auth.uid() IS NULL THEN 'AUTH.UID() IS NULL - No authentication context'
        ELSE 'AUTH.UID() WORKS: ' || auth.uid()::text
    END as auth_status;

-- Test 3: Create a test function that shows auth context
CREATE OR REPLACE FUNCTION public.test_auth_context()
RETURNS TABLE (
    auth_user_id UUID,
    auth_role TEXT,
    has_auth BOOLEAN
) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY SELECT 
        auth.uid() as auth_user_id,
        auth.role() as auth_role,
        (auth.uid() IS NOT NULL) as has_auth;
END;
$$;

-- Test 4: Check RLS policies on unlocked_blogs table
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd, 
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'unlocked_blogs';

-- Test 5: Check if the user exists in auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE id = '8b2e5ddf-2007-4cd2-8f8b-57706d417b5e'; 