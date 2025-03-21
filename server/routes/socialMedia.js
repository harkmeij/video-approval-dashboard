const express = require('express');
const router = express.Router();

// Mock data for development
const mockAccounts = [
  {
    id: '1',
    client_id: '1',
    platform: 'instagram',
    username: '@acmecompany',
    display_name: 'ACME Company',
    profile_url: 'https://instagram.com/acmecompany',
    profile_image_url: 'https://placehold.co/100',
    created_at: '2025-01-15T12:00:00Z',
    updated_at: '2025-01-15T12:00:00Z'
  },
  {
    id: '2',
    client_id: '1',
    platform: 'linkedin',
    username: 'acme-company',
    display_name: 'ACME Company Official',
    profile_url: 'https://linkedin.com/company/acme-company',
    profile_image_url: 'https://placehold.co/100',
    created_at: '2025-01-15T12:00:00Z',
    updated_at: '2025-01-15T12:00:00Z'
  },
  {
    id: '3',
    client_id: '2',
    platform: 'tiktok',
    username: '@innovationsinc',
    display_name: 'Innovations Inc',
    profile_url: 'https://tiktok.com/@innovationsinc',
    profile_image_url: 'https://placehold.co/100',
    created_at: '2025-01-20T12:00:00Z',
    updated_at: '2025-01-20T12:00:00Z'
  },
  {
    id: '4',
    client_id: '6bc91cf6-15a1-4386-ad75-8f9f1624d072',
    platform: 'instagram',
    username: '@clientcompany',
    display_name: 'Client Company',
    profile_url: 'https://instagram.com/clientcompany',
    profile_image_url: 'https://placehold.co/100',
    created_at: '2025-02-15T12:00:00Z',
    updated_at: '2025-02-15T12:00:00Z'
  },
  {
    id: '5',
    client_id: '6bc91cf6-15a1-4386-ad75-8f9f1624d072',
    platform: 'linkedin',
    username: 'client-company',
    display_name: 'Client Company Official',
    profile_url: 'https://linkedin.com/company/client-company',
    profile_image_url: 'https://placehold.co/100',
    created_at: '2025-02-15T12:00:00Z',
    updated_at: '2025-02-15T12:00:00Z'
  }
];

const mockMetrics = [
  {
    id: '1',
    account_id: '1',
    record_date: '2025-02-01',
    followers: 5000,
    following: 1500,
    posts_count: 120,
    reach: 25000,
    impressions: 40000,
    profile_views: 3000,
    engagement_rate: 3.2,
    notes: 'February metrics',
    created_at: '2025-02-01T12:00:00Z',
    updated_at: '2025-02-01T12:00:00Z'
  },
  {
    id: '2',
    account_id: '1',
    record_date: '2025-03-01',
    followers: 5500,
    following: 1550,
    posts_count: 135,
    reach: 30000,
    impressions: 45000,
    profile_views: 3500,
    engagement_rate: 3.5,
    notes: 'March metrics',
    created_at: '2025-03-01T12:00:00Z',
    updated_at: '2025-03-01T12:00:00Z'
  },
  {
    id: '3',
    account_id: '1',
    record_date: '2025-04-01',
    followers: 6000,
    following: 1600,
    posts_count: 150,
    reach: 35000,
    impressions: 50000,
    profile_views: 4000,
    engagement_rate: 3.8,
    notes: 'April metrics',
    created_at: '2025-04-01T12:00:00Z',
    updated_at: '2025-04-01T12:00:00Z'
  },
  {
    id: '4',
    account_id: '4',
    record_date: '2025-02-15',
    followers: 12000,
    following: 800,
    posts_count: 210,
    reach: 45000,
    impressions: 70000,
    profile_views: 5000,
    engagement_rate: 4.2,
    notes: 'February metrics',
    created_at: '2025-02-15T12:00:00Z',
    updated_at: '2025-02-15T12:00:00Z'
  },
  {
    id: '5',
    account_id: '4',
    record_date: '2025-03-15',
    followers: 12800,
    following: 820,
    posts_count: 230,
    reach: 50000,
    impressions: 78000,
    profile_views: 5500,
    engagement_rate: 4.5,
    notes: 'March metrics',
    created_at: '2025-03-15T12:00:00Z',
    updated_at: '2025-03-15T12:00:00Z'
  },
  {
    id: '6',
    account_id: '5',
    record_date: '2025-02-15',
    followers: 8500,
    following: 100,
    posts_count: 95,
    reach: 32000,
    impressions: 41000,
    profile_views: 2800,
    engagement_rate: 3.1,
    notes: 'February metrics',
    created_at: '2025-02-15T12:00:00Z',
    updated_at: '2025-02-15T12:00:00Z'
  },
  {
    id: '7',
    account_id: '5',
    record_date: '2025-03-15',
    followers: 9200,
    following: 105,
    posts_count: 102,
    reach: 35000,
    impressions: 45000,
    profile_views: 3100,
    engagement_rate: 3.3,
    notes: 'March metrics',
    created_at: '2025-03-15T12:00:00Z',
    updated_at: '2025-03-15T12:00:00Z'
  }
];

// In-memory storage for newly created items
let lastAccountId = 5;
let lastMetricsId = 7;

// ==============================
// SOCIAL MEDIA ACCOUNT ROUTES
// ==============================

// Get all social media accounts - DEVELOPMENT VERSION (no auth)
router.get('/accounts', (req, res) => {
  console.log('GET /api/social-media/accounts - Returning mock accounts');
  res.json(mockAccounts);
});

// Get social media accounts for a specific client - DEVELOPMENT VERSION (no auth)
router.get('/accounts/client/:clientId', (req, res) => {
  const clientAccounts = mockAccounts.filter(account => account.client_id === req.params.clientId);
  res.json(clientAccounts);
});

