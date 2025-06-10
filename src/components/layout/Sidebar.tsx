import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Package,
  Truck,
  Users,
  Bell,
  Settings,
  Building2,
  UsersRound,
  FileText,
  Home,
  ChevronDown,
  ChevronUp,
  Moon,
  Sun,
  ChevronLeft,
  CheckCircle,
  XCircle,
  Ban,
  CreditCard,
  RotateCcw,
  UserCheck,
  UserPlus,
  UserX,
  User
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarHeader,
  useSidebar,
} from '@/components/ui/sidebar';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/supabase';

export function AppSidebar() {
  const location = useLocation();
  const { state, toggleSidebar } = useSidebar();
  const { state: authState } = useAuth();
  const isMobile = useIsMobile();
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const [dropdownPopup, setDropdownPopup] = useState<{ items: any[]; x: number; y: number } | null>(null);
  const [badgeCounts, setBadgeCounts] = useState<Record<string, number>>({});



  // CSS variables will handle the styling properly

  const isCollapsed = state === 'collapsed';

  // Auto-expand dropdown if current page belongs to it, or close all if on regular page
  useEffect(() => {
    if (!isCollapsed) {
      // Find which dropdown contains the current page
      const activeDropdown = navigationItems.find(item =>
        item.items && item.items.some(subItem => location.pathname === subItem.url)
      );

      if (activeDropdown) {
        // Current page is in a dropdown - expand only that dropdown
        setExpandedItems(prev => {
          if (!prev.includes(activeDropdown.title)) {
            return [activeDropdown.title];
          }
          return prev; // Don't change if already correct
        });
      } else {
        // Current page is not in any dropdown - close all dropdowns
        const isRegularPage = navigationItems.some(item =>
          item.url && location.pathname === item.url
        );
        if (isRegularPage) {
          setExpandedItems(prev => prev.length > 0 ? [] : prev);
        }
      }
    }
  }, [location.pathname, isCollapsed]); // Removed expandedItems from dependencies

  // Fetch badge counts for livreur
  useEffect(() => {
    const fetchBadgeCounts = async () => {
      if (authState.user?.role?.toLowerCase() === 'livreur' && authState.user?.id) {
        try {
          const { data, error } = await api.getColisCountsByStatus(authState.user.id, ['Relancé', 'Relancé Autre Client']);
          if (data && !error) {
            setBadgeCounts(data);
          } else {
            // Set default counts if no data
            setBadgeCounts({
              'Relancé': 0,
              'Relancé Autre Client': 0
            });
          }
        } catch (error) {
          console.error('Error fetching badge counts:', error);
          // Set default counts on error
          setBadgeCounts({
            'Relancé': 0,
            'Relancé Autre Client': 0
          });
        }
      }
    };

    fetchBadgeCounts();
    // Refresh counts every 30 seconds
    const interval = setInterval(fetchBadgeCounts, 30000);
    return () => clearInterval(interval);
  }, [authState.user?.id, authState.user?.role]);

  const navigationItems = [
    {
      title: 'Accueil',
      url: '/',
      icon: Home,
      roles: ['admin', 'gestionnaire', 'livreur']
    },
    {
      title: 'Colis',
      icon: Package,
      roles: ['admin', 'gestionnaire', 'livreur'],
      hasDropdown: true,
      items: [
        { title: 'Liste Colis', url: '/colis', icon: Package, roles: ['admin', 'gestionnaire'] },
        { title: 'Mes Colis', url: '/colis/mes-colis', icon: Package, roles: ['livreur'] },
        { title: 'Colis Livrés', url: '/colis/livres', icon: CheckCircle, roles: ['admin', 'gestionnaire'] },
        { title: 'Colis Refusés', url: '/colis/refuses', icon: XCircle, roles: ['admin', 'gestionnaire'] },
        { title: 'Colis Annulés', url: '/colis/annules', icon: Ban, roles: ['admin', 'gestionnaire'] },
        { title: 'Colis Livrés', url: '/colis/mes-livres', icon: CheckCircle, roles: ['livreur'] },
        { title: 'Colis Retournés', url: '/colis/mes-refuses', icon: XCircle, roles: ['livreur'] },
        { title: 'Colis Annulés', url: '/colis/mes-annules', icon: Ban, roles: ['livreur'] },
      ]
    },
    {
      title: 'Colis Relancé',
      url: '/colis/relance',
      icon: RotateCcw,
      roles: ['livreur'],
      badgeCount: badgeCounts['Relancé'] ?? 0
    },
    {
      title: 'Relancé Autre Client',
      url: '/colis/relance-autre',
      icon: UserX,
      roles: ['livreur'],
      badgeCount: badgeCounts['Relancé Autre Client'] ?? 0
    },
    {
      title: 'Bons',
      icon: FileText,
      roles: ['admin', 'gestionnaire', 'livreur'],
      hasDropdown: true,
      items: [
        { title: 'Distribution', url: '/bons/distribution', icon: FileText },
        { title: 'Paiement', url: '/bons/paiement', icon: CreditCard },
        { title: 'Retour', url: '/bons/retour', icon: RotateCcw },
      ]
    },
    {
      title: 'Clients',
      url: '/clients',
      icon: Users,
      roles: ['admin', 'gestionnaire']
    },
    {
      title: 'Entreprises',
      url: '/entreprises',
      icon: Building2,
      roles: ['admin', 'gestionnaire']
    },
    {
      title: 'Livreurs',
      url: '/livreurs',
      icon: Truck,
      roles: ['admin', 'gestionnaire']
    },
    {
      title: 'Notifications',
      url: '/notifications',
      icon: Bell,
      roles: ['admin', 'gestionnaire', 'livreur']
    },
    {
      title: 'Mon Compte',
      icon: User,
      roles: ['admin', 'gestionnaire', 'livreur'],
      hasDropdown: true,
      items: [
        { title: 'Mon Profil', url: '/profil', icon: User, roles: ['admin', 'gestionnaire', 'livreur'] },
        { title: 'Paramètres', url: '/parametres/compte', icon: Settings, roles: ['admin', 'gestionnaire', 'livreur'] },
      ]
    },
    {
      title: 'Utilisateurs',
      icon: UsersRound,
      roles: ['admin'],
      hasDropdown: true,
      items: [
        { title: 'Gestion', url: '/utilisateurs', icon: UserCheck },
        { title: 'Suivi', url: '/utilisateurs/suivi', icon: UserPlus },
      ]
    },
    {
      title: 'Paramètres',
      icon: Settings,
      roles: ['admin'],
      hasDropdown: true,
      items: [
        { title: 'Général', url: '/parametres', icon: Settings, roles: ['admin'] },
        { title: 'Statuts', url: '/parametres/statuts', icon: Package, roles: ['admin'] },
      ]
    },
  ];

  const hasAccess = (itemRoles?: string[]) => {
    if (!itemRoles || itemRoles.length === 0) return true;
    if (!authState.user) return false;

    // Make role comparison case-insensitive
    const userRole = authState.user.role.toLowerCase();
    const hasRole = itemRoles.some(role => role.toLowerCase() === userRole);

    return hasRole;
  };



  const isActive = (url: string) => {
    if (url === '/') {
      return location.pathname === '/';
    }
    // For exact matching of sub-routes
    return location.pathname === url;
  };

  const isParentActive = (items: any[]) => {
    return items.some(item => location.pathname === item.url);
  };

  const toggleExpanded = (itemTitle: string) => {
    setExpandedItems(prev => {
      if (prev.includes(itemTitle)) {
        // If clicking on already expanded item, close it
        return prev.filter(item => item !== itemTitle);
      } else {
        // If clicking on collapsed item, close all others and open this one
        return [itemTitle];
      }
    });
  };

  const isExpanded = (itemTitle: string) => {
    return expandedItems.includes(itemTitle);
  };

  const toggleCollapse = () => {
    toggleSidebar();
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    // Apply dark mode to document
    if (!isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  const handleMouseEnter = (event: React.MouseEvent, text: string) => {
    if (!isCollapsed) return;

    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      text,
      x: rect.right + 8, // 8px spacing from the icon (reduced from 20px)
      y: rect.top + rect.height / 2 // Center vertically
    });
  };

  const handleMouseLeave = () => {
    setTooltip(null);
  };

  const handleDropdownClick = (event: React.MouseEvent, items: any[]) => {
    if (!isCollapsed) return;

    const rect = event.currentTarget.getBoundingClientRect();
    setDropdownPopup({
      items,
      x: rect.right + 8, // 8px spacing from the icon (same as tooltip)
      y: rect.top
    });
    // Hide tooltip when showing dropdown
    setTooltip(null);
  };

  const handleDropdownClose = () => {
    setDropdownPopup(null);
  };

  const handleLinkClick = () => {
    // Close sidebar on mobile when a link is clicked
    if (isMobile && state === 'expanded') {
      toggleSidebar();
    }
  };

  return (
    <>
      <Sidebar
        collapsible="icon"
        className={`bg-sidebar border-r border-sidebar-border ${isCollapsed ? 'sidebar-collapsed' : ''}`}
      >
      {/* Header */}
      <SidebarHeader className="h-16 px-4 border-b border-sidebar-border">
        <div className={`h-full flex items-center w-full ${!isCollapsed ? 'justify-between' : 'justify-center'}`}>
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-sidebar-foreground flex items-center">
              LogiTrack
            </h1>
          )}
          <div
            className="flex items-center justify-center p-2 rounded-lg transition-colors cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
            onClick={toggleCollapse}
          >
            <ChevronLeft className={`h-4 w-4 transition-transform duration-300 text-sidebar-foreground ${isCollapsed ? 'rotate-180' : ''}`} />
          </div>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className={isCollapsed ? "p-2" : "p-2"}>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => {
                if (!hasAccess(item.roles)) return null;

                const isItemActive = item.url ? isActive(item.url) : false;
                const hasActiveChild = item.items ? isParentActive(item.items) : false;
                const expanded = isExpanded(item.title);

                return (
                  <SidebarMenuItem key={item.title}>
                    {item.url ? (
                      // Single menu item
                      <div className={`relative ${isCollapsed ? 'flex justify-center' : ''}`}>
                        <Link to={item.url} onClick={handleLinkClick}>
                          <div
                            className={`flex items-center text-sm font-medium rounded-md transition-colors cursor-pointer ${
                              !isCollapsed
                                ? 'w-full justify-start space-x-2 px-3 py-2.5'
                                : 'w-10 h-10 justify-center'
                            } ${
                              isItemActive
                                ? 'bg-sidebar-primary text-sidebar-primary-foreground active-item'
                                : 'text-sidebar-foreground hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-sidebar-foreground hover-item'
                            }`}

                            onMouseEnter={(e) => handleMouseEnter(e, item.title)}
                            onMouseLeave={handleMouseLeave}
                          >
                            <item.icon
                              className={`h-5 w-5 flex-shrink-0 ${
                                isItemActive ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground'
                              }`}
                            />
                            {!isCollapsed && (
                              <div className="flex items-center justify-between w-full">
                                <span>{item.title}</span>
                                {item.badgeCount !== undefined && (
                                  <Badge
                                    variant="secondary"
                                    className="ml-2 bg-gray-200 text-black dark:bg-gray-700 dark:text-white text-xs px-2 py-0.5 min-w-[20px] h-5 flex items-center justify-center"
                                  >
                                    {item.badgeCount}
                                  </Badge>
                                )}
                              </div>
                            )}
                          </div>
                        </Link>
                      </div>
                    ) : (
                      // Menu item with dropdown
                      <div className="space-y-1">
                        <div className={`relative ${isCollapsed ? 'flex justify-center' : ''}`}>
                          {isCollapsed ? (
                            // When collapsed, show dropdown popup on click - MATCH REGULAR MENU STRUCTURE EXACTLY
                            <div onClick={(e) => handleDropdownClick(e, item.items || [])}>
                              <div
                                className={`flex items-center text-sm font-medium rounded-md transition-colors cursor-pointer ${
                                  !isCollapsed
                                    ? 'w-full justify-start space-x-2 px-3 py-2.5'
                                    : 'w-10 h-10 justify-center'
                                } ${
                                  hasActiveChild
                                    ? 'bg-sidebar-primary text-sidebar-primary-foreground active-item'
                                    : 'text-sidebar-foreground hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-sidebar-foreground hover-item'
                                }`}
                                onMouseEnter={(e) => handleMouseEnter(e, item.title)}
                                onMouseLeave={handleMouseLeave}
                              >
                                <item.icon
                                  className={`h-5 w-5 flex-shrink-0 ${
                                    hasActiveChild ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground'
                                  }`}
                                />
                                {!isCollapsed && <span>{item.title}</span>}
                              </div>
                            </div>
                          ) : (
                            // When expanded, keep original dropdown button
                            <button
                              onClick={() => toggleExpanded(item.title)}
                              className={`flex items-center text-sm font-medium rounded-md transition-colors cursor-pointer w-full justify-between px-3 py-2.5 ${
                                hasActiveChild
                                  ? 'bg-sidebar-primary text-sidebar-primary-foreground active-item'
                                  : 'text-sidebar-foreground hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-sidebar-foreground hover-item'
                              }`}
                              onMouseEnter={(e) => handleMouseEnter(e, item.title)}
                              onMouseLeave={handleMouseLeave}
                            >
                              <>
                                <div className="flex items-center space-x-2">
                                  <item.icon
                                    className={`h-5 w-5 flex-shrink-0 ${
                                      hasActiveChild ? 'text-sidebar-primary-foreground' : 'text-sidebar-foreground'
                                    }`}
                                  />
                                  <span>{item.title}</span>
                                </div>
                                {item.hasDropdown && (
                                  <div>
                                    {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                                  </div>
                                )}
                              </>
                            </button>
                          )}
                        </div>

                        {/* Dropdown items */}
                        {!isCollapsed && expanded && item.items && (
                          <div className="ml-8 space-y-1 mt-2">
                            {item.items.map((subItem: any) => {
                              if (subItem.roles && !hasAccess(subItem.roles)) return null;
                              const isSubItemActive = isActive(subItem.url);

                              return (
                                <Link key={subItem.url} to={subItem.url} onClick={handleLinkClick} className="block">
                                  <div
                                    className={`w-full flex items-center space-x-2 px-3 py-1.5 text-sm rounded-md transition-colors cursor-pointer ${
                                      isSubItemActive
                                        ? 'bg-black/20 dark:bg-blue-900 text-black dark:text-blue-100 font-medium border-l-4 border-black dark:border-sidebar-ring shadow-sm'
                                        : 'text-sidebar-foreground hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-sidebar-foreground'
                                    }`}
                                  >
                                    <subItem.icon className="h-4 w-4" />
                                    <span>{subItem.title}</span>
                                  </div>
                                </Link>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Theme Toggle Button - Fixed at bottom */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
          onClick={toggleDarkMode}
        >
          {isDarkMode ? (
            <Sun className="h-5 w-5 transition-colors text-white" />
          ) : (
            <Moon className="h-5 w-5 transition-colors text-sidebar-foreground" />
          )}
        </Button>
      </div>
    </Sidebar>

    {/* Portal-based Tooltip */}
    {tooltip && createPortal(
      <div
        className="fixed px-2 py-1 bg-black text-white text-xs rounded shadow-lg pointer-events-none whitespace-nowrap"
        style={{
          left: tooltip.x,
          top: tooltip.y,
          transform: 'translateY(-50%)',
          zIndex: 2147483647
        }}
      >
        {tooltip.text}
      </div>,
      document.body
    )}

    {/* Portal-based Dropdown Popup */}
    {dropdownPopup && createPortal(
      <>
        {/* Backdrop to close dropdown when clicking outside */}
        <div
          className="fixed inset-0 z-[2147483646]"
          onClick={handleDropdownClose}
        />
        {/* Dropdown menu */}
        <div
          className="fixed bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg py-2 min-w-[180px] z-[2147483647]"
          style={{
            left: dropdownPopup.x,
            top: dropdownPopup.y
          }}
        >
          {dropdownPopup.items.map((subItem) => {
            if (subItem.roles && !hasAccess(subItem.roles)) return null;
            const isSubItemActive = isActive(subItem.url);

            return (
              <Link
                key={subItem.url}
                to={subItem.url}
                onClick={() => {
                  handleDropdownClose();
                  handleLinkClick();
                }}
                className="block"
              >
                <div
                  className={`flex items-center space-x-2 px-4 py-2.5 text-sm transition-colors cursor-pointer ${
                    isSubItemActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground font-medium'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                  }`}
                >
                  <subItem.icon className="h-4 w-4 flex-shrink-0" />
                  <span>{subItem.title}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </>,
      document.body
    )}
    </>
  );
}