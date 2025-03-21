# Videos Table Schema Documentation

This document describes the current schema of the `videos` table in the Supabase database.

## Current Schema

```json
[
  {
    "column_name": "id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": "uuid_generate_v4()",
    "constraint_type": "PRIMARY KEY",
    "constraint_name": "videos_pkey"
  },
  {
    "column_name": "title",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "constraint_type": null,
    "constraint_name": null
  },
  {
    "column_name": "description",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "constraint_type": null,
    "constraint_name": null
  },
  {
    "column_name": "month_id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "constraint_type": "FOREIGN KEY",
    "constraint_name": "videos_month_id_fkey"
  },
  {
    "column_name": "client_id",
    "data_type": "uuid",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "constraint_type": "FOREIGN KEY",
    "constraint_name": "videos_client_id_fkey"
  },
  {
    "column_name": "created_by",
    "data_type": "uuid",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "constraint_type": "FOREIGN KEY",
    "constraint_name": "videos_created_by_fkey"
  },
  {
    "column_name": "status",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "'pending'::text",
    "constraint_type": null,
    "constraint_name": null
  },
  {
    "column_name": "created_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "now()",
    "constraint_type": null,
    "constraint_name": null
  },
  {
    "column_name": "updated_at",
    "data_type": "timestamp with time zone",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": "now()",
    "constraint_type": null,
    "constraint_name": null
  },
  {
    "column_name": "storage_path",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "NO",
    "column_default": null,
    "constraint_type": null,
    "constraint_name": null
  },
  {
    "column_name": "file_size",
    "data_type": "bigint",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "constraint_type": null,
    "constraint_name": null
  },
  {
    "column_name": "content_type",
    "data_type": "text",
    "character_maximum_length": null,
    "is_nullable": "YES",
    "column_default": null,
    "constraint_type": null,
    "constraint_name": null
  }
]
```

## Field Descriptions

| Column Name | Description | Notes |
|-------------|-------------|-------|
| id | Unique identifier for the video | Primary key, auto-generated UUID |
| title | Title of the video | Required |
| description | Optional description for the video | Can be used for Instagram captions |
| month_id | Reference to the month this video belongs to | Foreign key to months table |
| client_id | Reference to the client this video belongs to | Foreign key to users table |
| created_by | Reference to the user who created this video | Foreign key to users table |
| status | Current status of the video | Default: 'pending' |
| created_at | Timestamp when the video was created | Auto-generated |
| updated_at | Timestamp when the video was last updated | Auto-generated |
| storage_path | Path to the video file in Supabase Storage | Required |
| file_size | Size of the video file in bytes | Optional |
| content_type | MIME type of the video file | Optional |

## Migration History

The videos table has been migrated from using Dropbox fields to Supabase Storage. The following fields have been removed:

- `dropbox_link` - No longer used, replaced by storage_path
- `dropbox_file_id` - No longer used, obsolete with Supabase Storage

## Important Notes

1. The `storage_path` field is required and must be set when creating a new video
2. There are no more references to Dropbox in the database schema
3. The model code has been updated to remove all Dropbox-related field handling

## How to Query the Schema

To view the current schema of the videos table, you can run the following SQL query in the Supabase SQL editor:

```sql
SELECT
    c.column_name,
    c.data_type,
    c.character_maximum_length,
    c.is_nullable,
    c.column_default,
    tc.constraint_type,
    kcu.constraint_name
FROM
    information_schema.columns c
LEFT JOIN
    information_schema.constraint_column_usage ccu ON c.column_name = ccu.column_name AND c.table_name = ccu.table_name
LEFT JOIN
    information_schema.key_column_usage kcu ON c.column_name = kcu.column_name AND c.table_name = kcu.table_name
LEFT JOIN
    information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
WHERE
    c.table_name = 'videos';
