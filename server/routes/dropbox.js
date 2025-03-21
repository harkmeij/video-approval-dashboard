const express = require('express');
const router = express.Router();
const { Dropbox } = require('dropbox');
const { verifyToken } = require('./auth');

// Initialize Dropbox client
const getDropboxClient = () => {
  // For Dropbox SDK v10.34.0, the correct initialization is:
  return new Dropbox({
    accessToken: process.env.DROPBOX_ACCESS_TOKEN,
    clientId: process.env.DROPBOX_APP_KEY,
    clientSecret: process.env.DROPBOX_APP_SECRET,
    refreshToken: process.env.DROPBOX_REFRESH_TOKEN,
    accessTokenExpiresAt: new Date(Date.now() + (3600 * 1000))  // Set expiry to 1 hour from now to force refresh
  });
};

// Middleware to check if user is an editor
const isEditor = (req, res, next) => {
  if (req.user.role !== 'editor') {
    return res.status(403).json({ message: 'Access denied. Editor role required.' });
  }
  next();
};

// @route   GET /api/dropbox/files
// @desc    Get files from Dropbox (editors only)
// @access  Private (Editor only)
router.get('/files', verifyToken, isEditor, async (req, res) => {
  const { path = '' } = req.query;
  
  try {
    const dbx = getDropboxClient();
    
    const response = await dbx.filesListFolder({
      path: path || '',
      limit: 50
    });
    
    // Filter to only include video files
    const videoFiles = response.result.entries.filter(entry => {
      if (entry['.tag'] === 'file') {
        const extension = entry.name.split('.').pop().toLowerCase();
        return ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm'].includes(extension);
      }
      return entry['.tag'] === 'folder';
    });
    
    res.json(videoFiles);
  } catch (err) {
    console.error('Dropbox API error:', err);
    res.status(500).json({ message: 'Error fetching files from Dropbox' });
  }
});

// @route   GET /api/dropbox/search
// @desc    Search files in Dropbox (editors only)
// @access  Private (Editor only)
router.get('/search', verifyToken, isEditor, async (req, res) => {
  const { query } = req.query;
  
  if (!query) {
    return res.status(400).json({ message: 'Search query is required' });
  }
  
  try {
    const dbx = getDropboxClient();
    
    const response = await dbx.filesSearch({
      query,
      file_extensions: ['mp4', 'mov', 'avi', 'wmv', 'flv', 'webm'],
      max_results: 20
    });
    
    res.json(response.result.matches.map(match => match.metadata));
  } catch (err) {
    console.error('Dropbox API error:', err);
    res.status(500).json({ message: 'Error searching files in Dropbox' });
  }
});

// @route   GET /api/dropbox/file/:fileId
// @desc    Get file details from Dropbox
// @access  Private
router.get('/file/:fileId', verifyToken, async (req, res) => {
  try {
    const dbx = getDropboxClient();
    
    const response = await dbx.filesGetMetadata({
      path: req.params.fileId
    });
    
    res.json(response.result);
  } catch (err) {
    console.error('Dropbox API error:', err);
    res.status(500).json({ message: 'Error fetching file details from Dropbox' });
  }
});

// @route   POST /api/dropbox/create-folder
// @desc    Create a folder in Dropbox (editors only)
// @access  Private (Editor only)
router.post('/create-folder', verifyToken, isEditor, async (req, res) => {
  const { folderName, path } = req.body;
  
  if (!folderName) {
    return res.status(400).json({ message: 'Folder name is required' });
  }
  
  try {
    const dbx = getDropboxClient();
    const folderPath = path ? `${path}/${folderName}` : `/${folderName}`;
    
    // Check if folder already exists
    try {
      await dbx.filesGetMetadata({
        path: folderPath
      });
      
      // If we get here, the folder exists
      return res.json({ 
        message: 'Folder already exists',
        path: folderPath
      });
    } catch (err) {
      // Folder doesn't exist, create it
      const response = await dbx.filesCreateFolderV2({
        path: folderPath,
        autorename: false
      });
      
      res.json({ 
        message: 'Folder created successfully',
        path: response.result.metadata.path_display
      });
    }
  } catch (err) {
    console.error('Dropbox API error:', err);
    res.status(500).json({ message: 'Error creating folder in Dropbox' });
  }
});

