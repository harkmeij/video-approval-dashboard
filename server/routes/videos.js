const express = require('express');
const router = express.Router();
const supabase = require('../config/supabase');
const Video = require('../models/Video');
const Comment = require('../models/Comment');
const { verifyToken } = require('./auth');

// Middleware to check if user is an editor
const isEditor = (req, res, next) => {
  if (req.user.role !== 'editor') {
    return res.status(403).json({ message: 'Access denied. Editor role required.' });
  }
  next();
};

// @route   GET /api/videos/test
// @desc    Simple test endpoint to check if the server is running
// @access  Public
router.get('/test', (req, res) => {
  res.json({ message: 'Videos API is working' });
});

// @route   GET /api/videos
// @desc    Get all videos (editors only)
// @access  Private (Editor only)
router.get('/', verifyToken, isEditor, async (req, res) => {
  try {
    const videos = await Video.find();
    res.json(videos);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/videos/client
// @desc    Get videos for current client
// @access  Private (Client)
router.get('/client', verifyToken, async (req, res) => {
  try {
    // If user is an editor, they need to specify a client ID
    if (req.user.role === 'editor') {
      return res.status(400).json({ message: 'Editors must use /api/videos/client/:clientId endpoint' });
    }
    
    const videos = await Video.find({ client_id: req.user.id });
    res.json(videos);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/videos/client/preview
// @desc    Get preview-only videos for current client (using mock data)
// @access  Private (Client)
router.get('/client/preview', verifyToken, async (req, res) => {
  try {
    // Get existing videos from database
    const existingVideos = await Video.find({ client_id: req.user.id });
    
    // Create mock preview videos (not yet saved to the database)
    // These videos are shown as available for the client but not yet added to the system
    const mockPreviews = [
      {
        id: `preview-mock-1-${req.user.id}`,
        title: 'New Product Demo',
        storage_path: 'preview/new-product-demo.mp4',
        content_type: 'video/mp4',
        file_size: 10485760, // 10MB
        status: 'preview',
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        is_preview: true
      },
      {
        id: `preview-mock-2-${req.user.id}`,
        title: 'Upcoming Marketing Video',
        storage_path: 'preview/upcoming-marketing.mp4',
        content_type: 'video/mp4',
        file_size: 15728640, // 15MB
        status: 'preview',
        created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        is_preview: true
      },
      {
        id: `preview-mock-3-${req.user.id}`,
        title: 'Social Media Campaign',
        storage_path: 'preview/social-campaign.mp4',
        content_type: 'video/mp4',
        file_size: 20971520, // 20MB
        status: 'preview',
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days ago
        is_preview: true
      }
    ];
    
    // Return both existing videos and mock previews
    res.json([...existingVideos, ...mockPreviews]);
  } catch (err) {
    console.error('Error fetching preview videos:', err);
    res.status(500).json({ message: 'Server error fetching preview videos' });
  }
});

// @route   GET /api/videos/client/:clientId
// @desc    Get videos for a specific client (editors only)
// @access  Private (Editor only)
router.get('/client/:clientId', verifyToken, isEditor, async (req, res) => {
  try {
    const videos = await Video.find({ client_id: req.params.clientId });
    res.json(videos);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/videos/month/:monthId
// @desc    Get videos for a specific month
// @access  Private
router.get('/month/:monthId', verifyToken, async (req, res) => {
  try {
    const videos = await Video.find({ month_id: req.params.monthId });
    res.json(videos);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/videos/:id
// @desc    Get video by ID
// @access  Private
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Check if user is authorized to access this video
    if (req.user.role !== 'editor' && video.client_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to access this video' });
    }
    
    res.json(video);
  } catch (err) {
    console.error(err.message);
    if (err.code === 'PGRST116') {
      return res.status(404).json({ message: 'Video not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/videos
// @desc    Create a new video (editors or clients)
// @access  Private
router.post('/', verifyToken, async (req, res) => {
  console.log('Received video creation request:', JSON.stringify(req.body, null, 2));
  
  try {
    const { 
      title, 
      description, 
      storage_path,
      month_id, 
      monthInfo, 
      client_id,
      file_size,
      content_type 
    } = req.body;
    
    if (!client_id) {
      return res.status(400).json({ message: 'Client ID is required' });
    }
    
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    // Supabase storage path is required
    if (!storage_path) {
      return res.status(400).json({ message: 'storage_path is required' });
    }
    
    let finalMonthId = month_id || null;
    
    console.log('Full request body:', JSON.stringify(req.body, null, 2));
    console.log('User info:', JSON.stringify(req.user, null, 2));
    
    // Handle month data
    if (monthInfo && monthInfo.month && monthInfo.year) {
      console.log('Processing monthInfo:', JSON.stringify(monthInfo, null, 2));
      
      try {
        // Ensure month and year are integers
        const monthInt = parseInt(monthInfo.month, 10);
        const yearInt = parseInt(monthInfo.year, 10);
        
        if (isNaN(monthInt) || isNaN(yearInt)) {
          throw new Error(`Invalid month or year values: month=${monthInfo.month}, year=${monthInfo.year}`);
        }

        // Ensure we don't have string month ID format
        if (typeof month_id === 'string' && month_id.includes('-')) {
          console.log('Detected string format month_id. Using monthInfo instead.');
          // Don't use the string month_id, use only monthInfo
        }
        
        // Use direct Supabase queries for better reliability
        console.log('Looking for existing month with:', { month: monthInt, year: yearInt });
        
        const { data: monthData, error: monthError } = await supabase
          .from('months')
          .select('*')
          .eq('month', monthInt)
          .eq('year', yearInt)
          .single();
        
        if (monthError && monthError.code !== 'PGRST116') {
          console.error('Error checking for month:', monthError);
          throw monthError;
        }
        
        if (!monthData) {
          console.log('No existing month found, creating new month');
          // Create a new month on-the-fly
          const monthNames = [
            'January', 'February', 'March', 'April', 'May', 'June',
            'July', 'August', 'September', 'October', 'November', 'December'
          ];
          
          const newMonth = {
            name: `${monthNames[monthInt - 1]} ${yearInt}`,
            month: monthInt,
            year: yearInt,
            created_by: req.user.id || null
          };
            
          console.log('Creating month with data:', JSON.stringify(newMonth, null, 2));
          
          try {
            const { data: createdMonth, error: createMonthError } = await supabase
              .from('months')
              .insert([newMonth])
              .select();
            
            if (createMonthError) {
              console.error('Month creation error details:', createMonthError);
              throw new Error(`Failed to create month: ${createMonthError.message}`);
            }
            
            console.log('Created month successfully:', JSON.stringify(createdMonth[0], null, 2));
            finalMonthId = createdMonth[0].id;
          } catch (monthErr) {
            console.error('Month creation error details:', monthErr);
            throw new Error(`Failed to create month: ${monthErr.message}`);
          }
        } else {
          // Use the existing month
          console.log('Found existing month:', JSON.stringify(monthData, null, 2));
          finalMonthId = monthData.id;
        }
      } catch (monthErr) {
        console.error('Error in month processing:', monthErr);
        return res.status(500).json({ 
          message: 'Error processing month data', 
          error: monthErr.message || 'Unknown error',
          details: JSON.stringify(monthErr)
        });
      }
    }
    
      // Create video
    try {
      console.log('Final month ID for video:', finalMonthId);
      
      if (!finalMonthId) {
        console.warn('No month ID available - this might cause an error if month_id is required in the database');
        return res.status(400).json({ 
          message: 'Month is required', 
          error: 'No month ID available after processing monthInfo. This field is required by the database schema.'
        });
      }
      
      // Remove string-format month_id if it's in format "month-year"
      if (month_id && typeof month_id === 'string' && month_id.includes('-')) {
        console.log('Removing string-format month_id and using UUID instead:', finalMonthId);
        // Keep only the UUID format month_id that we processed
      }
      
      // Debug validation for created_by
      if (!req.user || !req.user.id) {
        console.error('Missing user ID for created_by field:', req.user);
        return res.status(400).json({
          message: 'User ID is required',
          error: 'No valid user ID available for the created_by field'
        });
      }
      
      const newVideo = {
        title,
        description,
        month_id: finalMonthId,
        client_id,
        created_by: req.user.id,
        status: 'pending'
      };
      
      // Set Supabase Storage fields
      newVideo.storage_path = storage_path;
      newVideo.file_size = file_size || 0;
      newVideo.content_type = content_type || 'video/mp4';
      
      console.log('Creating video with data:', JSON.stringify(newVideo, null, 2));
      
      try {
        try {
          // Log the object being sent to Supabase
          console.log('Final data being sent to Video.create:', JSON.stringify(newVideo, null, 2));
          
          const video = await Video.create(newVideo);
          console.log('Video created successfully:', JSON.stringify(video, null, 2));
          res.json(video);
        } catch (innerErr) {
          console.error('CRITICAL ERROR IN VIDEO.CREATE CALL:');
          console.error(innerErr);
          
          // Log specific details about the error for debugging
          if (innerErr.response) {
            console.error('Supabase response error:', innerErr.response);
          }
          
          return res.status(500).json({ 
            message: 'Error creating video in database (inner error)', 
            error: innerErr.message || 'Unknown error creating video',
            stack: innerErr.stack,
            details: JSON.stringify(innerErr)
          });
        }
      } catch (createErr) {
        console.error('Database error creating video:', createErr);
        console.error('Error details:', createErr.message);
        
        if (createErr.code) {
          console.error('Error code:', createErr.code);
        }
        
        if (createErr.details) {
          console.error('Error details from Supabase:', createErr.details);
        }
        
        return res.status(500).json({ 
          message: 'Error creating video in database', 
          error: createErr.message || 'Unknown error',
          details: JSON.stringify(createErr)
        });
      }
    } catch (videoErr) {
      console.error('Error creating video:', videoErr);
      return res.status(500).json({ 
        message: 'Error creating video', 
        error: videoErr.message || 'Unknown error',
        details: JSON.stringify(videoErr)
      });
    }
  } catch (err) {
    console.error('Top level error in video creation:', err);
    res.status(500).json({ 
      message: 'Server error', 
      error: err.message || 'Unknown error',
      details: JSON.stringify(err)
    });
  }
});

// @route   PUT /api/videos/:id
// @desc    Update a video (editors only)
// @access  Private (Editor only)
router.put('/:id', verifyToken, isEditor, async (req, res) => {
  const { title, description, storage_path, file_size, content_type, month_id } = req.body;
  
  // Build video object
  const videoFields = {};
  if (title) videoFields.title = title;
  if (description) videoFields.description = description;
  if (storage_path) videoFields.storage_path = storage_path;
  if (file_size) videoFields.file_size = file_size;
  if (content_type) videoFields.content_type = content_type;
  if (month_id) videoFields.month_id = month_id;
  
  try {
    let video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Update video
    video = await Video.findByIdAndUpdate(
      req.params.id,
      { $set: videoFields },
      { new: true }
    );
    
    res.json(video);
  } catch (err) {
    console.error(err.message);
    if (err.code === 'PGRST116') {
      return res.status(404).json({ message: 'Video not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/videos/:id/status
// @desc    Update video status (approve/reject)
// @access  Private (Client)
router.put('/:id/status', verifyToken, async (req, res) => {
  const { status } = req.body;
  
  // Validate status - allow any status to support toggling between states
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be pending, approved, or rejected.' });
  }
  
  try {
    let video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Check if user is authorized to update this video's status
    if (req.user.role !== 'editor' && video.client_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this video' });
    }
    
    // Update video status and record the time of update
    video = await Video.findByIdAndUpdate(
      req.params.id,
      { 
        $set: { 
          status,
          status_updated_at: new Date().toISOString(),
          status_updated_by: req.user.id
        } 
      },
      { new: true }
    );
    
    res.json(video);
  } catch (err) {
    console.error(err.message);
    if (err.code === 'PGRST116') {
      return res.status(404).json({ message: 'Video not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/videos/:id
// @desc    Delete a video (editors only)
// @access  Private (Editor only)
router.delete('/:id', verifyToken, isEditor, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // If video has a storage path, delete the file from Supabase Storage
    if (video.storage_path) {
      try {
        // Delete from Supabase Storage
        const { error } = await supabase.storage.from('videos')
          .remove([video.storage_path]);
        
        if (error) {
          console.error('Error deleting file from Supabase Storage:', error);
          // Continue with video deletion even if storage deletion fails
        } else {
          console.log(`File deleted from Supabase Storage: ${video.storage_path}`);
        }
      } catch (storageErr) {
        console.error('Error in storage delete operation:', storageErr);
        // Continue with video deletion even if storage deletion fails
      }
    }
    
    // Delete video from database
    await Video.findByIdAndDelete(req.params.id);
    
    // Delete associated comments
    await Comment.deleteMany({ video_id: req.params.id });
    
    res.json({ message: 'Video removed' });
  } catch (err) {
    console.error(err.message);
    if (err.code === 'PGRST116') {
      return res.status(404).json({ message: 'Video not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/videos/:id/comments
// @desc    Add a comment to a video
// @access  Private
router.post('/:id/comments', verifyToken, async (req, res) => {
  const { content } = req.body;
  
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Check if user is authorized to comment on this video
    if (req.user.role !== 'editor' && video.client_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to comment on this video' });
    }
    
    // Create new comment
    const newComment = {
      content,
      video_id: req.params.id,
      user_id: req.user.id
    };
    
    const comment = await Comment.create(newComment);
    
    // Add user data to the comment before returning
    const User = require('../models/User');
    const userData = await User.findById(req.user.id, 'id,name,role');
    
    const commentWithUser = {
      ...comment,
      user: userData
    };
    
    res.json(commentWithUser);
  } catch (err) {
    console.error(err.message);
    if (err.code === 'PGRST116') {
      return res.status(404).json({ message: 'Video not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/videos/:id/comments
// @desc    Get comments for a video
// @access  Private
router.get('/:id/comments', verifyToken, async (req, res) => {
  try {
    const video = await Video.findById(req.params.id);
    
    if (!video) {
      return res.status(404).json({ message: 'Video not found' });
    }
    
    // Check if user is authorized to view comments for this video
    if (req.user.role !== 'editor' && video.client_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to view comments for this video' });
    }
    
    // Get comments from the database
    const commentsData = await Comment.find({ 
      video_id: req.params.id,
      sort: { field: 'created_at', ascending: false }
    });
    
    // Get user data for each comment
    const User = require('../models/User');
    const commentsWithUserData = await Promise.all(
      commentsData.map(async (comment) => {
        try {
          if (comment.user_id) {
            const userData = await User.findById(comment.user_id, 'id,name,role');
            if (userData) {
              return {
                ...comment,
                user: userData
              };
            }
          }
          return comment;
        } catch (error) {
          console.error(`Error fetching user data for comment ${comment.id || comment._id}:`, error);
          return comment;
        }
      })
    );
    
    res.json(commentsWithUserData);
  } catch (err) {
    console.error(err.message);
    if (err.code === 'PGRST116') {
      return res.status(404).json({ message: 'Video not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/videos/comments/:id
// @desc    Delete a comment
// @access  Private
router.delete('/comments/:id', verifyToken, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Check if user is authorized to delete this comment
    if (req.user.role !== 'editor' && comment.user_id !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }
    
    // Delete comment
    await Comment.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Comment removed' });
  } catch (err) {
    console.error(err.message);
    if (err.code === 'PGRST116') {
      return res.status(404).json({ message: 'Comment not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/videos/comments/:id/resolve
// @desc    Toggle resolve status of a comment (admin only)
// @access  Private (Admin only)
router.put('/comments/:id/resolve', verifyToken, async (req, res) => {
  try {
    // Only admins can resolve comments
    if (req.user.role !== 'editor') {
      return res.status(403).json({ message: 'Access denied. Only admins can resolve comments.' });
    }
    
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }
    
    // Toggle the resolved status (default to true if not already set)
    const resolved = req.body.resolved !== undefined ? req.body.resolved : !comment.resolved;
    
    // Update comment
    const updatedComment = await Comment.toggleResolved(req.params.id, resolved);
    
    // Add user data to the response
    if (updatedComment && updatedComment.user_id) {
      const User = require('../models/User');
      const userData = await User.findById(updatedComment.user_id, 'id,name,role');
      
      if (userData) {
        updatedComment.user = userData;
      }
    }
    
    res.json(updatedComment);
  } catch (err) {
    console.error(err.message);
    if (err.code === 'PGRST116') {
      return res.status(404).json({ message: 'Comment not found' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
