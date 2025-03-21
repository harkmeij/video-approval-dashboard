import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Spinner from './layout/Spinner';

const SocialMediaOverview = ({ clientId }) => {
  const [accounts, setAccounts] = useState([]);
  const [metrics, setMetrics] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Get social media accounts for this client
        const accountsRes = await axios.get(`/api/social-media/accounts/client/${clientId}`);
        setAccounts(accountsRes.data);
        
        // If we have accounts, get their metrics
        if (accountsRes.data.length > 0) {
          const metricsData = {};
          
          // Get metrics for each account
          await Promise.all(
            accountsRes.data.map(async (account) => {
              try {
                const metricsRes = await axios.get(`/api/social-media/metrics/account/${account.id}`);
                
                // Sort metrics by date (newest first) and take the most recent
                const sortedMetrics = metricsRes.data.sort((a, b) => 
                  new Date(b.record_date) - new Date(a.record_date)
                );
                
                if (sortedMetrics.length > 0) {
                  metricsData[account.id] = {
                    current: sortedMetrics[0],
                    previous: sortedMetrics.length > 1 ? sortedMetrics[1] : null,
                    history: sortedMetrics
                  };
                }
              } catch (err) {
                console.error(`Error fetching metrics for account ${account.id}:`, err);
              }
            })
          );
          
          setMetrics(metricsData);
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching social media data:', err);
        setLoading(false);
      }
    };
    
    fetchData();
  }, [clientId]);
  
  // Calculate growth percentage
  const calculateGrowth = (current, previous, field) => {
    if (!current || !previous || !current[field] || !previous[field]) return null;
    
    const growth = current[field] - previous[field];
    const percentage = (growth / previous[field]) * 100;
    
    return {
      value: growth,
      percentage: percentage.toFixed(1)
    };
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
  
  if (accounts.length === 0) {
    return (
      <div className="alert alert-info">
        <p className="mb-0">No social media accounts have been connected for this client yet.</p>
      </div>
    );
  }

  return (
    <div>
      {accounts.length === 0 ? (
        <div className="alert alert-info">
          <p className="mb-0">No social media accounts have been added for this client yet.</p>
        </div>
      ) : (
        <div className="row">
          {accounts.map(account => {
            const accountMetrics = metrics[account.id];
            const hasMetrics = accountMetrics && accountMetrics.current;
            
            // Calculate growth metrics if we have previous data
            const followerGrowth = hasMetrics && accountMetrics.previous 
              ? calculateGrowth(accountMetrics.current, accountMetrics.previous, 'followers')
              : null;
              
            const engagementGrowth = hasMetrics && accountMetrics.previous 
              ? calculateGrowth(accountMetrics.current, accountMetrics.previous, 'engagement_rate')
              : null;
              
            return (
              <div key={account.id} className="col-md-4 mb-4">
                <div className="card h-100">
                  <div className="card-header d-flex align-items-center">
                    <i className={`${getPlatformIcon(account.platform)} me-2`} style={{ fontSize: '1.25rem' }}></i>
                    <div>
                      <h5 className="mb-0">{account.platform.charAt(0).toUpperCase() + account.platform.slice(1)}</h5>
                      <p className="small text-muted mb-0">@{account.username}</p>
                    </div>
                  </div>
                  
                  <div className="card-body">
                    {!hasMetrics ? (
                      <div className="alert alert-warning">
                        <p className="mb-0">No metrics available for this account yet.</p>
                      </div>
                    ) : (
                      <>
                        <div className="row mb-3">
                          <div className="col-6">
                            <h6 className="text-muted mb-1">Followers</h6>
                            <h4 className="mb-0">{accountMetrics.current.followers.toLocaleString()}</h4>
                            {followerGrowth && (
                              <small className={`text-${followerGrowth.value > 0 ? 'success' : 'danger'}`}>
                                {followerGrowth.value > 0 ? '+' : ''}{followerGrowth.value.toLocaleString()} 
                                ({followerGrowth.percentage}%)
                              </small>
                            )}
                          </div>
                          
                          <div className="col-6">
                            <h6 className="text-muted mb-1">Engagement</h6>
                            <h4 className="mb-0">
                              {accountMetrics.current.engagement_rate ? 
                                `${accountMetrics.current.engagement_rate}%` : 
                                'N/A'}
                            </h4>
                            {engagementGrowth && (
                              <small className={`text-${engagementGrowth.value > 0 ? 'success' : 'danger'}`}>
                                {engagementGrowth.value > 0 ? '+' : ''}{engagementGrowth.value.toFixed(1)} 
                                ({engagementGrowth.percentage}%)
                              </small>
                            )}
                          </div>
                        </div>
                        
                        {accountMetrics.current.reach && (
                          <div className="mb-3">
                            <h6 className="text-muted mb-1">Reach</h6>
                            <h5 className="mb-0">{accountMetrics.current.reach.toLocaleString()}</h5>
                          </div>
                        )}
                        
                        <div className="small text-muted mt-2">
                          Last updated: {new Date(accountMetrics.current.record_date).toLocaleDateString()}
                        </div>
                      </>
                    )}
                  </div>
                  
                  <div className="card-footer bg-transparent">
                    <a 
                      href={`/admin/social-media/metrics?accountId=${account.id}`}
                      className="btn btn-sm btn-outline-primary"
                    >
                      <i className="fas fa-chart-line me-1"></i> View Metrics
                    </a>
                    {account.profile_url && (
                      <a 
                        href={account.profile_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-sm btn-outline-secondary ms-2"
                      >
                        <i className="fas fa-external-link-alt me-1"></i> View Profile
                      </a>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SocialMediaOverview;
