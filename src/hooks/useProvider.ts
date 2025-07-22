import { useColorMode } from './useColorMode';

export const accentColor = 'purple';
export const grayColor = 'neutral';

export function useTheme() {
  const { colorMode } = useColorMode();
  return colorMode === 'dark' ? 'dark' : 'light';
}

export function useColorModeToggle(): {
  colorMode: 'light' | 'dark';
  toggleColorMode: () => void;
} {
  const { colorMode, toggleColorMode } = useColorMode();
  return {
    colorMode: (colorMode || 'light') as 'light' | 'dark',
    toggleColorMode,
  };
}
