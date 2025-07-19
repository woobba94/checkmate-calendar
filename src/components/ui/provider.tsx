"use client"

import { ChakraProvider, createSystem, defaultConfig, defaultSystem, defineConfig, Theme } from "@chakra-ui/react";
import { ColorModeProvider, type ColorModeProviderProps } from "./color-mode"

export function Provider(props: ColorModeProviderProps) {
  const config = defineConfig({
    globalCss: {
      html: {
        colorPalette: "gray", 
      },
    },
  })
  const system = createSystem(defaultConfig, config)

  return (
    <ChakraProvider value={system}>
      <Theme appearance="light">
        <ColorModeProvider {...props} />
      </Theme>
    </ChakraProvider>
  )
}
