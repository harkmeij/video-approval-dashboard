const supabase = require('../config/supabase');

class SupabaseMonth {
  // Find a month by ID
  static async findById(id) {
    try {
      console.log('Finding month by ID:', id);
      const { data, error } = await supabase
        .from('months')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) {
        console.error('Error finding month by ID:', error);
        throw error;
      }
      
      return data;
    } catch (err) {
      console.error('Exception in findById:', err);
      throw err;
    }
  }
  
  // Find months with filters
  static async find(filter = {}) {
    try {
      console.log('Finding months with filter:', JSON.stringify(filter, null, 2));
      let query = supabase.from('months').select('*');
      
      // Apply filters if provided
      if (filter.year) {
        // Ensure year is an integer
        const yearInt = parseInt(filter.year, 10);
        console.log(`Month filter: Converting year ${filter.year} (${typeof filter.year}) to ${yearInt} (${typeof yearInt})`);
        query = query.eq('year', yearInt);
      }
      
      if (filter.month) {
        // Ensure month is an integer
        const monthInt = parseInt(filter.month, 10); 
        console.log(`Month filter: Converting month ${filter.month} (${typeof filter.month}) to ${monthInt} (${typeof monthInt})`);
        query = query.eq('month', monthInt);
      }
      
      // Handle client_id filter if present (for backward compatibility)
      // but log a warning that it will be ignored
      if (filter.client_id) {
        console.warn('client_id filter provided but ignored - months are now global');
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error finding months:', error);
        throw error;
      }
      
      console.log(`Found ${data ? data.length : 0} months matching filter`);
      return data;
    } catch (err) {
      console.error('Exception in find:', err);
      throw err;
    }
  }
  
  // Create a new month
  static async create(monthData) {
    try {
      console.log('Creating month with data:', JSON.stringify(monthData, null, 2));
      
      // Remove client_id if present (for backward compatibility)
      if (monthData.client_id) {
        console.warn('client_id provided in monthData but will be ignored - months are now global');
        delete monthData.client_id;
      }
      
      // Ensure month and year are integers
      if (monthData.month) {
        monthData.month = parseInt(monthData.month, 10);
        console.log(`Month create: Ensuring month is an integer: ${monthData.month} (${typeof monthData.month})`);
      }
      
      if (monthData.year) {
        monthData.year = parseInt(monthData.year, 10);
        console.log(`Month create: Ensuring year is an integer: ${monthData.year} (${typeof monthData.year})`);
      }
      
      const { data, error } = await supabase
        .from('months')
        .insert([monthData])
        .select();
      
      if (error) {
        console.error('Error creating month:', error);
        throw error;
      }
      
      console.log('Month created successfully:', data ? data[0] : null);
      return data[0];
    } catch (err) {
      console.error('Exception in create:', err);
      throw err;
    }
  }
  
  // Update a month by ID
  static async findByIdAndUpdate(id, update, options = {}) {
    const { $set } = update;
    
    const { data, error } = await supabase
      .from('months')
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
  
  // Delete a month
  static async findByIdAndDelete(id) {
    const { error } = await supabase
      .from('months')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { deletedCount: 1 };
  }
}

module.exports = SupabaseMonth;
