-- First, disable RLS on the users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop existing policies on users table
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Editors can view all users" ON users;

-- Create admin user (password is hashed 'admin123')
INSERT INTO users (email, name, role, active, password)
VALUES ('mark@betterview.nl', 'Admin User', 'editor', true, '$2b$10$upNPIGBCf0UDQeID6KY4MuAodKtTAj5.vYr9FRsx4BryHa6z3Wj9y')
ON CONFLICT (email) DO UPDATE SET password = '$2b$10$upNPIGBCf0UDQeID6KY4MuAodKtTAj5.vYr9FRsx4BryHa6z3Wj9y', active = true;

-- Create a simple policy that allows all operations for now
-- This is a temporary solution to get things working
CREATE POLICY "Allow all operations" ON users
  FOR ALL USING (true);

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
