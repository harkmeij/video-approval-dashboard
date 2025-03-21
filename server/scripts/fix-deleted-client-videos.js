/**
 * Fix-Deleted-Client-Videos Script
 * 
 * This script identifies videos associated with deleted clients and fixes their
 * permissions in Supabase Storage. It can also reassign videos to a different client
 * or an admin account when needed.
 * 
 * Usage: node scripts/fix-deleted-client-videos.js [--reassign-to <user_id>]
 * 
 * Options:
 *   --reassign-to <user_id>: Reassign orphaned videos to this user ID (must be an editor or specified client)
 *   --dry-run: Don't make any changes, just show what would be done
 */
require('dotenv').config();
const supabase = require('../config/supabase');

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
let reassignToUserId = null;

// Check for reassign-to parameter
const reassignIndex = args.indexOf('--reassign-to');
if (reassignIndex !== -1 && args.length > reassignIndex + 1) {
  reassignToUserId = args[reassignIndex + 1];
}

async function fixDeletedClientVideos() {
  console.log(`Starting deleted client video fix script${dryRun ? ' (DRY RUN)' : ''}...`);

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

    // 2. Check if each client still exists
    const clientIds = [...new Set(videos.map(video => video.client_id))];

    const { data: existingClients, error: clientsError } = await supabase
      .from('users')
      .select('id, name, role')
      .in('id', clientIds);

    if (clientsError) {
      console.error('Error fetching clients:', clientsError);
      return;
    }

    const existingClientIds = new Set(existingClients.map(client => client.id));
    
    // Track existing clients with their details
    const clientDetails = {};
    existingClients.forEach(client => {
      clientDetails[client.id] = {
        name: client.name,
        role: client.role
      };
    });

    // 3. Find an editor account for reassignment if none specified
    let reassignmentTarget = null;
    
    if (reassignToUserId) {
      // Check if specified user exists and is an editor or client
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id, name, role')
        .eq('id', reassignToUserId)
        .single();
      
      if (userError) {
        console.error(`Error finding specified user ${reassignToUserId}:`, userError);
        return;
      }
      
      if (!user) {
        console.error(`Specified user ID ${reassignToUserId} not found`);
        return;
      }
      
      console.log(`Will reassign videos to: ${user.name} (${user.role}, ID: ${user.id})`);
      reassignmentTarget = user;
    } else {
      // Find an editor to assign to if no user specified
      const { data: editors, error: editorsError } = await supabase
        .from('users')
        .select('id, name')
        .eq('role', 'editor')
        .limit(1);
      
      if (editorsError) {
        console.error('Error finding editor accounts:', editorsError);
        return;
      }
      
      if (editors && editors.length > 0) {
        reassignmentTarget = editors[0];
        console.log(`Will reassign videos to editor: ${reassignmentTarget.name} (ID: ${reassignmentTarget.id})`);
      } else {
        console.error('No editor accounts found for reassignment');
        return;
      }
    }

    // 4. Identify videos with deleted clients
    const orphanedVideos = videos.filter(video => !existingClientIds.has(video.client_id));

    // 5. Process each orphaned video
    const results = {
      successful: [],
      failed: []
    };

    for (const video of orphanedVideos) {
      try {
        // Update video in database to point to new owner
        if (!dryRun) {
          const { data: updatedVideo, error: updateError } = await supabase
            .from('videos')
            .update({ client_id: reassignmentTarget.id })
            .eq('id', video.id)
            .select();
          
          if (updateError) {
            console.error(`  Error updating video in database:`, updateError);
            results.failed.push({
              id: video.id,
              title: video.title,
              error: updateError.message
            });
            continue;
          }
          
          console.log(`  ✓ Updated video owner to ${reassignmentTarget.name} (ID: ${reassignmentTarget.id})`);
          
          results.successful.push({
            id: video.id,
            title: video.title,
            newClientId: reassignmentTarget.id
          });
        } else {
          console.log(`  Would update video owner to ${reassignmentTarget.name} (ID: ${reassignmentTarget.id})`);
        }
      } catch (err) {
        console.error(`  Error processing video ${video.id}:`, err);
        results.failed.push({
          id: video.id,
          title: video.title,
          error: err.message
        });
      }
    }

    // 6. Print summary
    console.log('\n=== SUMMARY ===');
    console.log(`Total orphaned videos found: ${orphanedVideos.length}`);
    if (!dryRun) {
      console.log(`Successfully updated: ${results.successful.length}`);
      console.log(`Failed to update: ${results.failed.length}`);
    } else {
      console.log(`Would update: ${orphanedVideos.length} videos`);
    }

    console.log('\nScript completed. Run the check-storage-permissions.js script to verify the results.');
  } catch (err) {
    console.error('Error running fix script:', err);
  }
}

// Execute the function
fixDeletedClientVideos().catch(console.error);
