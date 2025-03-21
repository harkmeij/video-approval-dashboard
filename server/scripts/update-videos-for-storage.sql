-- Add storage_path column to videos table
ALTER TABLE videos 
ADD COLUMN storage_path TEXT,
ADD COLUMN file_size INTEGER,
ADD COLUMN content_type TEXT;

-- Make dropbox columns optional for backward compatibility
ALTER TABLE videos
ALTER COLUMN dropbox_link DROP NOT NULL,
ALTER COLUMN dropbox_file_id DROP NOT NULL;

-- Comment on the new columns
COMMENT ON COLUMN videos.storage_path IS 'Path to the video file in Supabase Storage';
COMMENT ON COLUMN videos.file_size IS 'Size of the video file in bytes';
COMMENT ON COLUMN videos.content_type IS 'MIME type of the video file';
