const supabase = require('../config/supabase');

class SocialMediaAccount {
  // Find an account by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('social_media_accounts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // Find accounts by client ID
  static async findByClientId(clientId) {
    const { data, error } = await supabase
      .from('social_media_accounts')
      .select('*')
      .eq('client_id', clientId);
    
    if (error) throw error;
    return data;
  }
  
  // Get all accounts
  static async findAll() {
    const { data, error } = await supabase
      .from('social_media_accounts')
      .select('*, users:client_id(id, name, email)');
    
    if (error) throw error;
    return data;
  }
  
  // Create a new social media account
  static async create(accountData) {
    const { data, error } = await supabase
      .from('social_media_accounts')
      .insert(accountData)
      .select();
    
    if (error) throw error;
    return data[0];
  }
  
  // Update an account
  static async update(id, accountData) {
    const { data, error } = await supabase
      .from('social_media_accounts')
      .update(accountData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  }
  
  // Delete an account
  static async delete(id) {
    const { error } = await supabase
      .from('social_media_accounts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  }
  
  // Get platforms by client
  static async getPlatformsByClient(clientId) {
    const { data, error } = await supabase
      .from('social_media_accounts')
      .select('platform')
      .eq('client_id', clientId)
      .order('platform');
    
    if (error) throw error;
    return data.map(item => item.platform);
  }
}

module.exports = SocialMediaAccount;
