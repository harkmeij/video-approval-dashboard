import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Spinner from '../../components/layout/Spinner';

const AddVideo = ({ showAlert }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    storage_path: '',
    monthId: '',
    monthInfo: {
      month: new Date().getMonth() + 1, // 1-12 for current month
      year: new Date().getFullYear(),    // Current year
    },
    clientId: ''
  });
  
  const [useDefaultDescription, setUseDefaultDescription] = useState(true);
  
  const [clients, setClients] = useState([]);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);
  
  const [loading, setLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(true);
  
  const navigate = useNavigate();
  
  const { title, description, monthInfo, clientId } = formData;
  
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
  const generateAvailableMonths = () => {
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
  
  // Validate file type and size
  const validateFile = (file) => {
    // Check file type
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-ms-wmv'];
    if (!validTypes.includes(file.type)) {
      return { valid: false, message: 'Invalid file type. Please select a video file (MP4, MOV, AVI, WMV).' };
    }
    
    // Check file size (max 100MB)
    const maxSize = 100 * 1024 * 1024; // 100MB in bytes
    if (file.size > maxSize) {
      return { valid: false, message: 'File too large. Maximum size is 100MB.' };
    }
    
    return { valid: true };
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch clients
        const clientsRes = await axios.get('/api/users/clients');
        setClients(clientsRes.data);
        setClientsLoading(false);
        
        // Set default client if available
        if (clientsRes.data.length > 0) {
          setFormData(prevState => ({
            ...prevState,
            clientId: clientsRes.data[0]._id
          }));
        }
        
        // Generate available months
        const months = generateAvailableMonths();
        setAvailableMonths(months);
        
        // Set default month to current month
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // 1-12
        const currentYear = currentDate.getFullYear();
        
        setFormData(prevState => ({
          ...prevState,
          monthInfo: {
            month: currentMonth,
            year: currentYear
          }
        }));
      } catch (err) {
        console.error('Error fetching initial data:', err.response?.data?.message || err.message);
        showAlert('Error fetching data', 'danger');
        setClientsLoading(false);
      }
    };
    
    fetchData();
  }, [showAlert]);
  
  // Handle file selection
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const validation = validateFile(file);
    if (!validation.valid) {
      showAlert(validation.message, 'danger');
      return;
    }
    
    setSelectedFile(file);
    
    // Set title from filename if title is empty
    if (!formData.title) {
      const filename = file.name.split('.').slice(0, -1).join('.');
      setFormData(prevState => ({
        ...prevState,
        title: filename
      }));
    }
  };
  
  // Upload file to Supabase Storage
  const uploadFile = async () => {
    if (!selectedFile || !clientId || !monthInfo.month || !monthInfo.year) {
      showAlert('Please select a client, month, and file before uploading', 'danger');
      return null;
    }
    
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      // Step 1: Get a signed upload URL
      const { data: urlData } = await axios.get('/api/storage/upload-url', {
        params: {
          client_id: clientId,
          month_id: `${monthInfo.month}-${monthInfo.year}`,
          filename: selectedFile.name
        }
      });
      
      // Step 2: Upload directly to Supabase
      const formData = new FormData();
      formData.append('file', selectedFile);
      
      await axios.post(urlData.uploadUrl, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      
      setIsUploading(false);
      showAlert('Video uploaded successfully', 'success');
      
      return urlData.path;
    } catch (err) {
      setIsUploading(false);
      console.error('Error uploading file:', err);
      showAlert('Error uploading file. Please try again.', 'danger');
      return null;
    }
  };
  
  // Handle form input change
  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  // Handle selecting a month from the dropdown
  const handleMonthChange = (e) => {
    const selectedValue = e.target.value;
    const [month, year] = selectedValue.split('-').map(Number);
    
    setFormData({
      ...formData,
      monthInfo: {
        month,
        year
      }
    });
  };
  
  // Handle form submission
  const onSubmit = async e => {
    e.preventDefault();
    
    if (!title || !clientId || !selectedFile) {
      showAlert('Please fill in all required fields and select a video', 'danger');
      return;
    }
    
    try {
      setLoading(true);
      
      // Upload the file first
      const storagePath = await uploadFile();
      if (!storagePath) {
        setLoading(false);
        return; // Error occurred during upload
      }
      
  // Find the selected client to use for description
  const selectedClient = clients.find(client => client._id === clientId);
  const clientName = selectedClient ? selectedClient.name : 'our team';
  
  // Prepare data for submission with default description if needed
  const videoData = { ...formData, storage_path: storagePath };
  
  // Generate hashtags from client keywords if available
  let hashtags = '#VideoProduction #ContentCreation';
  if (selectedClient && selectedClient.keywords && selectedClient.keywords.length > 0) {
    // Select up to 5 keywords to use as hashtags
    const keywordHashtags = selectedClient.keywords
      .slice(0, 5)
      .map(keyword => `#${keyword.replace(/\s+/g, '')}`)
      .join(' ');
    
    if (keywordHashtags) {
      hashtags = `${keywordHashtags} ${hashtags}`;
    }
  }
  
  // If description is empty and useDefaultDescription is checked, use default template
  if (!videoData.description.trim() && useDefaultDescription) {
    videoData.description = `Check out this amazing video by ${clientName}! 🎬✨\n\n${hashtags}`;
  }
      
      // Add file properties to the video data
      videoData.file_size = selectedFile.size;
      videoData.content_type = selectedFile.type;
      
      const apiData = {
        ...videoData,
        // Ensure monthInfo is properly formatted
        monthInfo: videoData.monthInfo
      };
      
      await axios.post('/api/videos', apiData);
      
      setLoading(false);
      showAlert('Video added successfully', 'success');
      
      navigate('/admin/videos');
    } catch (err) {
      console.error('Error adding video:', err.response?.data?.message || err.message);
      showAlert(err.response?.data?.message || 'Error adding video', 'danger');
      setLoading(false);
    }
  };
  
  if (clientsLoading) {
    return <Spinner />;
  }
  
  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else if (bytes < 1073741824) return (bytes / 1048576).toFixed(1) + ' MB';
    else return (bytes / 1073741824).toFixed(1) + ' GB';
  };
  
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Add Video</h1>
        <Link to="/admin/videos" className="btn btn-outline-secondary">
          Back to Videos
        </Link>
      </div>
      
      {clients.length === 0 ? (
        <div className="alert alert-warning">
          <p className="mb-0">
            No clients found. Please <Link to="/admin/users/add">add a client</Link> first.
          </p>
        </div>
      ) : (
        <div className="row">
          <div className="col-md-6">
            <div className="card mb-4">
              <div className="card-header">
                <h5 className="mb-0">Video Details</h5>
              </div>
              <div className="card-body">
                <form onSubmit={onSubmit}>
                  <div className="mb-3">
                    <label htmlFor="clientId" className="form-label">Client</label>
                    <select
                      className="form-select"
                      id="clientId"
                      name="clientId"
                      value={clientId}
                      onChange={onChange}
                                
                    >
                      <option value="">Select Client</option>
                      {clients.map(client => (
                        <option key={client._id} value={client._id}>
                          {client.name} ({client.email})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="monthSelector" className="form-label">Month</label>
                    <select
                      className="form-select"
                      id="monthSelector"
                      value={`${monthInfo.month}-${monthInfo.year}`}
                      onChange={handleMonthChange}
                          
                    >
                      {availableMonths.map((month, index) => (
                        <option key={index} value={`${month.month}-${month.year}`}>
                          {month.label}
                        </option>
                      ))}
                    </select>
                    <small className="text-muted">
                      Select from 3 previous months and 12 upcoming months
                    </small>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="title" className="form-label">Title</label>
                    <input
                      type="text"
                      className="form-control"
                      id="title"
                      name="title"
                      value={title}
                      onChange={onChange}
                      required
                    />
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="description" className="form-label">Instagram Description</label>
                    <div className="form-check mb-2">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        id="useDefaultDescription"
                        checked={useDefaultDescription}
                        onChange={() => setUseDefaultDescription(!useDefaultDescription)}
                      />
                      <label className="form-check-label" htmlFor="useDefaultDescription">
                        Use default template if no description is provided
                      </label>
                    </div>
                    <textarea
                      className="form-control"
                      id="description"
                      name="description"
                      value={description}
                      onChange={onChange}
                      rows="3"
                      placeholder={useDefaultDescription ? 
                        `Leave empty to use default: "Check out this amazing video by [client name]! 🎬✨ #VideoProduction #ContentCreation"` : 
                        "Enter a description for Instagram..."}
                    ></textarea>
                    <small className="text-muted">
                      This description will be displayed with the video and can be copied for Instagram posts.
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
                    disabled={loading || !selectedFile}
                  >
                    {loading ? 'Adding...' : 'Add Video'}
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
                <div className="alert alert-info mb-3">
                  <h6>Using Supabase Storage</h6>
                  <p className="mb-0">Videos are now uploaded directly to our secure cloud storage, allowing for reliable playback and streaming.</p>
                </div>
                
                <div className="mb-4">
                  <label htmlFor="fileUpload" className="form-label">Select Video File</label>
                  <input 
                    type="file" 
                    className="form-control" 
                    id="fileUpload"
                    accept="video/mp4,video/quicktime,video/x-msvideo,video/x-ms-wmv"
                    onChange={handleFileChange}
                    ref={fileInputRef}
                    disabled={isUploading}
                  />
                  <small className="text-muted d-block mt-1">
                    Supported formats: MP4, MOV, AVI, WMV (max 100MB)
                  </small>
                </div>
                
                {selectedFile && (
                  <div className="card border-primary mb-3">
                    <div className="card-body">
                      <h6 className="card-title">Selected Video</h6>
                      <p className="card-text mb-0">
                        <strong>{selectedFile.name}</strong>
                      </p>
                      <p className="card-text mb-0">
                        Size: {formatFileSize(selectedFile.size)}
                      </p>
                      <p className="card-text mb-2">
                        Type: {selectedFile.type}
                      </p>
                      
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
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddVideo;
