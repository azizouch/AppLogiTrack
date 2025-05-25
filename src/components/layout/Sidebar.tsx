
import React from 'react';
import { 
  Package, 
  Truck, 
  Users, 
  Bell, 
  Settings, 
  Building2, 
  UsersRound,
  FileText,
  BarChart3
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
  SidebarHeader,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { useLocation, Link } from 'react-router-dom';

export function AppSidebar() {
  const { state } = useAuth();
  const location = useLocation();

  const navigationItems = [
    {
      title: 'Dashboard',
      url: '/',
      icon: BarChart3,
      roles: ['admin', 'gestionnaire', 'livreur']
    },
    {
      title: 'Colis',
      icon: Package,
      roles: ['admin', 'gestionnaire', 'livreur'],
      items: [
        { title: 'Tous les colis', url: '/colis' },
        { title: 'Colis livrés', url: '/colis/livres' },
        { title: 'Colis refusés', url: '/colis/refuses', roles: ['admin', 'gestionnaire'] },
        { title: 'Colis annulés', url: '/colis/annules', roles: ['admin', 'gestionnaire'] },
      ]
    },
    {
      title: 'Bons de livraison',
      url: '/bons',
      icon: FileText,
      roles: ['admin', 'gestionnaire']
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
  ];

  const adminItems = [
    {
      title: 'Utilisateurs',
      url: '/utilisateurs',
      icon: UsersRound,
      roles: ['admin']
    },
    {
      title: 'Paramètres',
      url: '/parametres',
      icon: Settings,
      roles: ['admin']
    },
  ];

  const hasAccess = (itemRoles?: string[]) => {
    if (!itemRoles) return true;
    return itemRoles.includes(state.user?.role || '');
  };

  const isActive = (url: string) => {
    if (url === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(url);
  };

  return (
    <Sidebar>
      <SidebarHeader className="border-b p-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">LT</span>
          </div>
          <div>
            <h2 className="font-bold text-lg text-blue-600">LogiTrack</h2>
            <p className="text-xs text-gray-500">Gestion des livraisons</p>
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                if (!hasAccess(item.roles)) return null;

                if (item.items) {
                  return (
                    <SidebarMenuItem key={item.title}>
                      <div className="px-2 py-1">
                        <div className="flex items-center space-x-2 text-sm font-medium text-gray-700 mb-2">
                          <item.icon className="h-4 w-4" />
                          <span>{item.title}</span>
                        </div>
                        <div className="ml-6 space-y-1">
                          {item.items.map((subItem) => {
                            if (subItem.roles && !hasAccess(subItem.roles)) return null;
                            return (
                              <SidebarMenuButton
                                key={subItem.url}
                                asChild
                                isActive={isActive(subItem.url)}
                                className="text-sm"
                              >
                                <Link to={subItem.url}>
                                  {subItem.title}
                                </Link>
                              </SidebarMenuButton>
                            );
                          })}
                        </div>
                      </div>
                    </SidebarMenuItem>
                  );
                }

                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url!)}>
                      <Link to={item.url!}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {state.user?.role === 'admin' && (
          <SidebarGroup>
            <SidebarGroupLabel>Administration</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={isActive(item.url)}>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t p-4">
        <div className="text-xs text-gray-500">
          <p>Connecté en tant que:</p>
          <p className="font-medium text-gray-700">{state.user?.nom}</p>
          <p className="capitalize">{state.user?.role}</p>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
