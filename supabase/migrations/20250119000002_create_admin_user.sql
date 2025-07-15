-- Create admin user directly in auth.users table
-- This creates the user with email: cliveonabs@outlook.com and password: CliveAdmin123!

-- First, insert into auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  aud,
  role,
  confirmation_token,
  confirmed_at,
  raw_app_meta_data,
  raw_user_meta_data
) VALUES (
  gen_random_uuid(),
  '00000000-0000-0000-0000-000000000000',
  'cliveonabs@outlook.com',
  crypt('CliveAdmin123!', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  'authenticated',
  'authenticated',
  '',
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"admin": true, "username": "clive_admin"}'
); 