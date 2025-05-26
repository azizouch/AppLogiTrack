
import React from 'react';
import { Header } from './Header';
import { AppSidebar } from './Sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ScrollToTop } from '@/components/ui/scroll-to-top';

interface LayoutProps {
  children: React.ReactNode;
}

export function Layout({ children }: LayoutProps) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 p-4 sm:p-6 bg-background">
          {children}
        </main>
        <ScrollToTop />
      </SidebarInset>
    </SidebarProvider>
  );
}
