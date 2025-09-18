/**
 * 테마 유틸리티
 */

const THEME_STORAGE_KEY = 'checkmate-theme';

/**
 * localStorage 또는 시스템 설정에서 초기 테마 가져오기
 * SSR/초기 렌더링 시 테마 깜빡임을 방지하기 위해 사용
 */
export function getInitialTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') {
    return 'light';
  }

  const stored = localStorage.getItem(THEME_STORAGE_KEY);

  if (stored === 'light' || stored === 'dark') {
    return stored;
  }

  // 'system' 또는 값이 없으면 시스템 설정 확인
  return window.matchMedia('(prefers-color-scheme: dark)').matches
    ? 'dark'
    : 'light';
}
