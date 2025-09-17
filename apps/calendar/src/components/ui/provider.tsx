'use client';

import * as React from 'react';
import { ThemeProvider as NextThemesProvider } from 'next-themes';
import { TooltipProvider } from '@/components/ui/tooltip';

interface ProviderProps {
  children: React.ReactNode;
  defaultTheme?: string;
  storageKey?: string;
}

export function Provider({
  children,
  defaultTheme = 'system',
  storageKey = 'checkmate-theme',
  ...props
}: ProviderProps) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme={defaultTheme}
      enableSystem
      disableTransitionOnChange
      storageKey={storageKey}
      {...props}
    >
      <TooltipProvider>{children}</TooltipProvider>
    </NextThemesProvider>
  );
}

export const useColorModeToggle = () => {
  const { theme, setTheme } = React.useContext(React.createContext<any>({}));

  return {
    colorMode: theme as 'light' | 'dark',
    toggleColorMode: () => setTheme(theme === 'light' ? 'dark' : 'light'),
  };
};
