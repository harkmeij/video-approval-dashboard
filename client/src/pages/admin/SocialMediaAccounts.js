import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import Spinner from '../../components/layout/Spinner';

const SocialMediaAccounts = ({ showAlert }) => {
  const [accounts, setAccounts] = useState([]);
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    client_id: '',
    platform: '',
    username: '',
    display_name: '',
    profile_url: '',
    profile_image_url: ''
  });
  const [editing, setEditing] = useState(false);
  const [currentAccountId, setCurrentAccountId] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const { client_id, platform, username, display_name, profile_url, profile_image_url } = formData;

  // Platform options
  const platformOptions = [
    { value: 'instagram', label: 'Instagram' },
    { value: 'linkedin', label: 'LinkedIn' },
    { value: 'tiktok', label: 'TikTok' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'facebook', label: 'Facebook' },
    { value: 'twitter', label: 'Twitter' }
  ];

  // Load accounts and clients on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const clientsRes = await axios.get('/api/users/clients');
        setClients(clientsRes.data);
        
        try {
          const accountsRes = await axios.get('/api/social-media/accounts');
          setAccounts(accountsRes.data);
        } catch (err) {
          console.error('Error fetching social media accounts:', err);
          showAlert('Error fetching social media accounts. Please add accounts manually.', 'warning');
          setAccounts([]);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        showAlert('Error fetching clients. Social media accounts cannot be managed without clients.', 'danger');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [showAlert]);

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const onSubmit = async e => {
    e.preventDefault();
    
    if (!client_id || !platform || !username) {
      showAlert('Please fill in all required fields', 'danger');
      return;
    }
    
    try {
      setFormLoading(true);
      
      const accountData = {
        client_id,
        platform,
        username,
        display_name: display_name || username,
        profile_url: profile_url || null,
        profile_image_url: profile_image_url || null
      };
      
      try {
        if (editing) {
          // Update existing account
          const res = await axios.put(`/api/social-media/accounts/${currentAccountId}`, accountData);
          
          // Update the accounts state
          setAccounts(accounts.map(account => 
            account.id === currentAccountId ? res.data : account
          ));
          
          showAlert('Social media account updated successfully', 'success');
        } else {
          // Create new account
          const res = await axios.post('/api/social-media/accounts', accountData);
          
          // Add new account to state
          setAccounts([...accounts, res.data]);
          
          showAlert('Social media account added successfully', 'success');
        }
      } catch (apiErr) {
        console.error('Error with social media account API:', apiErr);
        showAlert('Error saving social media account. Please try again later.', 'danger');
        setFormLoading(false);
        return; // Exit early without resetting the form
      }
      
      // Reset form
      setFormData({
        client_id: '',
        platform: '',
        username: '',
        display_name: '',
        profile_url: '',
        profile_image_url: ''
      });
      setEditing(false);
      setCurrentAccountId(null);
      setFormLoading(false);
    } catch (err) {
      console.error('Error saving social media account:', err);
      showAlert(err.response?.data?.message || 'Error saving social media account', 'danger');
      setFormLoading(false);
    }
  };
  
  const handleEdit = account => {
    setEditing(true);
    setCurrentAccountId(account.id);
    
    setFormData({
      client_id: account.client_id,
      platform: account.platform,
      username: account.username,
      display_name: account.display_name || '',
      profile_url: account.profile_url || '',
      profile_image_url: account.profile_image_url || ''
    });
    
    // Scroll to form
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const cancelEdit = () => {
    setEditing(false);
    setCurrentAccountId(null);
    
    setFormData({
      client_id: '',
      platform: '',
      username: '',
      display_name: '',
      profile_url: '',
      profile_image_url: ''
    });
  };
  
  const handleDelete = async accountId => {
    if (window.confirm('Are you sure you want to delete this social media account? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/social-media/accounts/${accountId}`);
        
        // Remove account from state
        setAccounts(accounts.filter(account => account.id !== accountId));
        
        showAlert('Social media account deleted successfully', 'success');
        
        // If we were editing this account, cancel edit mode
        if (currentAccountId === accountId) {
          cancelEdit();
        }
      } catch (err) {
        console.error('Error deleting social media account:', err);
        showAlert('Error deleting social media account', 'danger');
      }
    }
  };
  
  // Helper to get client name by ID
  const getClientName = clientId => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : 'Unknown Client';
  };
  
  // Helper to get platform label
  const getPlatformLabel = platformValue => {
    const platform = platformOptions.find(p => p.value === platformValue);
    return platform ? platform.label : platformValue;
  };
  
  // Helper to get platform icon class
  const getPlatformIcon = platform => {
    switch (platform) {
      case 'instagram':
        return 'fab fa-instagram';
      case 'linkedin':
        return 'fab fa-linkedin';
      case 'tiktok':
        return 'fab fa-tiktok';
      case 'youtube':
        return 'fab fa-youtube';
      case 'facebook':
        return 'fab fa-facebook';
      case 'twitter':
        return 'fab fa-twitter';
      default:
        return 'fas fa-globe';
    }
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div>
      <h1 className="mb-4">Social Media Accounts</h1>
      
      <div className="card mb-4 shadow-sm">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">{editing ? 'Edit' : 'Add'} Social Media Account</h5>
        </div>
        <div className="card-body">
          <form onSubmit={onSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="client_id" className="form-label">Client</label>
                <select
                  className="form-select"
                  id="client_id"
                  name="client_id"
                  value={client_id}
                  onChange={onChange}
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="col-md-6 mb-3">
                <label htmlFor="platform" className="form-label">Platform</label>
                <select
                  className="form-select"
                  id="platform"
                  name="platform"
                  value={platform}
                  onChange={onChange}
                  required
                >
                  <option value="">Select a platform</option>
                  {platformOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="username" className="form-label">Username</label>
                <input
                  type="text"
                  className="form-control"
                  id="username"
                  name="username"
                  value={username}
                  onChange={onChange}
                  placeholder="e.g. @brandname"
                  required
                />
              </div>
              
              <div className="col-md-6 mb-3">
                <label htmlFor="display_name" className="form-label">Display Name (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  id="display_name"
                  name="display_name"
                  value={display_name}
                  onChange={onChange}
                  placeholder="e.g. Brand Name Official"
                />
              </div>
            </div>
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="profile_url" className="form-label">Profile URL (Optional)</label>
                <input
                  type="url"
                  className="form-control"
                  id="profile_url"
                  name="profile_url"
                  value={profile_url}
                  onChange={onChange}
                  placeholder="e.g. https://instagram.com/brandname"
                />
              </div>
              
              <div className="col-md-6 mb-3">
                <label htmlFor="profile_image_url" className="form-label">Profile Image URL (Optional)</label>
                <input
                  type="url"
                  className="form-control"
                  id="profile_image_url"
                  name="profile_image_url"
                  value={profile_image_url}
                  onChange={onChange}
                  placeholder="URL to profile picture"
                />
              </div>
            </div>
            
            <div className="d-flex">
              <button 
                type="submit" 
                className="btn btn-primary me-2"
                disabled={formLoading}
              >
                {formLoading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {editing ? 'Updating...' : 'Saving...'}
                  </>
                ) : (
                  <>{editing ? 'Update Account' : 'Add Account'}</>
                )}
              </button>
              
              {editing && (
                <button 
                  type="button" 
                  className="btn btn-outline-secondary"
                  onClick={cancelEdit}
                  disabled={formLoading}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
      
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white">
          <h5 className="card-title mb-0">Social Media Accounts List</h5>
        </div>
        <div className="card-body">
          {accounts.length === 0 ? (
            <p className="text-center text-muted">No social media accounts found. Add your first account above.</p>
          ) : (
            <div className="table-responsive">
              <table className="table table-hover">
                <thead>
                  <tr>
                    <th>Client</th>
                    <th>Platform</th>
                    <th>Username</th>
                    <th>Profile URL</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {accounts.map(account => (
                    <tr key={account.id}>
                      <td>
                        <Link to={`/admin/clients/${account.client_id}`}>
                          {account.users ? account.users.name : getClientName(account.client_id)}
                        </Link>
                      </td>
                      <td>
                        <span className="me-2">
                          <i className={getPlatformIcon(account.platform)}></i>
                        </span>
                        {getPlatformLabel(account.platform)}
                      </td>
                      <td>{account.username}</td>
                      <td>
                        {account.profile_url ? (
                          <a 
                            href={account.profile_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="d-inline-block text-truncate"
                            style={{ maxWidth: '200px' }}
                          >
                            {account.profile_url}
                          </a>
                        ) : (
                          <span className="text-muted">N/A</span>
                        )}
                      </td>
                      <td>
                        <div className="btn-group" role="group">
                          <Link 
                            to={`/admin/social-media/metrics?accountId=${account.id}`}
                            className="btn btn-sm btn-outline-primary"
                          >
                            <i className="fas fa-chart-line me-1"></i> Metrics
                          </Link>
                          <button
                            className="btn btn-sm btn-outline-secondary"
                            onClick={() => handleEdit(account)}
                          >
                            <i className="fas fa-edit me-1"></i> Edit
                          </button>
                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => handleDelete(account.id)}
                          >
                            <i className="fas fa-trash-alt me-1"></i> Delete
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
      </div>
    </div>
  );
};

export default SocialMediaAccounts;
