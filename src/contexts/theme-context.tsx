import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type ThemeMode = 'light' | 'dark' | 'auto';
export type FontSize = 'small' | 'medium' | 'large';
export type AccentColor = 'blue' | 'green' | 'purple' | 'red' | 'orange';

interface ThemeSettings {
  mode: ThemeMode;
  fontSize: FontSize;
  accentColor: AccentColor;
}

interface ThemeContextType {
  theme: ThemeSettings;
  isDark: boolean;
  updateTheme: (settings: Partial<ThemeSettings>) => void;
  resetTheme: () => void;
}

const defaultTheme: ThemeSettings = {
  mode: 'auto',
  fontSize: 'medium',
  accentColor: 'blue'
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// eslint-disable-next-line react-refresh/only-export-components
export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setTheme] = useState<ThemeSettings>(defaultTheme);
  const [isDark, setIsDark] = useState(true);

  const updateTheme = async (newSettings: Partial<ThemeSettings>) => {
    const updatedTheme = { ...theme, ...newSettings };
    setTheme(updatedTheme);
    
    try {
      await chrome.storage.local.set({ themeSettings: updatedTheme });
    } catch (error) {
      console.error('Failed to save theme settings:', error);
    }
  };

  const resetTheme = async () => {
    setTheme(defaultTheme);
    try {
      await chrome.storage.local.remove('themeSettings');
    } catch (error) {
      console.error('Failed to reset theme settings:', error);
    }
  };

  const contextValue: ThemeContextType = {
    theme,
    isDark,
    updateTheme,
    resetTheme
  };

  // Load theme from storage on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const stored = await chrome.storage.local.get('themeSettings');
        if (stored.themeSettings) {
          setTheme(stored.themeSettings);
        }
      } catch (error) {
        console.error('Failed to load theme settings:', error);
      }
    };
    loadTheme();
  }, []);

  // Determine if dark mode should be active
  useEffect(() => {
    let mediaQueryListener: ((e: MediaQueryListEvent) => void) | null = null;
    
    const updateDarkMode = () => {
      if (theme.mode === 'auto') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        setIsDark(mediaQuery.matches);

        mediaQueryListener = (e: MediaQueryListEvent) => setIsDark(e.matches);
        mediaQuery.addEventListener('change', mediaQueryListener);
      } else {
        setIsDark(theme.mode === 'dark');
      }
    };

    updateDarkMode();

    // Cleanup function
    return () => {
      if (mediaQueryListener) {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.removeEventListener('change', mediaQueryListener);
        mediaQueryListener = null;
      }
    };
  }, [theme.mode]);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;

    // Remove previous theme classes
    root.classList.remove('light', 'dark', 'font-small', 'font-medium', 'font-large');
    root.classList.remove('accent-blue', 'accent-green', 'accent-purple', 'accent-red', 'accent-orange');

    // Apply current theme classes
    root.classList.add(isDark ? 'dark' : 'light');
    root.classList.add(`font-${theme.fontSize}`);
    root.classList.add(`accent-${theme.accentColor}`);
  }, [isDark, theme.fontSize, theme.accentColor]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
}