// Get a specific social media account - DEVELOPMENT VERSION (no auth)
router.get('/accounts/:id', (req, res) => {
  const account = mockAccounts.find(acc => acc.id === req.params.id);
  if (!account) {
    return res.status(404).json({ message: 'Social media account not found' });
  }
  res.json(account);
});

// Create a new social media account - DEVELOPMENT VERSION (no auth)
router.post('/accounts', (req, res) => {
  const { client_id, platform, username, display_name, profile_url, profile_image_url } = req.body;

  if (!client_id || !platform || !username) {
    return res.status(400).json({ message: 'Client ID, platform, and username are required' });
  }

  const newAccount = {
    id: String(++lastAccountId),
    client_id,
    platform,
    username,
    display_name: display_name || username,
    profile_url: profile_url || null,
    profile_image_url: profile_image_url || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  mockAccounts.push(newAccount);
  res.status(201).json(newAccount);
});

// Update a social media account - DEVELOPMENT VERSION (no auth)
router.put('/accounts/:id', (req, res) => {
  const accountIndex = mockAccounts.findIndex(acc => acc.id === req.params.id);
  if (accountIndex === -1) {
    return res.status(404).json({ message: 'Social media account not found' });
  }

  const { username, display_name, profile_url, profile_image_url } = req.body;

  const updatedAccount = {
    ...mockAccounts[accountIndex],
    username: username || mockAccounts[accountIndex].username,
    display_name: display_name !== undefined ? display_name : mockAccounts[accountIndex].display_name,
    profile_url: profile_url !== undefined ? profile_url : mockAccounts[accountIndex].profile_url,
    profile_image_url: profile_image_url !== undefined ? profile_image_url : mockAccounts[accountIndex].profile_image_url,
    updated_at: new Date().toISOString()
  };

  mockAccounts[accountIndex] = updatedAccount;
  res.json(updatedAccount);
});

// Delete a social media account - DEVELOPMENT VERSION (no auth)
router.delete('/accounts/:id', (req, res) => {
  const accountIndex = mockAccounts.findIndex(acc => acc.id === req.params.id);
  if (accountIndex === -1) {
    return res.status(404).json({ message: 'Social media account not found' });
  }

  mockAccounts.splice(accountIndex, 1);
  res.json({ message: 'Account removed' });
});

// ==============================
// SOCIAL MEDIA METRICS ROUTES
// ==============================

// Get metrics for a specific account - DEVELOPMENT VERSION (no auth)
router.get('/metrics/account/:accountId', (req, res) => {
  const accountMetrics = mockMetrics.filter(metric => metric.account_id === req.params.accountId);
  res.json(accountMetrics);
});

// Get a specific metric record - DEVELOPMENT VERSION (no auth)
router.get('/metrics/:id', (req, res) => {
  const metric = mockMetrics.find(m => m.id === req.params.id);
  if (!metric) {
    return res.status(404).json({ message: 'Metric record not found' });
  }
  res.json(metric);
});

// Add new metrics - DEVELOPMENT VERSION (no auth)
router.post('/metrics', (req, res) => {
  const {
    account_id, record_date, followers, following,
    posts_count, reach, impressions, profile_views,
    engagement_rate, notes
  } = req.body;

  if (!account_id || !record_date || followers === undefined) {
    return res.status(400).json({ message: 'Account ID, record date, and followers count are required' });
  }

  const newMetric = {
    id: String(++lastMetricsId),
    account_id,
    record_date,
    followers,
    following: following || null,
    posts_count: posts_count || null,
    reach: reach || null,
    impressions: impressions || null,
    profile_views: profile_views || null,
    engagement_rate: engagement_rate || null,
    notes: notes || null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  mockMetrics.push(newMetric);
  res.status(201).json(newMetric);
});

// Update metrics - DEVELOPMENT VERSION (no auth)
router.put('/metrics/:id', (req, res) => {
  const metricIndex = mockMetrics.findIndex(m => m.id === req.params.id);
  if (metricIndex === -1) {
    return res.status(404).json({ message: 'Metric record not found' });
  }

  const {
    followers, following, posts_count, reach, impressions,
    profile_views, engagement_rate, notes
  } = req.body;

  const updatedMetric = {
    ...mockMetrics[metricIndex],
    followers: followers !== undefined ? followers : mockMetrics[metricIndex].followers,
    following: following !== undefined ? following : mockMetrics[metricIndex].following,
    posts_count: posts_count !== undefined ? posts_count : mockMetrics[metricIndex].posts_count,
    reach: reach !== undefined ? reach : mockMetrics[metricIndex].reach,
    impressions: impressions !== undefined ? impressions : mockMetrics[metricIndex].impressions,
    profile_views: profile_views !== undefined ? profile_views : mockMetrics[metricIndex].profile_views,
    engagement_rate: engagement_rate !== undefined ? engagement_rate : mockMetrics[metricIndex].engagement_rate,
    notes: notes !== undefined ? notes : mockMetrics[metricIndex].notes,
    updated_at: new Date().toISOString()
  };

  mockMetrics[metricIndex] = updatedMetric;
  res.json(updatedMetric);
});

// Delete metrics - DEVELOPMENT VERSION (no auth)
router.delete('/metrics/:id', (req, res) => {
  const metricIndex = mockMetrics.findIndex(m => m.id === req.params.id);
  if (metricIndex === -1) {
    return res.status(404).json({ message: 'Metric record not found' });
  }

  mockMetrics.splice(metricIndex, 1);
  res.json({ message: 'Metric record removed' });
});

module.exports = router;
