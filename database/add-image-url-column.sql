-- Add image_url column to posts table
-- Run this in your Supabase SQL Editor

-- Add the missing image_url column to the posts table
ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Optional: Add a comment to document the column
COMMENT ON COLUMN posts.image_url IS 'URL to the image associated with the post, stored in the image-media bucket';