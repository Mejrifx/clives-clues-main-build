-- Diagnostic script to check current database state
-- Run this in your Supabase SQL Editor to see what's happening

-- 1. Check if functions exist and their signatures
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments,
    pg_get_functiondef(oid) as definition
FROM pg_proc 
WHERE proname IN ('has_unlocked_blog', 'unlock_blog')
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 2. Check if tables exist
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('posts', 'unlocked_blogs')
ORDER BY table_name, ordinal_position;

-- 3. Check if the specific blog post exists
SELECT id, title, created_at 
FROM public.posts 
WHERE id = '15db5bec-babb-4b4c-80ee-8c00c4d12345';

-- 4. Test the functions manually (if they exist)
-- SELECT public.has_unlocked_blog('15db5bec-babb-4b4c-80ee-8c00c4d12345');
-- SELECT public.unlock_blog('15db5bec-babb-4b4c-80ee-8c00c4d12345', 100); 