import { Link } from 'react-router-dom';

const Header = () => {
  const handleGetStarted = () => {
    window.location.href = 'https://app.checkmate-calendar.com';
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <Link to="/" className="logo">
            Checkmate Calendar
          </Link>
          <nav>
            <ul className="nav-links">
              <li>
                <Link to="/about" className="nav-link">
                  About
                </Link>
              </li>
              <li>
                <Link to="/features" className="nav-link">
                  Features
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="nav-link">
                  Pricing
                </Link>
              </li>
            </ul>
          </nav>
          <button onClick={handleGetStarted} className="cta-button">
            Get Started
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
