/**
 * Script to get a new Dropbox refresh token
 * Run this script with: node scripts/get-dropbox-refresh-token.js
 */

require('dotenv').config();
const express = require('express');
const axios = require('axios');
const app = express();
const port = 3001;

const APP_KEY = process.env.DROPBOX_APP_KEY;
const APP_SECRET = process.env.DROPBOX_APP_SECRET;
const REDIRECT_URI = 'http://localhost:3001/auth/dropbox/callback';

app.get('/', (req, res) => {
  res.send(`
    <h1>Dropbox Auth Tool</h1>
    <p>Click the button below to start the authentication process:</p>
    <a href="/auth/dropbox" style="display: inline-block; background-color: #0061fe; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Connect to Dropbox</a>
  `);
});

app.get('/auth/dropbox', (req, res) => {
  const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${APP_KEY}&response_type=code&redirect_uri=${REDIRECT_URI}&token_access_type=offline`;
  res.redirect(authUrl);
});

app.get('/auth/dropbox/callback', async (req, res) => {
  const code = req.query.code;
  
  if (!code) {
    return res.status(400).send('No authorization code received');
  }
  
  try {
    // Exchange code for access token and refresh token
    const tokenData = new URLSearchParams();
    tokenData.append('code', code);
    tokenData.append('grant_type', 'authorization_code');
    tokenData.append('redirect_uri', REDIRECT_URI);
    tokenData.append('client_id', APP_KEY);
    tokenData.append('client_secret', APP_SECRET);
    
    const response = await axios.post('https://api.dropboxapi.com/oauth2/token', 
      tokenData.toString(),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      }
    );
    
    console.log('Full token response:', JSON.stringify(response.data, null, 2));
    
    const { access_token, refresh_token } = response.data;
    
    if (!refresh_token) {
      console.log('Warning: No refresh token received. This might be a short-lived token.');
    }
    
    res.send(`
      <h1>Authentication Successful!</h1>
      <p>Add these values to your .env file:</p>
      <pre style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; overflow-x: auto;">
DROPBOX_APP_KEY=${APP_KEY}
DROPBOX_APP_SECRET=${APP_SECRET}
DROPBOX_ACCESS_TOKEN=${access_token}
DROPBOX_REFRESH_TOKEN=${refresh_token}
      </pre>
      <p><strong>Important:</strong> Replace the entire DROPBOX_ACCESS_TOKEN line in your .env file with the new one above.</p>
    `);
  } catch (error) {
    console.error('Error exchanging code for tokens:', error.response?.data || error.message);
    res.status(500).send(`
      <h1>Authentication Failed</h1>
      <p>Error: ${error.response?.data?.error_description || error.message}</p>
      <p>Please check your app configuration in the Dropbox Developer Console:</p>
      <ol>
        <li>Make sure the app key and secret are correct</li>
        <li>Verify that <code>${REDIRECT_URI}</code> is added as a redirect URI in your app settings</li>
        <li>Ensure your app has the necessary permissions (files.metadata.read, files.content.read, sharing.write)</li>
      </ol>
      <a href="/" style="display: inline-block; background-color: #0061fe; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Try Again</a>
    `);
  }
});

app.listen(port, () => {
  console.log(`
  Dropbox auth server running!
  
  Open your browser and navigate to: http://localhost:${port}
  
  Follow the instructions to get a new refresh token for your Dropbox app.
  `);
});
