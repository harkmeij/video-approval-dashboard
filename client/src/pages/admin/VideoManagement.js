import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Spinner from '../../components/layout/Spinner';

const VideoManagement = ({ showAlert }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);
  
  useEffect(() => {
    const fetchVideos = async () => {
      try {
        const res = await axios.get('/api/videos');
        setVideos(res.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching videos:', err.response?.data?.message || err.message);
        showAlert('Error fetching videos', 'danger');
        setLoading(false);
      }
    };
    
    fetchVideos();
  }, [showAlert]);
  
  const handleDelete = async (videoId) => {
    if (window.confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      try {
        setDeleting(videoId);
        
        await axios.delete(`/api/videos/${videoId}`);
        
        setVideos(videos.filter(video => video._id !== videoId));
        setDeleting(null);
        
        showAlert('Video deleted successfully', 'success');
      } catch (err) {
        console.error('Error deleting video:', err.response?.data?.message || err.message);
        showAlert(err.response?.data?.message || 'Error deleting video', 'danger');
        setDeleting(null);
      }
    }
  };
  
  const getStatusBadge = (status) => {
    if (status === 'pending') {
      return <span className="badge bg-warning text-dark">Pending</span>;
    } else if (status === 'approved') {
      return <span className="badge bg-success">Approved</span>;
    } else {
      return <span className="badge bg-danger">Rejected</span>;
    }
  };
  
  if (loading) {
    return <Spinner />;
  }
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Video Management</h1>
        <Link to="/admin/videos/add" className="btn btn-primary">
          Add Video
        </Link>
      </div>
      
      {videos.length === 0 ? (
        <div className="alert alert-info">No videos found</div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead>
              <tr>
                <th>Title</th>
                <th>Month</th>
                <th>Client</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {videos.map(video => (
                <tr key={video._id}>
                  <td>{video.title}</td>
                  <td>
                    {video.month ? (
                      video.month.name || `${video.month.month}/${video.month.year}`
                    ) : (
                      'N/A'
                    )}
                  </td>
                  <td>{video.client?.name || 'N/A'}</td>
                  <td>{getStatusBadge(video.status)}</td>
                  <td>{new Date(video.createdAt).toLocaleDateString()}</td>
                  <td>
                    <div className="btn-group" role="group">
                      <Link 
                        to={`/videos/${video._id}`} 
                        className="btn btn-sm btn-outline-primary"
                      >
                        View
                      </Link>
                      <Link 
                        to={`/admin/videos/edit/${video._id}`} 
                        className="btn btn-sm btn-outline-secondary"
                      >
                        Edit
                      </Link>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(video._id)}
                        disabled={deleting === video._id}
                      >
                        {deleting === video._id ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default VideoManagement;
