import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import Spinner from '../../components/layout/Spinner';
import KeywordInput from '../../components/KeywordInput';

const AddUser = ({ showAlert }) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'client',
    website_url: '',
    keywords: [],
    location: ''
  });
  
  const [loading, setLoading] = useState(false);
  
  const navigate = useNavigate();
  
  const { name, email, role, website_url, keywords, location } = formData;
  
  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  // Function to handle URL input with auto-prepend https://
  const handleUrlChange = (e) => {
    let url = e.target.value.trim();
    setFormData({ ...formData, website_url: url });
  };
  
  // Function to handle URL blur - add https:// if missing
  const handleUrlBlur = () => {
    let url = formData.website_url;
    if (url && !url.startsWith('http://') && !url.startsWith('https://')) {
      setFormData({ ...formData, website_url: `https://${url}` });
    }
  };
  
  // Function to handle keywords update
  const handleKeywordsChange = (newKeywords) => {
    setFormData({ ...formData, keywords: newKeywords });
  };
  
  const onSubmit = async e => {
    e.preventDefault();
    
    if (!name || !email) {
      showAlert('Please enter all required fields', 'danger');
      return;
    }
    
    try {
      setLoading(true);
      
      await axios.post('/api/auth/invite', formData);
      
      setLoading(false);
      showAlert('User invited successfully. An email has been sent with setup instructions.', 'success');
      
      navigate('/admin/users');
    } catch (err) {
      console.error('Error inviting user:', err.response?.data?.message || err.message);
      showAlert(err.response?.data?.message || 'Error inviting user', 'danger');
      setLoading(false);
    }
  };
  
  if (loading) {
    return <Spinner />;
  }
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Add User</h1>
        <Link to="/admin/users" className="btn btn-outline-secondary">
          Back to Users
        </Link>
      </div>
      
      <div className="card">
        <div className="card-body">
          <form onSubmit={onSubmit}>
            <div className="mb-3">
              <label htmlFor="name" className="form-label">Name</label>
              <input
                type="text"
                className="form-control"
                id="name"
                name="name"
                value={name}
                onChange={onChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="email" className="form-label">Email</label>
              <input
                type="email"
                className="form-control"
                id="email"
                name="email"
                value={email}
                onChange={onChange}
                required
              />
            </div>
            <div className="mb-3">
              <label htmlFor="role" className="form-label">Role</label>
              <select
                className="form-select"
                id="role"
                name="role"
                value={role}
                onChange={onChange}
              >
                <option value="client">Client</option>
                <option value="editor">Editor</option>
              </select>
            </div>
            
            {/* Show additional fields only for clients */}
            {role === 'client' && (
              <div className="client-specific-fields">
                <h5 className="mt-4 mb-3">Client Information</h5>
                
                <div className="mb-3">
                  <label htmlFor="website_url" className="form-label">Website URL</label>
                  <input
                    type="url"
                    className="form-control"
                    id="website_url"
                    name="website_url"
                    placeholder="https://example.com"
                    value={website_url}
                    onChange={handleUrlChange}
                    onBlur={handleUrlBlur}
                  />
                  <small className="form-text text-muted">
                    Client's website address (optional)
                  </small>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="location" className="form-label">Location</label>
                  <input
                    type="text"
                    className="form-control"
                    id="location"
                    name="location"
                    placeholder="City, Country"
                    value={location}
                    onChange={onChange}
                  />
                  <small className="form-text text-muted">
                    Client's physical location (optional)
                  </small>
                </div>
                
                <div className="mb-3">
                  <label htmlFor="keywords" className="form-label">Keywords</label>
                  <KeywordInput
                    initialKeywords={keywords}
                    onChange={handleKeywordsChange}
                  />
                </div>
              </div>
            )}
            
            <div className="alert alert-info mt-4">
              <p className="mb-0">
                <strong>Note:</strong> An invitation email will be sent to the user with instructions to set up their password.
              </p>
            </div>
            <button type="submit" className="btn btn-primary">
              Invite User
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUser;
