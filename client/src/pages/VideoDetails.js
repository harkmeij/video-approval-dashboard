import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Spinner from '../components/layout/Spinner';

const VideoDetails = ({ showAlert }) => {
  const [video, setVideo] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [videoUrl, setVideoUrl] = useState(null);
  const [urlLoading, setUrlLoading] = useState(false);
  
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Function to get video URL from Supabase Storage
  const fetchVideoUrl = useCallback(async (videoId) => {
    if (!videoId) return null;
    
    try {
      setUrlLoading(true);
      const { data } = await axios.get(`/api/storage/video-url/${videoId}`);
      setVideoUrl(data.url);
      setUrlLoading(false);
      return data.url;
    } catch (err) {
      console.error('Error fetching video URL:', err);
      
      // Show error message only to editors
      if (user?.role === 'editor') {
        showAlert(`Error fetching video: ${err.response?.data?.message || 'Server error'}`, 'warning');
      }
      
      setUrlLoading(false);
      return null;
    }
  }, [user, showAlert]);

  useEffect(() => {
    const fetchVideoDetails = async () => {
      try {
        // Check if this is a preview video (ID starts with 'preview-')
        if (id.startsWith('preview-')) {
          // This is a mock preview video, not yet in the database
          try {
            // Get the video details from the client's mock preview videos
            const clientVideosResponse = await axios.get('/api/videos/client/preview');
            const previewVideo = clientVideosResponse.data.find(v => v.id === id);
            
            if (previewVideo) {
              setVideo({
                ...previewVideo,
                description: previewVideo.description || 'Preview video', 
                status: 'preview'
              });
              
              // No comments for preview videos
              setComments([]);
              setLoading(false);
            } else {
              throw new Error('Preview video not found');
            }
          } catch (previewErr) {
            console.error('Error fetching preview video:', previewErr);
            showAlert('Error fetching preview video', 'danger');
            setLoading(false);
            navigate('/');
          }
        } else {
          // Regular video from database
          const res = await axios.get(`/api/videos/${id}`);
          setVideo(res.data);
          
          // Get video URL if it's a storage path
          if (res.data.storage_path) {
            await fetchVideoUrl(id);
          } else if (res.data.dropbox_link) {
            // Use the existing Dropbox link for legacy videos
            setVideoUrl(res.data.dropbox_link);
          }
          
    // Get comments for database videos
    try {
      const commentsRes = await axios.get(`/api/videos/${id}/comments`);
      setComments(commentsRes.data);
    } catch (commentsErr) {
      console.error('Error fetching comments:', commentsErr);
      setComments([]);
    }
          
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching video details:', err.response?.data?.message || err.message);
        showAlert('Error fetching video details', 'danger');
        setLoading(false);
        navigate('/');
      }
    };
    
    fetchVideoDetails();
  }, [id, navigate, showAlert]);
  
  const handleStatusChange = async (status) => {
    try {
      setSubmitting(true);
      
      const res = await axios.put(`/api/videos/${id}/status`, { status });
      
      setVideo(res.data);
      setSubmitting(false);
      
      showAlert(
        status === 'approved' 
          ? 'Video approved successfully' 
          : status === 'rejected'
            ? 'Video rejected successfully'
            : 'Video status reset to pending successfully', 
        'success'
      );
    } catch (err) {
      console.error('Error updating video status:', err.response?.data?.message || err.message);
      showAlert('Error updating video status', 'danger');
      setSubmitting(false);
    }
  };
  
  const handleCommentSubmit = async (e) => {
    e.preventDefault();
    
    if (!newComment.trim()) {
      showAlert('Please enter a comment', 'danger');
      return;
    }
    
    try {
      setSubmitting(true);
      
      const res = await axios.post(`/api/videos/${id}/comments`, { content: newComment });
      
      setComments([res.data, ...comments]);
      setNewComment('');
      setSubmitting(false);
      
      showAlert('Comment added successfully', 'success');
    } catch (err) {
      console.error('Error adding comment:', err.response?.data?.message || err.message);
      showAlert('Error adding comment', 'danger');
      setSubmitting(false);
    }
  };
  
  const handleDeleteComment = async (commentId) => {
    try {
      setSubmitting(true);
      
      await axios.delete(`/api/videos/comments/${commentId}`);
      
      setComments(comments.filter(comment => comment._id !== commentId || comment.id !== commentId));
      setSubmitting(false);
      
      showAlert('Comment deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting comment:', err.response?.data?.message || err.message);
      showAlert('Error deleting comment', 'danger');
      setSubmitting(false);
    }
  };
  
  const handleResolveComment = async (commentId, currentResolvedStatus) => {
    try {
      setSubmitting(true);
      
      const res = await axios.put(`/api/videos/comments/${commentId}/resolve`, {
        resolved: !currentResolvedStatus
      });
      
      // Update comment in state
      setComments(
        comments.map(comment => 
          (comment._id === commentId || comment.id === commentId) 
            ? {...comment, resolved: res.data.resolved}
            : comment
        )
      );
      
      setSubmitting(false);
      
      showAlert(`Comment ${res.data.resolved ? 'resolved' : 'reopened'} successfully`, 'success');
    } catch (err) {
      console.error('Error resolving comment:', err.response?.data?.message || err.message);
      showAlert('Error resolving comment', 'danger');
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return <Spinner />;
  }
  
  if (!video) {
    return (
      <div className="alert alert-danger">Video not found</div>
    );
  }
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{video.title}</h1>
        <Link to="/" className="btn btn-outline-secondary">
          Back to Dashboard
        </Link>
      </div>
      
      <div className="card mb-4">
        <div className="card-body">
          <div className="video-container mb-4">
            {urlLoading ? (
              <div className="text-center py-5 bg-light rounded">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading video...</span>
                </div>
                <p className="mt-2">Loading video...</p>
              </div>
            ) : videoUrl ? (
              video.storage_path ? (
                <video 
                  controls
                  src={videoUrl}
                  title={video.title}
                  height="500"
                  width="100%"
                  className="rounded"
                  playsInline
                  controlsList="nodownload"
                ></video>
              ) : (
                <iframe 
                  src={videoUrl}
                  title={video.title}
                  height="500px"
                  width="100%"
                  allowFullScreen 
                  allow="autoplay; fullscreen"
                  frameBorder="0"
                ></iframe>
              )
            ) : (
              <div className="alert alert-warning">
                <p className="mb-0"><i className="bi bi-exclamation-triangle me-2"></i>Video preview not available</p>
                {video.storage_path && user?.role === 'editor' && (
                  <div className="mt-2 small">
                    <strong>Note for editors:</strong> The video file exists at path "{video.storage_path}" but couldn't be loaded. 
                    This may be due to one of the following reasons:
                    <ul className="mt-1 mb-0">
                      <li>The client account has been deleted</li>
                      <li>The file doesn't exist in storage anymore</li>
                      <li>There's a storage permission issue with the bucket or file</li>
                      <li>The storage path in the database is incorrect</li>
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
          
          <div className="d-flex justify-content-between align-items-center mb-3">
            <div>
              <h5 className="card-title">{video.title}</h5>
              <div className="instagram-description-container mb-2">
                <h6 className="text-primary mb-1">Instagram Description</h6>
                <p className="card-text border p-3 bg-light rounded instagram-description">
                  {video.description || `Check out this amazing video by ${user.name || 'our team'}! 🎬✨ #VideoProduction #ContentCreation`}
                </p>
                <div className="d-flex gap-2 mt-1">
                  <button
                    className="btn btn-sm btn-outline-secondary"
                    onClick={() => {
                      navigator.clipboard.writeText(video.description || `Check out this amazing video by ${user.name || 'our team'}! 🎬✨ #VideoProduction #ContentCreation`);
                      showAlert('Instagram description copied to clipboard!', 'success');
                    }}
                  >
                    <i className="bi bi-clipboard me-1"></i> Copy Description
                  </button>
                  {video.client_id && (
                    <button
                      className="btn btn-sm btn-outline-primary"
                      onClick={async () => {
                        try {
                          // Fetch client information to get keywords
                          const { data: client } = await axios.get(`/api/users/${video.client_id}`);
                          
                          // Generate hashtags from keywords if available
                          let hashtags = '#VideoProduction #ContentCreation';
                          if (client.keywords && client.keywords.length > 0) {
                            const keywordHashtags = client.keywords
                              .slice(0, 5)
                              .map(keyword => `#${keyword.replace(/\s+/g, '')}`)
                              .join(' ');
                            
                            if (keywordHashtags) {
                              hashtags = `${keywordHashtags} ${hashtags}`;
                            }
                          }
                          
                          // Generate enhanced description
                          const enhancedDesc = `${video.title}\n\n${video.description || `Check out this amazing video by ${client.name}! 🎬✨`}\n\n${hashtags}`;
                          
                          navigator.clipboard.writeText(enhancedDesc);
                          showAlert('Enhanced description with hashtags copied!', 'success');
                        } catch (err) {
                          console.error('Error generating enhanced description:', err);
                          showAlert('Error generating enhanced description', 'danger');
                        }
                      }}
                    >
                      <i className="bi bi-hash me-1"></i> Copy with Hashtags
                    </button>
                  )}
                </div>
              </div>
            </div>
            <div>
              {video.status === 'preview' ? (
                <span className="badge bg-info">Preview</span>
              ) : video.status === 'pending' ? (
                <span className="badge bg-warning">Pending</span>
              ) : video.status === 'approved' ? (
                <span className="badge bg-success">Approved</span>
              ) : (
                <span className="badge bg-danger">Rejected</span>
              )}
            </div>
          </div>
          
          {/* Information for preview videos */}
          {video.status === 'preview' && user.role === 'client' && (
            <div className="alert alert-info mb-3">
              <div className="d-flex align-items-center">
                <i className="bi bi-info-circle me-2 fs-4"></i>
                <div>
                  <p className="mb-0">This is a preview of a video that has not yet been added to your account.</p>
                  <p className="mb-0">Please provide feedback to your editor or approve the video.</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Status buttons for pending/preview videos */}
          {(video.status === 'pending' || video.status === 'preview') && (
            <div className="d-flex gap-3 mb-4">
              <button
                className="btn btn-success"
                onClick={() => handleStatusChange('approved')}
                disabled={submitting}
              >
                Approve Video
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleStatusChange('rejected')}
                disabled={submitting}
              >
                Reject Video
              </button>
            </div>
          )}
          
          {/* Reset status button for approved videos */}
          {video.status === 'approved' && (
            <div className="d-flex gap-3 mb-4">
              <button
                className="btn btn-secondary"
                onClick={() => handleStatusChange('pending')}
                disabled={submitting}
              >
                Reset to Pending
              </button>
              <button
                className="btn btn-danger"
                onClick={() => handleStatusChange('rejected')}
                disabled={submitting}
              >
                Reject Video
              </button>
            </div>
          )}
          
          {/* Reset status button for rejected videos */}
          {video.status === 'rejected' && (
            <div className="d-flex gap-3 mb-4">
              <button
                className="btn btn-secondary"
                onClick={() => handleStatusChange('pending')}
                disabled={submitting}
              >
                Reset to Pending
              </button>
              <button
                className="btn btn-success"
                onClick={() => handleStatusChange('approved')}
                disabled={submitting}
              >
                Approve Video
              </button>
            </div>
          )}
          
          {/* Only show comments section for database videos (not previews) */}
          {!id.startsWith('preview-') && (
            <div className="card">
              <div className="card-header">
                <h5 className="mb-0">Comments</h5>
              </div>
              <div className="card-body">
                <form onSubmit={handleCommentSubmit} className="mb-4">
                  <div className="mb-3">
                    <textarea
                      className="form-control"
                      rows="3"
                      placeholder="Add a comment..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      required
                    ></textarea>
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    Add Comment
                  </button>
                </form>
                
                <div className="comment-section">
                  {comments.length === 0 ? (
                    <p className="text-muted">No comments yet</p>
                  ) : (
                    comments.map(comment => {
                      const commentId = comment._id || comment.id;
                      const isResolved = comment.resolved || false;
                      
                      return (
                        <div key={commentId} className={`card mb-3 ${isResolved ? 'border-success' : ''}`}>
                          <div className="card-body p-3">
                            <div className="d-flex justify-content-between align-items-center">
                              <div className="d-flex align-items-center">
                                <h6 className="card-subtitle mb-0 text-muted">
                                  {comment.user?.name || 'Unknown User'}
                                </h6>
                                {isResolved && (
                                  <span className="badge bg-success ms-2">Resolved</span>
                                )}
                              </div>
                              <small className="text-muted">
                                {comment.createdAt 
                                  ? new Date(comment.createdAt).toLocaleString() 
                                  : comment.created_at 
                                    ? new Date(comment.created_at).toLocaleString()
                                    : 'Date not available'}
                              </small>
                            </div>
                            <p className={`card-text mt-2 ${isResolved ? 'text-muted' : ''}`}>
                              {comment.content}
                            </p>
                            <div className="d-flex gap-2 mt-1">
                              {/* Admin resolve button */}
                              {user.role === 'editor' && (
                                <button
                                  className={`btn btn-sm ${isResolved ? 'btn-outline-secondary' : 'btn-outline-success'}`}
                                  onClick={() => handleResolveComment(commentId, isResolved)}
                                  disabled={submitting}
                                >
                                  {isResolved ? 'Reopen Comment' : 'Resolve Comment'}
                                </button>
                              )}
                              
                              {/* Delete button */}
                              {(user.role === 'editor' || (comment.user && (user.id === comment.user._id || user.id === comment.user.id))) && (
                                <button
                                  className="btn btn-sm btn-outline-danger"
                                  onClick={() => handleDeleteComment(commentId)}
                                  disabled={submitting}
                                >
                                  Delete
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VideoDetails;
