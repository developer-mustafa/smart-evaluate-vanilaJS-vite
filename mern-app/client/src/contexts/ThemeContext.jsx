import { createContext, useState, useEffect, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { setColorTheme as setColorThemeAction } from '../store/settingsSlice';
import { THEME_COLORS } from '../config/themeConfig';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const dispatch = useDispatch();
  const colorTheme = useSelector((state) => state.settings?.colorTheme) || 'zinc';
  
  // Initialize theme mode from localStorage or system preference
  const [mode, setMode] = useState(() => {
    const saved = localStorage.getItem('theme_mode');
    if (saved && saved !== 'system') return saved;
    
    // Check system preference
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
    
    return 'light';
  });

  const [themeMode, setThemeMode] = useState(() => {
    const saved = localStorage.getItem('theme_mode');
    return saved || 'system';
  });

  // Apply CSS variables for color theme
  useEffect(() => {
    const root = window.document.documentElement;
    const themeColors = THEME_COLORS[colorTheme];
    
    if (!themeColors) return;
    
    // Determine which theme variant to use (light or dark)
    const variant = mode === 'dark' ? 'dark' : 'light';
    const colors = themeColors[variant];
    
    // Apply all main CSS variables
    Object.entries(colors).forEach(([key, value]) => {
      const cssVarName = `--${key.replace(/([A-Z])/g, '-$1').toLowerCase()}`;
      root.style.setProperty(cssVarName, value);
    });

    // Apply sidebar variables (derived from theme colors)
    if (mode === 'dark') {
      // Sidebar for dark mode
      root.style.setProperty('--sidebar-background', colors.card); // Same as card
      root.style.setProperty('--sidebar-foreground', colors.foreground);
      root.style.setProperty('--sidebar-primary', colors.primary);
      root.style.setProperty('--sidebar-primary-foreground', colors.primaryForeground);
      root.style.setProperty('--sidebar-accent', colors.accent);
      root.style.setProperty('--sidebar-accent-foreground', colors.accentForeground);
      root.style.setProperty('--sidebar-border', colors.border);
      root.style.setProperty('--sidebar-ring', colors.ring);
    } else {
      // Sidebar for light mode  
      root.style.setProperty('--sidebar-background', '0 0% 98%');
      root.style.setProperty('--sidebar-foreground', '240 5.3% 26.1%');
      root.style.setProperty('--sidebar-primary', colors.primary);
      root.style.setProperty('--sidebar-primary-foreground', colors.primaryForeground);
      root.style.setProperty('--sidebar-accent', colors.accent);
      root.style.setProperty('--sidebar-accent-foreground', colors.accentForeground);
      root.style.setProperty('--sidebar-border', '220 13% 91%');
      root.style.setProperty('--sidebar-ring', colors.ring);
    }

    // Apply chart variables
    if (mode === 'dark') {
      root.style.setProperty('--chart-1', '220 70% 50%');
      root.style.setProperty('--chart-2', '160 60% 45%');
      root.style.setProperty('--chart-3', '30 80% 55%');
      root.style.setProperty('--chart-4', '280 65% 60%');
      root.style.setProperty('--chart-5', '340 75% 55%');
    } else {
      root.style.setProperty('--chart-1', '12 76% 61%');
      root.style.setProperty('--chart-2', '173 58% 39%');
      root.style.setProperty('--chart-3', '197 37% 24%');
      root.style.setProperty('--chart-4', '43 74% 66%');
      root.style.setProperty('--chart-5', '27 87% 67%');
    }

    // Apply destructive colors (red scheme for all themes)
    if (mode === 'dark') {
      root.style.setProperty('--destructive', '0 62.8% 30.6%');
      root.style.setProperty('--destructive-foreground', '0 0% 98%');
    } else {
      root.style.setProperty('--destructive', '0 84.2% 60.2%');
      root.style.setProperty('--destructive-foreground', '0 0% 98%');
    }

    // Apply radius
    root.style.setProperty('--radius', '0.5rem');
  }, [colorTheme, mode]);

  // Apply dark mode class
  useEffect(() => {
    const root = window.document.documentElement;
    
    if (mode === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [mode]);

  // Handle theme mode changes (including system)
  useEffect(() => {
    if (themeMode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      setMode(mediaQuery.matches ? 'dark' : 'light');
      
      const handleChange = (e) => {
        setMode(e.matches ? 'dark' : 'light');
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    } else {
      setMode(themeMode);
    }
  }, [themeMode]);

  const setTheme = (newMode) => {
    setThemeMode(newMode);
    localStorage.setItem('theme_mode', newMode);
  };

  const toggleTheme = () => {
    const newMode = mode === 'dark' ? 'light' : 'dark';
    setTheme(newMode);
  };

  const setColor = (color) => {
    dispatch(setColorThemeAction(color));
  };

  const value = {
    mode,
    themeMode,
    colorTheme,
    setTheme,
    setColor,
    toggleTheme,
    isDark: mode === 'dark'
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
