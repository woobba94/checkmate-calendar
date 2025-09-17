import { useEffect, useState } from 'react';
import './SplashScreen.scss';

export function SplashScreen() {
  const [fadeOut, setFadeOut] = useState(false);
  const [hide, setHide] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setFadeOut(true), 200);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (fadeOut) {
      const timer = setTimeout(() => setHide(true), 500);
      return () => clearTimeout(timer);
    }
  }, [fadeOut]);

  if (hide) return null;

  let colorMode = 'light';
  if (typeof window !== 'undefined') {
    colorMode =
      localStorage.getItem('colorMode') ||
      (window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light');
  }
  const logoSrc =
    colorMode === 'light' ? '/text-logo-light.svg' : '/text-logo-dark.svg';

  return (
    <div
      className={`splash-screen${fadeOut ? ' fade-out' : ''}`}
      style={{ background: colorMode === 'light' ? '#fff' : '#18181b' }}
    >
      <img
        src={logoSrc}
        alt="Checkmate Calendar Logo"
        style={{
          height: 48,
          filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.08))',
        }}
      />
    </div>
  );
}
