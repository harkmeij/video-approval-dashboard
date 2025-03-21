# Migrating from MongoDB to Supabase

This document outlines the steps to migrate the Video Approval Dashboard from MongoDB to Supabase.

## What is Supabase?

Supabase is an open-source Firebase alternative that provides a PostgreSQL database, authentication, instant APIs, real-time subscriptions, and storage. It's a great alternative to MongoDB for applications that need a relational database with built-in authentication and authorization.

## Migration Steps

### 1. Set Up Supabase

1. Create a Supabase account at [supabase.com](https://supabase.com)
2. Create a new project
3. Get your project URL and API key from Project Settings > API
4. Add these to your `.env` file:
   ```
   PROJECT_URL=your_supabase_project_url
   SUPABASE_API_KEY=your_supabase_api_key
   ```

### 2. Set Up Database Tables

To set up the database tables in Supabase:

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Create a new query
4. Copy and paste the contents of `server/config/supabase-schema.sql` into the SQL Editor
5. Run the query

This will create the following tables:
- users
- months
- videos
- comments

### 3. Create an Admin User

Create an initial admin user with the following command:

```bash
cd server
npm run create-supabase-admin
```

This will create an admin user with the following credentials:
- Email: admin@example.com
- Password: admin123 (or specify a custom password as an argument)

### 4. Test the Supabase Authentication

The application now has two authentication endpoints:
- `/api/auth` - Original MongoDB authentication
- `/api/auth-supabase` - New Supabase authentication

You can test the Supabase authentication by making requests to the `/api/auth-supabase` endpoints.

### 5. Migrate Data (Optional)

If you have existing data in MongoDB, you can migrate it to Supabase using a migration script (not included in this repository). The migration would involve:

1. Fetching all data from MongoDB
2. Transforming the data to match the Supabase schema
3. Inserting the data into Supabase

### 6. Switch to Supabase Completely

Once you're confident that the Supabase implementation is working correctly, you can update the application to use Supabase exclusively:

1. Update the client to use the `/api/auth-supabase` endpoints
2. Rename `auth-supabase.js` to `auth.js` (replacing the original)
3. Remove MongoDB dependencies from the application

## Database Schema

The Supabase database schema is defined in `server/config/supabase-schema.sql` and includes:

### Users Table
- id (UUID, primary key)
- email (TEXT, unique)
- password (TEXT)
- name (TEXT)
- role (TEXT, 'client' or 'editor')
- password_reset_token (TEXT)
- password_reset_expires (TIMESTAMP)
- active (BOOLEAN)
- created_at (TIMESTAMP)

### Months Table
- id (UUID, primary key)
- name (TEXT)
- year (INTEGER)
- month (INTEGER)
- client_id (UUID, foreign key to users)
- created_by (UUID, foreign key to users)
- created_at (TIMESTAMP)

### Videos Table
- id (UUID, primary key)
- title (TEXT)
- description (TEXT)
- dropbox_link (TEXT)
- dropbox_file_id (TEXT)
- month_id (UUID, foreign key to months)
- client_id (UUID, foreign key to users)
- status (TEXT, 'pending', 'approved', or 'rejected')
- created_by (UUID, foreign key to users)
- created_at (TIMESTAMP)
- updated_at (TIMESTAMP)

### Comments Table
- id (UUID, primary key)
- content (TEXT)
- video_id (UUID, foreign key to videos)
- user_id (UUID, foreign key to users)
- created_at (TIMESTAMP)

## Security

The Supabase implementation includes Row Level Security (RLS) policies to ensure that users can only access data they are authorized to see. These policies are defined in the SQL schema and enforce the following rules:

- Users can only view their own data
- Editors can view all users' data
- Users can only view months, videos, and comments that belong to them or were created by them
- Editors can view all months, videos, and comments

## Troubleshooting

If you encounter issues with the Supabase migration, check the following:

1. Ensure your Supabase project URL and API key are correct in the `.env` file
2. Check that the SQL schema was executed successfully
3. Verify that the admin user was created successfully
4. Check the server logs for any errors related to Supabase

For more help, refer to the [Supabase documentation](https://supabase.com/docs).
