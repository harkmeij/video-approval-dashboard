/**
 * Script to create the necessary folder structure in Dropbox
 */

require('dotenv').config();
const { Dropbox } = require('dropbox');

// Initialize Dropbox client with the new tokens
const dbx = new Dropbox({
  accessToken: process.env.DROPBOX_ACCESS_TOKEN,
  clientId: process.env.DROPBOX_APP_KEY,
  clientSecret: process.env.DROPBOX_APP_SECRET,
  refreshToken: process.env.DROPBOX_REFRESH_TOKEN,
  accessTokenExpiresAt: new Date(Date.now() + (3600 * 1000))
});

async function createFolderIfNotExists(path) {
  try {
    console.log(`Checking if folder exists: ${path}`);
    
    try {
      // Try to get metadata for the folder
      const response = await dbx.filesGetMetadata({
        path: path
      });
      
      console.log(`✅ Folder already exists: ${path}`);
      return response.result;
    } catch (err) {
      // If folder doesn't exist, create it
      if (err.status === 409 && err.error && err.error.error && err.error.error['.tag'] === 'path_not_found') {
        console.log(`Creating folder: ${path}`);
        
        const response = await dbx.filesCreateFolderV2({
          path: path,
          autorename: false
        });
        
        console.log(`✅ Created folder: ${path}`);
        return response.result.metadata;
      } else {
        throw err;
      }
    }
  } catch (err) {
    console.error(`Error handling folder ${path}:`, err);
    throw err;
  }
}

async function createFolderStructure() {
  try {
    console.log('Creating folder structure in Dropbox...');
    
    // Create Betterview folder in root
    const betterviewFolder = await createFolderIfNotExists('/Betterview');
    
    // Create Reels folder inside Betterview
    const reelsFolder = await createFolderIfNotExists('/Betterview/Reels');
    
    // Create a Demo folder inside Reels
    const demoFolder = await createFolderIfNotExists('/Betterview/Reels/Demo');
    
    console.log('\nFolder structure created successfully:');
    console.log(`- Betterview: ${betterviewFolder.path_lower}`);
    console.log(`- Reels: ${reelsFolder.path_lower}`);
    console.log(`- Demo: ${demoFolder.path_lower}`);
    
    return {
      betterviewPath: betterviewFolder.path_lower,
      reelsPath: reelsFolder.path_lower,
      demoPath: demoFolder.path_lower
    };
  } catch (err) {
    console.error('Error creating folder structure:', err);
    throw err;
  }
}

async function waitForClients() {
  // List Reels folder
  try {
    console.log('\nChecking if any client folders already exist in Reels...');
    
    const response = await dbx.filesListFolder({
      path: '/Betterview/Reels',
      limit: 100
    });
    
    const folders = response.result.entries.filter(entry => entry['.tag'] === 'folder');
    
    if (folders.length > 0) {
      console.log('\nFound existing client folders:');
      folders.forEach((folder, index) => {
        console.log(`${index + 1}. ${folder.name} (${folder.path_lower})`);
      });
    } else {
      console.log('No existing client folders found.');
    }
  } catch (err) {
    console.error('Error checking for existing client folders:', err);
  }
}

async function main() {
  try {
    const folderStructure = await createFolderStructure();
    await waitForClients();
    
    console.log('\n📝 NEXT STEPS:');
    console.log('1. You can now upload videos to the Demo folder or create client folders');
    console.log(`2. Upload a sample video to: ${folderStructure.demoPath}`);
    console.log('3. For client specific videos, create a folder with the client name in the Reels folder');
    console.log(`   Example: ${folderStructure.reelsPath}/ClientName`);
    
  } catch (err) {
    console.error('Error in main:', err);
  }
}

main();
