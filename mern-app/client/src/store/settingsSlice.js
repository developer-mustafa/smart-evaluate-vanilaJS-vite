import { createSlice } from '@reduxjs/toolkit';

const DEFAULT_SETTINGS = {
  colorTheme: 'zinc',
  dashboardSections: {
    hero: true,
    stats: true,
    topGroups: true,
    academicStats: true,
    ranking: true,
  },
  sidebar: {
    '/': { visible: true, type: 'public', label: 'ড্যাশবোর্ড', icon: 'fas fa-tachometer-alt', locked: true },
    '/assignments': { visible: true, type: 'public', label: 'এসাইনমেন্ট', icon: 'fas fa-book-open' },
    '/ranking': { visible: true, type: 'public', label: 'র‍্যাঙ্কিং লিডারবোর্ড', icon: 'fas fa-trophy' },
    '/members': { visible: true, type: 'private', label: 'শিক্ষার্থী ব্যবস্থাপনা', icon: 'fas fa-users' },
    '/groups': { visible: true, type: 'private', label: 'গ্রুপ ম্যানেজমেন্ট', icon: 'fas fa-layer-group' },
    '/tasks': { visible: true, type: 'private', label: 'টাস্ক ম্যানেজমেন্ট', icon: 'fas fa-tasks' },
    '/evaluations': { visible: true, type: 'private', label: 'মূল্যায়ন', icon: 'fas fa-clipboard-check' },
    '/statistics': { visible: true, type: 'private', label: 'পরিসংখ্যান', icon: 'fas fa-chart-bar' },
    '/students-directory': { visible: true, type: 'public', label: 'শিক্ষার্থী তথ্য', icon: 'fas fa-address-book' },
    '/admin-management': { visible: true, type: 'private', label: 'অ্যাডমিন ম্যানেজমেন্ট', icon: 'fas fa-user-shield' },
    '/settings': { visible: true, type: 'private', label: 'সেটিংস', icon: 'fas fa-cog', locked: true }
  }
};

const loadSettings = () => {
  try {
    const saved = localStorage.getItem('app_settings_v2');
    if (saved) {
      const parsed = JSON.parse(saved);
      // Merge saved settings with default to ensure new keys are present
      const mergedSidebar = { ...DEFAULT_SETTINGS.sidebar, ...parsed.sidebar };
      // Remove obsolete keys
      delete mergedSidebar['/upcoming-assignments'];

      return {
        colorTheme: parsed.colorTheme || DEFAULT_SETTINGS.colorTheme,
        dashboardSections: { ...DEFAULT_SETTINGS.dashboardSections, ...parsed.dashboardSections },
        sidebar: mergedSidebar
      };
    }
  } catch (e) {
    console.error('Failed to load settings:', e);
  }
  return DEFAULT_SETTINGS;
};

const initialState = loadSettings();

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    toggleSidebarVisibility: (state, action) => {
      const { path, visible } = action.payload;
      if (state.sidebar[path] && !state.sidebar[path].locked) {
        state.sidebar[path].visible = visible;
        localStorage.setItem('app_settings_v2', JSON.stringify(state));
      }
    },
    toggleSidebarType: (state, action) => {
      const { path } = action.payload;
      if (state.sidebar[path] && !state.sidebar[path].locked) {
        state.sidebar[path].type = state.sidebar[path].type === 'public' ? 'private' : 'public';
        localStorage.setItem('app_settings_v2', JSON.stringify(state));
      }
    },
    toggleDashboardSection: (state, action) => {
      const { section, visible } = action.payload;
      if (state.dashboardSections.hasOwnProperty(section)) {
        state.dashboardSections[section] = visible;
        localStorage.setItem('app_settings_v2', JSON.stringify(state));
      }
    },
    setColorTheme: (state, action) => {
      state.colorTheme = action.payload;
      localStorage.setItem('app_settings_v2', JSON.stringify(state));
    },
    resetSettings: (state) => {
      state.colorTheme = DEFAULT_SETTINGS.colorTheme;
      state.dashboardSections = DEFAULT_SETTINGS.dashboardSections;
      state.sidebar = DEFAULT_SETTINGS.sidebar;
      localStorage.setItem('app_settings_v2', JSON.stringify(state));
    }
  }
});

export const { toggleSidebarVisibility, toggleSidebarType, toggleDashboardSection, setColorTheme, resetSettings } = settingsSlice.actions;
export default settingsSlice.reducer;
