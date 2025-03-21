-- Migration to create a clean videos table for Supabase Storage (no Dropbox fields)
BEGIN;

-- Back up any existing comments (we'll restore references later)
CREATE TABLE IF NOT EXISTS comments_backup AS SELECT * FROM comments;

-- Since there are dependencies, we need to use CASCADE to drop the videos table
DROP TABLE IF EXISTS videos CASCADE;

-- Create a new videos table with only Supabase Storage fields
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  month_id UUID NOT NULL REFERENCES months(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES users(id),
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Supabase Storage specific fields
  storage_path TEXT NOT NULL,
  file_size BIGINT,
  content_type TEXT
);

-- Add comments to document the schema
COMMENT ON TABLE videos IS 'Videos stored in Supabase Storage';
COMMENT ON COLUMN videos.storage_path IS 'Path to the video file in Supabase Storage';
COMMENT ON COLUMN videos.file_size IS 'Size of the video file in bytes';
COMMENT ON COLUMN videos.content_type IS 'MIME type of the video file';

-- Create indexes for performance
CREATE INDEX videos_client_id_idx ON videos(client_id);
CREATE INDEX videos_month_id_idx ON videos(month_id);
CREATE INDEX videos_created_by_idx ON videos(created_by);

-- Enable RLS on the videos table
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Editors can manage all videos" ON videos 
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'editor'
    )
  );

CREATE POLICY "Clients can view their own videos" ON videos
  FOR SELECT
  USING (client_id = auth.uid());

-- Recreate comments table if it was dropped due to CASCADE
CREATE TABLE IF NOT EXISTS comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes and enable RLS
CREATE INDEX IF NOT EXISTS comments_video_id_idx ON comments(video_id);
CREATE INDEX IF NOT EXISTS comments_user_id_idx ON comments(user_id);
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Recreate policies for comments
CREATE POLICY "Editors can manage all comments" ON comments 
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'editor'
    )
  );

CREATE POLICY "Users can view comments on their videos" ON comments
  FOR SELECT
  USING (
    video_id IN (
      SELECT id FROM videos WHERE client_id = auth.uid()
    )
    OR
    user_id = auth.uid()
  );

CREATE POLICY "Users can manage their own comments" ON comments
  USING (user_id = auth.uid());

-- Commit the transaction
COMMIT;
