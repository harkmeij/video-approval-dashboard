const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const { verifyToken } = require('./auth');
const Video = require('../models/Video');

// Middleware to check if user is an editor
const isEditor = (req, res, next) => {
  if (req.user.role !== 'editor') {
    return res.status(403).json({ message: 'Access denied. Editor role required.' });
  }
  next();
};

// Add a simple test route
router.get('/test', (req, res) => {
  res.json({ message: 'Storage route is working' });
});

// @route   POST /api/storage/sync
// @desc    Sync videos in Supabase Storage with database (editors only)
// @access  Private (Editor only)
router.post('/sync', verifyToken, isEditor, async (req, res) => {
  try {
    console.log('Storage sync requested by user:', req.user.id);
    
    // Import the sync function
    const syncStorage = require('../scripts/sync-supabase-storage').syncStorage;
    
    // Start sync process asynchronously (don't wait for completion)
    syncStorage()
      .then(result => {
        console.log('Sync process completed successfully:', result);
      })
      .catch(err => {
        console.error('Error in sync process:', err);
      });
    
    // Return success immediately since this can be a long-running process
    res.json({ 
      message: 'Sync process started successfully',
      note: 'This process runs asynchronously. Check server logs for progress.'
    });
  } catch (err) {
    console.error('Error starting sync process:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   GET /api/storage/list
// @desc    List all videos in Supabase Storage (editors only)
// @access  Private (Editor only)
router.get('/list', verifyToken, isEditor, async (req, res) => {
  try {
    // Check if the videos bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      throw bucketsError;
    }
    
    const videosBucket = buckets.find(bucket => bucket.name === 'videos');
    if (!videosBucket) {
      return res.status(404).json({ message: 'Videos bucket not found' });
    }
    
    // List files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from('videos')
      .list('clients', {
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (listError) {
      throw listError;
    }
    
    // Return client directories
    res.json({
      bucket: 'videos',
      path: 'clients',
      files: files
    });
  } catch (err) {
    console.error('Error listing storage contents:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   POST /api/storage/upload
// @desc    Upload file directly to server then to Supabase (clients and editors)
// @access  Private (All authenticated users)
router.post('/upload', verifyToken, async (req, res) => {
  try {
    console.log('Received upload request');
    
    // Check if file was uploaded
    if (!req.files || !req.files.file) {
      console.log('No file uploaded');
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const { client_id, month_id } = req.body;
    if (!client_id || !month_id) {
      console.log('Missing client_id or month_id');
      return res.status(400).json({ message: 'client_id and month_id are required' });
    }
    
    // Get uploaded file
    const uploadedFile = req.files.file;
    console.log('File info:', {
      name: uploadedFile.name,
      mimetype: uploadedFile.mimetype,
      size: uploadedFile.size,
      tempFilePath: uploadedFile.tempFilePath || 'No temp path available'
    });
    
    // Create path format: clients/{clientId}/{monthId}/{filename}
    const filePath = `clients/${client_id}/${month_id}/${uploadedFile.name}`;
    console.log('Storage path:', filePath);
    
    // Check if the videos bucket exists, create if needed
    try {
      const { data: buckets, error: bucketListError } = await supabase.storage.listBuckets();
      
      if (bucketListError) {
        console.error('Error listing buckets:', bucketListError);
        throw bucketListError;
      }
      
      if (!buckets || !buckets.some(bucket => bucket.name === 'videos')) {
        console.log('Creating videos bucket');
        const { error: createBucketError } = await supabase.storage.createBucket('videos', {
          public: false
        });
        
        if (createBucketError) {
          console.error('Error creating bucket:', createBucketError);
          throw createBucketError;
        }
      }
    } catch (bucketErr) {
      console.error('Error checking/creating bucket:', bucketErr);
      return res.status(500).json({ 
        message: 'Error checking/creating Supabase bucket', 
        error: bucketErr.message 
      });
    }
    
    // Upload to Supabase
    try {
      let fileBuffer;
      
      // Check if we have a tempFilePath
      if (uploadedFile.tempFilePath) {
        const fs = require('fs');
        
        // Verify the temp file exists
        if (!fs.existsSync(uploadedFile.tempFilePath)) {
          console.error('Temp file does not exist:', uploadedFile.tempFilePath);
          return res.status(500).json({ 
            message: 'Temporary file does not exist', 
            error: 'File processing error'
          });
        }
        
        // Read the file into a buffer
        try {
          fileBuffer = fs.readFileSync(uploadedFile.tempFilePath);
          console.log('Successfully read temp file, size:', fileBuffer.length);
        } catch (readErr) {
          console.error('Error reading temp file:', readErr);
          return res.status(500).json({ 
            message: 'Error reading temporary file', 
            error: readErr.message 
          });
        }
      } else {
        // If no tempFilePath, use the data buffer directly
        fileBuffer = uploadedFile.data;
        console.log('Using data buffer directly, size:', fileBuffer.length);
      }
      
      if (!fileBuffer || fileBuffer.length === 0) {
        console.error('Empty file buffer');
        return res.status(500).json({ 
          message: 'Empty file buffer', 
          error: 'File processing error'
        });
      }
      
      console.log('Uploading to Supabase, buffer size:', fileBuffer.length);
      
      const { data, error } = await supabase.storage.from('videos')
        .upload(filePath, fileBuffer, {
          contentType: uploadedFile.mimetype,
          upsert: true
        });
      
      if (error) {
        console.error('Supabase upload error:', error);
        return res.status(500).json({ 
          message: 'Error uploading to Supabase', 
          error: error.message 
        });
      }
      
      console.log('File uploaded successfully to Supabase:', data);
      
      // Return success with file path
      return res.json({
        success: true,
        path: filePath,
        size: uploadedFile.size,
        type: uploadedFile.mimetype
      });
    } catch (uploadErr) {
      console.error('Error uploading to Supabase:', uploadErr);
      return res.status(500).json({ 
        message: 'Error uploading to Supabase', 
        error: uploadErr.message 
      });
    }
  } catch (err) {
    console.error('Error handling file upload:', err);
    return res.status(500).json({ 
      message: 'Server error processing upload', 
      error: err.message 
    });
  }
});

// @route   GET /api/storage/video-url/:videoId
// @desc    Get video URL for playback
// @access  Private
router.get('/video-url/:videoId', verifyToken, async (req, res) => {
  try {
    console.log(`Fetching video URL for ID: ${req.params.videoId}`);
    
    // Get video details from database
    const video = await Video.findById(req.params.videoId);
    
    if (!video) {
      console.log(`Video not found with ID: ${req.params.videoId}`);
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Check authorization - either you're an editor or the client that owns the video
    if (req.user.role !== 'editor') {
      // If you're not an editor, you need to be the client who owns the video
      if (video.client_id !== req.user.id) {
        console.log(`Access denied: User ${req.user.id} is not client ${video.client_id} or an editor`);
        return res.status(403).json({ message: 'Not authorized to access this video' });
      }
      
      // At this point, we know the user is the client who owns the video
      console.log(`Access granted for client ${req.user.id} to video ${req.params.videoId}`);
    } else {
      // User is an editor, so we allow access
      console.log(`Access granted for editor ${req.user.id} to video ${req.params.videoId}`);
    }
    
    // If we don't have a storage path, return an error
    if (!video.storage_path) {
      console.log(`Video has no storage_path: ${req.params.videoId}`);
      return res.status(404).json({ message: 'Video file not found in storage' });
    }
    
    console.log(`Creating signed URL for path: ${video.storage_path}`);
    
    try {
      // Get a public URL with 24-hour expiry
      const { data, error } = await supabase.storage.from('videos')
        .createSignedUrl(video.storage_path, 86400); // 24 hours in seconds
      
      if (error) {
        console.error('Error creating signed URL for video:', error);
        
        // Check for specific storage errors
        if (error.message) {
          if (error.message.includes('not found')) {
            return res.status(404).json({ 
              message: 'Video file not found in storage',
              details: 'The file may have been deleted or moved from storage'
            });
          } else if (error.message.includes('permission') || error.message.includes('access') || error.message.includes('denied')) {
            return res.status(403).json({ 
              message: 'Storage permission error',
              details: 'The system does not have permission to access this file in storage'
            });
          }
        }
        
        throw error;
      }
      
      console.log(`URL created successfully for video: ${req.params.videoId}`);
      res.json({ url: data.signedUrl });
    } catch (storageErr) {
      console.error('Error accessing storage:', storageErr);
      throw storageErr;
    }
  } catch (err) {
    console.error('Error generating video URL:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// @route   DELETE /api/storage/video/:videoId
// @desc    Delete a video file from storage (editors only)
// @access  Private (Editor only)
router.delete('/video/:videoId', verifyToken, isEditor, async (req, res) => {
  try {
    // Get video details from database
    const video = await Video.findById(req.params.videoId);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // If we don't have a storage path, just return success
    if (!video.storage_path) {
      return res.json({ message: 'No storage file to delete' });
    }
    
    // Delete the file from storage
    const { error } = await supabase.storage.from('videos')
      .remove([video.storage_path]);
    
    if (error) {
      console.error('Error deleting file from storage:', error);
      throw error;
    }
    
    res.json({ message: 'Video file deleted successfully' });
  } catch (err) {
    console.error('Error deleting video file:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
