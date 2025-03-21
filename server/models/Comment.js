const supabase = require('../config/supabase');

class SupabaseComment {
  // Find comments with filters
  static async find(filter = {}) {
    let query = supabase.from('comments').select('*');
    
    // Apply filters if provided
    if (filter.video_id) {
      query = query.eq('video_id', filter.video_id);
    }
    
    if (filter.user_id) {
      query = query.eq('user_id', filter.user_id);
    }
    
    if (filter.resolved !== undefined) {
      query = query.eq('resolved', filter.resolved);
    }
    
    // Add sorting if needed
    if (filter.sort) {
      query = query.order(filter.sort.field, { ascending: filter.sort.ascending });
    } else {
      // Default sort by created_at descending
      query = query.order('created_at', { ascending: false });
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  }
  
  // Create a new comment
  static async create(commentData) {
    // Set default resolved status to false if not provided
    if (commentData.resolved === undefined) {
      commentData.resolved = false;
    }
    
    const { data, error } = await supabase
      .from('comments')
      .insert([commentData])
      .select();
    
    if (error) throw error;
    return data[0];
  }
  
  // Find a comment by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('comments')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // Update a comment
  static async findByIdAndUpdate(id, updateData) {
    const { data, error } = await supabase
      .from('comments')
      .update(updateData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  }
  
  // Delete a comment
  static async findByIdAndDelete(id) {
    const { error } = await supabase
      .from('comments')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { deletedCount: 1 };
  }
  
  // Delete many comments
  static async deleteMany(filter = {}) {
    let query = supabase.from('comments').delete();
    
    // Apply filters
    if (filter.video_id) {
      query = query.eq('video_id', filter.video_id);
    }
    
    const { error } = await query;
    
    if (error) throw error;
    return { acknowledged: true };
  }
  
  // Resolve or unresolve a comment
  static async toggleResolved(id, resolved = true) {
    return this.findByIdAndUpdate(id, { resolved });
  }
}

module.exports = SupabaseComment;
