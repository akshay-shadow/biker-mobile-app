-- Create user_bikes table for the garage functionality
CREATE TABLE IF NOT EXISTS user_bikes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  model TEXT,
  year INTEGER,
  color TEXT,
  type TEXT DEFAULT 'Sports',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE user_bikes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own bikes" ON user_bikes
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own bikes" ON user_bikes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bikes" ON user_bikes
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bikes" ON user_bikes
  FOR DELETE USING (auth.uid() = user_id);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS user_bikes_user_id_idx ON user_bikes(user_id);
CREATE INDEX IF NOT EXISTS user_bikes_created_at_idx ON user_bikes(created_at);