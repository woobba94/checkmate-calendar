import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen box-border bg-[var(--bg-primary)]">
      <main className="flex flex-1 w-full">{children}</main>
    </div>
  );
};

export default Layout;
