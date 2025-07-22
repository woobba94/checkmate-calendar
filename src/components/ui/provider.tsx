'use client';

import {
  ChakraProvider,
  createSystem,
  defaultConfig,
  defineConfig,
  Theme,
} from '@chakra-ui/react';
import { createContext, useContext, useState, useEffect } from 'react';
import { ColorModeProvider, type ColorModeProviderProps } from './color-mode';

const ColorModeContext = createContext<{
  colorMode: 'light' | 'dark';
  toggleColorMode: () => void;
}>({ colorMode: 'light', toggleColorMode: () => {} });

export const useColorModeToggle = () => useContext(ColorModeContext);

const config = defineConfig({
  globalCss: {
    html: {
      colorPalette: 'gray',
    },
  },
});

export const system = createSystem(defaultConfig, config);

export function Provider(props: ColorModeProviderProps) {
  const [colorMode, setColorMode] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('colorMode') as 'light' | 'dark') || 'light';
    }
    return 'light';
  });
  const toggleColorMode = () => {
    setColorMode((m) => {
      const next = m === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        localStorage.setItem('colorMode', next);
      }
      return next;
    });
  };

  // colorMode가 바뀔 때 body에 data-theme 속성 동기화
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.setAttribute('data-theme', colorMode);
    }
  }, [colorMode]);

  return (
    <ChakraProvider value={system}>
      <ColorModeContext.Provider value={{ colorMode, toggleColorMode }}>
        <Theme appearance={colorMode}>
          <ColorModeProvider {...props} />
        </Theme>
      </ColorModeContext.Provider>
    </ChakraProvider>
  );
}
