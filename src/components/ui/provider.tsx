"use client"

import { ChakraProvider, createSystem, defaultConfig, defaultSystem, defineConfig, Theme } from "@chakra-ui/react";
import React, { createContext, useContext, useState } from "react";
import { ColorModeProvider, type ColorModeProviderProps } from "./color-mode";

const ColorModeContext = createContext<{ colorMode: 'light' | 'dark', toggleColorMode: () => void }>({ colorMode: 'light', toggleColorMode: () => {} });

export const useColorModeToggle = () => useContext(ColorModeContext);

const config = defineConfig({
  globalCss: {
    html: {
      colorPalette: "gray",
    },
  },
});

export const system = createSystem(defaultConfig, config);

export function Provider(props: ColorModeProviderProps) {
  const [colorMode, setColorMode] = useState<'light' | 'dark'>('light');
  const toggleColorMode = () => setColorMode((m) => (m === 'light' ? 'dark' : 'light'));

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
