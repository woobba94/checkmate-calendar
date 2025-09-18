/**
 * Theme utilities
 */

const THEME_STORAGE_KEY = 'checkmate-theme';

/**
 * Get initial theme from localStorage or system preference
 * This is used for SSR/initial render to avoid theme flash
 */
export function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = localStorage.getItem(THEME_STORAGE_KEY);
  
  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  // If 'system' or no value, check system preference
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}
