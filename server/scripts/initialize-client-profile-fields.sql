-- Initialize new client profile fields for existing users
-- This sets default values to prevent errors when fields are referenced

-- Set default empty array for keywords for all users
UPDATE users 
SET keywords = '{}'::TEXT[]
WHERE keywords IS NULL;

-- Set NULL for website_url where it doesn't exist
UPDATE users 
SET website_url = NULL
WHERE website_url IS NULL;

-- Set NULL for location where it doesn't exist
UPDATE users 
SET location = NULL
WHERE location IS NULL;

-- Validate the types (helpful for debugging)
-- This ensures that existing data is compatible with the new column types
SELECT 
  id, 
  name, 
  pg_typeof(website_url) as website_url_type,
  pg_typeof(keywords) as keywords_type,
  pg_typeof(location) as location_type
FROM users
LIMIT 5;
