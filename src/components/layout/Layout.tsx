
import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { AppSidebar } from './Sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { QRScannerProvider, useQRScanner } from '@/contexts/QRScannerContext';
import { ColisQRScanner, ScannedColisDetailsModal, ScannedColisTableModal } from '@/components/colis';
import { api } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';


interface LayoutProps {
  children: React.ReactNode;
}

function LayoutContent({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = useAuth();
  const [finalizingBon, setFinalizingBon] = useState(false);
  const scanJustCompletedRef = useRef(false);
  
  const { 
    isQRScannerOpen, 
    setIsQRScannerOpen,
    scannedColis,
    setScannedColis,
    isScannedColisDetailsOpen,
    setIsScannedColisDetailsOpen,
    scannedColisList,
    isScannedColisTableOpen,
    setIsScannedColisTableOpen,
    addScannedColis,
    clearScannedColisList,
  } = useQRScanner();

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleScanComplete = (colis: any) => {
    if (colis.livreur_id && colis.livreur_id !== state.user?.id) {
      toast.error('Ce colis est déjà assigné à un autre livreur');
      setScannedColis(null);
      return false;
    }

    if (scannedColisList.some(item => item.id === colis.id)) {
      toast.error('Ce colis est déjà dans la liste de balayage');
      setScannedColis(null);
      return false;
    }

    // Close table modal so details modal shows alone
    setIsScannedColisTableOpen(false);
    setScannedColis(colis);
    setIsScannedColisDetailsOpen(true);
    scanJustCompletedRef.current = true;
    return true;
  };

  const handleAssociateColis = (colis: any) => {
    // Check if colis is already in the scanned list
    const isAlreadyScanned = scannedColisList.some(item => item.id === colis.id);
    if (isAlreadyScanned) {
      toast.error('Ce colis est déjà dans la liste de balayage');
      setIsScannedColisDetailsOpen(false);
      setScannedColis(null);
      return;
    }

    // Check if colis is already assigned to another livreur
    if (colis.livreur_id && colis.livreur_id !== state.user?.id) {
      toast.error('Ce colis est déjà assigné à un autre livreur');
      setIsScannedColisDetailsOpen(false);
      setScannedColis(null);
      return;
    }

    addScannedColis(colis);
    setIsScannedColisDetailsOpen(false);
    setScannedColis(null);
    // Automatically open the table modal to show associated colis
    setTimeout(() => {
      setIsScannedColisTableOpen(true);
    }, 100);
  };

  const handleScanAgain = () => {
    setIsScannedColisTableOpen(false);
    setIsQRScannerOpen(true);
  };

  const handleFinalizeBon = async () => {
    if (scannedColisList.length === 0) {
      toast.error('Aucun colis à traiter');
      return;
    }

    setFinalizingBon(true);
    try {
      // Generate bon ID
      const bonId = `BON-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      
      // Calculate total amount
      const totalAmount = scannedColisList.reduce((sum, colis) => sum + (colis.prix || 0), 0);
      
      // Create bon with source_type: 'livreur', type: 'distribution'
      const { data: bon, error: bonError } = await api.createBonWithColis(
        {
          id: bonId,
          user_id: state.user?.id || '',
          type: 'distribution',
          statut: 'En cours',
          source_type: 'livreur',
          nb_colis: scannedColisList.length,
          montant: totalAmount,
          date_creation: new Date().toISOString(),
          notes: `Bon de distribution créé par ${state.user?.nom} via scannage de ${scannedColisList.length} colis`,
        },
        scannedColisList.map(c => c.id)
      );

      if (bonError) {
        throw bonError;
      }

      toast.success(`Bon de distribution #${bonId.slice(0, 8)} créé avec ${scannedColisList.length} colis`);
      
      // Clear the scanned colis list and close modals
      clearScannedColisList();
      setIsScannedColisTableOpen(false);
      
      // Navigate to the bon details page
      navigate(`/bons/${bon?.id}`);
    } catch (error: any) {
      console.error('Error finalizing bon:', error);
      toast.error('Erreur lors de la création du bon');
    } finally {
      setFinalizingBon(false);
    }
  };

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
        onClose={() => {
          setIsQRScannerOpen(false);
          // Reopen table modal if scanner was closed manually (not after a scan)
          if (scannedColisList.length > 0 && !scanJustCompletedRef.current) {
            setIsScannedColisTableOpen(true);
          }
          scanJustCompletedRef.current = false;
        }}
        onScanComplete={handleScanComplete}
        title="Scanner un colis"
        description="Scannez le code QR du colis pour afficher ses détails"
      />

      {/* Global Scanned Colis Details Modal */}
      <ScannedColisDetailsModal
        isOpen={isScannedColisDetailsOpen}
        onClose={() => {
          setIsScannedColisDetailsOpen(false);
          setScannedColis(null);
          if (scannedColisList.length > 0) {
            setIsScannedColisTableOpen(true);
          }
          scanJustCompletedRef.current = false;
        }}
        colis={scannedColis}
        onAssociate={handleAssociateColis}
      />

      {/* Global Scanned Colis Table Modal */}
      <ScannedColisTableModal
        isOpen={isScannedColisTableOpen}
        onClose={() => setIsScannedColisTableOpen(false)}
        scannedColisList={scannedColisList}
        onScanAgain={handleScanAgain}
        onFinalize={handleFinalizeBon}
        loading={finalizingBon}
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
