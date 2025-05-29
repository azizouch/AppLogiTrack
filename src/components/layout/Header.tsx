
import { Search, Bell, User, Menu, X } from 'lucide-react';
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
import { useState } from 'react';

export function Header() {
  const { toggleSidebar } = useSidebar();
  const [showMobileSearch, setShowMobileSearch] = useState(false);

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
              <DropdownMenuLabel className="text-gray-900 dark:text-gray-100">Mon compte</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
              <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Profil</DropdownMenuItem>
              <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Paramètres</DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-200 dark:bg-gray-700" />
              <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
                Se déconnecter
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Mobile/Tablet Search Overlay - Below Header */}
      {showMobileSearch && (
        <div className="absolute top-16 left-0 right-0 bg-background p-4 md:hidden z-40">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Rechercher..."
              className="pl-10 pr-12 py-3 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 rounded-lg focus:ring-1 focus:ring-gray-400 dark:focus:ring-gray-500 focus:border-gray-400 dark:focus:border-gray-500"
              autoFocus
            />
            <button
              onClick={() => setShowMobileSearch(false)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0 hover:bg-transparent flex items-center justify-center"
            >
              <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>
      )}

      {/* Desktop Layout */}
      <div className="hidden md:flex items-center justify-between w-full">
        <div className="flex items-center">
          <div className="relative w-80 sm:w-96">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
            <Input
              type="text"
              placeholder="Rechercher par ID, nom, adresse..."
              className="pl-10 pr-4 py-2 w-full bg-white dark:bg-[hsl(222.2,84%,4.9%)] border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>
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
                    Jean Dupont
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">jean.dupont@example.com</div>
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
            <DropdownMenuItem className="text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              Se déconnecter
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
