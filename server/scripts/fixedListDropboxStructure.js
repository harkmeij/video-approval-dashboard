/**
 * Script to list the entire folder structure in Dropbox
 * 
 * This script will:
 * 1. List all folders in the root directory
 * 2. Recursively list the contents of each folder
 * 3. Display the complete folder structure in a tree-like format
 */

require('dotenv').config();
const { Dropbox } = require('dropbox');

// Initialize Dropbox client
const getDropboxClient = () => {
  console.log('Initializing Dropbox client...');
  return new Dropbox({
    accessToken: process.env.DROPBOX_ACCESS_TOKEN,
    clientId: process.env.DROPBOX_APP_KEY,
    clientSecret: process.env.DROPBOX_APP_SECRET,
    refreshToken: process.env.DROPBOX_REFRESH_TOKEN,
    accessTokenExpiresAt: new Date(Date.now() + (3600 * 1000))  // Set expiry to 1 hour from now to force refresh
  });
};

// Function to list folder contents recursively
const listFolderContents = async (dbx, path, indent = '', depth = 0, maxDepth = 10) => {
  if (depth > maxDepth) {
    console.log(`${indent}└── ... (max depth reached)`);
    return;
  }
  
  try {
    const response = await dbx.filesListFolder({
      path: path === 'root' ? '' : path,
      limit: 100
    });
    
    const entries = response.result.entries;
    
    console.log(`\nFolder: ${path === 'root' ? '/' : path}`);
    console.log("===============================================");
    
    if (entries.length === 0) {
      console.log("No files or folders found in this directory.");
    } else {
      for (const entry of entries) {
        console.log(`${entry['.tag'] === 'folder' ? '📁' : '📄'} ${entry.name} (${entry.path_lower})`);
        
        // Recursively list contents of folders
        if (entry['.tag'] === 'folder' && depth < maxDepth) {
          await listFolderContents(dbx, entry.path_lower, indent + '  ', depth + 1, maxDepth);
        }
      }
    }
    
  } catch (err) {
    console.error(`Error listing folder contents for ${path}:`, err);
  }
};

// Function to try listing a specific folder
const tryListFolder = async (dbx, path) => {
  try {
    console.log(`\nTrying to list specific folder: ${path}`);
    console.log("===============================================");
    
    const response = await dbx.filesListFolder({
      path: path,
      limit: 100
    });
    
    console.log(`Successfully listed folder: ${path}`);
    
    const entries = response.result.entries;
    for (const entry of entries) {
      console.log(`${entry['.tag'] === 'folder' ? '📁' : '📄'} ${entry.name} (${entry.path_lower})`);
    }
    
    return true;
  } catch (err) {
    console.error(`Error listing folder ${path}:`, err.message);
    return false;
  }
};

// Main function
const listDropboxStructure = async () => {
  try {
    console.log(`Listing Dropbox folder structure...\n`);
    
    const dbx = getDropboxClient();
    
    // Try root folder (empty string is root in Dropbox API)
    await listFolderContents(dbx, 'root', '', 0);
    
    // Try specific paths that might exist
    console.log("\nTrying specific paths that might exist:");
    await tryListFolder(dbx, '/Betterview');
    await tryListFolder(dbx, '/betterview');
    await tryListFolder(dbx, '/BetterView');
    await tryListFolder(dbx, '/betterView');
    await tryListFolder(dbx, '/better_view');
    await tryListFolder(dbx, '/Better View');
    
    // Try other paths that might contain "Reels"
    await tryListFolder(dbx, '/Reels');
    await tryListFolder(dbx, '/reels');
    
  } catch (err) {
    console.error('Error listing Dropbox structure:', err);
  }
};

// Run the script
listDropboxStructure();
