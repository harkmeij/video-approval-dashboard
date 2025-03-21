const supabase = require('../config/supabase');

async function createVideoDirectly() {
  try {
    console.log('Attempting to create video directly in Supabase...');
    
    // Using real IDs from earlier tests
    const videoData = {
      title: 'Direct Test Upload',
      description: 'This is a test video created directly in the database',
      month_id: '5813fea6-ad87-4d79-bdb5-449a77d507cf',
      client_id: '6ea593b6-dfb9-4a6e-937e-a3ca78a40ef9',
      created_by: '09a4f1d6-66a3-49e7-98d1-eb78de72f92a',
      status: 'pending',
      storage_path: 'test/path/direct-test.mp4',
      file_size: 1024,
      content_type: 'video/mp4',
      dropbox_link: 'https://placeholder-link',
      dropbox_file_id: 'placeholder-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    console.log('Video data:', JSON.stringify(videoData, null, 2));
    
    // Insert directly into the videos table
    const { data, error } = await supabase
      .from('videos')
      .insert([videoData])
      .select();
    
    if (error) {
      console.error('Error creating video:', error);
      if (error.details) {
        console.error('Error details:', error.details);
      }
      if (error.hint) {
        console.error('Error hint:', error.hint);
      }
    } else {
      console.log('Video created successfully:', JSON.stringify(data, null, 2));
    }
    
  } catch (err) {
    console.error('Exception during video creation:', err);
  }
}

// Run the function
createVideoDirectly()
  .then(() => console.log('Finished'))
  .catch(err => console.error('Fatal error:', err))
  .finally(() => process.exit());
