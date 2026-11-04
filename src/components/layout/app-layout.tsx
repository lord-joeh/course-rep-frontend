import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './sidebar';
import { Navbar } from './navbar';
import { Sheet, SheetContent, SheetTitle } from '@/components/ui/sheet';
import { PwaInstallBanner } from '@/components/pwa/pwa-install-banner';
import { OfflineIndicator } from '@/components/pwa/offline-indicator';
import type { AuthenticatedUser } from '@/types';

interface AppLayoutProps {
  user?: AuthenticatedUser | null;
  onLogout?: () => void;
  unreadNotificationCount?: number;
}

export const AppLayout: React.FC<AppLayoutProps> = ({
  user,
  onLogout,
  unreadNotificationCount = 0,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground">
      {/* Desktop Persistent Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar
          isRep={user?.isRep}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed((prev) => !prev)}
        />
      </div>

      {/* Mobile Drawer (Sheet) */}
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="p-0 w-72 border-r border-border">
          <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          <Sidebar
            isRep={user?.isRep}
            collapsed={false}
            onToggleCollapse={() => setMobileOpen(false)}
            onItemClick={() => setMobileOpen(false)}
            className="w-full h-full border-none"
          />
        </SheetContent>
      </Sheet>

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar
          user={user}
          onOpenMobileMenu={() => setMobileOpen(true)}
          onLogout={onLogout}
          unreadNotificationCount={unreadNotificationCount}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-background">
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>

      {/* PWA In-App Install Banner & Offline Connectivity Indicator */}
      <PwaInstallBanner />
      <OfflineIndicator />
    </div>
  );
};
