-- Disable RLS temporarily for users table
ALTER TABLE users DISABLE ROW LEVEL SECURITY;

-- Drop existing policies on users table
DROP POLICY IF EXISTS "Users can view their own data" ON users;
DROP POLICY IF EXISTS "Editors can view all users" ON users;

-- Create a policy for the admin user first
INSERT INTO users (email, name, role, active, password)
VALUES ('mark@betterview.nl', 'Admin User', 'editor', true, '$2a$10$rDJKDfI2KVCbh7MEp.4QCeGIr0tqq9Bg4JF9aBWl.f/zku.Z.u5lW');

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create better policies that avoid circular references
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Editors can view all users" ON users
  FOR SELECT USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'editor'
  );

-- Create policies for INSERT, UPDATE, DELETE
CREATE POLICY "Editors can insert users" ON users
  FOR INSERT WITH CHECK (
    (SELECT role FROM users WHERE id = auth.uid()) = 'editor'
  );

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text);

CREATE POLICY "Editors can update any user" ON users
  FOR UPDATE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'editor'
  );

CREATE POLICY "Editors can delete users" ON users
  FOR DELETE USING (
    (SELECT role FROM users WHERE id = auth.uid()) = 'editor'
  );
