/**
 * Script to find the Betterview folder in Dropbox
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
    accessTokenExpiresAt: new Date(Date.now() + (3600 * 1000))
  });
};

// Function to list folder contents
const listFolder = async (dbx, path) => {
  try {
    console.log(`\nListing folder: ${path || 'ROOT'}`);
    console.log("---------------------------------");
    
    const response = await dbx.filesListFolder({
      path: path,
      limit: 100
    });
    
    const entries = response.result.entries;
    
    if (entries.length === 0) {
      console.log("No files or folders found.");
    } else {
      entries.forEach(entry => {
        console.log(`${entry['.tag'] === 'folder' ? '📁' : '📄'} ${entry.name} (${entry.path_lower})`);
      });
    }
    
    return entries.filter(entry => entry['.tag'] === 'folder');
  } catch (err) {
    console.error(`Error listing folder ${path || 'ROOT'}:`, err.message);
    return [];
  }
};

// Function to search for a folder by name (non-recursive, case-insensitive)
const searchFolders = async (dbx, searchName) => {
  try {
    console.log(`\nSearching for folder containing: "${searchName}" (non-recursive)`);
    console.log("---------------------------------");
    
    // First try direct search in root
    const rootFolders = await listFolder(dbx, '');
    
    // Check if any folder in root matches
    const matchingFolders = rootFolders.filter(folder => 
      folder.name.toLowerCase().includes(searchName.toLowerCase())
    );
    
    if (matchingFolders.length > 0) {
      console.log(`\nFound matching folders in root:`);
      matchingFolders.forEach(folder => {
        console.log(`📁 ${folder.name} (${folder.path_lower})`);
      });
    } else {
      console.log(`No folders found matching "${searchName}" in root.`);
    }
    
    return matchingFolders;
  } catch (err) {
    console.error('Error searching for folders:', err);
    return [];
  }
};

// Main function
const findBetterviewFolder = async () => {
  try {
    console.log('Starting search for Betterview folder...');
    
    const dbx = getDropboxClient();
    
    // List root contents
    const rootFolders = await listFolder(dbx, '');
    
    // Search for Betterview folders
    const betterviewFolders = await searchFolders(dbx, 'betterview');
    
    // If found, check their contents
    for (const folder of betterviewFolders) {
      const subfolders = await listFolder(dbx, folder.path_lower);
      
      // Look for a Reels folder
      const reelsFolder = subfolders.find(sf => 
        sf.name.toLowerCase() === 'reels'
      );
      
      if (reelsFolder) {
        console.log(`\n>>> Found Reels folder: ${reelsFolder.path_lower}`);
        
        // List contents of Reels folder
        await listFolder(dbx, reelsFolder.path_lower);
      }
    }
    
    console.log('\nSearch complete.');
    
  } catch (err) {
    console.error('Error finding Betterview folder:', err);
  }
};

// Run the script
findBetterviewFolder();
