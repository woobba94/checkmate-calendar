import React from 'react';
import './Layout.scss';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      <main className="app-main">{children}</main>
    </div>
  );
};

export default Layout;
