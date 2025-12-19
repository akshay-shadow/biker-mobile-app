-- Simple storage policies for image uploads
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

-- 2. Enable RLS on storage.objects (if not already enabled)
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 3. Allow authenticated users to insert/upload any object to image-media bucket
CREATE POLICY "Allow authenticated uploads to image-media"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'image-media' 
  AND auth.role() = 'authenticated'
);

-- 4. Allow public read access to all objects in image-media bucket
CREATE POLICY "Allow public downloads from image-media"
ON storage.objects
FOR SELECT
USING (bucket_id = 'image-media');

-- 5. Allow authenticated users to delete objects from image-media bucket
CREATE POLICY "Allow authenticated deletes from image-media"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'image-media' 
  AND auth.role() = 'authenticated'
);

-- 6. Allow authenticated users to update objects in image-media bucket
CREATE POLICY "Allow authenticated updates to image-media"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'image-media' 
  AND auth.role() = 'authenticated'
);