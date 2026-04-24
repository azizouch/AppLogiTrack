import React, { useEffect, useState, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Header } from './Header';
import { AppSidebar } from './Sidebar';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { ScrollToTop } from '@/components/ui/scroll-to-top';
import { QRScannerProvider, useQRScanner } from '@/contexts/QRScannerContext';
import { AdminReturnScannerProvider, useAdminReturnScanner } from '@/contexts/AdminReturnScannerContext';
import { ColisQRScanner, ScannedColisDetailsModal, ScannedColisTableModal, AdminReturnScanner, ScannedReturnColisDetailsModal, ScannedReturnColisTableModal } from '@/components/colis';
import { api, supabase } from '@/lib/supabase';
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

  // Admin Return Scanner hooks
  const {
    isAdminReturnScannerOpen,
    setIsAdminReturnScannerOpen,
    scannedReturnColis,
    setScannedReturnColis,
    isScannedReturnColisDetailsOpen,
    setIsScannedReturnColisDetailsOpen,
    scannedReturnColisList,
    isScannedReturnColisTableOpen,
    setIsScannedReturnColisTableOpen,
    addScannedReturnColis,
    clearScannedReturnColisList,
  } = useAdminReturnScanner();

  // Scroll to top when route changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleScanComplete = async (colis: any) => {
    // Check if colis is already assigned to the current livreur
    if (colis.livreur_id && colis.livreur_id === state.user?.id) {
      toast.info('Ce colis est déjà associé à votre compte');
      setScannedColis(null);
      return false;
    }

    // Check if colis is assigned to a different livreur
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

    // Check if colis is part of a completed bon
    try {
      const { data: bonColisList } = await api.getColisById(colis.id);
      if (bonColisList) {
        // Fetch all bons to check if this colis is part of a completed one
        const { data: allBons } = await api.getBons({
          limit: 1000,
          sourceType: 'livreur'
        });
        
        if (Array.isArray(allBons)) {
          for (const bon of allBons) {
            if ((bon.statut === 'Complété' || bon.statut === 'Complete' || bon.statut === 'Livré') && bon.id) {
              // Check if this colis is part of this bon
              const { data: bonColis } = await api.getColisByBonId(bon.id);
              if (bonColis && bonColis.some((c: any) => c.id === colis.id)) {
                toast.error(`Ce colis est déjà finalisé dans le bon #${bon.id}`);
                setScannedColis(null);
                return false;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking colis bon status:', error);
    }

    // Close table modal so details modal shows alone
    setIsScannedColisTableOpen(false);
    setScannedColis(colis);
    setIsScannedColisDetailsOpen(true);
    scanJustCompletedRef.current = true;
    return true;
  };

  const handleAssociateColis = async (colis: any) => {
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
      // Calculate total amount
      const totalAmount = scannedColisList.reduce((sum, colis) => sum + (colis.prix || 0), 0);
      
      // Create bon with source_type: 'livreur', type: 'distribution'
      const { data: bon, error: bonError } = await api.createBonWithColis(
        {
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

      toast.success(`Bon de distribution #${bon?.id} créé avec ${scannedColisList.length} colis`);
      
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

  // ========== Admin Return Scanner Handlers ==========
  const [finalizingReturnBon, setFinalizingReturnBon] = useState(false);
  const scanReturnJustCompletedRef = useRef(false);

  const handleReturnScanComplete = async (colis: any) => {
    // Check if colis is already in the scanned return list
    if (scannedReturnColisList.some(item => item.id === colis.id)) {
      toast.error('Ce colis est déjà dans la liste des retours');
      setScannedReturnColis(null);
      return false;
    }

    // Check if colis is part of a completed bon (already delivered/returned)
    try {
      const { data: bonColisList } = await api.getColisById(colis.id);
      if (bonColisList) {
        const { data: allBons } = await api.getBons({
          limit: 1000,
          sourceType: 'livreur'
        });
        
        if (Array.isArray(allBons)) {
          for (const bon of allBons) {
            if ((bon.statut === 'Complété' || bon.statut === 'Complete' || bon.statut === 'Livré') && bon.id) {
              const { data: bonColis } = await api.getColisByBonId(bon.id);
              if (bonColis && bonColis.some((c: any) => c.id === colis.id)) {
                toast.error(`Ce colis est déjà finalisé dans le bon #${bon.id}`);
                setScannedReturnColis(null);
                return false;
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Error checking colis bon status:', error);
    }

    // Close table modal so details modal shows alone
    setIsScannedReturnColisTableOpen(false);
    setScannedReturnColis(colis);
    setIsScannedReturnColisDetailsOpen(true);
    scanReturnJustCompletedRef.current = true;
    return true;
  };

  const handleAssociateReturnColis = async (colis: any) => {
    // Check if colis is already in the scanned return list
    const isAlreadyScanned = scannedReturnColisList.some(item => item.id === colis.id);
    if (isAlreadyScanned) {
      toast.error('Ce colis est déjà dans la liste des retours');
      setIsScannedReturnColisDetailsOpen(false);
      setScannedReturnColis(null);
      return;
    }

    addScannedReturnColis(colis);
    setIsScannedReturnColisDetailsOpen(false);
    setScannedReturnColis(null);
    // Automatically open the table modal to show associated colis
    setTimeout(() => {
      setIsScannedReturnColisTableOpen(true);
    }, 100);
  };

  const handleScanReturnAgain = () => {
    setIsScannedReturnColisTableOpen(false);
    setIsAdminReturnScannerOpen(true);
  };

  const handleFinalizeReturnBon = async () => {
    if (scannedReturnColisList.length === 0) {
      toast.error('Aucun colis à traiter');
      return;
    }

    setFinalizingReturnBon(true);
    try {
      // Calculate total amount
      const totalAmount = scannedReturnColisList.reduce((sum, colis) => sum + (colis.prix || 0), 0);
      
      // Create bon with source_type: 'admin' (for Admin/Gestionnaire), type: 'retour'
      const { data: bon, error: bonError } = await api.createBonWithColis(
        {
          user_id: state.user?.id || '',
          type: 'retour',
          statut: 'En cours',
          source_type: 'admin',
          nb_colis: scannedReturnColisList.length,
          montant: totalAmount,
          date_creation: new Date().toISOString(),
          notes: `Bon de retour créé par ${state.user?.nom} via scannage de ${scannedReturnColisList.length} colis`,
        },
        scannedReturnColisList.map(c => c.id)
      );

      if (bonError) {
        throw bonError;
      }

      // Update all colis status to 'retourne'
      for (const colis of scannedReturnColisList) {
        const { error: updateError } = await supabase
          .from('colis')
          .update({ statut: 'retourne' })
          .eq('id', colis.id);

        if (updateError) {
          console.error('Error updating colis status:', updateError);
        }

        // Create historique entry for each colis
        await supabase.from('historique_colis').insert({
          colis_id: colis.id,
          ancien_statut: colis.statut,
          nouveau_statut: 'retourne',
          date_changement: new Date().toISOString(),
          utilisateur_id: state.user?.id,
          notes: `Colis retourné via bon de retour #${bon?.id}`,
        });
      }

      toast.success(`Bon de retour #${bon?.id} créé avec ${scannedReturnColisList.length} colis`);
      
      // Clear the scanned return colis list and close modals
      clearScannedReturnColisList();
      setIsScannedReturnColisTableOpen(false);
      
      // Navigate to the bon details page
      navigate(`/bons/${bon?.id}`);
    } catch (error: any) {
      console.error('Error finalizing return bon:', error);
      toast.error('Erreur lors de la création du bon de retour');
    } finally {
      setFinalizingReturnBon(false);
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

      {/* Global Admin Return Scanner Modal */}
      <AdminReturnScanner
        isOpen={isAdminReturnScannerOpen}
        onClose={() => {
          setIsAdminReturnScannerOpen(false);
          if (scannedReturnColisList.length > 0 && !scanReturnJustCompletedRef.current) {
            setIsScannedReturnColisTableOpen(true);
          }
          scanReturnJustCompletedRef.current = false;
        }}
        onScanComplete={handleReturnScanComplete}
        title="Scanner un colis pour retour"
        description="Scannez le code QR du colis pour le retourner au livreur"
      />

      {/* Global Scanned Return Colis Details Modal */}
      <ScannedReturnColisDetailsModal
        isOpen={isScannedReturnColisDetailsOpen}
        onClose={() => {
          setIsScannedReturnColisDetailsOpen(false);
          setScannedReturnColis(null);
          if (scannedReturnColisList.length > 0) {
            setIsScannedReturnColisTableOpen(true);
          }
          scanReturnJustCompletedRef.current = false;
        }}
        colis={scannedReturnColis}
        onAssociate={handleAssociateReturnColis}
      />

      {/* Global Scanned Return Colis Table Modal */}
      <ScannedReturnColisTableModal
        isOpen={isScannedReturnColisTableOpen}
        onClose={() => setIsScannedReturnColisTableOpen(false)}
        scannedReturnColisList={scannedReturnColisList}
        onScanAgain={handleScanReturnAgain}
        onFinalize={handleFinalizeReturnBon}
        loading={finalizingReturnBon}
      />
    </SidebarProvider>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <QRScannerProvider>
      <AdminReturnScannerProvider>
        <LayoutContent>{children}</LayoutContent>
      </AdminReturnScannerProvider>
    </QRScannerProvider>
  );
}
