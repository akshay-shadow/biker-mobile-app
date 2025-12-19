-- Create storage bucket for image uploads (without RLS policies)
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

-- Note: If you can't create storage policies via SQL, you can:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click on the 'image-media' bucket 
-- 3. Go to 'Policies' tab
-- 4. Click 'New Policy' and use the templates for:
--    - "Allow authenticated uploads"
--    - "Allow public downloads"