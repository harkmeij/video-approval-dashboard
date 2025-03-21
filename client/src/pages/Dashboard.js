import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import Spinner from '../components/layout/Spinner';
import ClientDashboard from './admin/ClientDashboard';

const Dashboard = ({ showAlert }) => {
  const [videos, setVideos] = useState([]);
  const [months, setMonths] = useState([]);
  const [groupedVideos, setGroupedVideos] = useState({});
  const [loading, setLoading] = useState(true);
  
  const { user } = useContext(AuthContext);
  
  // Function to group videos by month
  const groupVideosByMonth = (videosList, monthsList) => {
    const grouped = {};
    
    // Create a "No Month" group for videos without a month
    grouped.unassigned = [];
    
    // Initialize groups for each month
    if (monthsList.length > 0) {
      monthsList.forEach(month => {
        grouped[month.id] = {
          month: month,
          videos: []
        };
      });
    }
    
    // Assign videos to their months
    videosList.forEach(video => {
      if (video.month_id && grouped[video.month_id]) {
        grouped[video.month_id].videos.push(video);
      } else {
        grouped.unassigned.push(video);
      }
    });
    
    return grouped;
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Only fetch data for client users
        if (user && user.role !== 'editor') {
          setLoading(true);
          
          // Fetch months for this client
          let clientMonths = [];
          try {
            const monthsResponse = await axios.get('/api/months/client');
            clientMonths = monthsResponse.data;
            setMonths(clientMonths);
          } catch (monthErr) {
            console.error('Error fetching months:', monthErr);
          }
          
          // Use the preview endpoint to get both saved videos and mock preview videos
          const videosResponse = await axios.get('/api/videos/client/preview');
          const videoData = videosResponse.data;
          setVideos(videoData);
          
          // Use the groupVideosByMonth function
          const grouped = groupVideosByMonth(videoData, clientMonths);
          
          setGroupedVideos(grouped);
          setLoading(false);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching data:', err.response?.data?.message || err.message);
        showAlert('Error fetching data', 'danger');
        setLoading(false);
        
        // Fall back to regular endpoint if preview endpoint fails
        if (user && user.role !== 'editor') {
          try {
            const fallbackResponse = await axios.get('/api/videos/client');
            setVideos(fallbackResponse.data);
          } catch (fallbackErr) {
            console.error('Fallback error:', fallbackErr);
          }
        }
      }
    };
    
    fetchData();
  }, [user, showAlert]);
  
  if (loading) {
    return <Spinner />;
  }
  
  // Editor view - show ClientDashboard component
  if (user && user.role === 'editor') {
    return <ClientDashboard showAlert={showAlert} />;
  }
  
  // Client view - show their videos
  return (
    <div>
      <h1 className="mb-4">My Videos</h1>
      
      {videos.length === 0 ? (
        <div className="alert alert-info">
          <div className="d-flex align-items-center">
            <i className="bi bi-info-circle me-3 fs-4"></i>
            <p className="mb-0">No videos found. Your editor will add videos for you to review.</p>
          </div>
        </div>
      ) : (
        <div>
          {/* Display videos by month section, sorted by year and month (newest first) */}
          {months.length > 0 && (
            <>
              {[...months].sort((a, b) => {
                // Sort by year (descending)
                if (b.year !== a.year) {
                  return b.year - a.year;
                }
                // Then by month (descending)
                return b.month - a.month;
              }).map(month => {
                // Skip months with no videos
                if (!groupedVideos[month.id] || groupedVideos[month.id].videos.length === 0) {
                  return null;
                }
                
                // Format month name
                const monthName = month.name || `${new Date(month.year, month.month - 1).toLocaleString('default', { month: 'long' })} ${month.year}`;
                
                return (
                  <div key={month.id} className="mb-5">
                    <div className="d-flex align-items-center mb-3">
                      <h2 className="mb-0 h3">{monthName}</h2>
                      <span className="badge bg-primary ms-2">{groupedVideos[month.id].videos.length} videos</span>
                    </div>
                    
                    <div className="card">
                      <div className="card-body p-0">
                        <div className="row g-4 p-4">
                          {groupedVideos[month.id].videos.map(video => (
                            <div key={video.id} className="col-md-6 col-lg-4 mb-3">
                              <div className="card h-100 video-card">
                                <div className="card-img-top video-preview-container">
                                  {video.dropbox_link ? (
                                    <iframe
                                      src={video.dropbox_link}
                                      title={video.title}
                                      allowFullScreen
                                      allow="autoplay; fullscreen"
                                      className="w-100"
                                      style={{ aspectRatio: '16/9', border: 'none' }}
                                    ></iframe>
                                  ) : (
                                    <div className="no-preview d-flex justify-content-center align-items-center" 
                                        style={{ aspectRatio: '16/9', backgroundColor: '#f8f9fa' }}>
                                      <i className="bi bi-film fs-1 text-muted"></i>
                                    </div>
                                  )}
                                </div>
                                <div className="card-body">
                                  <h5 className="card-title">{video.title}</h5>
                                  <div className="d-flex justify-content-between mb-2">
                                    <small className="text-muted">{new Date(video.created_at).toLocaleDateString()}</small>
                                    {video.status === 'pending' ? (
                                      <span className="badge bg-warning">Pending</span>
                                    ) : video.status === 'approved' ? (
                                      <span className="badge bg-success">Approved</span>
                                    ) : (
                                      <span className="badge bg-danger">Rejected</span>
                                    )}
                                  </div>
                                  <Link 
                                    to={`/videos/${video.id}`} 
                                    className="btn btn-primary w-100"
                                  >
                                    <i className="bi bi-eye me-1"></i> View Details
                                  </Link>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </>
          )}
          
          {/* Unassigned videos section */}
          {groupedVideos.unassigned && groupedVideos.unassigned.length > 0 && (
            <div className="mb-5">
              <div className="d-flex align-items-center mb-3">
                <h2 className="mb-0 h3">Unassigned Videos</h2>
                <span className="badge bg-secondary ms-2">{groupedVideos.unassigned.length} videos</span>
              </div>
              
              <div className="card">
                <div className="card-body p-0">
                  <div className="row g-4 p-4">
                    {groupedVideos.unassigned.map(video => (
                      <div key={video.id} className="col-md-6 col-lg-4 mb-3">
                        <div className="card h-100 video-card">
                          <div className="card-img-top video-preview-container">
                            {video.dropbox_link ? (
                              <iframe
                                src={video.dropbox_link}
                                title={video.title}
                                allowFullScreen
                                allow="autoplay; fullscreen"
                                className="w-100"
                                style={{ aspectRatio: '16/9', border: 'none' }}
                              ></iframe>
                            ) : (
                              <div className="no-preview d-flex justify-content-center align-items-center" 
                                  style={{ aspectRatio: '16/9', backgroundColor: '#f8f9fa' }}>
                                <i className="bi bi-film fs-1 text-muted"></i>
                              </div>
                            )}
                          </div>
                          <div className="card-body">
                            <h5 className="card-title">{video.title}</h5>
                            <div className="d-flex justify-content-between mb-2">
                              <small className="text-muted">{new Date(video.created_at).toLocaleDateString()}</small>
                              {video.status === 'pending' ? (
                                <span className="badge bg-warning">Pending</span>
                              ) : video.status === 'approved' ? (
                                <span className="badge bg-success">Approved</span>
                              ) : (
                                <span className="badge bg-danger">Rejected</span>
                              )}
                            </div>
                            <Link 
                              to={`/videos/${video.id}`} 
                              className="btn btn-primary w-100"
                            >
                              <i className="bi bi-eye me-1"></i> View Details
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Dashboard;
