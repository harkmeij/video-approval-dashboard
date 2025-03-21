-- This script modifies the months table to make months global instead of client-specific

-- First, we need to back up any existing data
CREATE TABLE months_backup AS SELECT * FROM months;

-- Drop constraints on videos table that reference months.id
ALTER TABLE videos DROP CONSTRAINT videos_month_id_fkey;

-- Drop the existing unique constraint
ALTER TABLE months DROP CONSTRAINT months_year_month_client_id_key;

-- Create a temporary months table with the new structure
CREATE TABLE months_new (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  created_by UUID NOT NULL REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(year, month)
);

-- Insert data into the new table, consolidating any duplicate months
-- We'll keep the first occurrence of each month/year combination
INSERT INTO months_new (id, name, year, month, created_by, created_at)
SELECT DISTINCT ON (year, month) id, name, year, month, created_by, created_at
FROM months
ORDER BY year, month, created_at;

-- Update videos to point to the correct month_id in the new structure
-- First create a mapping table
CREATE TEMP TABLE month_mapping AS
SELECT m.id AS old_id, mn.id AS new_id
FROM months m
JOIN months_new mn ON m.year = mn.year AND m.month = mn.month;

-- Drop old table and rename new one
DROP TABLE months;
ALTER TABLE months_new RENAME TO months;

-- Re-establish the foreign key constraint from videos to months
ALTER TABLE videos ADD CONSTRAINT videos_month_id_fkey 
  FOREIGN KEY (month_id) REFERENCES months(id) ON DELETE CASCADE;
 
-- Enable RLS on the new months table
ALTER TABLE months ENABLE ROW LEVEL SECURITY;

-- Create updated policy for months table
DROP POLICY IF EXISTS "Users can view their own months" ON months;
CREATE POLICY "All users can view all months" ON months
  FOR SELECT TO PUBLIC USING (true);
  
CREATE POLICY "Editors can manage months" ON months
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid() AND users.role = 'editor'
    )
  );