// @route   GET /api/dropbox/check-folder-structure
// @desc    Check if the required folder structure exists in Dropbox
// @access  Private (Editor only)
router.get('/check-folder-structure', verifyToken, isEditor, async (req, res) => {
  try {
    const dbx = getDropboxClient();
    
    // Define folder structure info
    const folderStructure = {
      root: false,
      reelsFolder: false,
      reelsPath: null, // This will store the actual path to the Reels folder
      betterviewPath: null, // This will store the actual path to the Betterview folder or equivalent
    };
    
    // First, check if we have access to the root folder
    try {
      const rootResponse = await dbx.filesListFolder({
        path: '',
        limit: 20
      });
      
      folderStructure.root = true;
      
      // Find all folders in root that might contain a "Reels" folder
      const rootFolders = rootResponse.result.entries.filter(entry => entry['.tag'] === 'folder');
      
      // First try to find "Betterview" folder directly in root
      const betterviewFolder = rootFolders.find(folder => 
        folder.name.toLowerCase().includes('betterview') || 
        folder.name.toLowerCase().includes('better view')
      );
      
      if (betterviewFolder) {
        // If found, use this as our Betterview folder
        folderStructure.betterviewPath = betterviewFolder.path_lower;
        
        // Check for Reels folder inside
        try {
          const betterviewResponse = await dbx.filesListFolder({
            path: betterviewFolder.path_lower,
            limit: 10
          });
          
          const reelsFolder = betterviewResponse.result.entries.find(entry => 
            entry['.tag'] === 'folder' && 
            (entry.name.toLowerCase() === 'reels' || entry.name.toLowerCase().includes('reel'))
          );
          
          if (reelsFolder) {
            folderStructure.reelsFolder = true;
            folderStructure.reelsPath = reelsFolder.path_lower;
          }
        } catch (err) {
          console.error('Error checking Betterview contents:', err);
        }
      } else {
        // Try to find a Reels folder in root
        const reelsFolder = rootFolders.find(folder => 
          folder.name.toLowerCase() === 'reels' || folder.name.toLowerCase().includes('reel')
        );
        
        if (reelsFolder) {
          folderStructure.reelsFolder = true;
          folderStructure.reelsPath = reelsFolder.path_lower;
          folderStructure.betterviewPath = ''; // Root is the parent
        } else {
          // As a last resort, find any folder that might be appropriate for videos
          const videoFolder = rootFolders.find(folder => 
            folder.name.toLowerCase().includes('video') || 
            folder.name.toLowerCase().includes('media') ||
            folder.name.toLowerCase().includes('content')
          );
          
          if (videoFolder) {
            // Use this as our parent folder and potentially create a Reels subfolder
            folderStructure.betterviewPath = videoFolder.path_lower;
            
            // Check if this folder contains a Reels folder
            try {
              const videoFolderResponse = await dbx.filesListFolder({
                path: videoFolder.path_lower,
                limit: 10
              });
              
              const reelsInVideoFolder = videoFolderResponse.result.entries.find(entry => 
                entry['.tag'] === 'folder' && 
                (entry.name.toLowerCase() === 'reels' || entry.name.toLowerCase().includes('reel'))
              );
              
              if (reelsInVideoFolder) {
                folderStructure.reelsFolder = true;
                folderStructure.reelsPath = reelsInVideoFolder.path_lower;
              }
            } catch (err) {
              console.error('Error checking video folder contents:', err);
            }
          }
        }
      }
    } catch (err) {
      console.error('Error checking root access:', err);
    }
    
    // Create missing folders if needed
    if (folderStructure.root && !folderStructure.reelsFolder) {
      // Determine where to create the Reels folder
      const parentPath = folderStructure.betterviewPath || '';
      
      try {
        // If we don't have a Betterview path, create one
        if (!folderStructure.betterviewPath) {
          try {
            const createBetterviewResponse = await dbx.filesCreateFolderV2({
              path: '/Betterview',
              autorename: false
            });
            folderStructure.betterviewPath = createBetterviewResponse.result.metadata.path_lower;
          } catch (err) {
            // If folder already exists, this will fail but that's okay
            if (err.status === 409) {
              folderStructure.betterviewPath = '/Betterview';
            } else {
              throw err;
            }
          }
        }
        
        // Now create the Reels folder within the appropriate parent
        const reelsPath = `${folderStructure.betterviewPath}/Reels`;
        try {
          const createReelsResponse = await dbx.filesCreateFolderV2({
            path: reelsPath,
            autorename: false
          });
          folderStructure.reelsFolder = true;
          folderStructure.reelsPath = createReelsResponse.result.metadata.path_lower;
        } catch (err) {
          // If folder already exists, this will fail but that's okay
          if (err.status === 409) {
            folderStructure.reelsFolder = true;
            folderStructure.reelsPath = reelsPath.toLowerCase();
          } else {
            throw err;
          }
        }
      } catch (err) {
        console.error('Error creating folder structure:', err);
      }
    }
    
    res.json({
      folderStructure,
      accessStatus: folderStructure.root ? 'Access granted to Dropbox' : 'No access to Dropbox',
      reelsPath: folderStructure.reelsPath,
      missingFolders: !folderStructure.reelsFolder ? 'Required folder structure is missing' : 'All required folders exist',
      nextSteps: !folderStructure.reelsFolder 
        ? 'Please ensure a Reels folder exists in your Dropbox'
        : 'Your folder structure is ready for client folders'
    });
  } catch (err) {
    console.error('Dropbox API error:', err);
    res.status(500).json({ 
      message: 'Error checking Dropbox folder structure',
      error: err.message,
      suggestion: 'Please verify your Dropbox API credentials and permissions'
    });
  }
});

