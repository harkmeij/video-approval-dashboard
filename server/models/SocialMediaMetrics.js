const supabase = require('../config/supabase');

class SocialMediaMetrics {
  // Find metrics by ID
  static async findById(id) {
    const { data, error } = await supabase
      .from('social_media_metrics')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }
  
  // Find metrics by account ID
  static async findByAccountId(accountId) {
    const { data, error } = await supabase
      .from('social_media_metrics')
      .select('*')
      .eq('account_id', accountId)
      .order('record_date', { ascending: false });
    
    if (error) throw error;
    return data;
  }
  
  // Find metrics by month ID
  static async findByMonthId(monthId) {
    const { data, error } = await supabase
      .from('social_media_metrics')
      .select('*, social_media_accounts!inner(*)')
      .eq('month_id', monthId);
    
    if (error) throw error;
    return data;
  }
  
  // Find metrics for a client (across all their accounts)
  static async findByClientId(clientId) {
    const { data, error } = await supabase
      .from('social_media_metrics')
      .select(`
        *,
        social_media_accounts!inner(
          *,
          users!inner(*)
        )
      `)
      .eq('social_media_accounts.client_id', clientId)
      .order('record_date', { ascending: false });
    
    if (error) throw error;
    return data;
  }
  
  // Create new metrics
  static async create(metricsData) {
    const { data, error } = await supabase
      .from('social_media_metrics')
      .insert(metricsData)
      .select();
    
    if (error) throw error;
    return data[0];
  }
  
  // Update metrics
  static async update(id, metricsData) {
    const { data, error } = await supabase
      .from('social_media_metrics')
      .update(metricsData)
      .eq('id', id)
      .select();
    
    if (error) throw error;
    return data[0];
  }
  
  // Delete metrics
  static async delete(id) {
    const { error } = await supabase
      .from('social_media_metrics')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    return { success: true };
  }
  
  // Get metrics by date range for an account
  static async getByDateRange(accountId, startDate, endDate) {
    const { data, error } = await supabase
      .from('social_media_metrics')
      .select('*')
      .eq('account_id', accountId)
      .gte('record_date', startDate)
      .lte('record_date', endDate)
      .order('record_date');
    
    if (error) throw error;
    return data;
  }
  
  // Get latest metrics for an account
  static async getLatest(accountId) {
    const { data, error } = await supabase
      .from('social_media_metrics')
      .select('*')
      .eq('account_id', accountId)
      .order('record_date', { ascending: false })
      .limit(1)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "No rows found"
    return data;
  }
  
  // Calculate growth for an account over a period
  static async calculateGrowth(accountId, metricName, startDate, endDate) {
    try {
      // Get metrics at start and end of period
      const [startMetrics, endMetrics] = await Promise.all([
        // Find closest record to start date
        supabase
          .from('social_media_metrics')
          .select('*')
          .eq('account_id', accountId)
          .lte('record_date', startDate)
          .order('record_date', { ascending: false })
          .limit(1)
          .single(),
        
        // Find closest record to end date
        supabase
          .from('social_media_metrics')
          .select('*')
          .eq('account_id', accountId)
          .lte('record_date', endDate)
          .order('record_date', { ascending: false })
          .limit(1)
          .single()
      ]);
      
      if (startMetrics.error && startMetrics.error.code !== 'PGRST116') 
        throw startMetrics.error;
      
      if (endMetrics.error && endMetrics.error.code !== 'PGRST116')
        throw endMetrics.error;
      
      // If we don't have both start and end data, return null
      if (!startMetrics.data || !endMetrics.data) return null;
      
      // Calculate growth
      const startValue = startMetrics.data[metricName] || 0;
      const endValue = endMetrics.data[metricName] || 0;
      
      if (startValue === 0) return null; // Avoid division by zero
      
      const absoluteGrowth = endValue - startValue;
      const percentageGrowth = (absoluteGrowth / startValue) * 100;
      
      return {
        startValue,
        endValue,
        absoluteGrowth,
        percentageGrowth,
        startDate: startMetrics.data.record_date,
        endDate: endMetrics.data.record_date
      };
    } catch (err) {
      console.error('Error calculating growth:', err);
      throw err;
    }
  }
  
  // Get monthly metrics for an account (grouped by month)
  static async getMonthlyMetrics(accountId) {
    const { data, error } = await supabase
      .from('social_media_metrics')
      .select(`
        *,
        months(name, year, month)
      `)
      .eq('account_id', accountId)
      .order('record_date', { ascending: false });
    
    if (error) throw error;
    
    // Group by month
    const groupedByMonth = {};
    data.forEach(metric => {
      if (metric.month_id) {
        const monthKey = metric.months ? `${metric.months.year}-${metric.months.month}` : metric.month_id;
        if (!groupedByMonth[monthKey]) {
          groupedByMonth[monthKey] = {
            monthId: metric.month_id,
            monthName: metric.months ? metric.months.name : `${metric.record_date.substring(0, 7)}`,
            metrics: []
          };
        }
        groupedByMonth[monthKey].metrics.push(metric);
      }
    });
    
    return Object.values(groupedByMonth);
  }
}

module.exports = SocialMediaMetrics;
