import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import './Layout.scss';
import { useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '@/services/authService';
import { Button } from "@chakra-ui/react";

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleLogout = async () => {
    try {
      await logout();
      queryClient.removeQueries({ queryKey: ['auth', 'user'] });
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  return (
    <div className="layout">
      <header className="app-header">
        <div className="logo">BUBU Calendar</div>
        <nav className="nav-menu">
        </nav>
        <div className="user-menu">
          {user ? (
            <>
              <span className="user-email">{user.email}</span>
              <Button onClick={handleLogout}>Logout</Button>
            </>
          ) : (
            <Button onClick={() => navigate('/login')}>Login</Button>
          )}
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
};

export default Layout;