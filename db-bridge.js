/**
 * db-bridge.js
 * Compatibility bridge for pages that still use localStorage internally.
 * Hydrates localStorage from Supabase on load and mirrors page saves back.
 */

const DEFAULT_DISTRICTS = [
  'Amuru', 'Gulu', 'Isingiro', 'Kabale', 'Kagadi', 'Kaliro', 'Kamwengye',
  'Kanungu', 'Kibaale', 'Kiryandongo', 'Kisoro', 'Kyegegwa', 'Kyenjojo',
  'Luuka', 'Mbarara', 'Mitooma', 'Nwoya', 'Rubanda', 'Rubirizi',
  'Rukiga', 'Rukungiri'
];

const dbBridge = {
  hydrated: false,
  syncInProgress: false,

  /**
   * Hydrate local cache from Supabase
   */
  async hydrateLocalCache() {
    if (this.hydrated) return;
    if (this.syncInProgress) return;

    this.syncInProgress = true;

    if (typeof db === 'undefined' || !window.supabaseClient) {
      console.warn('Database bridge could not find Supabase helpers. Using local storage only.');
      this.seedFallbacks();
      this.hydrated = true;
      this.syncInProgress = false;
      return;
    }

    try {
      const [
        inventoryResult,
        logsResult,
        supervisorsResult,
        districtsResult,
        officersResult,
        adminResult
      ] = await Promise.all([
        db.getInventory(),
        db.getMovementLogs(500),
        db.getSupervisors(),
        db.getDistricts(),
        db.getFieldOfficers(),
        db.getAdminCredentials()
      ]);

      if (!inventoryResult?.error && inventoryResult?.data) {
        localStorage.setItem('inventoryData', JSON.stringify(
          inventoryResult.data.map(this.fromDbInventory)
        ));
      }

      if (!logsResult?.error && logsResult?.data) {
        const logs = logsResult.data.map(this.fromDbLog);
        localStorage.setItem('movementLogs', JSON.stringify(logs));
        localStorage.setItem(
          '__syncedMovementLogKeys',
          JSON.stringify(logs.map(log => `${log.itemId || log.item_id}|${log.action}|${log.timestamp}`))
        );
      }

      if (!supervisorsResult?.error && supervisorsResult?.data) {
        localStorage.setItem('supervisors', JSON.stringify(
          supervisorsResult.data.map(this.fromDbSupervisor)
        ));
      }

      if (!districtsResult?.error && districtsResult?.data) {
        const districts = districtsResult.data && districtsResult.data.length 
          ? districtsResult.data 
          : DEFAULT_DISTRICTS;
        localStorage.setItem('districts', JSON.stringify([...new Set(districts)].sort()));
      }

      if (!officersResult?.error && officersResult?.data) {
        localStorage.setItem('fieldOfficers', JSON.stringify(
          officersResult.data.map(this.fromDbFieldOfficer)
        ));
      }

      if (!adminResult?.error && adminResult?.data) {
        localStorage.setItem('adminCredentials', JSON.stringify(adminResult.data));
      }
    } catch (error) {
      console.error('Failed to hydrate data from Supabase:', error);
      this.seedFallbacks();
    } finally {
      this.hydrated = true;
      this.syncInProgress = false;
    }
  },

  /**
   * Seed fallback data to localStorage
   */
  seedFallbacks() {
    if (!localStorage.getItem('districts')) {
      localStorage.setItem('districts', JSON.stringify(DEFAULT_DISTRICTS));
    }
    if (!localStorage.getItem('inventoryData')) {
      localStorage.setItem('inventoryData', JSON.stringify([]));
    }
    if (!localStorage.getItem('movementLogs')) {
      localStorage.setItem('movementLogs', JSON.stringify([]));
    }
    if (!localStorage.getItem('supervisors')) {
      localStorage.setItem('supervisors', JSON.stringify([]));
    }
    if (!localStorage.getItem('fieldOfficers')) {
      localStorage.setItem('fieldOfficers', JSON.stringify([]));
    }
  },

  // ============= DATA MAPPING FUNCTIONS =============

  /**
   * Map Supabase inventory item to app format
   */
  fromDbInventory(item) {
    return {
      ...item,
      id: item.id || '',
      name: item.name || '',
      type: item.type || item.category || '',
      status: item.status || 'available',
      assigned: item.assigned || item.assigned_to || '',
      district: item.district || '',
      notes: item.notes || item.description || '',
      lastUpdate: item.lastUpdate || item.last_update || item.updated_at || item.created_at || '',
      category: item.category || item.type || ''
    };
  },

  /**
   * Map app inventory item to Supabase format
   */
  toDbInventory(item) {
    if (!item || !item.id) {
      throw new Error('Item must have an ID');
    }
    return {
      id: String(item.id),
      name: item.name || '',
      type: item.type || item.category || '',
      category: item.category || item.type || '',
      status: item.status || 'available',
      assigned: item.assigned || '',
      district: item.district || '',
      notes: item.notes || '',
      lastUpdate: item.lastUpdate || new Date().toLocaleDateString(),
      updated_at: new Date().toISOString()
    };
  },

  /**
   * Map Supabase movement log to app format
   */
  fromDbLog(log) {
    return {
      ...log,
      itemId: log.itemId || log.item_id || '',
      action: log.action || '',
      details: log.details || '',
      timestamp: log.timestamp || log.created_at || new Date().toISOString()
    };
  },

  /**
   * Map app movement log to Supabase format
   */
  toDbLog(log) {
    if (!log || !log.itemId && !log.item_id) {
      throw new Error('Log must have an item ID');
    }
    return {
      item_id: String(log.itemId || log.item_id || ''),
      action: log.action || '',
      details: log.details || '',
      actor: log.actor || this.getCurrentUser() || 'System',
      timestamp: log.timestamp || new Date().toISOString()
    };
  },

  /**
   * Map Supabase supervisor to app format
   */
  fromDbSupervisor(supervisor) {
    return {
      ...supervisor,
      empId: supervisor.empId || supervisor.emp_id || '',
      username: supervisor.username || '',
      password: supervisor.password || '',
      status: supervisor.status || 'active'
    };
  },

  /**
   * Map app supervisor to Supabase format
   */
  toDbSupervisor(supervisor) {
    if (!supervisor || !supervisor.id) {
      throw new Error('Supervisor must have an ID');
    }
    return {
      id: supervisor.id,
      user_id: supervisor.user_id,
      emp_id: supervisor.empId || supervisor.emp_id || '',
      name: supervisor.name || '',
      email: supervisor.email || '',
      phone: supervisor.phone || '',
      district: supervisor.district || '',
      status: supervisor.status || 'active'
    };
  },

  /**
   * Map Supabase field officer to app format
   */
  fromDbFieldOfficer(officer) {
    return {
      ...officer,
      empId: officer.empId || officer.emp_id || '',
      status: officer.status || 'active'
    };
  },

  /**
   * Map app field officer to Supabase format
   */
  toDbFieldOfficer(officer) {
    if (!officer || !officer.id) {
      throw new Error('Officer must have an ID');
    }
    return {
      id: officer.id,
      emp_id: officer.empId || officer.emp_id || '',
      name: officer.name || '',
      email: officer.email || '',
      phone: officer.phone || '',
      district: officer.district || '',
      status: officer.status || 'active'
    };
  },

  // ============= PERSISTENCE FUNCTIONS =============

  /**
   * Persist inventory items to Supabase
   */
  async persistInventory(items) {
    if (!window.supabaseClient || !items || !Array.isArray(items)) {
      return;
    }
    
    try {
      const validItems = items.filter(i => i && i.id).map(this.toDbInventory);
      if (validItems.length === 0) return;
      
      const { error } = await window.supabaseClient
        .from('inventory_items')
        .upsert(validItems);
      
      if (error) {
        console.error('Error persisting inventory:', error);
      }
    } catch (error) {
      console.error('Failed to persist inventory:', error);
    }
  },

  /**
   * Delete inventory items from Supabase
   */
  async deleteInventory(ids) {
    if (!window.supabaseClient || !ids || !Array.isArray(ids) || ids.length === 0) {
      return;
    }
    
    try {
      const { error } = await window.supabaseClient
        .from('inventory_items')
        .delete()
        .in('id', ids.map(String));
      
      if (error) {
        console.error('Error deleting inventory:', error);
      }
    } catch (error) {
      console.error('Failed to delete inventory:', error);
    }
  },

  /**
   * Persist movement logs to Supabase
   */
  async persistMovementLogs(logs) {
    if (!window.supabaseClient || !logs || !Array.isArray(logs)) {
      return;
    }

    try {
      const existing = JSON.parse(localStorage.getItem('__syncedMovementLogKeys') || '[]');
      const existingKeys = new Set(existing);
      
      const unsynced = logs.filter(log => {
        const key = `${log.itemId || log.item_id}|${log.action}|${log.timestamp}`;
        return !existingKeys.has(key);
      });

      if (unsynced.length === 0) return;

      const validLogs = unsynced.filter(log => log && (log.itemId || log.item_id));
      if (validLogs.length === 0) return;

      const { error } = await window.supabaseClient
        .from('movement_logs')
        .insert(validLogs.map(this.toDbLog.bind(this)));

      if (!error) {
        validLogs.forEach(log => {
          existingKeys.add(`${log.itemId || log.item_id}|${log.action}|${log.timestamp}`);
        });
        localStorage.setItem('__syncedMovementLogKeys', JSON.stringify([...existingKeys]));
      } else {
        console.error('Error persisting movement logs:', error);
      }
    } catch (error) {
      console.error('Failed to persist movement logs:', error);
    }
  },

  /**
   * Persist supervisors to Supabase
   */
  async persistSupervisors(supervisors) {
    if (!window.supabaseClient || !supervisors || !Array.isArray(supervisors)) {
      return;
    }

    try {
      let updated = false;
      for (const supervisor of supervisors) {
        if (supervisor.username && supervisor.password && !supervisor.user_id) {
          const result = await db.addSupervisor(supervisor);
          if (!result.error && result.data) {
            supervisor.id = result.data.id || supervisor.id;
            supervisor.user_id = result.data.user_id || supervisor.user_id;
            updated = true;
          } else {
            console.error('Failed to save supervisor:', result.error);
          }
        } else if (supervisor.id) {
          const { error } = await window.supabaseClient
            .from('supervisors')
            .upsert(this.toDbSupervisor(supervisor));
          if (error) {
            console.error('Failed to update supervisor:', error);
          }
        }
      }
      if (updated) {
        localStorage.setItem('supervisors', JSON.stringify(supervisors));
      }
    } catch (error) {
      console.error('Failed to persist supervisors:', error);
    }
  },

  /**
   * Persist field officers to Supabase
   */
  async persistFieldOfficers(officers) {
    if (!window.supabaseClient || !officers || !Array.isArray(officers)) {
      return;
    }

    try {
      const validOfficers = officers.filter(o => o && o.id).map(this.toDbFieldOfficer);
      if (validOfficers.length === 0) return;

      const { error } = await window.supabaseClient
        .from('field_officers')
        .upsert(validOfficers);
      
      if (error) {
        console.error('Error persisting field officers:', error);
      }
    } catch (error) {
      console.error('Failed to persist field officers:', error);
    }
  },

  /**
   * Persist districts to Supabase
   */
  async persistDistricts(districts) {
    if (!window.supabaseClient || !districts || !Array.isArray(districts)) {
      return;
    }

    try {
      const { error } = await window.supabaseClient
        .from('districts')
        .upsert(
          districts.map(name => ({ name })),
          { onConflict: 'name' }
        );
      
      if (error) {
        console.error('Error persisting districts:', error);
      }
    } catch (error) {
      console.error('Failed to persist districts:', error);
    }
  },

  /**
   * Persist admin password to Supabase
   */
  async persistAdminPassword(password) {
    if (typeof db === 'undefined' || !password) {
      return;
    }

    try {
      const { error } = await db.updateAdminPassword(password);
      if (error) {
        console.error('Error updating admin password:', error);
      }
    } catch (error) {
      console.error('Failed to persist admin password:', error);
    }
  },

  /**
   * Get current logged-in user
   */
  getCurrentUser() {
    try {
      const user = JSON.parse(sessionStorage.getItem('loggedInUser') || '{}');
      return user?.username || user?.name || 'System';
    } catch {
      return 'System';
    }
  }
};
