# Supabase Storage for Video Hosting

This document outlines the architecture and implementation of the Supabase Storage solution for video hosting in the Video Approval Dashboard.

## Why Supabase Storage Over Dropbox

The Video Approval Dashboard previously used Dropbox for video storage, but encountered several issues:

- **API Reliability**: The Dropbox API frequently disconnected, causing video playback issues
- **Complexity**: Managing Dropbox folders and permissions added unnecessary complexity
- **Authentication**: Maintaining Dropbox authentication tokens required additional infrastructure
- **Integration**: Tighter integration with our user and permission system was needed

Supabase Storage provides a more reliable, integrated solution with the following benefits:

- **Direct Integration**: Seamless integration with our existing Supabase authentication and database
- **Row-Level Security**: Granular access control using the same permission system as our database
- **Simplified Operations**: No need for third-party authentication or complex folder structures
- **Improved Reliability**: Built on top of reliable object storage infrastructure

## Architecture Overview

### Storage Setup

- Storage bucket: `videos`
- Security: Private bucket with access controlled via Row-Level Security (RLS) policies
- File organization: `clients/{clientId}/{monthId}/{filename}`

### Database Schema

The `videos` table has been extended with the following fields to support Supabase Storage:

```sql
ALTER TABLE videos 
ADD COLUMN storage_path TEXT,
ADD COLUMN file_size INTEGER,
ADD COLUMN content_type TEXT;

-- Make dropbox columns optional for backward compatibility
ALTER TABLE videos
ALTER COLUMN dropbox_link DROP NOT NULL,
ALTER COLUMN dropbox_file_id DROP NOT NULL;
```

### Security Model

Access to videos is controlled through RLS policies:

1. **Upload Policy**: Only editors can upload videos to the storage bucket
2. **View Policy**: Clients can only access videos in their own folder, while editors can access all videos
3. **Delete Policy**: Only editors can delete videos

```sql
-- Policy for editors to upload videos
CREATE POLICY "Editors can upload videos"
ON storage.objects FOR INSERT
TO authenticated
USING (
  bucket_id = 'videos' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'editor'
  )
);

-- Policy for users to view their own videos
CREATE POLICY "Users can view their own videos" 
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'videos' AND 
  (
    -- Client can access their own folder
    (storage.foldername(name))[1] = 'clients' AND
    (storage.foldername(name))[2] = auth.uid()::text
    OR
    -- Editors can access all videos
    EXISTS (
      SELECT 1 FROM users
      WHERE id = auth.uid() AND role = 'editor'
    )
  )
);

-- Policy for editors to delete videos
CREATE POLICY "Editors can delete videos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'videos' AND
  EXISTS (
    SELECT 1 FROM users
    WHERE id = auth.uid() AND role = 'editor'
  )
);
```

## API Endpoints

### Upload Flow

1. Frontend requests a signed upload URL from the server:
   ```
   GET /api/storage/upload-url?client_id={clientId}&month_id={monthId}&filename={filename}
   ```

2. Backend generates a signed URL for direct client-side upload:
   ```javascript
   const { data } = await supabase.storage.from('videos')
     .createSignedUploadUrl(`clients/${client_id}/${month_id}/${filename}`);
   ```

3. Frontend uploads directly to Supabase Storage using the signed URL:
   ```javascript
   await axios.post(urlData.uploadUrl, formData);
   ```

4. After successful upload, a video record is created in the database with the storage path:
   ```javascript
   POST /api/videos
   {
     title: "Video Title",
     description: "Description",
     storage_path: "clients/123/5-2024/video.mp4",
     file_size: 15000000,
     content_type: "video/mp4",
     client_id: "123",
     monthInfo: { month: 5, year: 2024 }
   }
   ```

### Playback Flow

1. Frontend requests a signed URL for playback:
   ```
   GET /api/storage/video-url/{videoId}
   ```

2. Backend retrieves the video record, validates user permissions, and generates a temporary URL:
   ```javascript
   const { data } = await supabase.storage.from('videos')
     .createSignedUrl(video.storage_path, 86400); // 24 hour expiry
   ```

3. Frontend uses the signed URL for video playback:
   ```javascript
   <video src={signedUrl} controls />
   ```

### Deletion Flow

1. Frontend requests video deletion:
   ```
   DELETE /api/videos/{videoId}
   ```

2. Backend deletes the file from storage and removes the database record:
   ```javascript
   await supabase.storage.from('videos').remove([video.storage_path]);
   await Video.findByIdAndDelete(videoId);
   ```

## Backward Compatibility

The system maintains backward compatibility with previously uploaded Dropbox videos:

- The database schema supports both storage methods
- The video playback component checks for either `storage_path` or `dropbox_link`
- All new uploads use Supabase Storage, while existing Dropbox videos continue to work

## Client-Side Implementation

The `AddVideo.js` component has been updated to support direct uploads to Supabase Storage:

1. File validation (type and size limits)
2. Obtaining a signed upload URL from the server
3. Progress tracking during upload
4. Creating the video record with storage information

## Future Improvements

1. **Video Transcoding**: Implement server-side transcoding for optimized playback
2. **Multiple Resolutions**: Store videos in multiple resolutions for adaptive streaming
3. **Thumbnails**: Auto-generate and store thumbnails for videos
4. **Migration Tool**: Create a tool to migrate existing Dropbox videos to Supabase Storage
5. **Caching**: Implement CDN caching for frequently accessed videos

## Troubleshooting

### Common Issues

1. **Permission Errors**: Verify RLS policies are correctly configured in Supabase dashboard
2. **Upload Failures**: Check file size limits and network connectivity
3. **Missing Videos**: Ensure the storage path in the database matches the actual file path

### Debugging

1. Check browser network tab for upload/download requests
2. Verify video records in the database include the correct storage_path
3. Test direct access through the Supabase dashboard Storage browser