// @route   GET /api/dropbox/debug-structure
// @desc    Debug Dropbox folder structure (editors only)
// @access  Private (Editor only)
router.get('/debug-structure', verifyToken, isEditor, async (req, res) => {
  try {
    console.log('Debug: Initializing Dropbox client');
    const dbx = getDropboxClient();
    
    let folderStructure = {
      root: false,
      rootListing: [],
      betterviewPath: null,
      betterviewListing: [],
      reelsPath: null,
      reelsListing: []
    };
    
    // First check root
    console.log('Debug: Checking root folder access');
    try {
      const rootResponse = await dbx.filesListFolder({
        path: '',
        limit: 50
      });
      
      folderStructure.root = true;
      folderStructure.rootListing = rootResponse.result.entries.map(entry => {
        return {
          name: entry.name,
          type: entry['.tag'],
          path: entry.path_lower,
          id: entry.id
        };
      });
      
      // Look for Betterview folder
      const betterviewFolder = rootResponse.result.entries.find(entry => 
        entry['.tag'] === 'folder' && 
        (entry.name.toLowerCase().includes('betterview') || 
         entry.name.toLowerCase().includes('better view'))
      );
      
      if (betterviewFolder) {
        folderStructure.betterviewPath = betterviewFolder.path_lower;
        
        // List Betterview contents
        try {
          const betterviewResponse = await dbx.filesListFolder({
            path: betterviewFolder.path_lower,
            limit: 50
          });
          
          folderStructure.betterviewListing = betterviewResponse.result.entries.map(entry => {
            return {
              name: entry.name,
              type: entry['.tag'],
              path: entry.path_lower,
              id: entry.id
            };
          });
          
          // Look for Reels folder
          const reelsFolder = betterviewResponse.result.entries.find(entry => 
            entry['.tag'] === 'folder' && 
            (entry.name.toLowerCase() === 'reels' || 
             entry.name.toLowerCase().includes('reel'))
          );
          
          if (reelsFolder) {
            folderStructure.reelsPath = reelsFolder.path_lower;
            
            // List Reels contents
            try {
              const reelsResponse = await dbx.filesListFolder({
                path: reelsFolder.path_lower,
                limit: 50
              });
              
              folderStructure.reelsListing = reelsResponse.result.entries.map(entry => {
                return {
                  name: entry.name,
                  type: entry['.tag'],
                  path: entry.path_lower,
                  id: entry.id
                };
              });
            } catch (reelsErr) {
              console.error('Debug: Error listing Reels folder:', reelsErr);
              folderStructure.reelsError = reelsErr.message;
            }
          }
        } catch (betterviewErr) {
          console.error('Debug: Error listing Betterview folder:', betterviewErr);
          folderStructure.betterviewError = betterviewErr.message;
        }
      } else {
        // Try to find Reels directly in root
        const rootReelsFolder = rootResponse.result.entries.find(entry => 
          entry['.tag'] === 'folder' && 
          (entry.name.toLowerCase() === 'reels' || 
           entry.name.toLowerCase().includes('reel'))
        );
        
        if (rootReelsFolder) {
          folderStructure.reelsPath = rootReelsFolder.path_lower;
          
          // List Reels contents
          try {
            const reelsResponse = await dbx.filesListFolder({
              path: rootReelsFolder.path_lower,
              limit: 50
            });
            
            folderStructure.reelsListing = reelsResponse.result.entries.map(entry => {
              return {
                name: entry.name,
                type: entry['.tag'],
                path: entry.path_lower,
                id: entry.id
              };
            });
          } catch (reelsErr) {
            console.error('Debug: Error listing Reels folder:', reelsErr);
            folderStructure.reelsError = reelsErr.message;
          }
        }
      }
    } catch (rootErr) {
      console.error('Debug: Error listing root folder:', rootErr);
      folderStructure.rootError = rootErr.message;
    }
    
    // Send the debug info
    res.json({
      message: 'Dropbox folder structure debug information',
      structure: folderStructure,
      tokenInfo: {
        accessTokenProvided: !!process.env.DROPBOX_ACCESS_TOKEN,
        refreshTokenProvided: !!process.env.DROPBOX_REFRESH_TOKEN,
        appKeyProvided: !!process.env.DROPBOX_APP_KEY,
        appSecretProvided: !!process.env.DROPBOX_APP_SECRET
      }
    });
  } catch (err) {
    console.error('Debug: Dropbox API error:', err);
    res.status(500).json({ 
      message: 'Error debugging Dropbox structure',
      error: err.message
    });
  }
});

