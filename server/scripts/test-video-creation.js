const Video = require('../models/Video');

async function testVideoCreation() {
  try {
    console.log('Testing video creation...');
    
    // Use the month ID found from the previous test
    const monthId = '5813fea6-ad87-4d79-bdb5-449a77d507cf';
    
    // Test data - using actual IDs from the system
    const videoData = {
      title: 'Test Video Upload',
      description: 'This is a test video for debugging',
      month_id: monthId,
      client_id: '6ea593b6-dfb9-4a6e-937e-a3ca78a40ef9', // Actual client ID from error message
      created_by: '09a4f1d6-66a3-49e7-98d1-eb78de72f92a', // Editor ID from month creation
      status: 'pending',
      // Storage info
      storage_path: 'test/path/video.mp4',
      file_size: 1000,
      content_type: 'video/mp4',
      // Dropbox info (required by schema)
      dropbox_link: 'https://placeholder-link',
      dropbox_file_id: 'placeholder-id'
    };
    
    console.log('Attempting to create video with data:', JSON.stringify(videoData, null, 2));
    
    // Create a new video
    const result = await Video.create(videoData);
    console.log('Video creation result:', JSON.stringify(result, null, 2));
    console.log('Successfully created video');
    
  } catch (err) {
    console.error('Error:', err);
    if (err.details) {
      console.error('Details:', err.details);
    }
    if (err.hint) {
      console.error('Hint:', err.hint);
    }
    console.error('Stack:', err.stack);
  }
}

// Set up error handler for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:');
  console.error(err);
  process.exit(1);
});

// Run the test with more extensive error handling
console.log('Starting test...');
testVideoCreation()
  .then(() => console.log('Test completed successfully!'))
  .catch(err => {
    console.error('Test failed with caught error:');
    console.error(err);
    if (err.message) console.error('Error message:', err.message);
    if (err.code) console.error('Error code:', err.code);
  })
  .finally(() => {
    console.log('Test execution finished, exiting...');
    process.exit();
  });
