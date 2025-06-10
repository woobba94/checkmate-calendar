import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Layout.scss';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="layout">
      <header className="app-header">
        <div className="logo">BUBU Calendar</div>
        <nav className="nav-menu">
          {/* 필요한 네비게이션 메뉴 항목들 */}
        </nav>
        <div className="user-menu">
          {user ? (
            <>
              <span className="user-email">{user.email}</span>
              <button onClick={handleLogout} className="logout-button">
                Logout
              </button>
            </>
          ) : (
            <button onClick={() => navigate('/login')} className="login-button">
              Login
            </button>
          )}
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
};

export default Layout;