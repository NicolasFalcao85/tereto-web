-- Run this in Supabase SQL Editor to enable comments
-- https://supabase.com/dashboard/project/aedbqwnsskuznmbywyav/sql/new

CREATE TABLE IF NOT EXISTS comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  post_id uuid REFERENCES posts(id) ON DELETE CASCADE NOT NULL,
  content text NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read comments
CREATE POLICY "comments_select" ON comments
  FOR SELECT USING (auth.role() = 'authenticated');

-- Authenticated users can insert their own comments
CREATE POLICY "comments_insert" ON comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only delete their own comments
CREATE POLICY "comments_delete" ON comments
  FOR DELETE USING (auth.uid() = user_id);

-- Index for fast lookup by post
CREATE INDEX IF NOT EXISTS comments_post_id_idx ON comments(post_id);
CREATE INDEX IF NOT EXISTS comments_created_at_idx ON comments(created_at);
