-- SQL Script to create all necessary tables and storage for BikeRiders app
-- Run this in your Supabase SQL Editor

-- Create the posts table with image support
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    image_url TEXT,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on posts
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

-- Posts policies
CREATE POLICY "Anyone can view posts" ON public.posts FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create posts" ON public.posts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own posts" ON public.posts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own posts" ON public.posts FOR DELETE USING (auth.uid() = user_id);

-- Create the rides table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.rides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    start_location VARCHAR(300) NOT NULL,
    end_location VARCHAR(300),
    start_time TIMESTAMPTZ NOT NULL,
    max_participants INTEGER,
    difficulty VARCHAR(20) DEFAULT 'Moderate' CHECK (difficulty IN ('Easy', 'Moderate', 'Hard', 'Expert')),
    estimated_duration VARCHAR(100),
    organizer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'completed', 'cancelled')),
    current_participants INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create an index on organizer_id for better performance
CREATE INDEX IF NOT EXISTS idx_rides_organizer_id ON public.rides(organizer_id);

-- Create an index on start_time for better performance when querying upcoming rides
CREATE INDEX IF NOT EXISTS idx_rides_start_time ON public.rides(start_time);

-- Create an index on status for filtering
CREATE INDEX IF NOT EXISTS idx_rides_status ON public.rides(status);

-- Enable Row Level Security (RLS)
ALTER TABLE public.rides ENABLE ROW LEVEL SECURITY;

-- Create policies for RLS
-- Policy: Users can view all scheduled rides
CREATE POLICY "Anyone can view scheduled rides" ON public.rides
    FOR SELECT USING (status = 'scheduled');

-- Policy: Users can view their own rides regardless of status
CREATE POLICY "Users can view own rides" ON public.rides
    FOR SELECT USING (auth.uid() = organizer_id);

-- Policy: Authenticated users can create rides
CREATE POLICY "Authenticated users can create rides" ON public.rides
    FOR INSERT WITH CHECK (auth.role() = 'authenticated' AND auth.uid() = organizer_id);

-- Policy: Users can update their own rides
CREATE POLICY "Users can update own rides" ON public.rides
    FOR UPDATE USING (auth.uid() = organizer_id);

-- Policy: Users can delete their own rides
CREATE POLICY "Users can delete own rides" ON public.rides
    FOR DELETE USING (auth.uid() = organizer_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically update updated_at
CREATE TRIGGER update_rides_updated_at BEFORE UPDATE ON public.rides
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- If you also need a profiles table, here's the basic structure:
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username VARCHAR(50) UNIQUE,
    email VARCHAR(255),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Comments table
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Likes table  
CREATE TABLE IF NOT EXISTS likes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(post_id, user_id) -- Prevent duplicate likes
);

-- Enable RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- Comments policies
CREATE POLICY "Anyone can view comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert comments" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own comments" ON comments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Likes policies
CREATE POLICY "Anyone can view likes" ON likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert likes" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON likes FOR DELETE USING (auth.uid() = user_id);

-- Function to increment comment count
CREATE OR REPLACE FUNCTION increment_comment_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET comments_count = COALESCE(comments_count, 0) + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to decrement comment count
CREATE OR REPLACE FUNCTION decrement_comment_count(post_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE posts 
  SET comments_count = GREATEST(COALESCE(comments_count, 0) - 1, 0)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to toggle like
CREATE OR REPLACE FUNCTION toggle_like(post_id UUID, user_id UUID)
RETURNS boolean AS $$
DECLARE
  like_exists boolean;
  new_like_state boolean;
BEGIN
  -- Check if like exists
  SELECT EXISTS(SELECT 1 FROM likes WHERE likes.post_id = toggle_like.post_id AND likes.user_id = toggle_like.user_id) INTO like_exists;
  
  IF like_exists THEN
    -- Remove like
    DELETE FROM likes WHERE likes.post_id = toggle_like.post_id AND likes.user_id = toggle_like.user_id;
    -- Decrement likes count
    UPDATE posts SET likes_count = GREATEST(COALESCE(likes_count, 0) - 1, 0) WHERE id = toggle_like.post_id;
    new_like_state := false;
  ELSE
    -- Add like
    INSERT INTO likes (post_id, user_id) VALUES (toggle_like.post_id, toggle_like.user_id);
    -- Increment likes count
    UPDATE posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = toggle_like.post_id;
    new_like_state := true;
  END IF;
  
  RETURN new_like_state;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get posts with user like status
CREATE OR REPLACE FUNCTION get_posts_with_likes(requesting_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  content TEXT,
  user_id UUID,
  image_url TEXT,
  likes_count INTEGER,
  comments_count INTEGER,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE,
  user_liked BOOLEAN,
  username TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.content,
    p.user_id,
    p.image_url,
    p.likes_count,
    p.comments_count,
    p.created_at,
    p.updated_at,
    CASE 
      WHEN requesting_user_id IS NOT NULL THEN EXISTS(SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = requesting_user_id)
      ELSE false
    END as user_liked,
    prof.username
  FROM posts p
  LEFT JOIN profiles prof ON p.user_id = prof.id
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;