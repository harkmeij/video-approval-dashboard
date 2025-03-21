/**
 * Check-Storage-Permissions Script
 * 
 * This script scans all videos in the database and checks if their storage paths
 * are accessible through Supabase Storage. It helps identify videos that might have
 * permission issues, particularly after client deletion.
 * 
 * Usage: node scripts/check-storage-permissions.js
 */
require('dotenv').config();
const supabase = require('../config/supabase');

async function checkStoragePermissions() {
  console.log('Starting storage permission diagnostic...');

  try {
    // 1. Get all videos from the database that have storage_path
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('id, title, storage_path, client_id')
      .not('storage_path', 'is', null);

    if (videosError) {
      console.error('Error fetching videos:', videosError);
      return;
    }

    console.log(`Found ${videos.length} videos with storage paths to check`);

    // 2. Check if each client still exists
    const clientIds = [...new Set(videos.map(video => video.client_id))];
    console.log(`Found ${clientIds.length} unique clients to check`);

    const { data: existingClients, error: clientsError } = await supabase
      .from('users')
      .select('id')
      .in('id', clientIds);

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
      return;
    }

    const existingClientIds = new Set(existingClients.map(client => client.id));
    
    console.log(`${existingClients.length} clients exist, ${clientIds.length - existingClients.length} clients missing`);

    // 3. Check storage access for each video
    const results = {
      accessible: [],
      notFound: [],
      permissionIssue: [],
      otherErrors: [],
      deletedClients: []
    };

    for (const video of videos) {
      try {
        // Check if the client exists
        if (!existingClientIds.has(video.client_id)) {
          results.deletedClients.push({
            videoId: video.id,
            title: video.title,
            path: video.storage_path,
            clientId: video.client_id
          });
        }

        // Try to get a signed URL (this tests permissions)
        const { data, error } = await supabase.storage.from('videos')
          .createSignedUrl(video.storage_path, 60); // 60 second expiry for test
        
        if (error) {
          if (error.message && error.message.includes('not found')) {
            results.notFound.push({
              videoId: video.id,
              title: video.title,
              path: video.storage_path,
              error: error.message
            });
          } else if (error.message && (error.message.includes('permission') || 
                                       error.message.includes('access') || 
                                       error.message.includes('denied'))) {
            results.permissionIssue.push({
              videoId: video.id,
              title: video.title,
              path: video.storage_path,
              error: error.message
            });
          } else {
            results.otherErrors.push({
              videoId: video.id,
              title: video.title,
              path: video.storage_path,
              error: error.message
            });
          }
        } else {
          results.accessible.push({
            videoId: video.id,
            title: video.title,
            path: video.storage_path,
            url: data.signedUrl
          });
        }
      } catch (err) {
        results.otherErrors.push({
          videoId: video.id,
          title: video.title,
          path: video.storage_path,
          error: err.message
        });
      }
    }

    // 4. Print summary results
    console.log('\n=== STORAGE PERMISSION DIAGNOSTIC RESULTS ===');
    console.log(`Total videos checked: ${videos.length}`);
    console.log(`Accessible videos: ${results.accessible.length}`);
    console.log(`Files not found: ${results.notFound.length}`);
    console.log(`Permission issues: ${results.permissionIssue.length}`);
    console.log(`Other errors: ${results.otherErrors.length}`);
    console.log(`Videos with deleted clients: ${results.deletedClients.length}`);

    // 5. Print detailed results for issues
    if (results.notFound.length > 0) {
      console.log('\n=== FILES NOT FOUND ===');
      results.notFound.forEach(item => {
        console.log(`Video ID: ${item.videoId}`);
        console.log(`Title: ${item.title}`);
        console.log(`Path: ${item.path}`);
        console.log(`Error: ${item.error}`);
        console.log('---');
      });
    }

    if (results.permissionIssue.length > 0) {
      console.log('\n=== PERMISSION ISSUES ===');
      results.permissionIssue.forEach(item => {
        console.log(`Video ID: ${item.videoId}`);
        console.log(`Title: ${item.title}`);
        console.log(`Path: ${item.path}`);
        console.log(`Error: ${item.error}`);
        console.log('---');
      });
    }

    if (results.deletedClients.length > 0) {
      console.log('\n=== VIDEOS WITH DELETED CLIENTS ===');
      results.deletedClients.forEach(item => {
        console.log(`Video ID: ${item.videoId}`);
        console.log(`Title: ${item.title}`);
        console.log(`Path: ${item.path}`);
        console.log(`Client ID (deleted): ${item.clientId}`);
        console.log('---');
      });
    }

    console.log('\nDiagnostic complete.');
  } catch (err) {
    console.error('Error running storage permission diagnostic:', err);
  }
}

// Execute the function
checkStoragePermissions().catch(console.error);
