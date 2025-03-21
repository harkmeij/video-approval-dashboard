/**
 * Script to check and create the required Dropbox folder structure
 * 
 * This script will:
 * 1. Check if the Dropbox API credentials are valid
 * 2. Check if the /Betterview folder exists, create it if not
 * 3. Check if the /Betterview/Reels folder exists, create it if not
 * 4. List any client folders that already exist
 * 
 * Usage: node scripts/checkDropboxFolders.js
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

const checkFolderStructure = async () => {
  console.log('Checking Dropbox folder structure...');
  
  try {
    const dbx = getDropboxClient();
    const folderStructure = {
      root: false,
      betterviewFolder: false,
      reelsFolder: false,
      clientFolders: []
    };
    
    // Check root access
    try {
      console.log('Checking root access...');
      const rootResponse = await dbx.filesListFolder({
        path: '',
        limit: 10
      });
      
      folderStructure.root = true;
      console.log('✅ Root access confirmed');
      
      // Check for Betterview folder
      const betterviewFolder = rootResponse.result.entries.find(
        entry => entry['.tag'] === 'folder' && entry.name === 'Betterview'
      );
      
      if (betterviewFolder) {
        folderStructure.betterviewFolder = true;
        console.log('✅ /Betterview folder exists');
        
        // Check for Reels folder
        try {
          console.log('Checking for Reels folder...');
          const betterviewResponse = await dbx.filesListFolder({
            path: '/Betterview',
            limit: 10
          });
          
          const reelsFolder = betterviewResponse.result.entries.find(
            entry => entry['.tag'] === 'folder' && entry.name === 'Reels'
          );
          
          if (reelsFolder) {
            folderStructure.reelsFolder = true;
            console.log('✅ /Betterview/Reels folder exists');
            
            // List client folders
            try {
              console.log('Listing client folders...');
              const reelsResponse = await dbx.filesListFolder({
                path: '/Betterview/Reels',
                limit: 100
              });
              
              const clientFolders = reelsResponse.result.entries.filter(
                entry => entry['.tag'] === 'folder'
              );
              
              if (clientFolders.length > 0) {
                folderStructure.clientFolders = clientFolders.map(folder => folder.name);
                console.log(`✅ Found ${clientFolders.length} client folders:`);
                clientFolders.forEach(folder => {
                  console.log(`   - ${folder.name}`);
                });
              } else {
                console.log('ℹ️ No client folders found yet');
              }
            } catch (err) {
              console.error('❌ Error listing client folders:', err.message);
            }
          } else {
            console.log('❌ /Betterview/Reels folder does not exist');
          }
        } catch (err) {
          console.error('❌ Error checking Reels folder:', err.message);
        }
      } else {
        console.log('❌ /Betterview folder does not exist');
      }
    } catch (err) {
      console.error('❌ Error checking root access:', err.message);
      console.error('Please check your Dropbox API credentials in the .env file');
      
      // Print more detailed error information
      console.error('\nDetailed error information:');
      if (err.status) {
        console.error(`Status code: ${err.status}`);
      }
      if (err.error && err.error.error_summary) {
        console.error(`Error summary: ${err.error.error_summary}`);
      }
      
      // Print current credentials (without showing full refresh token)
      const appKey = process.env.DROPBOX_APP_KEY || 'not set';
      const appSecret = process.env.DROPBOX_APP_SECRET || 'not set';
      const refreshToken = process.env.DROPBOX_REFRESH_TOKEN 
        ? `${process.env.DROPBOX_REFRESH_TOKEN.substring(0, 10)}...` 
        : 'not set';
      
      console.error('\nCurrent credentials:');
      console.error(`DROPBOX_APP_KEY: ${appKey}`);
      console.error(`DROPBOX_APP_SECRET: ${appSecret.substring(0, 4)}...`);
      console.error(`DROPBOX_REFRESH_TOKEN: ${refreshToken}`);
      
      console.error('\nTo fix this issue:');
      console.error('1. Check that your Dropbox app is properly configured');
      console.error('2. Verify that the refresh token is valid and not expired');
      console.error('3. Ensure your app has the required permissions (files.metadata.read, files.content.write, sharing.write)');
      console.error('4. Refer to DROPBOX_SETUP.md for instructions on setting up Dropbox API credentials');
      
      return;
    }
    
    // Create missing folders if needed
    if (folderStructure.root && !folderStructure.betterviewFolder) {
      try {
        console.log('Creating /Betterview folder...');
        const response = await dbx.filesCreateFolderV2({
          path: '/Betterview',
          autorename: false
        });
        folderStructure.betterviewFolder = true;
        console.log('✅ Created /Betterview folder');
      } catch (err) {
        console.error('❌ Error creating Betterview folder:', err.message);
      }
    }
    
    if (folderStructure.betterviewFolder && !folderStructure.reelsFolder) {
      try {
        console.log('Creating /Betterview/Reels folder...');
        const response = await dbx.filesCreateFolderV2({
          path: '/Betterview/Reels',
          autorename: false
        });
        folderStructure.reelsFolder = true;
        console.log('✅ Created /Betterview/Reels folder');
      } catch (err) {
        console.error('❌ Error creating Reels folder:', err.message);
      }
    }
    
    // Final status
    console.log('\nFinal Status:');
    console.log('-------------');
    console.log(`Dropbox API Access: ${folderStructure.root ? '✅ Connected' : '❌ Failed'}`);
    console.log(`/Betterview Folder: ${folderStructure.betterviewFolder ? '✅ Exists' : '❌ Missing'}`);
    console.log(`/Betterview/Reels Folder: ${folderStructure.reelsFolder ? '✅ Exists' : '❌ Missing'}`);
    console.log(`Client Folders: ${folderStructure.clientFolders.length} found`);
    
    if (folderStructure.root && folderStructure.betterviewFolder && folderStructure.reelsFolder) {
      console.log('\n✅ Folder structure is valid and ready for use');
    } else {
      console.log('\n❌ Folder structure is incomplete. Please fix the issues above.');
    }
    
  } catch (err) {
    console.error('Error checking Dropbox folder structure:', err);
  }
};

// Run the check
checkFolderStructure();
