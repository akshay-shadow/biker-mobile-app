# Database Setup

This folder contains SQL scripts for setting up the required database tables and storage policies in Supabase.

## Quick Setup

1. **Create user_bikes table**: Run `create-user-bikes-table.sql`
2. **Add image_url column to posts**: Run `add-image-url-column.sql`
3. **Set up image storage**: Run `create-storage-simple-policies.sql`

## Required Tables

### user_bikes table
The `user_bikes` table is required for the garage functionality in the ProfileScreen.

**To create the table:**

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `create-user-bikes-table.sql`
4. Run the query

### posts table - image_url column
The `posts` table needs an `image_url` column for image uploads to work.

**To add the missing column:**

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `add-image-url-column.sql`
4. Run the query

This adds: `ALTER TABLE posts ADD COLUMN IF NOT EXISTS image_url TEXT;`

**If you get "Array value must start with" error:**
The column might be defined as an array type instead of TEXT. Run `fix-image-url-column-type.sql` to fix this.

## Required Storage Setup

### Image Storage Bucket
The app requires a storage bucket called `image-media` for uploading post images.

**To set up storage:**

1. Open your Supabase project dashboard
2. Go to the SQL Editor
3. Copy and paste the contents of `create-storage-simple-policies.sql`
4. Run the query

This will:
- Create the `image-media` storage bucket
- Set up RLS policies for authenticated uploads
- Allow public read access to uploaded images

**Troubleshooting Storage Issues:**
- If you get RLS policy errors, first run `check-storage-policies.sql` to see existing policies
- You may need to drop conflicting policies before creating new ones
- The simple policies in `create-storage-simple-policies.sql` should work for most cases

**Alternative setup via Supabase CLI:**

```bash
supabase db push
```

## Table Structure

### user_bikes
- `id` (UUID, Primary Key)
- `user_id` (UUID, Foreign Key to auth.users)
- `name` (TEXT, Required) - Display name for the bike
- `model` (TEXT, Optional) - Bike model
- `year` (INTEGER, Optional) - Year of manufacture
- `color` (TEXT, Optional) - Bike color
- `type` (TEXT, Default: 'Sports') - Type of bike
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

The table includes Row Level Security (RLS) policies to ensure users can only access their own bikes.