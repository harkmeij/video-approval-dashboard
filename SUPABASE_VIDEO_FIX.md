# Supabase Video Upload Fix

This document covers the fixes implemented to resolve issues with video uploads in the Supabase storage system.

## Problem Summary

The system was having issues uploading videos to Supabase. Videos were being successfully uploaded to Supabase Storage, but the corresponding database entries were not being created, resulting in a 500 error from the API.

## Root Causes

1. **Model Compatibility Issue:** The `Video.js` model was still referencing deprecated Dropbox fields that no longer exist in the Supabase database schema.

2. **Inconsistent Month Handling:** The month creation logic was using the older model-based approach, which was unreliable with the current Supabase setup.

## Solutions Implemented

1. **Updated Video Model:**
   - Removed all references to `dropbox_link` and `dropbox_file_id` fields in the `Video.js` model
   - Ensured proper handling of storage-related fields (storage_path, file_size, content_type)

2. **Enhanced Month Creation Logic:**
   - Modified the month handling in `videos.js` route to use direct Supabase queries instead of the model-based approach
   - Added better error handling and logging for month creation

3. **Created Testing Tools:**
   - Added a debug script (`debug-video-creation.js`) that directly tests video creation with the Supabase client
   - Added an API test script (`direct-video-api-test.js`) that tests the video creation API endpoint

4. **Added Documentation:**
   - Created `video-table-schema.md` documenting the current database schema
   - Created this document to explain the issues and fixes

## Current Schema

The `videos` table now has the following schema:

```json
[
  {
    "column_name": "id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()",
    "constraint_type": "PRIMARY KEY"
  },
  {
    "column_name": "title",
    "data_type": "text",
    "is_nullable": "NO"
  },
  {
    "column_name": "description",
    "data_type": "text",
    "is_nullable": "YES"
  },
  {
    "column_name": "month_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "constraint_type": "FOREIGN KEY"
  },
  {
    "column_name": "client_id",
    "data_type": "uuid",
    "is_nullable": "NO",
    "constraint_type": "FOREIGN KEY"
  },
  {
    "column_name": "created_by",
    "data_type": "uuid",
    "is_nullable": "NO", 
    "constraint_type": "FOREIGN KEY"
  },
  {
    "column_name": "status",
    "data_type": "text",
    "is_nullable": "YES",
    "column_default": "'pending'::text"
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "is_nullable": "YES",
    "column_default": "now()"
  },
  {
    "column_name": "storage_path",
    "data_type": "text",
    "is_nullable": "NO"
  },
  {
    "column_name": "file_size",
    "data_type": "bigint",
    "is_nullable": "YES"
  },
  {
    "column_name": "content_type",
    "data_type": "text",
    "is_nullable": "YES"
  }
]
```

## How to Test

The issue has been fixed and videos should now upload correctly. To verify:

1. Use the ClientPage.js interface to upload a video
2. Use the debug script for direct testing:
   ```
   node server/scripts/debug-video-creation.js
   ```
3. Use the API test script (requires an auth token):
   ```
   node server/scripts/direct-video-api-test.js YOUR_AUTH_TOKEN
   ```

## Further Notes

The system has been fully migrated from Dropbox to Supabase Storage. All code references have been updated to match the current database schema, removing any deprecated fields and functionalities.
