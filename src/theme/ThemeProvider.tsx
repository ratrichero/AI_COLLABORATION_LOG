import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type Theme = 'light' | 'dev';

interface ThemeContextValue {
  theme: Theme;
  setTheme: (t: Theme) => void;
  toggle: () => void;
  isDev: boolean;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const STORAGE_KEY = 'adts-theme';

/** Chart palette that adapts to the active theme. */
export function getChartTheme(theme: Theme) {
  if (theme === 'dev') {
    return {
      axis: '#6e7681',
      grid: '#21262d',
      tipBg: '#161b22',
      tipBorder: '#30363d',
      tipText: '#e6edf3',
    };
  }
  return {
    axis: '#94a3b8',
    grid: '#f1f5f9',
    tipBg: '#ffffff',
    tipBorder: '#e2e8f0',
    tipText: '#1e293b',
  };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return 'light';
    return (localStorage.getItem(STORAGE_KEY) as Theme) || 'dev';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggle = () => setThemeState((p) => (p === 'light' ? 'dev' : 'light'));

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggle, isDev: theme === 'dev' }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
