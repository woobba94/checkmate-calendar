import { Button } from '@/components/ui/button';
import { useI18n } from '@/contexts/I18nContext';

export function Header() {
  const { t, locale, setLocale } = useI18n();

  return (
    <header
      className="fixed top-0 left-0 right-0 h-[64px] w-full z-50 border-b border-border/50"
      style={{
        background: 'rgba(255, 255, 255, 0.85)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div className="mx-auto max-w-[1100px] h-full px-6 flex items-center justify-between">
        {/* Logo */}
        <a
          href="https://checkmate-calendar.com"
          className="flex items-center hover:opacity-80 transition-opacity"
        >
          <img
            src="/simbol-and-text-logo.svg"
            alt="Checkmate"
            className="h-8"
          />
        </a>

        <div className="flex items-center gap-5">
          {/* Language Switcher */}
          <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
            <button
              onClick={() => setLocale('ko')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                locale === 'ko'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              KO
            </button>
            <button
              onClick={() => setLocale('en')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200 ${
                locale === 'en'
                  ? 'bg-white text-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              EN
            </button>
          </div>

          {/* CTA Button */}
          <Button
            onClick={() =>
              (window.location.href = 'https://app.checkmate-calendar.com')
            }
            variant="primary"
            className="px-5 py-2 text-sm font-semibold bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 rounded-lg shadow-md shadow-indigo-500/20 transition-all duration-200"
          >
            {t('@시작하기@')}
          </Button>
        </div>
      </div>
    </header>
  );
}
