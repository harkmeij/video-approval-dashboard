import React, { useState, useEffect } from 'react';
import { Link, useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Spinner from '../../components/layout/Spinner';
import SocialMediaOverview from '../../components/SocialMediaOverview';

const ClientPage = ({ showAlert }) => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  
  const [client, setClient] = useState(null);
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [videosLoading, setVideosLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [videoFormData, setVideoFormData] = useState({
    title: '',
    description: '',
    clientId: '',
    monthId: ''
  });
  const [showAddVideoModal, setShowAddVideoModal] = useState(false);
  const [addingVideo, setAddingVideo] = useState(false);
  
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
  
  // Load client and videos on component mount
  useEffect(() => {
    const fetchClientData = async () => {
      try {
        // Fetch client details
        const clientRes = await axios.get(`/api/users/${clientId}`);
        setClient(clientRes.data);
        setLoading(false);
        
        // Set client ID in form data
        setVideoFormData(prevState => ({
          ...prevState,
          clientId: clientRes.data.id
        }));
        
        // Fetch client videos
        const videosRes = await axios.get(`/api/videos/client/${clientId}`);
        setVideos(videosRes.data);
        setVideosLoading(false);
      } catch (err) {
        console.error('Error fetching client data:', err.response?.data?.message || err.message);
        showAlert('Error fetching client data', 'danger');
        setLoading(false);
        setVideosLoading(false);
        navigate('/admin/clients');
      }
    };

    fetchClientData();
    
    // Cleanup function to ensure we remove backdrop and reset body styles on unmount
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [clientId, showAlert, navigate]);
  
  const onVideoFormChange = e => {
    setVideoFormData({ ...videoFormData, [e.target.name]: e.target.value });
  };
  
  const openAddVideoModal = () => {
    // Set default month to current month
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const currentYear = currentDate.getFullYear();
    
    setVideoFormData({
      title: '',
      description: '',
      clientId: client.id,
      monthInfo: { month: currentMonth, year: currentYear }
    });
    setSelectedFile(null);
    setShowAddVideoModal(true);
    
    // Add modal classes to body
    document.body.classList.add('modal-open');
  };
  
  const closeAddVideoModal = () => {
    setShowAddVideoModal(false);
    setSelectedFile(null);
    
    // Clean up body classes
    document.body.classList.remove('modal-open');
  };
  
  const handleAddVideo = async (e) => {
    e.preventDefault();
    
    const { title } = videoFormData;
    
    if (!title || !selectedFile) {
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
      
      // Always upload to Supabase Storage
      if (selectedFile && selectedFile.file) {
        try {
          // Step 1: Set up authentication and upload status
          setIsUploading(true);
          setUploadProgress(0);
          showAlert('Uploading video to server...', 'info');
          
          // Get authentication token
          const token = localStorage.getItem('token');
          if (!token) {
            throw new Error('No authentication token found');
          }
          
          // Step 2: Prepare form data for upload
          const formData = new FormData();
          formData.append('file', selectedFile.file);
          formData.append('client_id', videoFormData.clientId);
          formData.append('month_id', `${monthInfoData.month}-${monthInfoData.year}`);
          
          // Step 3: Upload the file directly to our server endpoint with authentication
          console.log('Preparing to upload file to Supabase. File size:', selectedFile.file.size);
          
          const { data: uploadResult } = await axios.post('/api/storage/upload', formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'x-auth-token': token
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
              setUploadProgress(percentCompleted);
              console.log(`Upload progress: ${percentCompleted}%`);
            },
            maxContentLength: Infinity,
            maxBodyLength: Infinity,
            timeout: 60000 // 60 seconds timeout
          });
          
          setIsUploading(false);
          console.log('File uploaded successfully to Supabase Storage');
          
          // Step 4: Create video record with storage_path
          const apiData = {
            title: videoFormData.title,
            description: videoFormData.description || '',
            storage_path: uploadResult.path, // Use path from upload result
            file_size: uploadResult.size || selectedFile.file.size,
            content_type: uploadResult.type || selectedFile.file.type,
            // Don't send month_id as a string, only send monthInfo 
            monthInfo: {
              month: parseInt(monthInfoData.month, 10),
              year: parseInt(monthInfoData.year, 10)
            },
            client_id: videoFormData.clientId
          };
          
          console.log('Sending video data to API:', apiData);
          
          console.log('About to call /api/videos endpoint with data:', 
            JSON.stringify(apiData, null, 2));
          
          try {
            // Create the video record in the database
            const videoResponse = await axios.post('/api/videos', apiData, {
              headers: {
                'Content-Type': 'application/json',
                'x-auth-token': token
              }
            });
            console.log('Video created successfully:', videoResponse.data);
          } catch (apiError) {
            console.error('Error from /api/videos endpoint:', apiError);
            if (apiError.response) {
              console.error('Response status:', apiError.response.status);
              console.error('Response data:', apiError.response.data);
              
              // Show detailed error to user
              showAlert(`API Error (${apiError.response.status}): ${apiError.response.data.message || 'Unknown error'}`, 'danger');
            } else if (apiError.request) {
              console.error('No response received from server');
              showAlert('No response received from server. Please check your internet connection.', 'danger');
            } else {
              console.error('Error message:', apiError.message);
              showAlert(`Error: ${apiError.message}`, 'danger');
            }
            throw apiError; // Re-throw to be caught by outer catch
          }
          
          // Refresh videos for the client
          const res = await axios.get(`/api/videos/client/${clientId}`);
          console.log('Refreshed videos list:', res.data);
          setVideos(res.data);
          
          setAddingVideo(false);
          showAlert('Video added successfully', 'success');
          closeAddVideoModal();
          
        } catch (uploadErr) {
          console.error('Error uploading to Supabase:', uploadErr);
          showAlert('Error uploading video. Please try again.', 'danger');
          setAddingVideo(false);
          setIsUploading(false);
          return;
        }
      } else {
        showAlert('Please select a video file', 'danger');
        setAddingVideo(false);
        return;
      }
    } catch (err) {
      console.error('Error adding video:', err.response?.data?.message || err.message);
      showAlert(err.response?.data?.message || 'Error adding video', 'danger');
      setAddingVideo(false);
      setIsUploading(false);
    }
  };
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>{client.name}'s Dashboard</h1>
        <Link to="/admin/clients" className="btn btn-outline-secondary">
          Back to Clients
        </Link>
      </div>
      
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fw-bold">Client Information</h5>
          <Link 
            to={`/admin/users/edit/${client.id}`}
            className="btn btn-sm btn-outline-light"
          >
            <i className="fas fa-edit me-1"></i> Edit Client
          </Link>
        </div>
        <div className="card-body">
          <div className="row">
            <div className="col-md-6">
              <p><strong>Name:</strong> {client.name}</p>
              <p><strong>Email:</strong> {client.email}</p>
              {client.website_url && client.website_url.trim() !== '' && (
                <p>
                  <strong>Website:</strong> 
                  <a 
                    href={client.website_url.startsWith('http') ? client.website_url : `https://${client.website_url}`} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="ms-2"
                  >
                    <i className="fas fa-external-link-alt me-1"></i>
                    {(client.website_url || '').replace(/^https?:\/\//, '').replace(/\/$/, '')}
                  </a>
                </p>
              )}
              {client.location && client.location.trim() !== '' && (
                <p><strong>Location:</strong> {client.location}</p>
              )}
            </div>
            <div className="col-md-6">
              <p><strong>Status:</strong> {client.active ? 
                <span className="badge bg-success">Active</span> : 
                <span className="badge bg-warning text-dark">Pending</span>}
              </p>
              <p><strong>Account Created:</strong> {new Date(client.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          
          {/* Keywords Section */}
          {client.keywords && Array.isArray(client.keywords) && client.keywords.length > 0 && (
            <div className="mt-3">
              <p className="mb-2"><strong>Keywords:</strong></p>
              <div>
                {client.keywords.map((keyword, index) => (
                  <span key={index} className="badge bg-secondary me-2 mb-2">
                    {keyword}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="row mb-4">
        <div className="col-md-12">
          <div className="card">
            <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
              <h5 className="mb-0">Social Media</h5>
              <div>
                <Link 
                  to={`/admin/social-media/accounts`}
                  className="btn btn-sm btn-outline-light me-2"
                >
                  <i className="fas fa-hashtag me-1"></i> Manage Accounts
                </Link>
                <Link 
                  to={`/admin/social-media/metrics?clientId=${client.id}`}
                  className="btn btn-sm btn-light"
                >
                  <i className="fas fa-chart-line me-1"></i> Manage Metrics
                </Link>
              </div>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-12">
                  <h5 className="mb-3">Performance Overview</h5>

                  {/* Load accounts and metrics from API with hook */}
                  <SocialMediaOverview clientId={client.id} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
          <h5 className="mb-0">Videos</h5>
          <div>
            <button 
              className="btn btn-sm btn-outline-light me-2"
              onClick={async () => {
                try {
                  showAlert('Syncing videos from Supabase Storage...', 'info');
                  await axios.post('/api/storage/sync');
                  showAlert('Sync process started. This may take a few minutes to complete.', 'success');
                  
                  // Reload videos list after a short delay to allow for some processing
                  setTimeout(async () => {
                    try {
                      const videosRes = await axios.get(`/api/videos/client/${clientId}`);
                      setVideos(videosRes.data);
                      showAlert('Videos list refreshed', 'success');
                    } catch (refreshErr) {
                      console.error('Error refreshing videos:', refreshErr);
                    }
                  }, 5000);
                } catch (err) {
                  console.error('Error triggering storage sync:', err);
                  showAlert('Error syncing with Supabase Storage', 'danger');
                }
              }}
            >
              <i className="fas fa-sync-alt me-1"></i> Sync Storage
            </button>
            <button 
              className="btn btn-sm btn-light"
              onClick={openAddVideoModal}
            >
              <i className="fas fa-plus me-1"></i> Add Video
            </button>
          </div>
        </div>
        <div className="card-body">
          {videosLoading ? (
            <Spinner />
          ) : videos.length === 0 ? (
            <p className="text-muted">No videos found for this client.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {videos.map(video => (
                    <tr key={video.id}>
                      <td>{video.title}</td>
                      <td>
                        {video.status === 'pending' ? (
                          <span className="badge bg-warning text-dark">Pending</span>
                        ) : video.status === 'approved' ? (
                          <span className="badge bg-success">Approved</span>
                        ) : (
                          <span className="badge bg-danger">Rejected</span>
                        )}
                      </td>
                      <td>{new Date(video.created_at).toLocaleDateString()}</td>
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
      
      {/* Add Video Modal */}
      {showAddVideoModal && (
        <>
          <div className="modal fade show" style={{ display: 'block' }} tabIndex="-1">
            <div className="modal-dialog modal-xl">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">Add Video for {client.name}</h5>
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
                                defaultValue={`${videoFormData.monthInfo?.month || new Date().getMonth()+1}-${videoFormData.monthInfo?.year || new Date().getFullYear()}`}
                                onChange={(e) => {
                                  const [month, year] = e.target.value.split('-').map(Number);
                                  console.log(`Selected month: ${month}, year: ${year}`);
                                  setVideoFormData(prevState => ({
                                    ...prevState,
                                    monthInfo: { month, year }
                                  }));
                                }}
                                required
                              >
                                {generateMonthOptions().map((month, index) => (
                                  <option key={index} value={`${month.month}-${month.year}`}>
                                    {month.label}
                                  </option>
                                ))}
                              </select>
                              <div className="form-text">
                                Select from 3 previous months and 12 upcoming months
                              </div>
                            </div>
                            
                            {selectedFile && (
                              <div className="alert alert-info">
                                <h6 className="mb-1">Selected Video:</h6>
                                <p className="mb-0">
                                  <strong>{selectedFile.name}</strong> ({formatFileSize(selectedFile.size)})
                                </p>
                                {selectedFile.type && (
                                  <p className="mb-0">
                                    <small>Type: {selectedFile.type}</small>
                                  </p>
                                )}
                              </div>
                            )}
                            
                            {isUploading && (
                              <div className="mt-3">
                                <label className="form-label mb-1">Upload Progress: {uploadProgress}%</label>
                                <div className="progress">
                                  <div 
                                    className="progress-bar progress-bar-striped progress-bar-animated" 
                                    role="progressbar" 
                                    style={{ width: `${uploadProgress}%` }}
                                    aria-valuenow={uploadProgress} 
                                    aria-valuemin="0" 
                                    aria-valuemax="100"
                                  ></div>
                                </div>
                              </div>
                            )}
                              
                            <button
                              type="submit"
                              className="btn btn-primary mt-3"
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
                          <h5 className="mb-0">Upload Video</h5>
                        </div>
                        <div className="card-body">
                          <div className="mb-4">
                            <div className="card border-primary">
                              <div className="card-header bg-primary text-white">
                                <h5 className="mb-0">Upload Video to Supabase Storage</h5>
                              </div>
                              <div className="card-body">
                                <div className="mb-3">
                                  <label htmlFor="fileUpload" className="form-label">Select Video File</label>
                                  <input 
                                    type="file" 
                                    className="form-control" 
                                    id="fileUpload"
                                    accept="video/mp4,video/quicktime,video/x-msvideo,video/x-ms-wmv"
                                    onChange={(e) => {
                                      const file = e.target.files[0];
                                      if (!file) return;
                                      
                                      // Validate file
                                      if (file.size > 100 * 1024 * 1024) {
                                        showAlert('File too large. Maximum size is 100MB.', 'danger');
                                        return;
                                      }
                                      
                                      // Extract filename for title if empty
                                      if (!videoFormData.title) {
                                        const filename = file.name.split('.').slice(0, -1).join('.');
                                        setVideoFormData(prevState => ({
                                          ...prevState,
                                          title: filename
                                        }));
                                      }
                                      
                                      setSelectedFile({
                                        name: file.name,
                                        size: file.size,
                                        type: file.type,
                                        file: file
                                      });
                                    }}
                                  />
                                  <small className="text-muted d-block mt-1">
                                    Supported formats: MP4, MOV, AVI, WMV (max 100MB)
                                  </small>
                                </div>
                                
                                {selectedFile && (
                                  <div className="alert alert-success">
                                    <h6 className="mb-1">Selected for Upload:</h6>
                                    <p className="mb-1">
                                      <strong>{selectedFile.name}</strong> ({formatFileSize(selectedFile.size)})
                                    </p>
                                    <p className="mb-0">
                                      <small>Type: {selectedFile.type}</small>
                                    </p>
                                    <div className="mt-2">
                                      <i className="fas fa-info-circle me-1"></i>
                                      <small>File will be uploaded to Supabase Storage when you click "Add Video"</small>
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                          
                          <div className="alert alert-info">
                            <h5><i className="fas fa-info-circle me-2"></i>About Video Storage</h5>
                            <p className="mb-0">
                              Videos are stored securely in Supabase Storage, providing improved reliability and integration with our platform.
                            </p>
                          </div>
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
          </div>
          <div className="modal-backdrop fade show"></div>
        </>
      )}
    </div>
  );
};

export default ClientPage;
