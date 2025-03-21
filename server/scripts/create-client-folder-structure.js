/**
 * Script to create the necessary client folder structure in Dropbox
 * 
 * Based on user requirements:
 * - Videos should be in the Dashboard folder
 * - In Dashboard, there should be a Clients subfolder
 * - Each client should have their own folder inside Clients
 * - Videos should be placed in the client-specific folders
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

async function listFolder(path) {
  try {
    console.log(`\nListing contents of: ${path}`);
    console.log('-'.repeat(50));
    
    const response = await dbx.filesListFolder({
      path: path,
      limit: 100
    });
    
    if (response.result.entries.length === 0) {
      console.log('No files or folders found.');
      return [];
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
    
    return entries;
  } catch (err) {
    console.error(`Error listing folder ${path}:`, err.message);
    if (err.error) {
      console.error('Error details:', JSON.stringify(err.error, null, 2));
    }
    return [];
  }
}

async function createClientFolderStructure() {
  try {
    console.log('Creating client folder structure in Dropbox...');
    
    // First check if Betterview folder exists in root
    let betterviewPath = '/betterview';
    await createFolderIfNotExists(betterviewPath);
    
    // Then create/check Dashboard folder inside Betterview
    let dashboardPath = `${betterviewPath}/dashboard`;
    await createFolderIfNotExists(dashboardPath);
    
    // Create/check Clients folder inside Dashboard
    let clientsPath = `${dashboardPath}/clients`;
    await createFolderIfNotExists(clientsPath);
    
    // Create a Demo client folder for testing
    let demoClientPath = `${clientsPath}/demo_client`;
    await createFolderIfNotExists(demoClientPath);
    
    console.log('\nFolder structure created successfully:');
    console.log(`- Betterview: ${betterviewPath}`);
    console.log(`- Dashboard: ${dashboardPath}`);
    console.log(`- Clients: ${clientsPath}`);
    console.log(`- Demo Client: ${demoClientPath}`);
    
    return {
      betterviewPath,
      dashboardPath,
      clientsPath,
      demoClientPath
    };
  } catch (err) {
    console.error('Error creating folder structure:', err);
    throw err;
  }
}

async function checkExistingClients(clientsPath) {
  try {
    console.log('\nChecking for existing client folders...');
    
    const entries = await listFolder(clientsPath);
    const clientFolders = entries.filter(entry => entry['.tag'] === 'folder');
    
    if (clientFolders.length > 0) {
      console.log('\nFound existing client folders:');
      clientFolders.forEach((folder, index) => {
        console.log(`${index + 1}. ${folder.name} (${folder.path_lower})`);
      });
      
      // Look for video files in the first client folder
      if (clientFolders.length > 0) {
        const firstClientFolder = clientFolders[0];
        console.log(`\nChecking for videos in ${firstClientFolder.name}...`);
        
        const clientFiles = await listFolder(firstClientFolder.path_lower);
        const videoFiles = clientFiles.filter(file => {
          if (file['.tag'] === 'file') {
            const ext = file.name.split('.').pop().toLowerCase();
            return ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm'].includes(ext);
          }
          return false;
        });
        
        if (videoFiles.length > 0) {
          console.log(`\nFound ${videoFiles.length} videos in ${firstClientFolder.name} folder`);
        } else {
          console.log(`No videos found in ${firstClientFolder.name} folder`);
        }
      }
    } else {
      console.log('No client folders found yet.');
    }
  } catch (err) {
    console.error('Error checking clients:', err);
  }
}

async function main() {
  try {
    console.log('===== DROPBOX CLIENT FOLDER STRUCTURE SETUP =====');
    
    // Create the folder structure
    const paths = await createClientFolderStructure();
    
    // Check for existing clients
    await checkExistingClients(paths.clientsPath);
    
    console.log('\n📝 NEXT STEPS:');
    console.log('1. Upload client videos to their respective folders in the Clients directory');
    console.log(`2. The path for client videos should be: ${paths.clientsPath}/<client_name>/<video_file>`);
    console.log('3. When a client is created in the system, create a folder for them with the same name');
    console.log('4. Add videos to the client-specific folder to make them available to that client');
    
    // Update the structure in the ClientPage.js to look in the right location
    console.log('\n🔄 Remember to update the client page to look for videos in the Dashboard/Clients folder');
    console.log('Use this path in your application: /betterview/dashboard/clients');
    
  } catch (err) {
    console.error('Script error:', err);
  }
}

main();
