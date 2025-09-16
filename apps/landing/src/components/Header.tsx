import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header
      className="fixed top-0 left-0 right-0 h-[60px] w-full z-50"
      style={{
        background: 'var(--alpha-5, rgba(255, 255, 255, 0.95))',
        backdropFilter: 'blur(calc(var(--blur-2xl, 40px) / 2))',
      }}
    >
      <div className="mx-auto max-w-[1024px] h-full px-4 flex items-center justify-between">
        {/* Logo */}
        <a
          href="https://checkmate-calendar.com"
          className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
        >
          <img
            src="/simbol-and-text-logo.svg"
            alt="Checkmate Logo"
            className="h-8"
          />
        </a>

        {/* CTA Button */}
        <Button
          onClick={() =>
            (window.location.href = 'https://app.checkmate-calendar.com')
          }
          variant="primary"
        >
          시작하기
        </Button>
      </div>
    </header>
  );
}
