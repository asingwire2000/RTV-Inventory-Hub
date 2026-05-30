// supabase-config.js
// Your Supabase credentials
const SUPABASE_URL = 'https://xrfmfiaemmyfbizwafgv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_txbmwoxN4cU1i-abV6pvoA_oIoF2OWJ';

// Initialize Supabase client
const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

function formatSupabaseError(error, fallback = 'Database request failed') {
  if (!error) return null;
  const details = [error.message, error.details, error.hint].filter(Boolean).join(' ');
  console.error(fallback, error);
  return details || fallback;
}

// API Helper Functions
const db = {
  async testConnection() {
    if (!supabaseClient) {
      return { error: 'Supabase library did not load. Check your internet connection or CDN access.' };
    }

    try {
      const { error } = await supabaseClient
        .from('users')
        .select('id')
        .limit(1);

      return { error: formatSupabaseError(error, 'Could not connect to Supabase') };
    } catch (err) {
      console.error('Supabase connection failed', err);
      return { error: err?.message || 'Could not connect to Supabase' };
    }
  },

  // Authentication - SIMPLIFIED WORKING VERSION
  async login(username, password) {
    try {
      // Get all users (simplest approach)
      const { data: allUsers, error } = await supabaseClient
        .from('users')
        .select('*');
      
      if (error) {
        return { error: formatSupabaseError(error, 'Database connection error') };
      }
      
      if (!allUsers || allUsers.length === 0) {
        return { error: 'Connected to Supabase, but no users are visible. Seed the users table or check Row Level Security policies.' };
      }
      
      // Find matching user
      const user = allUsers.find(u => 
        u.username === username && u.password === password
      );
      
      if (!user) {
        return { error: 'Invalid username or password' };
      }
      
      // If supervisor, get district info
      if (user.role === 'supervisor') {
        const { data: supervisor } = await supabaseClient
          .from('supervisors')
          .select('district, id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        return { 
          data: { 
            ...user, 
            district: supervisor?.district || 'Unknown',
            supervisorId: supervisor?.id 
          } 
        };
      }
      
      return { data: user };
      
    } catch (err) {
      console.error('Login failed', err);
      return { error: err?.message || 'Login failed' };
    }
  },

  // Inventory
  async getInventory() {
    const { data, error } = await supabaseClient
      .from('inventory_items')
      .select('*')
      .order('created_at', { ascending: false });
    return { data: data || [], error };
  },

  async getInventoryByDistrict(district) {
    const { data, error } = await supabaseClient
      .from('inventory_items')
      .select('*')
      .eq('district', district)
      .order('created_at', { ascending: false });
    return { data: data || [], error };
  },

  async addInventoryItem(item) {
    const { data, error } = await supabaseClient
      .from('inventory_items')
      .insert([item])
      .select();
    return { data: data?.[0], error };
  },

  async updateInventoryItem(id, updates) {
    const { data, error } = await supabaseClient
      .from('inventory_items')
      .update({ ...updates, updated_at: new Date() })
      .eq('id', id)
      .select();
    return { data: data?.[0], error };
  },

  async deleteInventoryItem(id) {
    const { error } = await supabaseClient
      .from('inventory_items')
      .delete()
      .eq('id', id);
    return { error };
  },

  async bulkDeleteInventoryItems(ids) {
    const { error } = await supabaseClient
      .from('inventory_items')
      .delete()
      .in('id', ids);
    return { error };
  },

  // Movement Logs
  async addMovementLog(log) {
    const { error } = await supabaseClient
      .from('movement_logs')
      .insert([{
        item_id: log.item_id,
        action: log.action,
        details: log.details,
        actor: log.actor,
        timestamp: log.timestamp || new Date()
      }]);
    return { error };
  },

  async getMovementLogs(limit = 50) {
    const { data, error } = await supabaseClient
      .from('movement_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(limit);
    return { data: data || [], error };
  },

  async getMovementLogsByItemId(itemId) {
    const { data, error } = await supabaseClient
      .from('movement_logs')
      .select('*')
      .eq('item_id', itemId)
      .order('timestamp', { ascending: false });
    return { data: data || [], error };
  },

  // Supervisors
  async getSupervisors() {
    const { data, error } = await supabaseClient
      .from('supervisors')
      .select('*')
      .order('name');
    return { data: data || [], error };
  },

  async getActiveSupervisors() {
    const { data, error } = await supabaseClient
      .from('supervisors')
      .select('*')
      .eq('status', 'active')
      .order('name');
    return { data: data || [], error };
  },

  async addSupervisor(supervisor) {
    const { data: user, error: userError } = await supabaseClient
      .from('users')
      .insert([{ 
        username: supervisor.username, 
        password: supervisor.password, 
        role: 'supervisor',
        name: supervisor.name,
        email: supervisor.email
      }])
      .select()
      .single();
    
    if (userError) return { error: userError };
    
    const { data, error } = await supabaseClient
      .from('supervisors')
      .insert([{
        user_id: user.id,
        emp_id: supervisor.empId,
        name: supervisor.name,
        email: supervisor.email,
        phone: supervisor.phone,
        district: supervisor.district,
        status: supervisor.status || 'active'
      }])
      .select();
    return { data: data?.[0], error };
  },

  async updateSupervisor(id, updates) {
    const { data, error } = await supabaseClient
      .from('supervisors')
      .update(updates)
      .eq('id', id)
      .select();
    return { data: data?.[0], error };
  },

  async deleteSupervisor(id) {
    const { data: supervisor } = await supabaseClient
      .from('supervisors')
      .select('user_id')
      .eq('id', id)
      .single();
    
    if (supervisor) {
      await supabaseClient.from('users').delete().eq('id', supervisor.user_id);
    }
    
    const { error } = await supabaseClient
      .from('supervisors')
      .delete()
      .eq('id', id);
    return { error };
  },

  // Districts
  async getDistricts() {
    const { data, error } = await supabaseClient
      .from('districts')
      .select('name')
      .order('name');
    return { data: data?.map(d => d.name) || [], error };
  },

  async addDistrict(name) {
    const { error } = await supabaseClient
      .from('districts')
      .insert([{ name }]);
    return { error };
  },

  async deleteDistrict(name) {
    const { error } = await supabaseClient
      .from('districts')
      .delete()
      .eq('name', name);
    return { error };
  },

  // Field Officers
  async getFieldOfficers() {
    const { data, error } = await supabaseClient
      .from('field_officers')
      .select('*')
      .order('name');
    return { data: data || [], error };
  },

  async getFieldOfficersByDistrict(district) {
    const { data, error } = await supabaseClient
      .from('field_officers')
      .select('*')
      .eq('district', district)
      .eq('status', 'active')
      .order('name');
    return { data: data || [], error };
  },

  async addFieldOfficer(officer) {
    const { data, error } = await supabaseClient
      .from('field_officers')
      .insert([officer])
      .select();
    return { data: data?.[0], error };
  },

  async updateFieldOfficer(id, updates) {
    const { data, error } = await supabaseClient
      .from('field_officers')
      .update(updates)
      .eq('id', id)
      .select();
    return { data: data?.[0], error };
  },

  async deleteFieldOfficer(id) {
    const { error } = await supabaseClient
      .from('field_officers')
      .delete()
      .eq('id', id);
    return { error };
  },

  // Notifications
  async getNotifications() {
    const { data, error } = await supabaseClient
      .from('admin_notifications')
      .select('*')
      .order('created_at', { ascending: false });
    return { data: data || [], error };
  },

  async addNotification(notification) {
    const { error } = await supabaseClient
      .from('admin_notifications')
      .insert([{
        message: notification.message,
        type: notification.type,
        item_id: notification.item_id,
        read: false
      }]);
    return { error };
  },

  async markNotificationRead(id) {
    const { error } = await supabaseClient
      .from('admin_notifications')
      .update({ read: true })
      .eq('id', id);
    return { error };
  },

  async clearNotifications() {
    const { error } = await supabaseClient
      .from('admin_notifications')
      .delete()
      .neq('id', '');
    return { error };
  },

  // Admin credentials
  async getAdminCredentials() {
    const { data, error } = await supabaseClient
      .from('users')
      .select('username, password')
      .eq('role', 'admin')
      .maybeSingle();
    return { data, error: formatSupabaseError(error, 'Could not load admin credentials') };
  },

  async updateAdminPassword(newPassword) {
    const { error } = await supabaseClient
      .from('users')
      .update({ password: newPassword })
      .eq('role', 'admin');
    return { error };
  },

  // Dashboard Stats
  async getDashboardStats() {
    const { data: items, error } = await this.getInventory();
    if (error) return { total: 0, inUse: 0, available: 0, pendingApproval: 0 };
    
    const pendingApproval = items.filter(i => i.status === 'pending-approval').length;
    const inUse = items.filter(i => i.status === 'in-use').length;
    const available = items.filter(i => i.status === 'available').length;
    
    return { total: items.length, inUse, available, pendingApproval };
  }
};
