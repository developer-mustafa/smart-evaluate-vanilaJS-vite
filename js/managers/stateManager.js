// js/managers/stateManager.js

/**
 * Manages the global application state including core data, user info, and UI filters.
 */
class StateManager {
  constructor() {
    this._state = this._initializeState();
    this.state = this._state; // Direct access for simplicity
    console.log('StateManager initialized.');
  }

  /**
   * Defines the initial structure and default values of the application state.
   * @returns {object} The initial state object.
   * @private
   */
  _initializeState() {
    return {
      // Core Application Data
      groups: [],
      students: [],
      tasks: [],
      evaluations: [],
      admins: [],

      // Authentication & User State
      currentUser: null,
      currentUserData: null,
      authLoading: true,
      isPublicMode: true,

      // UI Filters (Centralized)
      filters: {
        membersList: {
          searchTerm: '',
          groupFilter: 'all',
          academicFilter: 'all',
        },
        studentCards: {
          searchTerm: '',
          groupFilter: 'all',
          academicFilter: 'all',
        },
        groupAnalysis: {
          groupFilter: 'all',
        },
        graphAnalysis: {
          groupFilter: 'all',
          startDate: '',
          endDate: '',
          studentSearch: '',
        },
        statistics: {
          taskFilter: '',
        },
        adminManagement: {
          searchTerm: '',
        },
      },

      // Other UI State
      activePage: 'dashboard',
      isLoading: false,
    };
  }

  // --- State Accessors ---

  getState() {
    return this.state;
  }
  get(key) {
    if (key in this.state) return this.state[key];
    console.warn(`Attempted to get unknown state key: ${key}`);
    return undefined;
  }

  // --- State Mutators ---
  set(key, value) {
    if (key in this.state) {
      this.state[key] = value;
      // console.log(`State updated - ${key}:`, value); // Debug
    } else {
      console.warn(`Attempted to set unknown state key: ${key}`);
    }
  }

  update(updates) {
    if (typeof updates !== 'object' || updates === null) {
      console.warn('StateManager update called with invalid argument:', updates);
      return;
    }
    for (const key in updates) {
      if (updates.hasOwnProperty(key) && key in this.state) {
        this.set(key, updates[key]);
      } else if (updates.hasOwnProperty(key)) {
        console.warn(`Attempted to update unknown state key during bulk update: ${key}`);
      }
    }
  }

  // --- Filter Specific Methods ---
  getFilters() {
    return this.state.filters;
  }

  getFilterSection(sectionKey) {
    if (sectionKey in this.state.filters) return this.state.filters[sectionKey];
    console.warn(`Attempted to get unknown filter section: ${sectionKey}`);
    return undefined;
  }

  updateFilters(sectionKey, filterUpdates) {
    if (!(sectionKey in this.state.filters)) {
      console.warn(`Attempted to update filters for unknown section: ${sectionKey}`);
      return;
    }
    if (typeof filterUpdates !== 'object' || filterUpdates === null) {
      console.warn(`Invalid filterUpdates provided for section ${sectionKey}:`, filterUpdates);
      return;
    }
    const sectionFilters = this.state.filters[sectionKey];
    let changed = false;
    for (const key in filterUpdates) {
      if (filterUpdates.hasOwnProperty(key) && key in sectionFilters) {
        if (sectionFilters[key] !== filterUpdates[key]) {
          sectionFilters[key] = filterUpdates[key];
          changed = true;
        }
      } else if (filterUpdates.hasOwnProperty(key)) {
        console.warn(`Attempted to update unknown filter key "${key}" in section "${sectionKey}"`);
      }
    }
    // if (changed) console.log(`Filters updated for section ${sectionKey}:`, sectionFilters);
  }

  resetAllFilters() {
    const initialFilters = this._initializeState().filters;
    this.set('filters', JSON.parse(JSON.stringify(initialFilters)));
    console.log('All filters reset.');
  }

  resetFiltersForSection(sectionKey) {
    if (!(sectionKey in this.state.filters)) {
      console.warn(`Attempted to reset filters for unknown section: ${sectionKey}`);
      return;
    }
    const initialSectionFilters = this._initializeState().filters[sectionKey];
    this.state.filters[sectionKey] = JSON.parse(JSON.stringify(initialSectionFilters));
    console.log(`Filters reset for section: ${sectionKey}`);
  }

  // --- User/Auth Specific ---
  setUser(user, userData) {
    this.update({
      currentUser: user,
      currentUserData: userData,
      isPublicMode: !user,
      authLoading: false,
    });
  }
  setAuthLoading(isLoading) {
    this.set('authLoading', isLoading);
  }

  // --- Loading State ---
  setLoading(isLoading) {
    this.set('isLoading', isLoading);
  }
}

const stateManager = new StateManager();
export default stateManager;
