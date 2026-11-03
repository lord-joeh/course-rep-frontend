import React from 'react';
import { useTheme } from '@/components/theme-provider';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Moon, Sun, Menu, Bell, User, LogOut, Settings } from 'lucide-react';
import type { AuthenticatedUser } from '@/types';

interface NavbarProps {
  user?: AuthenticatedUser | null;
  onOpenMobileMenu: () => void;
  onLogout?: () => void;
  unreadNotificationCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  user,
  onOpenMobileMenu,
  onLogout,
  unreadNotificationCount = 0,
}) => {
  const { setTheme, resolvedTheme } = useTheme();

  return (
    <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-border bg-background/95 px-4 md:px-6 backdrop-blur-xs">
      {/* Mobile Toggle & Brand */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={onOpenMobileMenu}
          className="md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme mode"
          title={`Switch to ${resolvedTheme === 'dark' ? 'Light' : 'Dark'} mode`}
        >
          {resolvedTheme === 'dark' ? (
            <Sun className="h-4 w-4 text-foreground" />
          ) : (
            <Moon className="h-4 w-4 text-foreground" />
          )}
        </Button>

        {/* Notifications Icon */}
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="View notifications"
        >
          <Bell className="h-4 w-4 text-foreground" />
          {unreadNotificationCount > 0 && (
            <span className="absolute top-2 right-2 flex h-2 w-2">
              <span className="relative inline-flex rounded-full h-2 w-2 bg-destructive"></span>
            </span>
          )}
        </Button>

        {/* User Profile Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="flex items-center gap-2 pl-2 pr-3 h-9"
              aria-label="Open user menu"
            >
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                {user?.name ? user.name.charAt(0).toUpperCase() : <User className="h-3.5 w-3.5" />}
              </div>
              <span className="hidden sm:inline-block max-w-[120px] truncate text-xs font-medium">
                {user?.name || user?.email || 'My Account'}
              </span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">{user?.name || 'User Profile'}</p>
                <p className="text-xs leading-none text-muted-foreground truncate">
                  {user?.email || 'Logged in'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="cursor-pointer text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
};
