import { Link } from 'react-router-dom';
import { useI18n } from '@/contexts/I18nContext';

const Footer = () => {
  const { t } = useI18n();

  return (
    <footer className="bg-slate-50 py-16 md:py-20">
      <div className="max-w-[1100px] mx-auto px-6">
        <div className="flex flex-col md:grid md:grid-cols-4 gap-8 md:gap-12 mb-12">
          {/* Logo */}
          <div className="flex flex-col gap-4">
            <a
              href="https://checkmate-calendar.com"
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <img
                src="/simbol-and-text-logo.svg"
                alt="Checkmate"
                className="h-7"
              />
            </a>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-[200px]">
              함께 쓰는 스마트한 공유 캘린더
            </p>
          </div>

          {/* Links */}
          <div className="flex flex-col md:contents gap-8">
            <div>
              <h3 className="text-sm font-semibold mb-4 text-foreground uppercase tracking-wider">
                {t('@Product@')}
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="/pricing"
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {t('@Pricing@')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-4 text-foreground uppercase tracking-wider">
                {t('@Company@')}
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="/contact"
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {t('@Contact@')}
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-sm font-semibold mb-4 text-foreground uppercase tracking-wider">
                {t('@Legal@')}
              </h3>
              <ul className="space-y-3">
                <li>
                  <Link
                    to="/terms"
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {t('@Terms_of_Service@')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="text-muted-foreground hover:text-foreground transition-colors text-sm"
                  >
                    {t('@Privacy_Policy@')}
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="pt-8 border-t border-border">
          <p className="text-muted-foreground text-sm text-center">
            {t('@©_2025_Checkmate_Calendar_Inc._All_rights_reserved.@')}
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
