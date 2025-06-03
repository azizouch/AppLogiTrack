
import { Search, Bell, User, Menu, X, LogOut, CheckCircle, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { GlobalSearch } from '@/components/ui/global-search';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useAuth } from '@/contexts/AuthContext';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';

export function Header() {
  const { toggleSidebar } = useSidebar();
  const { state, logout } = useAuth();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);



  // Force close logout dialog when component unmounts (during logout)
  useEffect(() => {
    return () => {
      setShowLogoutConfirm(false);
    };
  }, []);

  // Global cleanup effect to monitor and fix pointer-events issues
  useEffect(() => {
    const interval = setInterval(() => {
      // Check if body has pointer-events: none but no modal is open
      if (document.body.style.pointerEvents === 'none' && !showLogoutConfirm) {
        // Check if there are any open modals/dialogs
        const hasOpenModal = document.querySelector('[role="alertdialog"][data-state="open"]') ||
                            document.querySelector('[role="dialog"][data-state="open"]') ||
                            document.querySelector('[data-radix-popper-content-wrapper]');

        if (!hasOpenModal) {
          // No modals open, safe to remove pointer-events
          document.body.style.removeProperty('pointer-events');
          document.body.removeAttribute('data-scroll-locked');
        }
      }
    }, 500);

    return () => clearInterval(interval);
  }, [showLogoutConfirm]);

  const handleLogoutClick = () => {
    setShowLogoutConfirm(true);
  };

  const handleLogoutConfirm = async () => {
    try {
      // Perform logout
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Erreur lors de la déconnexion', {
        description: 'Une erreur est survenue lors de la déconnexion',
        duration: 4000,
        icon: <XCircle className="h-5 w-5 text-red-500" />,
      });
    }
  };

  // Handle modal close with proper cleanup
  const handleModalClose = (open: boolean) => {
    setShowLogoutConfirm(open);

    // If modal is being closed, ensure body styles are cleaned up
    if (!open) {
      // Multiple cleanup attempts with different delays to ensure it works
      const cleanupBody = () => {
        document.body.style.removeProperty('pointer-events');
        document.body.removeAttribute('data-scroll-locked');
      };

      // Immediate cleanup
      cleanupBody();

      // Delayed cleanup (after Radix animations)
      setTimeout(cleanupBody, 100);
      setTimeout(cleanupBody, 300);
      setTimeout(cleanupBody, 500);
    }
  };

  return (
    <header className="sticky top-0 z-50 h-16 border-b bg-background border-border flex items-center px-4 sm:px-6 transition-colors">
      {/* Mobile/Tablet Layout */}
      <div className="flex items-center justify-between w-full md:hidden">
        {/* Left side - Hamburger and Search */}
        <div className="flex items-center space-x-6">
          <button
            onClick={toggleSidebar}
            className="h-4 w-4 p-0 hover:bg-transparent flex items-center justify-center"
          >
            <svg className="h-4 w-4 text-gray-600 dark:text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
              <line x1="3" y1="6" x2="21" y2="6"></line>
              <line x1="3" y1="12" x2="21" y2="12"></line>
              <line x1="3" y1="18" x2="21" y2="18"></line>
            </svg>
          </button>
          <button
            onClick={() => setShowMobileSearch(!showMobileSearch)}
            className="h-4 w-4 p-0 hover:bg-transparent flex items-center justify-center"
          >
            <Search className="h-4 w-4 text-gray-600 dark:text-white" />
          </button>
        </div>

        {/* Center - LogiTrack Title */}
        <h1 className="text-lg font-bold text-gray-900 dark:text-white absolute left-1/2 transform -translate-x-1/2">LogiTrack</h1>

        {/* Right side - Notification and User */}
        <div className="flex items-center space-x-6">
          <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full border border-gray-300 dark:border-gray-600 p-0 hover:bg-transparent">
            <Bell className="h-4 w-4 text-gray-600 dark:text-white" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full border border-gray-300 dark:border-gray-600 p-0 hover:bg-transparent">
                <User className="h-4 w-4 text-gray-600 dark:text-white" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <DropdownMenuLabel className="text-gray-900 dark:text-gray-100">
                <div className="flex flex-col space-y-1">
                  <div className="font-medium">
                    {state.user ? `${state.user.prenom} ${state.user.nom}` : 'Utilisateur'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400 font-normal">
                    {state.user?.email || 'email@example.com'}
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
              <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Profil</DropdownMenuItem>
              <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Paramètres</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
              <DropdownMenuItem
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                onClick={handleLogoutClick}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile/Tablet Search Overlay - Below Header */}
      {showMobileSearch && (
        <div className="absolute top-16 left-0 right-0 bg-background p-4 md:hidden z-40 border-b border-border">
          <GlobalSearch
            isMobile={true}
            onClose={() => setShowMobileSearch(false)}
            className="w-full"
          />
        </div>
      )}

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between w-full">
        <div className="flex items-center">
          <GlobalSearch className="w-80 sm:w-96" />
        </div>

        <div className="flex items-center space-x-4 ml-6">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700">
            <Bell className="h-4 w-4 text-gray-600 dark:text-gray-400" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="flex items-center space-x-2 cursor-pointer">
                {/* Desktop: Show user info */}
                <div className="text-right">
                  <div className="font-medium text-sm text-gray-900 dark:text-gray-100">
                    {state.user ? `${state.user.prenom} ${state.user.nom}` : 'Utilisateur'}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {state.user?.email || 'email@example.com'}
                  </div>
                </div>
                <div className="h-8 w-8 rounded-full border border-gray-300 dark:border-gray-600 flex items-center justify-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                  <User className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                </div>
              </div>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <DropdownMenuLabel className="text-gray-900 dark:text-gray-100">Mon compte</DropdownMenuLabel>
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
            <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Profil</DropdownMenuItem>
            <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Paramètres</DropdownMenuItem>
            <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
            <DropdownMenuItem
              className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              onClick={handleLogoutClick}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>

      {/* Logout Confirmation Dialog */}
      <ConfirmationDialog
        open={showLogoutConfirm}
        onOpenChange={handleModalClose}
        title="Confirmer la déconnexion"
        description="Êtes-vous sûr de vouloir vous déconnecter ? Vous devrez vous reconnecter pour accéder à votre compte."
        confirmText="Se déconnecter"
        cancelText="Annuler"
        onConfirm={handleLogoutConfirm}
        variant="destructive"
      />
    </header>
  );
}
