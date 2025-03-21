import React, { useState } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';
import Spinner from '../../components/layout/Spinner';

const AddClient = ({ showAlert }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'client' // Default role is client
  });

  const { name, email } = formData;

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async e => {
    e.preventDefault();
    
    if (!name || !email) {
      showAlert('Please enter all required fields', 'danger');
      return;
    }
    
    try {
      setLoading(true);
      
      // Use the existing invite endpoint
      await axios.post('/api/auth/invite', formData);
      
      // Clear form
      setFormData({
        name: '',
        email: '',
        role: 'client'
      });
      
      setLoading(false);
      showAlert('Client invited successfully. An email has been sent with setup instructions.', 'success');
    } catch (err) {
      console.error('Error inviting client:', err.response?.data?.message || err.message);
      showAlert(err.response?.data?.message || 'Error inviting client', 'danger');
      setLoading(false);
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h1>Add New Client</h1>
        <Link to="/admin/clients" className="btn btn-outline-secondary">
          <i className="fas fa-arrow-left me-2"></i>Back to Client Dashboard
        </Link>
      </div>
      
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0 fw-bold">Client Information</h5>
        </div>
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
            <div className="alert alert-info">
              <p className="mb-0">
                <i className="fas fa-info-circle me-2"></i>
                An invitation email will be sent to the client with instructions to set up their password.
              </p>
            </div>
            <button type="submit" className="btn btn-primary">
              <i className="fas fa-user-plus me-2"></i>
              Invite Client
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddClient;
