import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import './Layout.scss';
import { useQueryClient } from '@tanstack/react-query';
import { getCurrentUser } from '@/services/authService';
import { Button } from "@chakra-ui/react";
import { useColorModeToggle } from "@/components/ui/provider";
import { LuSun, LuMoon } from "react-icons/lu";

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
          <ColorModeToggleButton />
          {user ? (
            <>
              <span className="user-email">{user.email}</span>
              <Button onClick={handleLogout} variant="surface">Logout</Button>
            </>
          ) : (
            <Button onClick={() => navigate('/login')} variant="surface">Login</Button>
          )}
        </div>
      </header>
      <main className="app-main">{children}</main>
    </div>
  );
};

function ColorModeToggleButton() {
  const { colorMode, toggleColorMode } = useColorModeToggle();
  return (
    <Button onClick={toggleColorMode} variant="ghost" size="sm" aria-label="색상 모드 토글" style={{ marginRight: 8 }}>
      {colorMode === 'light' ? <LuMoon /> : <LuSun />}
    </Button>
  );
}

export default Layout;