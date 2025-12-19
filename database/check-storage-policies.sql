-- Check existing storage policies and clean up if needed
-- Run this in your Supabase SQL Editor

-- 1. Check existing storage buckets
SELECT * FROM storage.buckets;

-- 2. Check existing storage policies
SELECT * FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';

-- 3. If you need to drop existing conflicting policies, use these commands:
-- (Replace 'policy_name' with the actual policy name from step 2)

-- DROP POLICY IF EXISTS "policy_name" ON storage.objects;

-- 4. After dropping conflicting policies, run the create-storage-simple-policies.sql script