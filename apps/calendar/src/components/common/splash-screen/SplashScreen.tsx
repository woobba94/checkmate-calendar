import { useEffect, useState } from 'react';

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
      className={`fixed top-0 left-0 w-screen h-screen flex justify-center items-center z-[9999] transition-opacity duration-1000 ${
        fadeOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
      style={{ background: colorMode === 'light' ? '#fff' : '#18181b' }}
    >
      <img
        src={logoSrc}
        alt="Checkmate Calendar Logo"
        className="h-12 drop-shadow-[0_2px_8px_rgba(0,0,0,0.08)]"
      />
    </div>
  );
}
