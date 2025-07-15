-- Add RLS policies for posts table management
-- Allow authenticated users to insert posts (for admin functionality)
CREATE POLICY "Authenticated users can insert posts" ON public.posts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Allow authenticated users to update posts (for admin functionality) 
CREATE POLICY "Authenticated users can update posts" ON public.posts
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Allow authenticated users to delete posts (for admin functionality)
CREATE POLICY "Authenticated users can delete posts" ON public.posts
  FOR DELETE USING (auth.uid() IS NOT NULL); 