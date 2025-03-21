import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import Spinner from '../../components/layout/Spinner';
import KeywordInput from '../../components/KeywordInput';

const EditUser = ({ showAlert }) => {
  const { userId } = useParams();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    website_url: '',
    location: '',
    keywords: []
  });
  
  // Load user data on component mount
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await axios.get(`/api/users/${userId}`);
        
        setFormData({
          name: res.data.name || '',
          email: res.data.email || '',
          website_url: res.data.website_url || '',
          location: res.data.location || '',
          keywords: Array.isArray(res.data.keywords) ? res.data.keywords : []
        });
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching user:', err);
        showAlert('Error loading user data', 'danger');
        navigate('/admin/users');
      }
    };
    
    fetchUser();
  }, [userId, navigate, showAlert]);
  
  const handleChange = e => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };
  
  const handleSubmit = async e => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      
      const { data } = await axios.put(`/api/users/${userId}`, formData);
      
      showAlert('User updated successfully', 'success');
      setSubmitting(false);
      
      // Redirect to client page
      navigate(`/admin/clients/${userId}`);
    } catch (err) {
      console.error('Error updating user:', err);
      showAlert(err.response?.data?.message || 'Error updating user', 'danger');
      setSubmitting(false);
    }
  };
  
  const handleKeywordsChange = keywords => {
    setFormData(prevData => ({
      ...prevData,
      keywords
    }));
  };
  
  if (loading) {
    return <Spinner />;
  }
  
  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Edit User</h1>
        <Link to={`/admin/clients/${userId}`} className="btn btn-outline-secondary">
          Cancel
        </Link>
      </div>
      
      <div className="card">
        <div className="card-header bg-primary text-white">
          <h5 className="mb-0">Edit User Information</h5>
        </div>
        <div className="card-body">
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label htmlFor="name" className="form-label">Name</label>
              <input
                type="text"
                className="form-control"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
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
                value={formData.email}
                onChange={handleChange}
                required
                disabled
              />
              <div className="form-text">Email cannot be changed</div>
            </div>
            
            <div className="mb-3">
              <label htmlFor="website_url" className="form-label">Website URL</label>
              <input
                type="text"
                className="form-control"
                id="website_url"
                name="website_url"
                value={formData.website_url}
                onChange={handleChange}
                placeholder="https://example.com"
              />
            </div>
            
            <div className="mb-3">
              <label htmlFor="location" className="form-label">Location</label>
              <input
                type="text"
                className="form-control"
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="City, Country"
              />
            </div>
            
            <div className="mb-3">
              <label className="form-label">Keywords</label>
              <KeywordInput
                keywords={formData.keywords}
                onChange={handleKeywordsChange}
              />
              <div className="form-text">Add keywords related to the client's business for better content organization</div>
            </div>
            
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? 'Updating...' : 'Update User'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default EditUser;