// @route   GET /api/dropbox/link/:fileId
// @desc    Get shared link for a file
// @access  Private
router.get('/link/:fileId', verifyToken, async (req, res) => {
  try {
    const dbx = getDropboxClient();
    const fileId = req.params.fileId;
    
    console.log(`Debug: Getting shared link for file: ${fileId}`);
    
    // Try to create a shared link
    try {
      const response = await dbx.sharingCreateSharedLinkWithSettings({
        path: fileId,
        settings: {
          requested_visibility: { '.tag': 'public' }
        }
      });
      
      console.log('Debug: Successfully created shared link');
      
      // Use the standard shared link for embedding with Dropbox's embed component
      const rawUrl = response.result.url;
      // For Dropbox embed API, we just need the standard shared link
      const embedUrl = rawUrl;
      
      res.json({ 
        url: response.result.url,
        embedUrl: embedUrl
      });
    } catch (error) {
      console.log(`Debug: Error creating shared link: ${error.message}`);
      
      // If error is because link already exists, get existing links
      if (error.status === 409 && error.error && error.error.error && error.error.error['.tag'] === 'shared_link_already_exists') {
        console.log('Debug: Link already exists, fetching existing links');
        const response = await dbx.sharingListSharedLinks({
          path: fileId,
          direct_only: true
        });
        
        if (response.result.links && response.result.links.length > 0) {
          const link = response.result.links[0];
          // Use the standard shared link for embedding with Dropbox's embed component
          const rawUrl = link.url;
          // For Dropbox embed API, we just need the standard shared link
          const embedUrl = rawUrl;
          
          console.log(`Debug: Found existing link: ${link.url}`);
          res.json({ 
            url: link.url,
            embedUrl: embedUrl
          });
        } else {
          console.log('Debug: No shared links found after checking');
          throw new Error('No shared links found');
        }
      } else if (error.status === 409 && error.error && error.error.error && error.error.error['.tag'] === 'path') {
        // Path not found error
        console.error('Debug: Path not found error', error.error);
        res.status(404).json({ 
          message: 'File not found in Dropbox',
          errorDetails: error.error
        });
      } else {
        console.error('Debug: Other error creating shared link', error);
        throw error;
      }
    }
  } catch (err) {
    console.error('Dropbox API error:', err);
    res.status(500).json({ 
      message: 'Error creating shared link', 
      error: err.message
    });
  }
});

module.exports = router;
