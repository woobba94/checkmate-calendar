import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-background py-12 md:py-20">
      <div className="max-w-[1200px] mx-auto px-5">
        <div className="flex flex-col md:grid md:grid-cols-4 gap-6 md:gap-8 mb-8">
          {/* Logo */}
          <a
            href="https://checkmate-calendar.com"
            className="flex items-center gap-2 text-foreground hover:opacity-80 transition-opacity mb-4 md:mb-0"
          >
            <img
              src="/simbol-and-text-logo-dark.svg"
              alt="Checkmate Logo"
              className="h-5"
            />
          </a>

          {/* Mobile: Vertical Layout */}
          <div className="flex flex-col md:contents gap-6 md:gap-8">
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">
                Product
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/pricing"
                    className="text-gray-400 hover:text-foreground transition-colors"
                  >
                    Pricing
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">
                Company
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/contact"
                    className="text-gray-400 hover:text-foreground transition-colors"
                  >
                    Contact
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h3 className="text-lg font-semibold mb-4 text-foreground">
                Legal
              </h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    to="/terms"
                    className="text-gray-400 hover:text-foreground transition-colors"
                  >
                    Terms of Service
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="text-gray-400 hover:text-foreground transition-colors"
                  >
                    Privacy Policy
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </div>
        <div className="text-center md:text-center pt-8">
          <p className="text-gray-400 text-sm md:text-base">
            &copy; 2025 Checkmate Calendar Inc. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
