const supabase = require('../config/supabase');

class SupabaseVideo {
  // Find a video by ID
  static async findById(id) {
    try {
      console.log('Finding video by ID:', id);
      const { data, error } = await supabase
        .from('videos')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error finding video by ID:', error);
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error('Exception in findById:', err);
      throw err;
    }
  }
  
  // Find videos with filters
  static async find(filter = {}) {
    try {
      console.log('Finding videos with filter:', JSON.stringify(filter, null, 2));
      let query = supabase.from('videos').select('*');
      
      // Apply filters if provided
      if (filter.month_id) {
        query = query.eq('month_id', filter.month_id);
      }
      
      if (filter.client_id) {
        query = query.eq('client_id', filter.client_id);
      }
      
      if (filter.status) {
        query = query.eq('status', filter.status);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error finding videos:', error);
        throw error;
      }
      
      console.log(`Found ${data ? data.length : 0} videos matching filter`);
      return data;
    } catch (err) {
      console.error('Exception in find:', err);
      throw err;
    }
  }
  
  // Create a new video
  static async create(videoData) {
    try {
      console.log('Creating video with data:', JSON.stringify(videoData, null, 2));
      
      // Check if month_id is null - this is a critical field according to the DB schema
      if (!videoData.month_id) {
        console.warn('Warning: Attempting to create video without month_id, which may violate DB constraints');
      }
      
      // Make a copy to avoid modifying the original data
      const processedData = { ...videoData };
      
      // Add created_at if not present
      if (!processedData.created_at) {
        processedData.created_at = new Date().toISOString();
      }
      
      // Add updated_at if not present
      if (!processedData.updated_at) {
        processedData.updated_at = new Date().toISOString();
      }
      
      // Storage fields are now the primary fields - ensure they're present
      if (!processedData.storage_path) {
        console.warn('Warning: No storage_path provided for video');
      }
      
      // Ensure client_id is a string
      if (processedData.client_id && typeof processedData.client_id !== 'string') {
        processedData.client_id = String(processedData.client_id);
      }
      
      // Log the final data being sent to Supabase
      console.log('Final video data for Supabase:', JSON.stringify(processedData, null, 2));
      
      // Try direct insertion using a more careful approach
      try {
        // Add additional safe mode data validation
        if (!processedData.month_id || typeof processedData.month_id !== 'string') {
          console.error('VALIDATION ERROR: month_id is invalid or missing:', processedData.month_id);
          throw new Error(`Invalid month_id: ${processedData.month_id}. It must be a string UUID.`);
        }
        
        if (!processedData.client_id || typeof processedData.client_id !== 'string') {
          console.error('VALIDATION ERROR: client_id is invalid or missing:', processedData.client_id);
          throw new Error(`Invalid client_id: ${processedData.client_id}. It must be a string UUID.`);
        }
        
        if (!processedData.created_by || typeof processedData.created_by !== 'string') {
          console.error('VALIDATION ERROR: created_by is invalid or missing:', processedData.created_by);
          throw new Error(`Invalid created_by: ${processedData.created_by}. It must be a string UUID.`);
        }
        
        if (!processedData.storage_path || typeof processedData.storage_path !== 'string') {
          console.error('VALIDATION ERROR: storage_path is invalid or missing:', processedData.storage_path);
          throw new Error(`Invalid storage_path: ${processedData.storage_path}. It must be a string.`);
        }
        
        // Remove any Dropbox fields - they don't exist in the database schema
        if ('dropbox_file_id' in processedData) {
          console.log('Removing dropbox_file_id field, not in schema');
          delete processedData.dropbox_file_id;
        }
        
        if ('dropbox_link' in processedData) {
          console.log('Removing dropbox_link field, not in schema');
          delete processedData.dropbox_link;
        }
        
        // Strip any monthInfo if it's still in the processed data
        if (processedData.monthInfo) {
          console.log('Removing monthInfo from database insert:', processedData.monthInfo);
          delete processedData.monthInfo;
        }
        
        console.log('After final validation, sending data to Supabase:', JSON.stringify(processedData, null, 2));
        const { data, error } = await supabase
          .from('videos')
          .insert([processedData])
          .select();
        
        if (error) {
          console.error('Error creating video:', error);
          console.error('Error code:', error.code);
          console.error('Error details:', error.details || 'No details');
          console.error('Error hint:', error.hint || 'No hint');
          throw error;
        }
        
        console.log('Video created successfully:', data ? data[0] : null);
        return data[0];
      } catch (insertErr) {
        console.error('Exception during insert operation:', insertErr);
        throw insertErr;
      }
    } catch (err) {
      console.error('Exception in create:', err);
      throw err;
    }
  }
  
  // Update a video by ID
  static async findByIdAndUpdate(id, update, options = {}) {
    const { $set } = update;
    
    const { data, error } = await supabase
      .from('videos')
      .update($set)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    
    // If options.new is true, return the updated document
    if (options.new && data && data.length > 0) {
      return data[0];
    }
    
    return null;
  }
  
  // Delete a video
  static async findByIdAndDelete(id) {
    const { error } = await supabase
      .from('videos')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { deletedCount: 1 };
  }
}

module.exports = SupabaseVideo;
