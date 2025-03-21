/**
 * Script to synchronize videos in Supabase Storage with the database
 * This script:
 * 1. Lists all files in the 'videos' bucket
 * 2. Parses the paths to extract client and month info
 * 3. Creates database records for any files not already in the database
 */

const supabase = require('../config/supabase');
const Video = require('../models/Video');
const Month = require('../models/Month');
const path = require('path');

async function syncStorage() {
  console.log('Starting Supabase Storage synchronization...');
  
  try {
    // Step 1: Check if the 'videos' bucket exists
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    
    if (bucketsError) {
      console.error('Error listing buckets:', bucketsError);
      return;
    }
    
    const videosBucket = buckets.find(bucket => bucket.name === 'videos');
    if (!videosBucket) {
      console.error('No videos bucket found in Supabase Storage');
      return;
    }
    
    console.log('Found videos bucket, listing files...');
    
    // Step 2: List all files in the bucket
    const { data: files, error: listError } = await supabase.storage
      .from('videos')
      .list('clients', {
        sortBy: { column: 'name', order: 'asc' }
      });
    
    if (listError) {
      console.error('Error listing files in bucket:', listError);
      return;
    }
    
    console.log(`Found ${files.length} client directories`);
    
    // Step 3: Process each client directory
    for (const clientDir of files) {
      if (!clientDir.name || clientDir.id === '.emptyFolderPlaceholder') continue;
      
      const clientId = clientDir.name;
      console.log(`Processing client directory: ${clientId}`);
      
      // List month directories for this client
      const { data: monthDirs, error: monthDirError } = await supabase.storage
        .from('videos')
        .list(`clients/${clientId}`, {
          sortBy: { column: 'name', order: 'asc' }
        });
      
      if (monthDirError) {
        console.error(`Error listing month directories for client ${clientId}:`, monthDirError);
        continue;
      }
      
      console.log(`Found ${monthDirs.length} month directories for client ${clientId}`);
      
      // Process each month directory
      for (const monthDir of monthDirs) {
        if (!monthDir.name || monthDir.id === '.emptyFolderPlaceholder') continue;
        
        const monthId = monthDir.name;
        console.log(`Processing month directory: ${monthId} for client ${clientId}`);
        
        // Extract month and year from the directory name (e.g., "3-2025")
        let monthNum = 0;
        let yearNum = 0;
        
        const monthParts = monthId.split('-');
        if (monthParts.length === 2) {
          monthNum = parseInt(monthParts[0], 10);
          yearNum = parseInt(monthParts[1], 10);
        }
        
        if (isNaN(monthNum) || isNaN(yearNum) || monthNum < 1 || monthNum > 12) {
          console.warn(`Invalid month format: ${monthId}, skipping`);
          continue;
        }
        
        // Find or create the month record
        let monthDbId = null;
        try {
          const existingMonths = await Month.find({
            month: monthNum,
            year: yearNum
          });
          
          if (existingMonths && existingMonths.length > 0) {
            monthDbId = existingMonths[0].id;
            console.log(`Found existing month record: ${monthDbId}`);
          } else {
            // Create a new month record
            const monthNames = [
              'January', 'February', 'March', 'April', 'May', 'June',
              'July', 'August', 'September', 'October', 'November', 'December'
            ];
            
            const newMonth = {
              name: `${monthNames[monthNum - 1]} ${yearNum}`,
              month: monthNum,
              year: yearNum,
              created_by: '00000000-0000-0000-0000-000000000000' // Use a system placeholder
            };
            
            const createdMonth = await Month.create(newMonth);
            monthDbId = createdMonth.id;
            console.log(`Created new month record: ${monthDbId}`);
          }
        } catch (err) {
          console.error(`Error processing month ${monthId}:`, err);
          continue;
        }
        
        // List video files in this month directory
        const { data: videoFiles, error: filesError } = await supabase.storage
          .from('videos')
          .list(`clients/${clientId}/${monthId}`, {
            sortBy: { column: 'name', order: 'asc' }
          });
        
        if (filesError) {
          console.error(`Error listing videos in ${monthId}:`, filesError);
          continue;
        }
        
        console.log(`Found ${videoFiles.length} video files in ${monthId}`);
        
        // Process each video file
        for (const file of videoFiles) {
          if (!file.name || file.id === '.emptyFolderPlaceholder') continue;
          
          // Skip non-video files
          const ext = path.extname(file.name).toLowerCase();
          const videoExtensions = ['.mp4', '.mov', '.avi', '.wmv', '.mkv', '.webm'];
          if (!videoExtensions.includes(ext)) {
            console.log(`Skipping non-video file: ${file.name}`);
            continue;
          }
          
          const storagePath = `clients/${clientId}/${monthId}/${file.name}`;
          console.log(`Processing video file: ${storagePath}`);
          
          // Check if this video already exists in the database
          try {
            const existingVideos = await Video.find({ storage_path: storagePath });
            
            if (existingVideos && existingVideos.length > 0) {
              console.log(`Video already exists in database: ${existingVideos[0].id}`);
              continue;
            }
            
            // Get file metadata
            const { data: metadata, error: metadataError } = await supabase.storage
              .from('videos')
              .getPublicUrl(storagePath);
            
            if (metadataError) {
              console.error(`Error getting metadata for ${storagePath}:`, metadataError);
              continue;
            }
            
            // Create new video record
            const title = file.name.replace(/\.[^/.]+$/, ""); // Remove extension
            
            const videoData = {
              title,
              description: '',
              month_id: monthDbId,
              client_id: clientId,
              created_by: '00000000-0000-0000-0000-000000000000', // System placeholder
              status: 'pending',
              storage_path: storagePath,
              file_size: file.metadata?.size || 0,
              content_type: file.metadata?.mimetype || `video/${ext.replace('.', '')}`
            };
            
            console.log('Creating video record:', videoData);
            
            const result = await Video.create(videoData);
            console.log(`Created new video record: ${result.id}`);
          } catch (err) {
            console.error(`Error processing video ${file.name}:`, err);
            continue;
          }
        }
      }
    }
    
    console.log('Synchronization complete!');
  } catch (err) {
    console.error('Unexpected error during synchronization:', err);
  }
}

// Export the sync function so it can be used by the API route
module.exports = { syncStorage };

// Run the sync function if this script is executed directly
if (require.main === module) {
  syncStorage()
    .then(() => {
      console.log('Storage sync script finished');
      process.exit(0);
    })
    .catch(err => {
      console.error('Error in sync script:', err);
      process.exit(1);
    });
}
