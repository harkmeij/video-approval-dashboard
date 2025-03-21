const supabase = require('../config/supabase');
const { comparePassword } = require('../utils/passwordUtils');

class SupabaseUser {
  // Find a user by ID
  static async findById(id, projection = '*') {
    const { data, error } = await supabase
      .from('users')
      .select(projection === '-password' ? 'id,email,name,role,active,created_at,website_url,keywords,location' : projection)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // Find a user by email
  static async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "No rows found"
    return data;
  }
  
  // Get all users
  static async find(filter = {}, projection = '*') {
    let query = supabase.from('users').select(projection);
    
    // Apply filters if provided
    if (filter.role) {
      query = query.eq('role', filter.role);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    
    // If we're excluding password, filter it out
    if (projection === '-password') {
      return data.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
    }
    
    return data;
  }
  
  // Count documents
  static async countDocuments(filter = {}) {
    let query = supabase.from('users').select('id', { count: 'exact' });
    
    // Apply filters if provided
    if (filter.role) {
      query = query.eq('role', filter.role);
    }
    
    const { count, error } = await query;
    
    if (error) throw error;
    return count;
  }
  
  // Update a user by ID
  static async findByIdAndUpdate(id, update, options = {}) {
    const { $set } = update;
    
    const { data, error } = await supabase
      .from('users')
      .update($set)
      .eq('id', id)
      .select('*');
    
    if (error) throw error;
    
    // If options.new is true, return the updated document
    if (options.new && data && data.length > 0) {
      return data[0];
    }
    
    return null;
  }
  
  // Delete a user
  static async deleteOne(id) {
    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { deletedCount: 1 };
  }
  
  // Compare password (instance method simulation)
  static async comparePassword(userId, candidatePassword) {
    const { data, error } = await supabase
      .from('users')
      .select('password')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    if (!data) return false;
    
    return comparePassword(candidatePassword, data.password);
  }
  
  // Save method for updating user (instance method simulation)
  static async save(user) {
    const { data, error } = await supabase
      .from('users')
      .update(user)
      .eq('id', user.id)
      .select();
    
    if (error) throw error;
    return data && data.length > 0 ? data[0] : null;
  }
}

module.exports = SupabaseUser;
