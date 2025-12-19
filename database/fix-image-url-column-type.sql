-- Fix image_url column type in posts table
-- Run this in your Supabase SQL Editor

-- Check current column type
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name LIKE '%image%';

-- RECOMMENDED SOLUTION: Convert from array to single TEXT column
-- This will preserve existing data by taking the first image URL from arrays

-- Step 1: Create a backup column with existing data converted to single URLs
ALTER TABLE posts ADD COLUMN image_url_backup TEXT;

-- Step 2: Convert array data to single URL (take first element)
UPDATE posts 
SET image_url_backup = (
  CASE 
    WHEN image_url IS NOT NULL AND array_length(image_url::TEXT[], 1) > 0 
    THEN (image_url::TEXT[])[1] 
    ELSE NULL 
  END
)
WHERE image_url IS NOT NULL;

-- Step 3: Drop the old array column
ALTER TABLE posts DROP COLUMN image_url;

-- Step 4: Rename backup to image_url
ALTER TABLE posts RENAME COLUMN image_url_backup TO image_url;

-- Step 5: Add comment to document the column
COMMENT ON COLUMN posts.image_url IS 'Single image URL for the post, stored in the image-media bucket (converted from array format)';

-- Verify the change
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'posts' 
AND column_name = 'image_url';