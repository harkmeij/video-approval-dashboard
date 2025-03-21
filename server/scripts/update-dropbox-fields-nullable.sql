-- Migration to make dropbox fields nullable for compatibility with storage uploads
BEGIN;

-- Alter the videos table to make dropbox_link and dropbox_file_id nullable
ALTER TABLE videos ALTER COLUMN dropbox_link DROP NOT NULL;
ALTER TABLE videos ALTER COLUMN dropbox_file_id DROP NOT NULL;

-- Add comment to document the change
COMMENT ON TABLE videos IS 'Videos stored in Supabase Storage with optional Dropbox fields for backwards compatibility';

COMMIT;
