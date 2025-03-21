const supabase = require('../config/supabase');

class SocialMediaPost {
  // Find post by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('social_media_posts')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // Find posts by account ID
  static async findByAccountId(accountId) {
    const { data, error } = await supabase
      .from('social_media_posts')
      .select('*')
      .eq('account_id', accountId)
      .order('published_date', { ascending: false });
    
    if (error) throw error;
    return data;
  }
  
  // Find posts by month ID
  static async findByMonthId(monthId) {
    const { data, error } = await supabase
      .from('social_media_posts')
      .select('*, social_media_accounts!inner(*)')
      .eq('month_id', monthId);
    
    if (error) throw error;
    return data;
  }
  
  // Find posts for a client (across all their accounts)
  static async findByClientId(clientId) {
    const { data, error } = await supabase
      .from('social_media_posts')
      .select(`
        *,
        social_media_accounts!inner(
          *,
          users!inner(*)
        )
      `)
      .eq('social_media_accounts.client_id', clientId)
      .order('published_date', { ascending: false });
    
    if (error) throw error;
    return data;
  }
  
  // Create new post
  static async create(postData) {
    const { data, error } = await supabase
      .from('social_media_posts')
      .insert(postData)
      .select();
    
    if (error) throw error;
    return data[0];
  }
  
  // Update post
  static async update(id, postData) {
    const { data, error } = await supabase
      .from('social_media_posts')
      .update(postData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  }
  
  // Delete post
  static async delete(id) {
    const { error } = await supabase
      .from('social_media_posts')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  }
  
  // Get posts by date range for an account
  static async getByDateRange(accountId, startDate, endDate) {
    const { data, error } = await supabase
      .from('social_media_posts')
      .select('*')
      .eq('account_id', accountId)
      .gte('published_date', startDate)
      .lte('published_date', endDate)
      .order('published_date');
    
    if (error) throw error;
    return data;
  }
  
  // Get top performing posts for an account based on a specified metric
  static async getTopPosts(accountId, metricName = 'engagement_rate', limit = 5) {
    const { data, error } = await supabase
      .from('social_media_posts')
      .select('*')
      .eq('account_id', accountId)
      .order(metricName, { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }
  
  // Get posts by post type
  static async getByPostType(accountId, postType) {
    const { data, error } = await supabase
      .from('social_media_posts')
      .select('*')
      .eq('account_id', accountId)
      .eq('post_type', postType)
      .order('published_date', { ascending: false });
    
    if (error) throw error;
    return data;
  }
  
  // Get recent posts
  static async getRecentPosts(accountId, limit = 10) {
    const { data, error } = await supabase
      .from('social_media_posts')
      .select('*')
      .eq('account_id', accountId)
      .order('published_date', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }
  
  // Calculate average engagement for an account's posts
  static async calculateAverageEngagement(accountId, metricName = 'engagement_rate') {
    const { data, error } = await supabase
      .from('social_media_posts')
      .select(metricName)
      .eq('account_id', accountId);
    
    if (error) throw error;
    
    if (data.length === 0) return 0;
    
    const sum = data.reduce((total, post) => {
      return total + (post[metricName] || 0);
    }, 0);
    
    return sum / data.length;
  }
  
  // Get monthly post summary
  static async getMonthlyPostSummary(accountId) {
    const { data, error } = await supabase
      .from('social_media_posts')
      .select(`
        *,
        months(name, year, month)
      `)
      .eq('account_id', accountId)
      .order('published_date', { ascending: false });
    
    if (error) throw error;
    
    // Group by month
    const groupedByMonth = {};
    data.forEach(post => {
      if (post.month_id) {
        const monthKey = post.months ? `${post.months.year}-${post.months.month}` : post.month_id;
        if (!groupedByMonth[monthKey]) {
          groupedByMonth[monthKey] = {
            monthId: post.month_id,
            monthName: post.months ? post.months.name : `${post.published_date.substring(0, 7)}`,
            posts: [],
            metrics: {
              totalPosts: 0,
              totalLikes: 0,
              totalComments: 0,
              totalShares: 0,
              averageEngagement: 0
            }
          };
        }
        
        groupedByMonth[monthKey].posts.push(post);
        
        // Update metrics
        const metrics = groupedByMonth[monthKey].metrics;
        metrics.totalPosts++;
        metrics.totalLikes += post.likes || 0;
        metrics.totalComments += post.comments || 0;
        metrics.totalShares += post.shares || 0;
      }
    });
    
    // Calculate average engagement
    Object.values(groupedByMonth).forEach(month => {
      if (month.metrics.totalPosts > 0) {
        const totalEngagement = month.posts.reduce((sum, post) => sum + (post.engagement_rate || 0), 0);
        month.metrics.averageEngagement = totalEngagement / month.metrics.totalPosts;
      }
    });
    
    return Object.values(groupedByMonth);
  }
}

module.exports = SocialMediaPost;
