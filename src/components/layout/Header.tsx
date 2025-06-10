
import { Search, Bell, User, Menu, X, LogOut, CheckCircle, XCircle, Settings, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { SidebarTrigger, useSidebar } from '@/components/ui/sidebar';
import { GlobalSearch } from '@/components/ui/global-search';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { useAuth } from '@/contexts/AuthContext';
import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/supabase';
import { Notification } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function Header() {
  const { toggleSidebar } = useSidebar();
  const { state, logout } = useAuth();
  const navigate = useNavigate();
  const { toast: showToast } = useToast();
  const [showMobileSearch, setShowMobileSearch] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  // Notification state
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);



  // Fetch notifications
  const fetchNotifications = async () => {
    if (!state.user?.id) return;

    try {
      const { data, error } = await api.getNotifications(state.user.id);

      if (!error && data) {
        setNotifications(data);
        setUnreadCount(data.filter(n => !n.lu).length);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await api.markNotificationAsRead(notificationId);
      if (!error) {
        setNotifications(prev =>
          prev.map(notif =>
            notif.id === notificationId
              ? { ...notif, lu: true }
              : notif
          )
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Mark all notifications as read
  const markAllAsRead = async () => {
    if (!state.user?.id) return;

    try {
      const { error } = await api.markAllNotificationsAsRead(state.user.id);
      if (!error) {
        setNotifications(prev =>
          prev.map(notif => ({ ...notif, lu: true }))
        );
        setUnreadCount(0);
        showToast({
          title: 'Notifications marquées comme lues',
          description: 'Toutes les notifications ont été marquées comme lues',
        });
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  // Delete notification
  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await api.deleteNotification(notificationId);
      if (!error) {
        setNotifications(prev => prev.filter(notif => notif.id !== notificationId));
        setUnreadCount(prev => {
          const notification = notifications.find(n => n.id === notificationId);
          return notification && !notification.lu ? Math.max(0, prev - 1) : prev;
        });
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));

    if (diffInHours < 1) {
      return 'Il y a moins d\'une heure';
    } else if (diffInHours < 24) {
      return `Il y a ${diffInHours} heure${diffInHours > 1 ? 's' : ''}`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `Il y a ${diffInDays} jour${diffInDays > 1 ? 's' : ''}`;
    }
  };

  // Fetch notifications on mount and when user changes
  useEffect(() => {
    if (state.user?.id && (state.user.role === 'admin' || state.user.role === 'gestionnaire')) {
      fetchNotifications();

      // Set up polling for new notifications every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [state.user?.id, state.user?.role]);

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
      // Redirect to home page after successful logout
      navigate('/');
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
          {(state.user?.role === 'admin' || state.user?.role === 'gestionnaire') && (
            <Popover open={showNotifications} onOpenChange={setShowNotifications}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-7 w-7 rounded-full border border-gray-300 dark:border-gray-600 p-0 hover:bg-transparent relative">
                  <Bell className="h-4 w-4 text-gray-600 dark:text-white" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                        <Check className="h-4 w-4 mr-1" />
                        Tout marquer comme lu
                      </Button>
                    )}
                  </div>
                </div>
                <ScrollArea className="h-80">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Aucune notification
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                            !notification.lu ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className={`text-sm font-medium ${!notification.lu ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                  {notification.titre}
                                </h4>
                                {!notification.lu && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatRelativeTime(notification.date_creation)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!notification.lu && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                {notifications.length > 0 && (
                  <div className="p-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigate('/notifications');
                        setShowNotifications(false);
                      }}
                      className="w-full"
                    >
                      Voir toutes les notifications
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          )}

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
              <DropdownMenuItem
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => navigate('/profil')}
              >
                <User className="mr-2 h-4 w-4" />
                Mon Profil
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => navigate('/parametres/compte')}
              >
                <Settings className="mr-2 h-4 w-4" />
                Paramètres
              </DropdownMenuItem>
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
          {(state.user?.role === 'admin' || state.user?.role === 'gestionnaire') && (
            <Popover open={showNotifications} onOpenChange={setShowNotifications}>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 relative">
                  <Bell className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-4 w-4 p-0 text-xs bg-red-500 text-white rounded-full flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="p-4 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                      <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                        <Check className="h-4 w-4 mr-1" />
                        Tout marquer comme lu
                      </Button>
                    )}
                  </div>
                </div>
                <ScrollArea className="h-80">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Aucune notification
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-3 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                            !notification.lu ? 'bg-blue-50 dark:bg-blue-900/10' : ''
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className={`text-sm font-medium ${!notification.lu ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                                  {notification.titre}
                                </h4>
                                {!notification.lu && (
                                  <div className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0"></div>
                                )}
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                {notification.message}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatRelativeTime(notification.date_creation)}
                              </p>
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              {!notification.lu && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => markAsRead(notification.id)}
                                  className="h-6 w-6 p-0"
                                >
                                  <Check className="h-3 w-3" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => deleteNotification(notification.id)}
                                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                              >
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
                {notifications.length > 0 && (
                  <div className="p-3 border-t">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        navigate('/notifications');
                        setShowNotifications(false);
                      }}
                      className="w-full"
                    >
                      Voir toutes les notifications
                    </Button>
                  </div>
                )}
              </PopoverContent>
            </Popover>
          )}

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
            <DropdownMenuItem
              className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => navigate('/profil')}
            >
              <User className="mr-2 h-4 w-4" />
              Mon Profil
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
              onClick={() => navigate('/parametres/compte')}
            >
              <Settings className="mr-2 h-4 w-4" />
              Paramètres
            </DropdownMenuItem>
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
