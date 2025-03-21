/**
 * Simple script to list Dropbox folder structure
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

async function listFolder(path) {
  try {
    console.log(`\nListing contents of: ${path || 'ROOT'}`);
    console.log('-'.repeat(50));
    
    const response = await dbx.filesListFolder({
      path: path || '',
      limit: 100
    });
    
    if (response.result.entries.length === 0) {
      console.log('No files or folders found.');
      return;
    }
    
    // Sort entries: folders first, then files
    const entries = response.result.entries.sort((a, b) => {
      if (a['.tag'] === 'folder' && b['.tag'] !== 'folder') return -1;
      if (a['.tag'] !== 'folder' && b['.tag'] === 'folder') return 1;
      return a.name.localeCompare(b.name);
    });
    
    for (const entry of entries) {
      const isFolder = entry['.tag'] === 'folder';
      const icon = isFolder ? '📁' : '📄';
      console.log(`${icon} ${entry.name} (${entry.path_lower})`);
    }
    
    return entries.filter(entry => entry['.tag'] === 'folder');
  } catch (err) {
    console.error(`Error listing folder ${path || 'ROOT'}:`, err.message);
    if (err.error) {
      console.error('Error details:', JSON.stringify(err.error, null, 2));
    }
  }
}

async function main() {
  try {
    console.log('=== DROPBOX FOLDER STRUCTURE ===');
    
    // List root
    const rootFolders = await listFolder('');
    
    if (!rootFolders || rootFolders.length === 0) {
      console.log('No folders found in root directory.');
      return;
    }
    
    // Look for Betterview folder
    const betterviewFolder = rootFolders.find(folder => 
      folder.name.toLowerCase().includes('better')
    );
    
    if (betterviewFolder) {
      console.log(`\n✅ Found potential Betterview folder: ${betterviewFolder.name}`);
      
      // List contents of Betterview folder
      const betterviewSubfolders = await listFolder(betterviewFolder.path_lower);
      
      if (betterviewSubfolders && betterviewSubfolders.length > 0) {
        // Look for Reels folder
        const reelsFolder = betterviewSubfolders.find(folder => 
          folder.name.toLowerCase().includes('reel')
        );
        
        if (reelsFolder) {
          console.log(`\n✅ Found Reels folder: ${reelsFolder.name}`);
          console.log(`\n🎯 FULL PATH: ${reelsFolder.path_lower}`);
          
          // List contents of Reels folder
          await listFolder(reelsFolder.path_lower);
        } else {
          console.log('\n❌ No Reels folder found inside Betterview folder.');
        }
      }
    } else {
      // Look for Reels folder directly in root
      const reelsFolder = rootFolders.find(folder => 
        folder.name.toLowerCase().includes('reel')
      );
      
      if (reelsFolder) {
        console.log(`\n✅ Found Reels folder directly in root: ${reelsFolder.name}`);
        console.log(`\n🎯 FULL PATH: ${reelsFolder.path_lower}`);
        
        // List contents of Reels folder
        await listFolder(reelsFolder.path_lower);
      } else {
        console.log('\n❌ No Betterview or Reels folders found.');
      }
    }
    
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
