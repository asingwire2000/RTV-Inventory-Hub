// supabase-config.js
// Your Supabase credentials
const SUPABASE_URL = 'https://xrfmfiaemmyfbizwafgv.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_txbmwoxN4cU1i-abV6pvoA_oIoF2OWJ';

// Initialize Supabase client
const supabaseClient = window.supabase
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;
window.supabaseClient = supabaseClient;

/**
 * Format Supabase errors with fallback message
 * @param {Error} error - The error object from Supabase
 * @param {string} fallback - Fallback message if error is null
 * @returns {string|null} - Formatted error message or null
 */
function formatSupabaseError(error, fallback = 'Database request failed') {
  if (!error) return null;
  const message = error.message || '';
  const details = error.details || '';
  const hint = error.hint || '';
  const formatted = [message, details, hint].filter(Boolean).join(' - ');
  console.error(`${fallback}:`, error);
  return formatted || fallback;
}

// API Helper Functions
const db = {
  async testConnection() {
    if (!supabaseClient) {
      return { 
        error: 'Supabase library did not load. Check your internet connection or CDN access.' 
      };
    }

    try {
      const { error } = await supabaseClient
        .from('users')
        .select('id')
        .limit(1);

      return { 
        error: formatSupabaseError(error, 'Could not connect to Supabase') 
      };
    } catch (err) {
      console.error('Supabase connection test failed:', err);
      return { 
        error: err?.message || 'Could not connect to Supabase' 
      };
    }
  },

  /**
   * Login function with supervisor details
   * @param {string} username - Username
   * @param {string} password - Password
   * @returns {Promise<{data?: object, error?: string}>}
   */
  async login(username, password) {
    try {
      if (!username || !password) {
        return { error: 'Username and password are required' };
      }

      const normalizedUsername = username.trim().toLowerCase();
      const { data: user, error } = await supabaseClient
        .from('users')
        .select('*')
        .ilike('username', normalizedUsername)
        .eq('password', password)
        .limit(1)
        .maybeSingle();
      
      if (error) {
        return { error: formatSupabaseError(error, 'Database connection error') };
      }
      
      if (!user) {
        return { error: 'Invalid username or password' };
      }
      
      if (user.role === 'supervisor') {
        const { data: supervisor, error: supError } = await supabaseClient
          .from('supervisors')
          .select('district, id')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (supError) {
          console.warn('Supervisor lookup warning:', supError);
        }

        return {
          data: {
            ...user,
            district: supervisor?.district || 'Unknown',
            supervisorId: supervisor?.id || null
          }
        };
      }
      
      return { data: user };
      
    } catch (err) {
      console.error('Login error:', err);
      return { error: err?.message || 'Login failed' };
    }
  },

  // ============= INVENTORY OPERATIONS =============
  
  async getInventory() {
    try {
      const { data, error } = await supabaseClient
        .from('inventory_items')
        .select('*')
        .order('created_at', { ascending: false });
      return { data: data || [], error };
    } catch (err) {
      console.error('Get inventory error:', err);
      return { data: [], error: err?.message };
    }
  },

  async getInventoryByDistrict(district) {
    try {
      const { data, error } = await supabaseClient
        .from('inventory_items')
        .select('*')
        .eq('district', district)
        .order('created_at', { ascending: false });
      return { data: data || [], error };
    } catch (err) {
      console.error('Get inventory by district error:', err);
      return { data: [], error: err?.message };
    }
  },

  async addInventoryItem(item) {
    try {
      if (!item || !item.name) {
        return { error: 'Item name is required' };
      }
      const { data, error } = await supabaseClient
        .from('inventory_items')
        .insert([item])
        .select();
      return { data: data?.[0] || null, error };
    } catch (err) {
      console.error('Add inventory item error:', err);
      return { error: err?.message };
    }
  },

  async updateInventoryItem(id, updates) {
    try {
      if (!id) {
        return { error: 'Item ID is required' };
      }
      const { data, error } = await supabaseClient
        .from('inventory_items')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select();
      return { data: data?.[0] || null, error };
    } catch (err) {
      console.error('Update inventory item error:', err);
      return { error: err?.message };
    }
  },

  async deleteInventoryItem(id) {
    try {
      if (!id) {
        return { error: 'Item ID is required' };
      }
      const { error } = await supabaseClient
        .from('inventory_items')
        .delete()
        .eq('id', id);
      return { error };
    } catch (err) {
      console.error('Delete inventory item error:', err);
      return { error: err?.message };
    }
  },

  async bulkDeleteInventoryItems(ids) {
    try {
      if (!ids || ids.length === 0) {
        return { error: 'No items to delete' };
      }
      const { error } = await supabaseClient
        .from('inventory_items')
        .delete()
        .in('id', ids);
      return { error };
    } catch (err) {
      console.error('Bulk delete inventory items error:', err);
      return { error: err?.message };
    }
  },

  // ============= MOVEMENT LOGS =============

  async addMovementLog(log) {
    try {
      if (!log || !log.item_id) {
        return { error: 'Item ID is required' };
      }
      const { error } = await supabaseClient
        .from('movement_logs')
        .insert([{
          item_id: String(log.item_id),
          action: log.action || '',
          details: log.details || '',
          actor: log.actor || 'System',
          timestamp: log.timestamp || new Date().toISOString()
        }]);
      return { error };
    } catch (err) {
      console.error('Add movement log error:', err);
      return { error: err?.message };
    }
  },

  async getMovementLogs(limit = 50) {
    try {
      const { data, error } = await supabaseClient
        .from('movement_logs')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(limit);
      return { data: data || [], error };
    } catch (err) {
      console.error('Get movement logs error:', err);
      return { data: [], error: err?.message };
    }
  },

  async getMovementLogsByItemId(itemId) {
    try {
      if (!itemId) {
        return { data: [], error: 'Item ID is required' };
      }
      const { data, error } = await supabaseClient
        .from('movement_logs')
        .select('*')
        .eq('item_id', String(itemId))
        .order('timestamp', { ascending: false });
      return { data: data || [], error };
    } catch (err) {
      console.error('Get movement logs by item error:', err);
      return { data: [], error: err?.message };
    }
  },

  // ============= SUPERVISORS =============

  async getSupervisors() {
    try {
      const { data, error } = await supabaseClient
        .from('supervisors')
        .select('*')
        .order('name');
      return { data: data || [], error };
    } catch (err) {
      console.error('Get supervisors error:', err);
      return { data: [], error: err?.message };
    }
  },

  async getActiveSupervisors() {
    try {
      const { data, error } = await supabaseClient
        .from('supervisors')
        .select('*')
        .eq('status', 'active')
        .order('name');
      return { data: data || [], error };
    } catch (err) {
      console.error('Get active supervisors error:', err);
      return { data: [], error: err?.message };
    }
  },

  async addSupervisor(supervisor) {
    try {
      if (!supervisor || !supervisor.username || !supervisor.password) {
        return { error: 'Username and password are required' };
      }
      
      const { data: user, error: userError } = await supabaseClient
        .from('users')
        .insert([{ 
          username: supervisor.username.trim().toLowerCase(), 
          password: supervisor.password, 
          role: 'supervisor',
          name: supervisor.name || '',
          email: supervisor.email || ''
        }])
        .select()
        .single();
      
      if (userError) {
        return { error: formatSupabaseError(userError, 'Failed to create user') };
      }
      
      const { data, error } = await supabaseClient
        .from('supervisors')
        .insert([{
          user_id: user.id,
          emp_id: supervisor.empId || '',
          name: supervisor.name || '',
          email: supervisor.email || '',
          phone: supervisor.phone || '',
          district: supervisor.district || '',
          status: supervisor.status || 'active'
        }])
        .select()
        .single();
      return { data, error };
    } catch (err) {
      console.error('Add supervisor error:', err);
      return { error: err?.message };
    }
  },

  async updateSupervisor(id, updates) {
    try {
      if (!id) {
        return { error: 'Supervisor ID is required' };
      }
      const { data, error } = await supabaseClient
        .from('supervisors')
        .update(updates)
        .eq('id', id)
        .select();
      return { data: data?.[0] || null, error };
    } catch (err) {
      console.error('Update supervisor error:', err);
      return { error: err?.message };
    }
  },

  async deleteSupervisor(id) {
    try {
      if (!id) {
        return { error: 'Supervisor ID is required' };
      }
      const { data: supervisor } = await supabaseClient
        .from('supervisors')
        .select('user_id')
        .eq('id', id)
        .single();
      
      if (supervisor?.user_id) {
        await supabaseClient.from('users').delete().eq('id', supervisor.user_id);
      }
      
      const { error } = await supabaseClient
        .from('supervisors')
        .delete()
        .eq('id', id);
      return { error };
    } catch (err) {
      console.error('Delete supervisor error:', err);
      return { error: err?.message };
    }
  },

  // ============= DISTRICTS =============

  async getDistricts() {
    try {
      const { data, error } = await supabaseClient
        .from('districts')
        .select('name')
        .order('name');
      return { data: data?.map(d => d.name) || [], error };
    } catch (err) {
      console.error('Get districts error:', err);
      return { data: [], error: err?.message };
    }
  },

  async addDistrict(name) {
    try {
      if (!name) {
        return { error: 'District name is required' };
      }
      const { error } = await supabaseClient
        .from('districts')
        .insert([{ name: name.trim() }]);
      return { error };
    } catch (err) {
      console.error('Add district error:', err);
      return { error: err?.message };
    }
  },

  async deleteDistrict(name) {
    try {
      if (!name) {
        return { error: 'District name is required' };
      }
      const { error } = await supabaseClient
        .from('districts')
        .delete()
        .eq('name', name);
      return { error };
    } catch (err) {
      console.error('Delete district error:', err);
      return { error: err?.message };
    }
  },

  // ============= DATA COLLECTORS =============

  async getDataCollectors() {
    try {
      const { data, error } = await supabaseClient
        .from('data_collectors')
        .select('*')
        .order('name');
      return { data: data || [], error };
    } catch (err) {
      console.error('Get data collectors error:', err);
      return { data: [], error: err?.message };
    }
  },

  async getDataCollectorsByDistrict(district) {
    try {
      if (!district) {
        return { data: [], error: 'District is required' };
      }
      const { data, error } = await supabaseClient
        .from('data_collectors')
        .select('*')
        .eq('district', district)
        .eq('status', 'active')
        .order('name');
      return { data: data || [], error };
    } catch (err) {
      console.error('Get data collectors by district error:', err);
      return { data: [], error: err?.message };
    }
  },

  async addDataCollector(collector) {
    try {
      if (!collector || !collector.name) {
        return { error: 'Data collector name is required' };
      }
      
      const dbCollector = {
        emp_id: collector.emp_id || collector.empId,
        name: collector.name,
        email: collector.email,
        phone: collector.phone || '',
        district: collector.district,
        status: collector.status || 'active'
      };
      
      const { data, error } = await supabaseClient
        .from('data_collectors')
        .insert([dbCollector])
        .select();
      
      if (error) {
        console.error('Supabase insert error:', error);
        return { error: error.message };
      }
      
      return { data: data?.[0] || null, error: null };
    } catch (err) {
      console.error('Add data collector error:', err);
      return { error: err?.message };
    }
  },

  async updateDataCollector(id, updates) {
    try {
      if (!id) {
        return { error: 'Data collector ID is required' };
      }
      
      const dbUpdates = {
        emp_id: updates.emp_id || updates.empId,
        name: updates.name,
        email: updates.email,
        phone: updates.phone || '',
        district: updates.district,
        status: updates.status,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabaseClient
        .from('data_collectors')
        .update(dbUpdates)
        .eq('id', id)
        .select();
      return { data: data?.[0] || null, error };
    } catch (err) {
      console.error('Update data collector error:', err);
      return { error: err?.message };
    }
  },

  async deleteDataCollector(id) {
    try {
      if (!id) {
        return { error: 'Data collector ID is required' };
      }
      const { error } = await supabaseClient
        .from('data_collectors')
        .delete()
        .eq('id', id);
      return { error };
    } catch (err) {
      console.error('Delete data collector error:', err);
      return { error: err?.message };
    }
  },

  // ============= NOTIFICATIONS =============

  async getNotifications() {
    try {
      const { data, error } = await supabaseClient
        .from('admin_notifications')
        .select('*')
        .order('created_at', { ascending: false });
      return { data: data || [], error };
    } catch (err) {
      console.error('Get notifications error:', err);
      return { data: [], error: err?.message };
    }
  },

  async addNotification(notification) {
    try {
      if (!notification || !notification.message) {
        return { error: 'Message is required' };
      }
      const { error } = await supabaseClient
        .from('admin_notifications')
        .insert([{
          message: notification.message,
          type: notification.type || 'info',
          item_id: notification.item_id || null,
          read: notification.read || false
        }]);
      return { error };
    } catch (err) {
      console.error('Add notification error:', err);
      return { error: err?.message };
    }
  },

  async markNotificationRead(id) {
    try {
      if (!id) {
        return { error: 'Notification ID is required' };
      }
      const { error } = await supabaseClient
        .from('admin_notifications')
        .update({ read: true })
        .eq('id', id);
      return { error };
    } catch (err) {
      console.error('Mark notification read error:', err);
      return { error: err?.message };
    }
  },

  async clearNotifications() {
    try {
      const { error } = await supabaseClient
        .from('admin_notifications')
        .delete()
        .neq('id', '');
      return { error };
    } catch (err) {
      console.error('Clear notifications error:', err);
      return { error: err?.message };
    }
  },

  // ============= ADMIN CREDENTIALS =============

  async getAdminCredentials() {
    try {
      const { data, error } = await supabaseClient
        .from('users')
        .select('username, password')
        .eq('role', 'admin')
        .maybeSingle();
      return { 
        data, 
        error: formatSupabaseError(error, 'Could not load admin credentials') 
      };
    } catch (err) {
      console.error('Get admin credentials error:', err);
      return { error: err?.message };
    }
  },

  async updateAdminPassword(newPassword) {
    try {
      if (!newPassword) {
        return { error: 'New password is required' };
      }
      const { error } = await supabaseClient
        .from('users')
        .update({ password: newPassword })
        .eq('role', 'admin');
      return { error };
    } catch (err) {
      console.error('Update admin password error:', err);
      return { error: err?.message };
    }
  },

  async updateUserPassword(userId, newPassword) {
    try {
      if (!userId || !newPassword) {
        return { error: 'User ID and password are required' };
      }
      const { error } = await supabaseClient
        .from('users')
        .update({ password: newPassword })
        .eq('id', userId);
      return { error };
    } catch (err) {
      console.error('Update user password error:', err);
      return { error: err?.message };
    }
  },

  // ============= DASHBOARD STATS =============

  async getDashboardStats() {
    try {
      const { data: items, error } = await this.getInventory();
      if (error) {
        console.warn('Dashboard stats error:', error);
        return { total: 0, inUse: 0, available: 0, pendingApproval: 0 };
      }
      
      const pendingApproval = items.filter(i => i.status === 'pending-approval').length;
      const inUse = items.filter(i => i.status === 'in-use').length;
      const available = items.filter(i => i.status === 'available').length;
      
      return { total: items.length, inUse, available, pendingApproval };
    } catch (err) {
      console.error('Get dashboard stats error:', err);
      return { total: 0, inUse: 0, available: 0, pendingApproval: 0 };
    }
  }
};