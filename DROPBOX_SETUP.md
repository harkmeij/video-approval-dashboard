# Dropbox Developer Setup Guide

This guide will walk you through the process of setting up a Dropbox Developer account and configuring it for use with the Video Approval Dashboard application.

## 1. Create a Dropbox Developer Account

1. Go to the [Dropbox Developer Console](https://www.dropbox.com/developers) and sign in with your Dropbox account.
2. If you don't have a Dropbox account, you'll need to create one first.

## 2. Create a New App

1. Once logged in, click on the "App console" button in the top-right corner.
2. Click the "Create app" button.
3. Select "Dropbox API" (not Dropbox Business API).
4. Choose "Full Dropbox" access type (this allows the app to access all files and folders in your Dropbox).
5. Give your app a name (e.g., "Video Approval Dashboard").
6. Click "Create app" to confirm.

## 3. Configure App Permissions

1. In your app's settings page, scroll down to the "Permissions" section.
2. Enable the following permissions:
   - `files.metadata.read` - To list files and folders
   - `files.content.read` - To access file content
   - `sharing.write` - To create shared links for videos

3. Click "Submit" to save the permissions.

## 4. Configure OAuth 2 Settings

1. Scroll to the "OAuth 2" section.
2. Add the following redirect URI:
   ```
   http://localhost:3000/auth/dropbox/callback
   ```
3. Under "Allow implicit grant," select "Allow" to simplify the authentication flow.

## 5. Generate Access Token

For development purposes, you can generate a long-lived access token:

1. Scroll to the "Generated access token" section.
2. Click "Generate" to create a token.
3. Copy this token - you'll need it for the application's `.env` file.

## 6. Get App Key and Secret

1. At the top of your app's settings page, note the "App key" and "App secret".
2. You'll need these values for the application's `.env` file.

## 7. Configure the Application

Update your `.env` file in the server directory with the following values:

```
DROPBOX_APP_KEY=your_app_key
DROPBOX_APP_SECRET=your_app_secret
DROPBOX_REFRESH_TOKEN=your_generated_access_token
```

## 8. Getting a Refresh Token (For Production Use)

For production use, you'll want to use a refresh token instead of a short-lived access token. This requires a more complex OAuth flow:

1. Create a simple script to handle the OAuth flow:

```javascript
// dropbox-auth.js
const express = require('express');
const axios = require('axios');
const app = express();
const port = 3001;

const APP_KEY = 'your_app_key';
const APP_SECRET = 'your_app_secret';
const REDIRECT_URI = 'http://localhost:3001/auth/dropbox/callback';

app.get('/auth/dropbox', (req, res) => {
  const authUrl = `https://www.dropbox.com/oauth2/authorize?client_id=${APP_KEY}&response_type=code&redirect_uri=${REDIRECT_URI}`;
  res.redirect(authUrl);
});

app.get('/auth/dropbox/callback', async (req, res) => {
  const code = req.query.code;
  
  try {
    // Exchange code for access token and refresh token
    const response = await axios.post('https://api.dropboxapi.com/oauth2/token', null, {
      params: {
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
        client_id: APP_KEY,
        client_secret: APP_SECRET
      }
    });
    
    const { access_token, refresh_token } = response.data;
    
    res.send(`
      <h1>Authentication Successful</h1>
      <p>Add these values to your .env file:</p>
      <pre>
DROPBOX_APP_KEY=${APP_KEY}
DROPBOX_APP_SECRET=${APP_SECRET}
DROPBOX_REFRESH_TOKEN=${refresh_token}
      </pre>
    `);
  } catch (error) {
    console.error('Error exchanging code for tokens:', error.response?.data || error.message);
    res.status(500).send('Authentication failed');
  }
});

app.listen(port, () => {
  console.log(`Dropbox auth server running at http://localhost:${port}`);
  console.log(`Visit http://localhost:${port}/auth/dropbox to start the auth flow`);
});
```

2. Install dependencies and run the script:
```bash
npm install express axios
node dropbox-auth.js
```

3. Visit `http://localhost:3001/auth/dropbox` in your browser.
4. Follow the authentication flow and authorize your app.
5. Copy the refresh token from the success page to your `.env` file.

## 9. Testing the Integration

After configuring the Dropbox integration:

1. Start your application.
2. Log in as an editor.
3. Navigate to the "Add Video" page.
4. You should see your Dropbox files and be able to select videos.

## Troubleshooting

- **Access Token Expired**: If you're using a generated access token and it expires, you'll need to generate a new one from the Dropbox Developer Console.
- **Permission Errors**: Make sure you've enabled all the required permissions for your app.
- **File Not Found**: Ensure the files you're trying to access exist in your Dropbox account.
- **CORS Issues**: If you encounter CORS errors, make sure your app's domain is added to the allowed domains in the Dropbox app settings.
