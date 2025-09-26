import { Button } from '@/components/ui/button';
import { useI18n } from '@/contexts/I18nContext';

export function Header() {
  const { t, locale, setLocale } = useI18n();

  return (
    <header
      className="fixed top-0 left-0 right-0 h-[60px] w-full z-50"
      style={{
        background: 'var(--alpha-5, rgba(255, 255, 255, 0.95))',
        backdropFilter: 'blur(calc(var(--blur-2xl, 40px) / 2))',
      }}
    >
      <div className="mx-auto max-w-[1024px] h-full px-5 md:px-4 flex items-center justify-between">
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

        <div className="flex items-center gap-4">
          {/* Language Switcher */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => setLocale('ko')}
              className={`px-2 py-1 text-sm rounded transition-colors ${
                locale === 'ko'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:text-foreground'
              }`}
            >
              KO
            </button>
            <button
              onClick={() => setLocale('en')}
              className={`px-2 py-1 text-sm rounded transition-colors ${
                locale === 'en'
                  ? 'bg-blue-100 text-blue-600'
                  : 'text-gray-600 hover:text-foreground'
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
          >
            {t('@시작하기@')}
          </Button>
        </div>
      </div>
    </header>
  );
}
