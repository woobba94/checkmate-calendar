import { useTheme } from 'next-themes';

export function useColorMode() {
  const { resolvedTheme: colorMode, setTheme: setColorMode } = useTheme();
  const toggleColorMode = () => {
    setColorMode(colorMode === 'light' ? 'dark' : 'light');
  };
  return { colorMode, setColorMode, toggleColorMode };
}

export function useColorModeValue<T>(light: T, dark: T) {
  const { colorMode } = useColorMode();
  return colorMode === 'light' ? light : dark;
}
