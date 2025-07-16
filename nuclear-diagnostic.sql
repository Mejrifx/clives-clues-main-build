-- NUCLEAR DIAGNOSTIC: Complete function analysis
-- Run this in Supabase SQL Editor to see EXACTLY what's in your database

-- 1. Show ALL functions related to unlock/blog
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_arguments(p.oid) as arguments,
    pg_get_function_result(p.oid) as return_type,
    pg_get_functiondef(p.oid) as full_definition
FROM pg_proc p
LEFT JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE p.proname IN ('unlock_blog', 'has_unlocked_blog')
ORDER BY n.nspname, p.proname;

-- 2. Check what the current unlock_blog function source code looks like
SELECT 
    proname,
    prosrc as source_code
FROM pg_proc 
WHERE proname = 'unlock_blog' 
AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');

-- 3. Verify the posts table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'posts'
ORDER BY ordinal_position;

-- 4. Verify the unlocked_blogs table structure  
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'unlocked_blogs'
ORDER BY ordinal_position; 