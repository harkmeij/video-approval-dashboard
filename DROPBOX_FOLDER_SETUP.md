# Dropbox Folder Structure Setup

This document explains how videos should be organized in Dropbox for the video approval dashboard.

## Folder Structure

The correct folder structure for videos is:

```
/betterview/
  ├── dashboard/
  │   └── clients/
  │       ├── client1_name/
  │       │   ├── video1.mp4
  │       │   └── video2.mp4
  │       ├── client2_name/
  │       │   └── video1.mp4
  │       └── etc...
  └── ...
```

## Setting Up the Structure

A script has been created to help set up this folder structure. To run it:

```
cd server
node scripts/create-client-folder-structure.js
```

This script will:
1. Create the `/betterview/dashboard/clients` folder structure in your Dropbox if it doesn't exist
2. Create a Demo client folder for testing
3. Check for any existing client folders

## Adding Videos for Clients

When adding videos for a client:

1. Make sure there is a folder in `/betterview/dashboard/clients/` with the **exact same name** as the client in the system
2. Upload the client's videos to their specific folder
3. In the admin dashboard, use the "Add Video" button on the client's page
4. Navigate to the client's folder in Dropbox and select the video

## Understanding the Path Structure

- The main application folder is `/betterview`
- Client videos are stored in `/betterview/dashboard/clients/[client_name]/`
- The path in the system is case-sensitive, so the client folder name should match exactly the client name in the system

## Troubleshooting

If you encounter issues:

1. Use the "Debug Dropbox" button on the client page to check for folder structure issues
2. Make sure the refresh token is valid (use `server/scripts/get-dropbox-refresh-token.js` to refresh if needed)
3. Double check that the client folder name exactly matches the client name in the system

## Creating a New Client Folder

When you create a new client in the system, make sure to also create a matching folder in Dropbox:

1. Navigate to `/betterview/dashboard/clients/` in your Dropbox
2. Create a new folder with the exact name of the client
3. Upload videos to that folder

The videos will then be available for selection when adding videos to the client from the admin dashboard.
