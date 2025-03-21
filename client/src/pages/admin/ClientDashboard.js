import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Spinner from '../../components/layout/Spinner';

const ClientDashboard = ({ showAlert }) => {
  const [clients, setClients] = useState([]);
  const [clientVideos, setClientVideos] = useState({});
  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [mockVideos, setMockVideos] = useState([]);
  const [mockVideosLoading, setMockVideosLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [videoFormData, setVideoFormData] = useState({
    title: '',
    description: '',
    dropboxLink: '',
    dropboxFileId: '',
    monthId: '',
    clientId: ''
  });
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [addingVideo, setAddingVideo] = useState(false);


  // Mock video data for development
  const mockVideoList = [
    { 
      id: 'mock-1', 
      name: 'Product Demo.mp4', 
      size: 15458000, 
      path_lower: '/mock/product-demo.mp4',
      '.tag': 'file',
      embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    { 
      id: 'mock-2', 
      name: 'Client Testimonial.mp4', 
      size: 8965400, 
      path_lower: '/mock/client-testimonial.mp4',
      '.tag': 'file',
      embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    { 
      id: 'mock-3', 
      name: 'Marketing Campaign.mp4', 
      size: 22145800, 
      path_lower: '/mock/marketing-campaign.mp4',
      '.tag': 'file',
      embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    { 
      id: 'mock-4', 
      name: 'Social Media Reel.mp4', 
      size: 5872300, 
      path_lower: '/mock/social-media-reel.mp4',
      '.tag': 'file',
      embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    { 
      id: 'mock-5', 
      name: 'Company Intro.mp4', 
      size: 18750000, 
      path_lower: '/mock/company-intro.mp4',
      '.tag': 'file',
      embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    },
    { 
      id: 'mock-6', 
      name: 'Event Highlights.mp4', 
      size: 31457280, 
      path_lower: '/mock/event-highlights.mp4',
      '.tag': 'file',
      embedUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ'
    }
  ];
  
  // Generate month options for dropdown
  const monthOptions = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' }
  ];
  
  // Generate available months (3 previous months and 12 coming months)
  const generateMonthOptions = () => {
    const today = new Date();
    const months = [];
    
    // Start 3 months back
    const startDate = new Date(today);
    startDate.setMonth(today.getMonth() - 3);
    
    // Go until 12 months in the future
    const endDate = new Date(today);
    endDate.setMonth(today.getMonth() + 12);
    
    // Create array of all available months
    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      months.push({
        year: currentDate.getFullYear(),
        month: currentDate.getMonth() + 1, // 1-12
        label: `${monthOptions[currentDate.getMonth()].label} ${currentDate.getFullYear()}`
      });
      currentDate.setMonth(currentDate.getMonth() + 1);
    }
    
    return months;
  };

  // Load clients and check Dropbox folder structure on component mount
  // Define fetchVideosForClients with useCallback to avoid recreating it on every render
  const fetchVideosForClients = React.useCallback(async (clientsList) => {
    setVideosLoading(true);
    const videosData = {};
    
    try {
      for (const client of clientsList) {
        const res = await axios.get(`/api/videos/client/${client.id}`);
        videosData[client.id] = res.data;
      }
      
      setClientVideos(videosData);
      setVideosLoading(false);
    } catch (err) {
      console.error('Error fetching client videos:', err);
      showAlert('Error fetching client videos', 'danger');
      setVideosLoading(false);
    }
  }, [showAlert]);
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch clients
        const res = await axios.get('/api/users/clients');
        setClients(res.data);
        setLoading(false);
        
        // Fetch videos for each client
        if (res.data.length > 0) {
          fetchVideosForClients(res.data);
        }
      } catch (err) {
        console.error('Error fetching clients:', err);
        showAlert('Error fetching clients', 'danger');
        setLoading(false);
      }
    };

    fetchData();
    
    // Initialize mock videos
    setMockVideos(mockVideoList);
  }, [showAlert, fetchVideosForClients]);
  
  
  // Select a mock video
  const handleSelectMockVideo = (file) => {
    setSelectedFile(file);
    
    // Set title from filename if title is empty
    if (!videoFormData.title) {
      const filename = file.name.split('.').slice(0, -1).join('.');
      setVideoFormData(prevState => ({
        ...prevState,
        title: filename,
        dropboxFileId: file.path_lower,
        dropboxLink: file.embedUrl
      }));
    } else {
      setVideoFormData(prevState => ({
        ...prevState,
        dropboxFileId: file.path_lower,
        dropboxLink: file.embedUrl
      }));
    }
  };
  

  const onVideoFormChange = e => {
    setVideoFormData({ ...videoFormData, [e.target.name]: e.target.value });
  };
  
  // Removed unused checkClientFolder function
  
  const openAddVideoModal = async (client) => {
    setSelectedClient(client);
    // Set default month to current month
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentYear = currentDate.getFullYear();
    
    setVideoFormData({
      title: '',
      description: '',
      dropboxLink: '',
      dropboxFileId: '',
      clientId: client.id,
      monthInfo: { month: currentMonth, year: currentYear }
    });
    setSelectedFile(null);
    setMockVideosLoading(true);
    
    // Simulate loading for mock videos (for UI consistency)
    setTimeout(() => {
      setMockVideosLoading(false);
    }, 500);
    
    setShowAddVideoModal(true);
  };
  
  const closeAddVideoModal = () => {
    setShowAddVideoModal(false);
    setSelectedClient(null);
    setSelectedFile(null);
  };
  
  const handleAddVideo = async (e) => {
    e.preventDefault();
    
    const { title, dropboxLink, dropboxFileId } = videoFormData;
    
    if (!title || !dropboxLink || !dropboxFileId) {
      showAlert('Please fill in all required fields and select a video', 'danger');
      return;
    }
    
    try {
      setAddingVideo(true);
      
      // Ensure monthInfo contains proper number values
      let monthInfoData = null;
      if (videoFormData.monthInfo) {
        const monthInt = parseInt(videoFormData.monthInfo.month, 10);
        const yearInt = parseInt(videoFormData.monthInfo.year, 10);
        
        if (!isNaN(monthInt) && !isNaN(yearInt)) {
          monthInfoData = {
            month: monthInt,
            year: yearInt
          };
          console.log('Using month data:', monthInfoData);
        } else {
          console.warn('Invalid month or year values:', videoFormData.monthInfo);
          showAlert('Invalid month or year values', 'danger');
          setAddingVideo(false);
          return;
        }
      }
      
      // Convert camelCase to snake_case for API request
      const apiData = {
        title: videoFormData.title,
        description: videoFormData.description,
        dropbox_link: videoFormData.dropboxLink,
        dropbox_file_id: videoFormData.dropboxFileId,
        monthInfo: monthInfoData,  // Include properly formatted monthInfo
        client_id: videoFormData.clientId
      };
      
      console.log('Sending video data to API:', apiData);
      
      await axios.post('/api/videos', apiData);
      
      // Refresh videos for the client
      const res = await axios.get(`/api/videos/client/${selectedClient.id}`);
      setClientVideos({
        ...clientVideos,
        [selectedClient.id]: res.data
      });
      
      setAddingVideo(false);
      showAlert('Video added successfully', 'success');
      closeAddVideoModal();
    } catch (err) {
      console.error('Error adding video:', err.response?.data?.message || err.message);
      showAlert(err.response?.data?.message || 'Error adding video', 'danger');
      setAddingVideo(false);
    }
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  };
  
  // Function to confirm and delete a client
  const confirmDeleteClient = async (client) => {
    if (window.confirm(`Are you sure you want to delete client "${client.name}"? This action cannot be undone.`)) {
      try {
        // Call the API to delete the client
        await axios.delete(`/api/users/${client.id}`);
        
        // Update the clients list
        setClients(clients.filter(c => c.id !== client.id));
        
        // Show success message
        showAlert(`Client "${client.name}" deleted successfully`, 'success');
        
        // Also remove client videos from state
        const updatedClientVideos = { ...clientVideos };
        delete updatedClientVideos[client.id];
        setClientVideos(updatedClientVideos);
      } catch (err) {
        console.error('Error deleting client:', err.response?.data?.message || err.message);
        showAlert(err.response?.data?.message || 'Error deleting client', 'danger');
      }
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Client Dashboard</h1>
        <Link to="/admin/add-client" className="btn btn-primary">
          <i className="fas fa-user-plus me-2"></i>Add New Client
        </Link>
      </div>
      
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0 fw-bold">Client List</h5>
        </div>
        <div className="card-body">
          {clients.length === 0 ? (
            <p className="text-muted">No clients found.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clients.map(client => (
                    <tr key={client.id}>
                      <td>
                        <Link to={`/admin/clients/${client.id}`}>
                          {client.name}
                        </Link>
                      </td>
                      <td>{client.email}</td>
                      <td>
                        {client.active ? (
                          <span className="badge bg-success">Active</span>
                        ) : (
                          <span className="badge bg-warning text-dark">Pending</span>
                        )}
                      </td>
                        <td>
                        <Link 
                          to={`/admin/clients/${client.id}`}
                          className="btn btn-sm btn-primary me-2"
                        >
                          View
                        </Link>
                        <button 
                          className="btn btn-sm btn-outline-primary me-2"
                          onClick={() => openAddVideoModal(client)}
                        >
                          Add Video
                        </button>
                        <button 
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => confirmDeleteClient(client)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      
      {/* Client Videos Section */}
      <div className="mt-5 mb-4">
        <h2>Client Videos</h2>
      </div>
      {videosLoading ? (
        <Spinner />
      ) : (
        <div className="row">
          {clients.map(client => (
            <div key={client.id} className="col-md-12 mb-4">
              <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">{client.name}'s Videos</h5>
                  <button 
                    className="btn btn-sm btn-primary"
                    onClick={() => openAddVideoModal(client)}
                  >
                    Add Video
                  </button>
                </div>
                <div className="card-body">
                  {!clientVideos[client.id] || clientVideos[client.id].length === 0 ? (
                    <p className="text-muted">No videos found for this client.</p>
                  ) : (
                    <div className="table-responsive">
                      <table className="table table-hover">
                        <thead>
                          <tr>
                            <th>Title</th>
                            <th>Month</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {clientVideos[client.id].map(video => (
                            <tr key={video.id || `video-${Math.random()}`}>
                              <td>{video.title}</td>
                              <td>
                                {video.month ? (
                                  video.month.name || `${video.month.month}/${video.month.year}`
                                ) : (
                                  'N/A'
                                )}
                              </td>
                              <td>
                                {video.status === 'pending' ? (
                                  <span className="badge bg-warning text-dark">Pending</span>
                                ) : video.status === 'approved' ? (
                                  <span className="badge bg-success">Approved</span>
                                ) : (
                                  <span className="badge bg-danger">Rejected</span>
                                )}
                              </td>
                              <td>
                                <Link 
                                  to={`/videos/${video.id}`} 
                                  className="btn btn-sm btn-outline-primary me-2"
                                >
                                  View
                                </Link>
                                <Link 
                                  to={`/admin/videos`} 
                                  className="btn btn-sm btn-outline-secondary"
                                >
                                  Manage Videos
                                </Link>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {/* Add Video Modal */}
      {showAddVideoModal && selectedClient && (
        <div className="modal-backdrop show"></div>
      )}
      {showAddVideoModal && selectedClient && (
        <div className="modal show" style={{ display: 'block' }} tabIndex="-1">
          <div className="modal-dialog modal-xl">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Add Video for {selectedClient.name}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={closeAddVideoModal}
                ></button>
              </div>
              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6">
                    <div className="card mb-4">
                      <div className="card-header">
                        <h5 className="mb-0">Video Details</h5>
                      </div>
                      <div className="card-body">
                        <form onSubmit={handleAddVideo}>
                          
                          <div className="mb-3">
                            <label htmlFor="title" className="form-label">Title</label>
                            <input
                              type="text"
                              className="form-control"
                              id="title"
                              name="title"
                              value={videoFormData.title}
                              onChange={onVideoFormChange}
                              required
                            />
                          </div>
                          
                          <div className="mb-3">
                            <label htmlFor="description" className="form-label">Description (Optional)</label>
                            <textarea
                              className="form-control"
                              id="description"
                              name="description"
                              value={videoFormData.description}
                              onChange={onVideoFormChange}
                              rows="3"
                            ></textarea>
                          </div>
                          
                          <div className="mb-3">
                            <label htmlFor="monthSelector" className="form-label">Month</label>
                            <select
                              className="form-select"
                              id="monthSelector"
                              name="monthSelector"
                              onChange={(e) => {
                                const [month, year] = e.target.value.split('-').map(Number);
                                setVideoFormData({
                                  ...videoFormData,
                                  monthInfo: { month, year }
                                });
                              }}
                              required
                            >
                              {generateMonthOptions().map((month, index) => (
                                <option key={index} value={`${month.month}-${month.year}`}>
                                  {month.label}
                                </option>
                              ))}
                            </select>
                            <small className="text-muted">
                              Select from 3 previous months and 12 upcoming months
                            </small>
                          </div>
                          
                          {selectedFile && (
                            <div className="alert alert-info">
                              <h6 className="mb-1">Selected Video:</h6>
                              <p className="mb-0">
                                <strong>{selectedFile.name}</strong> ({formatFileSize(selectedFile.size)})
                              </p>
                            </div>
                          )}
                          
                          <button
                            type="submit"
                            className="btn btn-primary"
                            disabled={addingVideo || !selectedFile}
                          >
                            {addingVideo ? 'Adding...' : 'Add Video'}
                          </button>
                        </form>
                      </div>
                    </div>
                  </div>
                  
                  <div className="col-md-6">
                    <div className="card">
                      <div className="card-header">
                        <h5 className="mb-0">Select Video</h5>
                      </div>
                      <div className="card-body">
                        <div className="alert alert-info mb-3">
                          <h6>Using Mock Videos</h6>
                          <p className="mb-0">The system is currently using mock video data while the integration is being rethought.</p>
                        </div>
                        
                        {mockVideosLoading ? (
                          <div className="text-center py-4">
                            <div className="spinner-border" role="status">
                              <span className="visually-hidden">Loading...</span>
                            </div>
                            <p className="mt-2 mb-0">Loading videos...</p>
                          </div>
                        ) : (
                          <div className="list-group" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {mockVideos.map((video, index) => (
                              <button
                                key={index}
                                className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center ${
                                  selectedFile && selectedFile.id === video.id ? 'active' : ''
                                }`}
                                onClick={() => handleSelectMockVideo(video)}
                              >
                                <div>
                                  <i className="bi bi-file-earmark-play me-2"></i>
                                  {video.name}
                                </div>
                                <span className="text-muted small">
                                  {formatFileSize(video.size)}
                                </span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-secondary" 
                  onClick={closeAddVideoModal}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
          {/* No separate backdrop div needed as we're using inline background color */}
        </div>
      )}
    </div>
  );
};

export default ClientDashboard;
