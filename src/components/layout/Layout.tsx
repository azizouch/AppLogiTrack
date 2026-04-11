
import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Header } from './Header';
import { AppSidebar } from './Sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { QRScannerProvider, useQRScanner } from '@/contexts/QRScannerContext';
import { ColisQRScanner } from '@/components/colis';


interface LayoutProps {
  children: React.ReactNode;
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const { isQRScannerOpen, setIsQRScannerOpen } = useQRScanner();

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Header />
        <main className="flex-1 px-4 pb-4 sm:px-6 sm:pb-6 bg-background" style={{paddingTop: '5.5rem'}}>
          {children}
        </main>
        <ScrollToTop />
      </SidebarInset>
      
      {/* Global QR Scanner Modal */}
      <ColisQRScanner
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        title="Scanner un colis"
        description="Scannez le code QR du colis pour afficher ses détails"
      />
    </SidebarProvider>
  );
}

export function Layout({ children }: LayoutProps) {
  return (
    <QRScannerProvider>
      <LayoutContent>{children}</LayoutContent>
    </QRScannerProvider>
  );
}
