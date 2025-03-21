-- Add new client profile fields to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS website_url VARCHAR(255),
ADD COLUMN IF NOT EXISTS keywords TEXT[],
ADD COLUMN IF NOT EXISTS location TEXT;

-- Comment on columns to document their purpose
COMMENT ON COLUMN users.website_url IS 'The URL of the client''s website';
COMMENT ON COLUMN users.keywords IS 'Array of keywords describing the client''s business for video descriptions';
COMMENT ON COLUMN users.location IS 'Text description of the client''s location';

-- If upgrading from a previous version, ensure any existing clients have empty arrays for keywords
UPDATE users 
SET keywords = '{}'::TEXT[]
WHERE role = 'client' AND (keywords IS NULL);
