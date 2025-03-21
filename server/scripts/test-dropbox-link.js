/**
 * Script to test creating a Dropbox shared link
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

// Test file path
// This would typically be a video file path in Dropbox
const TEST_FILE_PATH = '/path/to/video.mp4'; // REPLACE THIS WITH A REAL PATH TO TEST

async function testSharedLink(filePath) {
  try {
    console.log(`Testing shared link creation for: ${filePath}`);
    
    try {
      // First try to get file metadata to confirm the file exists
      console.log('Checking if file exists...');
      const metadataResponse = await dbx.filesGetMetadata({
        path: filePath
      });
      
      console.log('File exists:', metadataResponse.result);
      
      // Try to create a shared link
      console.log('Creating shared link...');
      try {
        const response = await dbx.sharingCreateSharedLinkWithSettings({
          path: filePath,
          settings: {
            requested_visibility: { '.tag': 'public' }
          }
        });
        
        console.log('Successfully created shared link:');
        console.log('- URL:', response.result.url);
        
        // Convert to embedded link format
        const embedLink = response.result.url.replace('www.dropbox.com', 'www.dropbox.com/embed');
        console.log('- Embed URL:', embedLink);
        
        return {
          success: true,
          url: response.result.url,
          embedUrl: embedLink
        };
      } catch (linkError) {
        console.error('Error creating link:', linkError);
        
        // If error is because link already exists, get existing links
        if (linkError.status === 409 && 
            linkError.error && 
            linkError.error.error && 
            linkError.error.error['.tag'] === 'shared_link_already_exists') {
          
          console.log('Link already exists, fetching existing links...');
          const linksResponse = await dbx.sharingListSharedLinks({
            path: filePath,
            direct_only: true
          });
          
          if (linksResponse.result.links && linksResponse.result.links.length > 0) {
            const link = linksResponse.result.links[0];
            // Convert to embedded link format
            const embedLink = link.url.replace('www.dropbox.com', 'www.dropbox.com/embed');
            
            console.log('Found existing shared link:');
            console.log('- URL:', link.url);
            console.log('- Embed URL:', embedLink);
            
            return {
              success: true,
              url: link.url,
              embedUrl: embedLink
            };
          } else {
            throw new Error('No shared links found');
          }
        } else {
          throw linkError;
        }
      }
    } catch (metadataErr) {
      console.error('Error checking file:', metadataErr);
      throw new Error(`File not found or inaccessible: ${filePath}`);
    }
  } catch (err) {
    console.error('Error testing shared link:', err);
    return {
      success: false,
      error: err.message
    };
  }
}

async function findVideoFiles() {
  try {
    console.log('Searching for video files in your Dropbox...');
    
    // List root folder
    const rootResponse = await dbx.filesListFolder({
      path: '',
      limit: 100
    });
    
    const entries = rootResponse.result.entries;
    const videoExtensions = ['.mp4', '.mov', '.avi', '.wmv', '.flv', '.webm'];
    
    // Find video files in root
    const videoFiles = entries.filter(entry => {
      if (entry['.tag'] === 'file') {
        const ext = entry.name.substring(entry.name.lastIndexOf('.')).toLowerCase();
        return videoExtensions.includes(ext);
      }
      return false;
    });
    
    if (videoFiles.length > 0) {
      console.log('\nFound video files in root:');
      videoFiles.forEach((file, index) => {
        console.log(`${index + 1}. ${file.name} (${file.path_lower})`);
      });
      
      // Test shared link for the first video file
      const testFile = videoFiles[0];
      console.log(`\nTesting shared link with: ${testFile.name}`);
      await testSharedLink(testFile.path_lower);
    } else {
      console.log('No video files found in root folder. Checking some common folders...');
      
      // Look for common folders
      const folders = entries.filter(entry => entry['.tag'] === 'folder');
      
      // Check some common folder names
      const commonFolders = folders.filter(folder => 
        ['videos', 'media', 'content', 'betterview', 'better view', 'reels'].some(name => 
          folder.name.toLowerCase().includes(name)
        )
      );
      
      if (commonFolders.length > 0) {
        console.log('\nFound potentially relevant folders:');
        commonFolders.forEach((folder, index) => {
          console.log(`${index + 1}. ${folder.name} (${folder.path_lower})`);
        });
        
        // Check the first folder's contents
        const firstFolder = commonFolders[0];
        console.log(`\nChecking ${firstFolder.name} folder contents...`);
        
        const folderResponse = await dbx.filesListFolder({
          path: firstFolder.path_lower,
          limit: 100
        });
        
        const folderEntries = folderResponse.result.entries;
        const folderVideoFiles = folderEntries.filter(entry => {
          if (entry['.tag'] === 'file') {
            const ext = entry.name.substring(entry.name.lastIndexOf('.')).toLowerCase();
            return videoExtensions.includes(ext);
          }
          return false;
        });
        
        if (folderVideoFiles.length > 0) {
          console.log(`Found video files in ${firstFolder.name}:`);
          folderVideoFiles.forEach((file, index) => {
            console.log(`${index + 1}. ${file.name} (${file.path_lower})`);
          });
          
          // Test shared link for the first video file in the folder
          const testFolderFile = folderVideoFiles[0];
          console.log(`\nTesting shared link with: ${testFolderFile.name}`);
          await testSharedLink(testFolderFile.path_lower);
        } else {
          console.log(`No video files found in ${firstFolder.name} folder.`);
        }
      } else {
        console.log('No relevant folders found.');
      }
    }
  } catch (err) {
    console.error('Error searching for video files:', err);
  }
}

// If a test path is provided, use it; otherwise search for videos
if (TEST_FILE_PATH !== '/path/to/video.mp4') {
  testSharedLink(TEST_FILE_PATH);
} else {
  findVideoFiles();
}
