const Video = require('../models/Video');
const supabase = require('../config/supabase');

async function verifyFix() {
  console.log('Verifying video creation with updated model...');
  
  // Using real IDs from earlier tests
  const monthId = '5813fea6-ad87-4d79-bdb5-449a77d507cf';
  const clientId = '6ea593b6-dfb9-4a6e-937e-a3ca78a40ef9';
  const editorId = '09a4f1d6-66a3-49e7-98d1-eb78de72f92a';
  
  try {
    // First, verify we can list existing videos
    console.log(`Checking existing videos for client ${clientId}...`);
    const existingVideos = await Video.find({ client_id: clientId });
    console.log(`Found ${existingVideos.length} existing videos for this client`);
    
    // Create a test video with an identifiable name
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const videoData = {
      title: `Verification Test Video ${timestamp}`,
      description: 'This video confirms the fix is working',
      month_id: monthId,
      client_id: clientId,
      created_by: editorId,
      status: 'pending',
      storage_path: `test/fix-verification-${timestamp}.mp4`,
      file_size: 2048,
      content_type: 'video/mp4'
    };
    
    console.log('Creating test video with data:', JSON.stringify(videoData, null, 2));
    
    // Create the video using our fixed model
    const createdVideo = await Video.create(videoData);
    console.log('Test video created successfully:', JSON.stringify(createdVideo, null, 2));
    
    // Verify we can find the newly created video
    console.log('Verifying new video shows up in client videos list...');
    const updatedVideos = await Video.find({ client_id: clientId });
    console.log(`Now found ${updatedVideos.length} videos for this client`);
    
    if (updatedVideos.length > existingVideos.length) {
      console.log('✅ FIX VERIFIED: Video count increased after creation');
      
      // Find our test video in the list
      const foundVideo = updatedVideos.find(v => v.title === videoData.title);
      if (foundVideo) {
        console.log('✅ FIX VERIFIED: Newly created video found in client videos list');
        console.log('Video details:', JSON.stringify(foundVideo, null, 2));
      } else {
        console.log('❌ VERIFICATION FAILED: Created video not found in client videos list');
      }
    } else {
      console.log('❌ VERIFICATION FAILED: Video count did not increase after creation');
    }
    
  } catch (err) {
    console.error('Error in verification:', err);
    if (err.details) console.error('Error details:', err.details);
    console.error('Stack:', err.stack);
  }
}

// Run the verification
verifyFix()
  .then(() => console.log('Verification completed'))
  .catch(err => console.error('Verification failed with error:', err))
  .finally(() => process.exit());
