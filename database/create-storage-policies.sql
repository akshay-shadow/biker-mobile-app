-- Create storage bucket and set up RLS policies for image uploads
-- Run this in your Supabase SQL Editor

-- 1. Create the storage bucket (if it doesn't exist)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'image-media', 
  'image-media', 
  true, 
  10485760, -- 10MB file size limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Enable RLS on storage.objects
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Create policy for authenticated users to upload images to image-media bucket
CREATE POLICY "Authenticated users can upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'image-media');

-- 4. Create policy for public read access to images in image-media bucket
CREATE POLICY "Public can view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'image-media');

-- 5. Create policy for users to update their own uploaded images
CREATE POLICY "Users can update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'image-media' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 6. Create policy for users to delete their own uploaded images
CREATE POLICY "Users can delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'image-media' AND auth.uid()::text = (storage.foldername(name))[1]);