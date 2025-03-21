-- Simple SQL solution to fix user fields

-- Set default empty array for keywords
UPDATE users 
SET keywords = '[]'::jsonb
WHERE keywords IS NULL;

-- Set empty string for website_url
UPDATE users 
SET website_url = ''
WHERE website_url IS NULL;

-- Set empty string for location
UPDATE users 
SET location = ''
WHERE location IS NULL;

-- Verify the result
SELECT id, name, email, website_url, 
       CASE WHEN keywords IS NULL THEN 'null' ELSE 'not null' END as keywords_status,
       CASE WHEN location IS NULL THEN 'null' ELSE 'not null' END as location_status
FROM users
LIMIT 10;
