require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { createClient } = require('@supabase/supabase-js');

console.log('Environment variables:');
console.log('PROJECT_URL:', process.env.PROJECT_URL);
console.log('SUPABASE_API_KEY:', process.env.SUPABASE_API_KEY ? 'Defined (not showing for security)' : 'NOT DEFINED');

// Get Supabase credentials from environment variables
const SUPABASE_URL = process.env.PROJECT_URL;
const SUPABASE_KEY = process.env.SUPABASE_API_KEY;

// Verify that environment variables are properly loaded
if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: Missing Supabase credentials in environment variables.');
  console.error('Make sure PROJECT_URL and SUPABASE_API_KEY are set in the .env file.');
  process.exit(1);
}

// Initialize Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

/**
 * This script sets up the Supabase storage bucket and policies for video hosting
 */
const setupSupabaseStorage = async () => {
  try {
    console.log('Setting up Supabase Storage for video hosting...');
    
    // Step 1: Create the videos bucket if it doesn't exist
    console.log('Creating videos bucket...');
    const { data: bucketData, error: bucketError } = await supabase
      .storage
      .createBucket('videos', {
        public: false, // Set to private bucket
        // Don't specify a file size limit, use default instead
      });
    
    if (bucketError) {
      if (bucketError.message.includes('already exists')) {
        console.log('Bucket already exists, skipping creation');
      } else {
        console.error('Error creating bucket:', bucketError);
        return;
      }
    } else {
      console.log('Bucket created successfully:', bucketData);
    }
    
    console.log('Supabase Storage setup completed!');
    console.log('\nNOTE: You need to set up RLS policies through the Supabase dashboard:');
    console.log('1. Go to Storage > Policies in your Supabase dashboard');
    console.log('2. For the "videos" bucket, create the following policies:');
    console.log(`
    # Policy for editors to upload videos
    CREATE POLICY "Editors can upload videos"
    ON storage.objects FOR INSERT
    TO authenticated
    USING (
      bucket_id = 'videos' AND
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'editor'
      )
    );
    
    # Policy for users to view their own videos
    CREATE POLICY "Users can view their own videos" 
    ON storage.objects FOR SELECT
    TO authenticated
    USING (
      bucket_id = 'videos' AND 
      (
        -- Client can access their own folder
        (storage.foldername(name))[1] = 'clients' AND
        (storage.foldername(name))[2] = auth.uid()::text
        OR
        -- Editors can access all videos
        EXISTS (
          SELECT 1 FROM users
          WHERE id = auth.uid() AND role = 'editor'
        )
      )
    );
    
    # Policy for editors to delete videos
    CREATE POLICY "Editors can delete videos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
      bucket_id = 'videos' AND
      EXISTS (
        SELECT 1 FROM users
        WHERE id = auth.uid() AND role = 'editor'
      )
    );
    `);
    
  } catch (error) {
    console.error('Unexpected error during setup:', error);
  }
};

// Run the setup
setupSupabaseStorage();
