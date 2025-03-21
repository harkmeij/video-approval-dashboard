const supabase = require('../config/supabase');

async function inspectSchema() {
  try {
    console.log('Inspecting schema for videos table...');
    
    // Get schema information for the videos table
    const { data: videosSchema, error: videosError } = await supabase
      .from('videos')
      .select('*')
      .limit(1);
    
    if (videosError) {
      console.error('Error retrieving videos schema:', videosError);
    } else {
      console.log('Sample video record:', JSON.stringify(videosSchema, null, 2));
      
      // List all videos to see structure
      const { data: allVideos, error: allVideosError } = await supabase
        .from('videos')
        .select('*')
        .limit(5);
      
      if (allVideosError) {
        console.error('Error retrieving videos:', allVideosError);
      } else {
        console.log('Recent videos (up to 5):', JSON.stringify(allVideos, null, 2));
        
        if (allVideos && allVideos.length > 0) {
          console.log('Video schema columns:');
          const columns = Object.keys(allVideos[0]);
          console.log(columns);
        }
      }
    }
    
    // Check if client ID exists
    const clientId = '6ea593b6-dfb9-4a6e-937e-a3ca78a40ef9';
    console.log(`Checking if client exists with ID: ${clientId}`);
    
    const { data: clientData, error: clientError } = await supabase
      .from('users')
      .select('*')
      .eq('id', clientId)
      .single();
    
    if (clientError) {
      console.error('Error checking client:', clientError);
    } else {
      console.log('Client found:', JSON.stringify(clientData, null, 2));
    }
    
  } catch (err) {
    console.error('Error in schema inspection:', err);
  }
}

// Run the test
inspectSchema()
  .then(() => console.log('Schema inspection completed'))
  .catch(err => console.error('Schema inspection failed:', err))
  .finally(() => process.exit());
