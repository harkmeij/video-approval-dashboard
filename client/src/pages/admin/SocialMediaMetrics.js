import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import axios from 'axios';
import Spinner from '../../components/layout/Spinner';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';

// Register ChartJS components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const SocialMediaMetrics = ({ showAlert }) => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const accountIdParam = params.get('accountId');

  const [accounts, setAccounts] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [selectedClient, setSelectedClient] = useState('');
  const [metrics, setMetrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [chartData, setChartData] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [formData, setFormData] = useState({
    account_id: '',
    record_date: new Date().toISOString().substring(0, 10),
    followers: '',
    following: '',
    posts_count: '',
    reach: '',
    impressions: '',
    profile_views: '',
    engagement_rate: '',
    notes: ''
  });

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Load clients
        const clientsRes = await axios.get('/api/users/clients');
        setClients(clientsRes.data);
        
        // If account ID is provided in URL, load that account's metrics
        if (accountIdParam) {
          try {
            // Try to get account from API
            const accountRes = await axios.get(`/api/social-media/accounts/${accountIdParam}`);
            setSelectedAccount(accountRes.data);
            setSelectedClient(accountRes.data.client_id);
            
            try {
              // Try to get metrics from API
              const metricsRes = await axios.get(`/api/social-media/metrics/account/${accountIdParam}`);
              setMetrics(metricsRes.data);
              
              // Prepare chart data
              prepareChartData(metricsRes.data);
            } catch (metricsErr) {
              console.error('Error fetching metrics:', metricsErr);
              showAlert('Error fetching metrics. Please add metrics for this account.', 'warning');
              setMetrics([]);
            }
            
            // Set the form account_id
            setFormData(prev => ({
              ...prev,
              account_id: accountIdParam
            }));
          } catch (accountErr) {
            console.error('Error fetching account:', accountErr);
            showAlert('Error fetching account details.', 'danger');
          }
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        showAlert('Error fetching clients data.', 'danger');
        setLoading(false);
      }
    };
    
    fetchData();
  }, [accountIdParam, showAlert]);
  
  // Load accounts when client changes
  useEffect(() => {
    const fetchAccounts = async () => {
      if (selectedClient) {
        try {
          const accountsRes = await axios.get(`/api/social-media/accounts/client/${selectedClient}`);
          setAccounts(accountsRes.data);
          
          // If no account is selected but we have accounts, select the first one
          if (!selectedAccount && accountsRes.data.length > 0 && !accountIdParam) {
            setSelectedAccount(accountsRes.data[0]);
            setFormData(prev => ({
              ...prev,
              account_id: accountsRes.data[0].id
            }));
            
            try {
              // Load metrics for this account
              const metricsRes = await axios.get(`/api/social-media/metrics/account/${accountsRes.data[0].id}`);
              setMetrics(metricsRes.data);
              
              // Prepare chart data
              prepareChartData(metricsRes.data);
            } catch (err) {
              console.error('Error fetching account metrics:', err);
              showAlert('Error fetching metrics. Please add metrics for this account.', 'warning');
              setMetrics([]);
            }
          }
        } catch (err) {
          console.error('Error fetching accounts:', err);
          showAlert('Error fetching client accounts', 'danger');
          setAccounts([]);
        }
      } else {
        setAccounts([]);
        setSelectedAccount(null);
      }
    };
    
    fetchAccounts();
  }, [selectedClient, selectedAccount, accountIdParam, showAlert]);
  
  // Prepare chart data from metrics
  const prepareChartData = (metricsData) => {
    if (!metricsData || metricsData.length === 0) {
      setChartData(null);
      return;
    }
    
    // Sort metrics by date
    const sortedMetrics = [...metricsData].sort((a, b) => 
      new Date(a.record_date) - new Date(b.record_date)
    );
    
    // Format dates for x-axis
    const labels = sortedMetrics.map(metric => 
      new Date(metric.record_date).toLocaleDateString()
    );
    
    // Create datasets
    const followersData = {
      label: 'Followers',
      data: sortedMetrics.map(metric => metric.followers),
      borderColor: 'rgb(75, 192, 192)',
      backgroundColor: 'rgba(75, 192, 192, 0.5)',
      tension: 0.1
    };
    
    const reachData = {
      label: 'Reach',
      data: sortedMetrics.map(metric => metric.reach),
      borderColor: 'rgb(255, 99, 132)',
      backgroundColor: 'rgba(255, 99, 132, 0.5)',
      tension: 0.1
    };
    
    const impressionsData = {
      label: 'Impressions',
      data: sortedMetrics.map(metric => metric.impressions),
      borderColor: 'rgb(54, 162, 235)',
      backgroundColor: 'rgba(54, 162, 235, 0.5)',
      tension: 0.1
    };
    
    const engagementData = {
      label: 'Engagement Rate (%)',
      data: sortedMetrics.map(metric => metric.engagement_rate),
      borderColor: 'rgb(153, 102, 255)',
      backgroundColor: 'rgba(153, 102, 255, 0.5)',
      yAxisID: 'y1',
      tension: 0.1
    };
    
    // Create chart data object
    const chartData = {
      labels,
      datasets: [followersData]
    };
    
    // Add optional metrics if they exist
    if (sortedMetrics.some(metric => metric.reach !== null && metric.reach !== undefined)) {
      chartData.datasets.push(reachData);
    }
    
    if (sortedMetrics.some(metric => metric.impressions !== null && metric.impressions !== undefined)) {
      chartData.datasets.push(impressionsData);
    }
    
    if (sortedMetrics.some(metric => metric.engagement_rate !== null && metric.engagement_rate !== undefined)) {
      chartData.datasets.push(engagementData);
    }
    
    setChartData(chartData);
  };
  
  // Handle form changes
  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };
  
  // Handle numeric input changes
  const onNumericChange = e => {
    const { name, value } = e.target;
    
    // Allow empty strings or valid numbers
    if (value === '' || !isNaN(value)) {
      setFormData({ ...formData, [name]: value });
    }
  };
  
  // Handle client selection
  const handleClientChange = e => {
    const clientId = e.target.value;
    setSelectedClient(clientId);
    setSelectedAccount(null);
    setMetrics([]);
    setChartData(null);
    setFormData({
      ...formData,
      account_id: ''
    });
  };
  
  // Handle account selection
  const handleAccountChange = async e => {
    const accountId = e.target.value;
    
    if (accountId) {
      try {
        setLoading(true);
        
        // Find the selected account
        const account = accounts.find(acc => acc.id === accountId);
        setSelectedAccount(account);
        
        // Set the form account_id
        setFormData(prev => ({
          ...prev,
          account_id: accountId
        }));
        
        try {
          // Load metrics for this account
          const metricsRes = await axios.get(`/api/social-media/metrics/account/${accountId}`);
          setMetrics(metricsRes.data);
          
          // Prepare chart data
          prepareChartData(metricsRes.data);
        } catch (err) {
          console.error('Error fetching account metrics:', err);
          showAlert('Error fetching metrics. Please add metrics for this account.', 'warning');
          setMetrics([]);
          setChartData(null);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error in account selection process:', err);
        showAlert('Error selecting account', 'danger');
        setLoading(false);
      }
    } else {
      setSelectedAccount(null);
      setMetrics([]);
      setChartData(null);
    }
  };
  
  // Handle form submission
  const onSubmit = async e => {
    e.preventDefault();
    
    const { 
      account_id, record_date, followers, following,
      posts_count, reach, impressions, profile_views,
      engagement_rate, notes
    } = formData;
    
    if (!account_id || !record_date || !followers) {
      showAlert('Please fill in all required fields', 'danger');
      return;
    }
    
    try {
      setFormLoading(true);
      
      // Convert string values to numbers where appropriate
      const metricsData = {
        account_id,
        record_date,
        followers: parseInt(followers),
        following: following === '' ? null : parseInt(following),
        posts_count: posts_count === '' ? null : parseInt(posts_count),
        reach: reach === '' ? null : parseInt(reach),
        impressions: impressions === '' ? null : parseInt(impressions),
        profile_views: profile_views === '' ? null : parseInt(profile_views),
        engagement_rate: engagement_rate === '' ? null : parseFloat(engagement_rate),
        notes: notes || null
      };
      
      // Check if there's already a metric for this date and account
      const existingMetric = metrics.find(m => 
        new Date(m.record_date).toISOString().split('T')[0] === record_date && 
        m.account_id === account_id
      );
      
      try {
        let result;
        if (existingMetric) {
          // Update existing metric
          result = await axios.put(`/api/social-media/metrics/${existingMetric.id}`, metricsData);
          showAlert('Metrics updated successfully', 'success');
          
          // Update metrics in state
          setMetrics(metrics.map(m => 
            m.id === existingMetric.id ? result.data : m
          ));
        } else {
          // Create new metric
          result = await axios.post('/api/social-media/metrics', metricsData);
          showAlert('Metrics added successfully', 'success');
          
          // Add new metric to state
          setMetrics([...metrics, result.data]);
        }
        
        // Refresh chart data
        try {
          const metricsRes = await axios.get(`/api/social-media/metrics/account/${account_id}`);
          prepareChartData(metricsRes.data);
        } catch (err) {
          console.error('Error refreshing metrics data:', err);
          
          // Update chart with current metrics state
          const updatedMetrics = existingMetric 
            ? metrics.map(m => m.id === existingMetric.id ? result.data : m) 
            : [...metrics, result.data];
          prepareChartData(updatedMetrics);
        }
      } catch (apiErr) {
        console.error('Error saving metrics:', apiErr);
        showAlert('Error saving metrics data. Please try again later.', 'danger');
        setFormLoading(false);
        return; // Exit without resetting form
      }
      
      // Reset form but keep account_id
      setFormData({
        account_id,
        record_date: new Date().toISOString().substring(0, 10),
        followers: '',
        following: '',
        posts_count: '',
        reach: '',
        impressions: '',
        profile_views: '',
        engagement_rate: '',
        notes: ''
      });
      
      setFormLoading(false);
    } catch (err) {
      console.error('Error in form submission process:', err);
      showAlert('Error processing form submission', 'danger');
      setFormLoading(false);
    }
  };
  
  // Calculate growth rates
  const calculateGrowth = (metricName) => {
    if (metrics.length < 2) return { value: 0, percentage: 0 };
    
    // Sort metrics by date
    const sortedMetrics = [...metrics].sort((a, b) => 
      new Date(b.record_date) - new Date(a.record_date)
    );
    
    // Get the latest two metrics
    const latest = sortedMetrics[0];
    const previous = sortedMetrics[1];
    
    if (!latest[metricName] || !previous[metricName]) return { value: 0, percentage: 0 };
    
    const growth = latest[metricName] - previous[metricName];
    const percentage = (growth / previous[metricName]) * 100;
    
    return { 
      value: growth,
      percentage: percentage.toFixed(2)
    };
  };
  
  // Helper to format dates
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
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
  
  // Chart options
  const chartOptions = {
    responsive: true,
    interaction: {
      mode: 'index',
      intersect: false,
    },
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Social Media Performance Metrics',
      },
    },
    scales: {
      y: {
        type: 'linear',
        display: true,
        position: 'left',
      },
      y1: {
        type: 'linear',
        display: true,
        position: 'right',
        grid: {
          drawOnChartArea: false,
        },
        min: 0,
        max: 10,
        title: {
          display: true,
          text: 'Engagement Rate (%)'
        }
      },
    },
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div>
      <h1 className="mb-4">Social Media Metrics</h1>
      
      <div className="row mb-4">
        <div className="col-md-6">
          <div className="card shadow-sm">
            <div className="card-header bg-primary text-white">
              <h5 className="card-title mb-0">Select Account</h5>
            </div>
            <div className="card-body">
              <div className="mb-3">
                <label htmlFor="client_select" className="form-label">Client</label>
                <select
                  className="form-select"
                  id="client_select"
                  onChange={handleClientChange}
                  value={selectedClient}
                >
                  <option value="">Select a client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mb-3">
                <label htmlFor="account_select" className="form-label">Social Media Account</label>
                <select
                  className="form-select"
                  id="account_select"
                  onChange={handleAccountChange}
                  value={formData.account_id}
                  disabled={!selectedClient || accounts.length === 0}
                >
                  <option value="">Select an account</option>
                  {accounts.map(account => (
                    <option key={account.id} value={account.id}>
                      <i className={getPlatformIcon(account.platform)}></i>
                      {account.platform.charAt(0).toUpperCase() + account.platform.slice(1)} - {account.username}
                    </option>
                  ))}
                </select>
                
                {selectedClient && accounts.length === 0 && (
                  <div className="alert alert-warning mt-2">
                    <small>No social media accounts found for this client.</small>
                    <div>
                      <Link to="/admin/social-media/accounts" className="btn btn-sm btn-outline-primary mt-2">
                        <i className="fas fa-plus me-1"></i> Add Account
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {selectedAccount && (
          <div className="col-md-6">
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white">
                <h5 className="card-title mb-0">Account Overview</h5>
              </div>
              <div className="card-body">
                <div className="d-flex align-items-center mb-3">
                  <div className="me-3">
                    <span className="display-5">
                      <i className={getPlatformIcon(selectedAccount.platform)}></i>
                    </span>
                  </div>
                  <div>
                    <h5 className="mb-0">{selectedAccount.platform.charAt(0).toUpperCase() + selectedAccount.platform.slice(1)}</h5>
                    <p className="mb-0">{selectedAccount.username}</p>
                  </div>
                </div>
                
                {metrics.length > 0 && (
                  <div className="row">
                    <div className="col-6">
                      <div className="card border-light mb-2">
                        <div className="card-body py-2">
                          <h6 className="text-muted mb-0">Followers</h6>
                          <h4 className="mb-0">{metrics[0].followers.toLocaleString()}</h4>
                          {calculateGrowth('followers').value !== 0 && (
                            <small className={`text-${calculateGrowth('followers').value > 0 ? 'success' : 'danger'}`}>
                              {calculateGrowth('followers').value > 0 ? '+' : ''}{calculateGrowth('followers').value} 
                              ({calculateGrowth('followers').percentage}%)
                            </small>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="col-6">
                      <div className="card border-light mb-2">
                        <div className="card-body py-2">
                          <h6 className="text-muted mb-0">Engagement</h6>
                          <h4 className="mb-0">{metrics[0].engagement_rate ? `${metrics[0].engagement_rate}%` : 'N/A'}</h4>
                          {calculateGrowth('engagement_rate').value !== 0 && (
                            <small className={`text-${calculateGrowth('engagement_rate').value > 0 ? 'success' : 'danger'}`}>
                              {calculateGrowth('engagement_rate').value > 0 ? '+' : ''}{calculateGrowth('engagement_rate').value} 
                              ({calculateGrowth('engagement_rate').percentage}%)
                            </small>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div className="mt-3">
                  <Link 
                    to={`/admin/social-media/accounts`}
                    className="btn btn-sm btn-outline-secondary me-2"
                  >
                    <i className="fas fa-user-circle me-1"></i> Manage Accounts
                  </Link>
                  
                  {selectedAccount.profile_url && (
                    <a 
                      href={selectedAccount.profile_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-sm btn-outline-primary"
                    >
                      <i className="fas fa-external-link-alt me-1"></i> View Profile
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {selectedAccount && (
        <div className="row">
          <div className="col-md-7">
            <div className="card shadow-sm mb-4">
              <div className="card-header bg-primary text-white">
                <h5 className="card-title mb-0">Performance Trends</h5>
              </div>
              <div className="card-body">
                {chartData ? (
                  <Line data={chartData} options={chartOptions} />
                ) : (
                  <div className="alert alert-info">
                    <p className="mb-0">No metrics data available for this account yet. Add your first metrics record to see performance trends.</p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white">
                <h5 className="card-title mb-0">Metrics History</h5>
              </div>
              <div className="card-body">
                {metrics.length === 0 ? (
                  <div className="alert alert-info">
                    <p className="mb-0">No metrics data available for this account yet.</p>
                  </div>
                ) : (
                  <div className="table-responsive">
                    <table className="table table-hover">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Followers</th>
                          <th>Engagement</th>
                          <th>Reach</th>
                          <th>Notes</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metrics.sort((a, b) => new Date(b.record_date) - new Date(a.record_date)).map(metric => (
                          <tr key={metric.id}>
                            <td>{formatDate(metric.record_date)}</td>
                            <td>{metric.followers.toLocaleString()}</td>
                            <td>{metric.engagement_rate ? `${metric.engagement_rate}%` : '-'}</td>
                            <td>{metric.reach ? metric.reach.toLocaleString() : '-'}</td>
                            <td>
                              {metric.notes ? (
                                <span className="text-truncate d-inline-block" style={{ maxWidth: '150px' }}>
                                  {metric.notes}
                                </span>
                              ) : (
                                <span className="text-muted">-</span>
                              )}
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
          
          <div className="col-md-5">
            <div className="card shadow-sm">
              <div className="card-header bg-primary text-white">
                <h5 className="card-title mb-0">Add/Update Metrics</h5>
              </div>
              <div className="card-body">
                <form onSubmit={onSubmit}>
                  <div className="mb-3">
                    <label htmlFor="record_date" className="form-label">Record Date</label>
                    <input
                      type="date"
                      className="form-control"
                      id="record_date"
                      name="record_date"
                      value={formData.record_date}
                      onChange={onChange}
                      required
                    />
                    <small className="text-muted">
                      If metrics already exist for this date, they will be updated.
                    </small>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="followers" className="form-label">Followers</label>
                    <input
                      type="number"
                      className="form-control"
                      id="followers"
                      name="followers"
                      value={formData.followers}
                      onChange={onNumericChange}
                      placeholder="e.g. 1250"
                      required
                    />
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="following" className="form-label">Following (Optional)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="following"
                        name="following"
                        value={formData.following}
                        onChange={onNumericChange}
                        placeholder="e.g. 500"
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="posts_count" className="form-label">Posts Count (Optional)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="posts_count"
                        name="posts_count"
                        value={formData.posts_count}
                        onChange={onNumericChange}
                        placeholder="e.g. 120"
                      />
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="reach" className="form-label">Reach (Optional)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="reach"
                        name="reach"
                        value={formData.reach}
                        onChange={onNumericChange}
                        placeholder="e.g. 5000"
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="impressions" className="form-label">Impressions (Optional)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="impressions"
                        name="impressions"
                        value={formData.impressions}
                        onChange={onNumericChange}
                        placeholder="e.g. 8000"
                      />
                    </div>
                  </div>
                  
                  <div className="row">
                    <div className="col-md-6 mb-3">
                      <label htmlFor="profile_views" className="form-label">Profile Views (Optional)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="profile_views"
                        name="profile_views"
                        value={formData.profile_views}
                        onChange={onNumericChange}
                        placeholder="e.g. 1000"
                      />
                    </div>
                    
                    <div className="col-md-6 mb-3">
                      <label htmlFor="engagement_rate" className="form-label">Engagement Rate % (Optional)</label>
                      <input
                        type="number"
                        className="form-control"
                        id="engagement_rate"
                        name="engagement_rate"
                        value={formData.engagement_rate}
                        onChange={onNumericChange}
                        placeholder="e.g. 2.5"
                        step="0.01"
                        min="0"
                        max="100"
                      />
                    </div>
                  </div>
                  
                  <div className="mb-3">
                    <label htmlFor="notes" className="form-label">Notes (Optional)</label>
                    <textarea
                      className="form-control"
                      id="notes"
                      name="notes"
                      value={formData.notes}
                      onChange={onChange}
                      placeholder="Any relevant observations or context"
                      rows="3"
                    ></textarea>
                  </div>
                  
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={formLoading}
                  >
                    {formLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Saving...
                      </>
                    ) : (
                      'Save Metrics'
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SocialMediaMetrics;
