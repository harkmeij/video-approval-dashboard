/**
 * Script to list the entire folder structure in Dropbox
 * 
 * This script will:
 * 1. List all folders in the root directory
 * 2. Recursively list the contents of each folder
 * 3. Display the complete folder structure in a tree-like format
 * 
 * Usage: node scripts/listDropboxStructure.js [max_depth]
 * 
 * Optional:
 * - max_depth: Maximum depth to traverse (default: 3)
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
    refreshToken: process.env.DROPBOX_REFRESH_TOKEN
  });
};

// Function to list folder contents recursively
const listFolderContents = async (dbx, path, indent = '', depth = 0, maxDepth = 3) => {
  if (depth > maxDepth) {
    console.log(`${indent}└── ... (max depth reached)`);
    return;
  }
  
  try {
    const response = await dbx.filesListFolder({
      path: path,
      limit: 100
    });
    
    const entries = response.result.entries;
    const folders = entries.filter(entry => entry['.tag'] === 'folder');
    const files = entries.filter(entry => entry['.tag'] === 'file');
    
    // Sort folders and files alphabetically
    folders.sort((a, b) => a.name.localeCompare(b.name));
    files.sort((a, b) => a.name.localeCompare(b.name));
    
    // Print folders first
    for (let i = 0; i < folders.length; i++) {
      const folder = folders[i];
      const isLast = i === folders.length - 1 && files.length === 0;
      const prefix = isLast ? '└── ' : '├── ';
      const newIndent = indent + (isLast ? '    ' : '│   ');
      
      console.log(`${indent}${prefix}📁 ${folder.name}/`);
      
      // Recursively list contents of this folder
      await listFolderContents(dbx, folder.path_lower, newIndent, depth + 1, maxDepth);
    }
    
    // Then print files (limited to 5 per folder to avoid clutter)
    const maxFilesToShow = 5;
    const shownFiles = files.slice(0, maxFilesToShow);
    const hiddenFiles = files.length - shownFiles.length;
    
    for (let i = 0; i < shownFiles.length; i++) {
      const file = shownFiles[i];
      const isLast = i === shownFiles.length - 1 && hiddenFiles === 0;
      const prefix = isLast ? '└── ' : '├── ';
      
      console.log(`${indent}${prefix}📄 ${file.name}`);
    }
    
    // Show message if some files were hidden
    if (hiddenFiles > 0) {
      console.log(`${indent}└── ... (${hiddenFiles} more files)`);
    }
    
    // Check if there are more results
    if (response.result.has_more) {
      console.log(`${indent}└── ... (more entries available)`);
    }
    
  } catch (err) {
    console.error(`Error listing folder contents for ${path}:`, err.message);
  }
};

// Main function
const listDropboxStructure = async () => {
  try {
    const maxDepth = parseInt(process.argv[2]) || 3;
    console.log(`Listing Dropbox folder structure (max depth: ${maxDepth})...\n`);
    
    const dbx = getDropboxClient();
    
    // Start with root folder
    console.log('📁 Root/');
    await listFolderContents(dbx, '', '', 1, maxDepth);
    
    console.log('\nFolder structure listing complete.');
    
  } catch (err) {
    console.error('Error listing Dropbox structure:', err);
  }
};

// Run the script
listDropboxStructure();
