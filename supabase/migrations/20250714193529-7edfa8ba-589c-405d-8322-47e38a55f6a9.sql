-- Add images column to posts table
ALTER TABLE public.posts 
ADD COLUMN images text[] DEFAULT '{}';

-- Create storage bucket for blog images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images', 
  'blog-images', 
  true, 
  10485760, -- 10MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Create storage policies for blog images
CREATE POLICY "Blog images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'blog-images');

CREATE POLICY "Anyone can upload blog images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'blog-images');

CREATE POLICY "Anyone can update blog images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'blog-images');

CREATE POLICY "Anyone can delete blog images" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'blog-images');