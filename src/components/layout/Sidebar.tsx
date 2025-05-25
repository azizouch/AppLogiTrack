import { useState } from 'react';
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
  ChevronLeft,
  CheckCircle,
  XCircle,
  Ban,
  CreditCard,
  RotateCcw,
  UserCheck,
  UserPlus
} from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function AppSidebar() {
  const location = useLocation();
  const [expandedItems, setExpandedItems] = useState<string[]>(['Colis']); // Start with Colis expanded
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

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
        { title: 'Liste Colis', url: '/colis', icon: Package },
        { title: 'Colis Livrés', url: '/colis/livres', icon: CheckCircle },
        { title: 'Colis Refusés', url: '/colis/refuses', icon: XCircle, roles: ['admin', 'gestionnaire'] },
        { title: 'Colis Annulés', url: '/colis/annules', icon: Ban, roles: ['admin', 'gestionnaire'] },
      ]
    },
    {
      title: 'Bons',
      icon: FileText,
      roles: ['admin', 'gestionnaire'],
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
        { title: 'Général', url: '/parametres', icon: Settings },
        { title: 'Statuts', url: '/parametres/statuts', icon: Package },
      ]
    },
  ];

  const hasAccess = (_itemRoles?: string[]) => {
    // Since we removed auth, show all items (admin access)
    return true;
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
    setExpandedItems(prev =>
      prev.includes(itemTitle)
        ? prev.filter(item => item !== itemTitle)
        : [...prev, itemTitle]
    );
  };

  const isExpanded = (itemTitle: string) => {
    return expandedItems.includes(itemTitle);
  };

  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
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

  return (
    <Sidebar className={`${isCollapsed ? 'w-16' : 'w-64'} bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300`}>
      {/* Header */}
      <SidebarHeader className="p-4 border-b border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">LogiTrack</h1>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={toggleCollapse}
          >
            <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} />
          </Button>
        </div>
      </SidebarHeader>

      {/* Navigation */}
      <SidebarContent className="p-4">
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
                      <Link to={item.url}>
                        <div
                          className={`w-full flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                            isCollapsed ? 'justify-center' : 'justify-start space-x-3'
                          } ${
                            isItemActive
                              ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          {!isCollapsed && <span>{item.title}</span>}
                        </div>
                      </Link>
                    ) : (
                      // Menu item with dropdown
                      <div className="space-y-1">
                        <Button
                          variant="ghost"
                          onClick={() => !isCollapsed && toggleExpanded(item.title)}
                          className={`w-full px-3 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                            isCollapsed ? 'justify-center' : 'justify-between'
                          } ${
                            hasActiveChild
                              ? 'bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                        >
                          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'space-x-3'}`}>
                            <item.icon className="h-5 w-5 flex-shrink-0" />
                            {!isCollapsed && <span>{item.title}</span>}
                          </div>
                          {!isCollapsed && item.hasDropdown && (
                            expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>

                        {/* Dropdown items */}
                        {!isCollapsed && expanded && item.items && (
                          <div className="ml-8 space-y-1 mt-2">
                            {item.items.map((subItem) => {
                              if (subItem.roles && !hasAccess(subItem.roles)) return null;
                              const isSubItemActive = isActive(subItem.url);

                              return (
                                <Link key={subItem.url} to={subItem.url}>
                                  <div
                                    className={`w-full flex items-center space-x-3 px-3 py-2.5 text-sm rounded-lg transition-colors cursor-pointer ${
                                      isSubItemActive
                                        ? 'bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 font-medium border-l-2 border-blue-500'
                                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-200'
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

      {/* Footer */}
      <SidebarFooter className="p-4 border-t border-gray-100 dark:border-gray-700">
        <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
          {!isCollapsed && (
            <div className="flex items-center justify-center w-10 h-10 bg-gray-800 dark:bg-gray-600 text-white rounded-full">
              <span className="text-sm font-medium">N</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-800"
            onClick={toggleDarkMode}
          >
            <Moon className={`h-4 w-4 transition-colors ${isDarkMode ? 'text-yellow-500' : 'text-gray-600 dark:text-gray-400'}`} />
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}