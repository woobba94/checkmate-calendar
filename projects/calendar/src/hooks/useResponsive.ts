import { useState, useEffect } from 'react';

// Tailwind 기본 브레이크포인트 활용
const BREAKPOINTS = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  '2xl': 1536,
} as const;

type BreakpointKey = keyof typeof BREAKPOINTS;

interface ResponsiveState {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  currentBreakpoint: BreakpointKey | 'xs';
}

export const useResponsive = (): ResponsiveState => {
  const [state, setState] = useState<ResponsiveState>(() => {
    // SSR 환경 고려
    if (typeof window === 'undefined') {
      return {
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        currentBreakpoint: 'lg',
      };
    }

    const width = window.innerWidth;
    return {
      isMobile: width < BREAKPOINTS.md,
      isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
      isDesktop: width >= BREAKPOINTS.lg,
      currentBreakpoint: getCurrentBreakpoint(width),
    };
  });

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      setState({
        isMobile: width < BREAKPOINTS.md,
        isTablet: width >= BREAKPOINTS.md && width < BREAKPOINTS.lg,
        isDesktop: width >= BREAKPOINTS.lg,
        currentBreakpoint: getCurrentBreakpoint(width),
      });
    };

    // 디바운스를 통한 성능 최적화
    let timeoutId: number;
    const debouncedCheckDevice = () => {
      clearTimeout(timeoutId);
      timeoutId = window.setTimeout(checkDevice, 150);
    };

    window.addEventListener('resize', debouncedCheckDevice);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', debouncedCheckDevice);
    };
  }, []);

  return state;
};

// 현재 브레이크포인트 판별
function getCurrentBreakpoint(width: number): BreakpointKey | 'xs' {
  if (width >= BREAKPOINTS['2xl']) return '2xl';
  if (width >= BREAKPOINTS.xl) return 'xl';
  if (width >= BREAKPOINTS.lg) return 'lg';
  if (width >= BREAKPOINTS.md) return 'md';
  if (width >= BREAKPOINTS.sm) return 'sm';
  return 'xs';
}

// 특정 브레이크포인트 이상인지 확인하는 Hook
export const useMediaQuery = (query: string): boolean => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia(query);
    
    // 초기값 설정
    setMatches(mediaQuery.matches);

    // 리스너 설정
    const handler = (event: MediaQueryListEvent) => {
      setMatches(event.matches);
    };

    // addEventListener 방식 사용 (구버전 브라우저 호환성)
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handler);
    } else {
      mediaQuery.addListener(handler);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handler);
      } else {
        mediaQuery.removeListener(handler);
      }
    };
  }, [query]);

  return matches;
};

// 브레이크포인트별 조건부 렌더링을 위한 Hook
export const useBreakpoint = () => {
  const responsive = useResponsive();
  
  return {
    ...responsive,
    isAbove: (breakpoint: BreakpointKey) => {
      const width = window.innerWidth;
      return width >= BREAKPOINTS[breakpoint];
    },
    isBelow: (breakpoint: BreakpointKey) => {
      const width = window.innerWidth;
      return width < BREAKPOINTS[breakpoint];
    },
  };
};
