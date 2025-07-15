-- Enable Row Level Security
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Create user profiles table to store additional user data
CREATE TABLE public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unlocked_blogs table to track which users have unlocked which blogs
CREATE TABLE public.unlocked_blogs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  blog_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  game_score INTEGER NOT NULL,
  UNIQUE(user_id, blog_id)
);

-- Enable RLS on new tables
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.unlocked_blogs ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_profiles
CREATE POLICY "Users can view their own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS policies for unlocked_blogs
CREATE POLICY "Users can view their own unlocked blogs" ON public.unlocked_blogs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own unlock records" ON public.unlocked_blogs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS policies for posts (allow public reading for title, summary, images, created_at)
CREATE POLICY "Anyone can view post previews" ON public.posts
  FOR SELECT USING (true);

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, username)
  VALUES (NEW.id, NEW.raw_user_meta_data->>'username');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile when user signs up
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to check if user has unlocked a specific blog
CREATE OR REPLACE FUNCTION public.has_unlocked_blog(blog_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.unlocked_blogs
    WHERE user_id = auth.uid() AND blog_id = has_unlocked_blog.blog_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to unlock a blog for a user
CREATE OR REPLACE FUNCTION public.unlock_blog(blog_id UUID, score INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  INSERT INTO public.unlocked_blogs (user_id, blog_id, game_score)
  VALUES (auth.uid(), blog_id, score)
  ON CONFLICT (user_id, blog_id) DO NOTHING;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER; 