import { Button } from '@/components/ui/button';
import { CheckSquare } from 'lucide-react';

export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 h-[60px] w-full bg-background border-b z-50">
      <div className="mx-auto max-w-[1024px] h-full px-4 flex items-center justify-between">
        {/* Logo */}
        <a
          href="https://checkmate-calendar.com"
          className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity"
        >
          <CheckSquare className="h-6 w-6" />
          <span className="font-semibold text-lg">Checkmate</span>
        </a>

        {/* CTA Button */}
        <Button
          onClick={() =>
            (window.location.href = 'https://app.checkmate-calendar.com')
          }
          size="sm"
        >
          시작하기
        </Button>
      </div>
    </header>
  );
}
