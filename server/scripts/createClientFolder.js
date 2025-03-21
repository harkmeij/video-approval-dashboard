/**
 * Script to create a client folder in Dropbox
 * 
 * This script will:
 * 1. Check if the Dropbox API credentials are valid
 * 2. Create a client folder in /Betterview/Reels
 * 
 * Usage: node scripts/createClientFolder.js "Client Name"
 */

require('dotenv').config();
const { Dropbox } = require('dropbox');

// Initialize Dropbox client
const getDropboxClient = () => {
  // For Dropbox SDK v10.34.0, the correct initialization is:
  console.log('Initializing Dropbox client...');
  return new Dropbox({
    accessToken: process.env.DROPBOX_ACCESS_TOKEN,
    clientId: process.env.DROPBOX_APP_KEY,
    clientSecret: process.env.DROPBOX_APP_SECRET,
    refreshToken: process.env.DROPBOX_REFRESH_TOKEN
  });
};

const createClientFolder = async (clientName) => {
  if (!clientName) {
    console.error('Please provide a client name as an argument');
    console.error('Usage: node scripts/createClientFolder.js "Client Name"');
    process.exit(1);
  }
  
  console.log(`Creating folder for client: ${clientName}`);
  
  try {
    const dbx = getDropboxClient();
    const folderPath = `/Betterview/Reels/${clientName}`;
    
    // Check if folder already exists
    try {
      console.log(`Checking if folder already exists: ${folderPath}`);
      await dbx.filesGetMetadata({
        path: folderPath
      });
      
      console.log(`✅ Folder already exists: ${folderPath}`);
      return;
    } catch (err) {
      // Folder doesn't exist, create it
      console.log(`Creating folder: ${folderPath}`);
      const response = await dbx.filesCreateFolderV2({
        path: folderPath,
        autorename: false
      });
      
      console.log(`✅ Folder created successfully: ${response.result.metadata.path_display}`);
    }
  } catch (err) {
    console.error('❌ Error creating client folder:', err.message);
    
    if (err.message.includes('path/not_found')) {
      console.error('\nThe parent folder structure does not exist.');
      console.error('Please run the checkDropboxFolders.js script first to create the required folder structure:');
      console.error('node scripts/checkDropboxFolders.js');
    }
  }
};

// Get client name from command line arguments
const clientName = process.argv[2];
createClientFolder(clientName);
