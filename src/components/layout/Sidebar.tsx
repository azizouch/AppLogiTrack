
import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { 
  Package, 
  Users, 
  Truck, 
  Bell, 
  Settings, 
  User,
  FileText,
  Calendar
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';

const navigationItems = [
  {
    title: 'Accueil',
    url: '/',
    icon: Calendar,
    roles: ['admin', 'gestionnaire', 'livreur'],
  },
  {
    title: 'Colis',
    icon: Package,
    roles: ['admin', 'gestionnaire', 'livreur'],
    subItems: [
      { title: 'Liste Colis', url: '/colis', roles: ['admin', 'gestionnaire', 'livreur'] },
      { title: 'Colis Livrés', url: '/colis/livres', roles: ['admin', 'gestionnaire', 'livreur'] },
      { title: 'Colis Refusés', url: '/colis/refuses', roles: ['admin', 'gestionnaire'] },
      { title: 'Colis Annulés', url: '/colis/annules', roles: ['admin', 'gestionnaire'] },
    ],
  },
  {
    title: 'Bons',
    url: '/bons',
    icon: FileText,
    roles: ['admin', 'gestionnaire'],
  },
  {
    title: 'Clients',
    url: '/clients',
    icon: Users,
    roles: ['admin', 'gestionnaire'],
  },
  {
    title: 'Entreprises',
    url: '/entreprises',
    icon: Package,
    roles: ['admin', 'gestionnaire'],
  },
  {
    title: 'Livreurs',
    url: '/livreurs',
    icon: Truck,
    roles: ['admin', 'gestionnaire'],
  },
  {
    title: 'Notifications',
    url: '/notifications',
    icon: Bell,
    roles: ['admin', 'gestionnaire', 'livreur'],
  },
  {
    title: 'Utilisateurs',
    url: '/utilisateurs',
    icon: User,
    roles: ['admin'],
  },
  {
    title: 'Paramètres',
    url: '/parametres',
    icon: Settings,
    roles: ['admin'],
  },
];

export function AppSidebar() {
  const { state } = useAuth();
  const { collapsed } = useSidebar();
  const location = useLocation();

  const filteredNavigation = navigationItems.filter(item => 
    item.roles.includes(state.user?.role || '')
  );

  const isActive = (path: string) => location.pathname === path;
  const isParentActive = (item: any) => {
    if (item.url && isActive(item.url)) return true;
    if (item.subItems) {
      return item.subItems.some((subItem: any) => isActive(subItem.url));
    }
    return false;
  };

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible>
      <div className="p-4 border-b">
        <h1 className={`font-bold text-xl text-blue-600 ${collapsed ? 'hidden' : 'block'}`}>
          LogiTrack
        </h1>
        {collapsed && (
          <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">LT</span>
          </div>
        )}
      </div>

      <SidebarContent className="p-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredNavigation.map((item) => (
                <div key={item.title}>
                  {item.subItems ? (
                    <div className="mb-2">
                      <SidebarGroupLabel className="px-3 py-2 text-sm font-medium text-gray-900 flex items-center">
                        <item.icon className="mr-3 h-4 w-4" />
                        {!collapsed && item.title}
                      </SidebarGroupLabel>
                      <div className="ml-4 space-y-1">
                        {item.subItems
                          .filter(subItem => subItem.roles.includes(state.user?.role || ''))
                          .map((subItem) => (
                            <SidebarMenuItem key={subItem.url}>
                              <SidebarMenuButton asChild>
                                <NavLink
                                  to={subItem.url}
                                  className={({ isActive }) =>
                                    `flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                                      isActive
                                        ? 'bg-blue-100 text-blue-700 font-medium'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`
                                  }
                                >
                                  <span className="ml-6">{!collapsed && subItem.title}</span>
                                </NavLink>
                              </SidebarMenuButton>
                            </SidebarMenuItem>
                          ))}
                      </div>
                    </div>
                  ) : (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild>
                        <NavLink
                          to={item.url!}
                          className={({ isActive }) =>
                            `flex items-center px-3 py-2 rounded-md text-sm transition-colors ${
                              isActive
                                ? 'bg-blue-100 text-blue-700 font-medium'
                                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                            }`
                          }
                        >
                          <item.icon className="mr-3 h-4 w-4" />
                          {!collapsed && item.title}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </div>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
