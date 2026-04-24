import React, { createContext, useContext, useState } from 'react';
import { Colis, User } from '@/types';

interface AdminReturnScannerContextType {
  isAdminReturnScannerOpen: boolean;
  setIsAdminReturnScannerOpen: (open: boolean) => void;
  scannedReturnColis: Colis | null;
  setScannedReturnColis: (colis: Colis | null) => void;
  isScannedReturnColisDetailsOpen: boolean;
  setIsScannedReturnColisDetailsOpen: (open: boolean) => void;
  scannedReturnColisList: Colis[];
  setScannedReturnColisList: (list: Colis[]) => void;
  isScannedReturnColisTableOpen: boolean;
  setIsScannedReturnColisTableOpen: (open: boolean) => void;
  isLivreurSelectionModalOpen: boolean;
  setIsLivreurSelectionModalOpen: (open: boolean) => void;
  selectedReturnLivreur: User | null;
  setSelectedReturnLivreur: (livreur: User | null) => void;
  openReturnScanner: () => void;
  closeReturnScanner: () => void;
  confirmLivreurAndOpenScanner: (livreur: User) => void;
  addScannedReturnColis: (colis: Colis) => void;
  removeScannedReturnColis: (colisId: string) => void;
  clearScannedReturnColisList: () => void;
}

const AdminReturnScannerContext = createContext<AdminReturnScannerContextType | undefined>(undefined);

export function AdminReturnScannerProvider({ children }: { children: React.ReactNode }) {
  const [isAdminReturnScannerOpen, setIsAdminReturnScannerOpen] = useState(false);
  const [scannedReturnColis, setScannedReturnColis] = useState<Colis | null>(null);
  const [isScannedReturnColisDetailsOpen, setIsScannedReturnColisDetailsOpen] = useState(false);
  const [scannedReturnColisList, setScannedReturnColisList] = useState<Colis[]>([]);
  const [isScannedReturnColisTableOpen, setIsScannedReturnColisTableOpen] = useState(false);
  const [isLivreurSelectionModalOpen, setIsLivreurSelectionModalOpen] = useState(false);
  const [selectedReturnLivreur, setSelectedReturnLivreur] = useState<User | null>(null);

  const openReturnScanner = () => setIsLivreurSelectionModalOpen(true);
  const closeReturnScanner = () => setIsAdminReturnScannerOpen(false);

  const confirmLivreurAndOpenScanner = (livreur: User) => {
    setSelectedReturnLivreur(livreur);
    setIsLivreurSelectionModalOpen(false);
    setIsAdminReturnScannerOpen(true);
  };

  const addScannedReturnColis = (colis: Colis) => {
    setScannedReturnColisList(prev => {
      if (prev.some(item => item.id === colis.id)) {
        return prev;
      }
      return [...prev, colis];
    });
  };

  const removeScannedReturnColis = (colisId: string) => {
    setScannedReturnColisList(prev => prev.filter(item => item.id !== colisId));
  };

  const clearScannedReturnColisList = () => {
    setScannedReturnColisList([]);
  };

  return (
    <AdminReturnScannerContext.Provider value={{
      isAdminReturnScannerOpen,
      setIsAdminReturnScannerOpen,
      scannedReturnColis,
      setScannedReturnColis,
      isScannedReturnColisDetailsOpen,
      setIsScannedReturnColisDetailsOpen,
      scannedReturnColisList,
      setScannedReturnColisList,
      isScannedReturnColisTableOpen,
      setIsScannedReturnColisTableOpen,
      isLivreurSelectionModalOpen,
      setIsLivreurSelectionModalOpen,
      selectedReturnLivreur,
      setSelectedReturnLivreur,
      openReturnScanner,
      closeReturnScanner,
      confirmLivreurAndOpenScanner,
      addScannedReturnColis,
      removeScannedReturnColis,
      clearScannedReturnColisList,
    }}>
      {children}
    </AdminReturnScannerContext.Provider>
  );
}

export function useAdminReturnScanner() {
  const context = useContext(AdminReturnScannerContext);
  if (!context) {
    throw new Error('useAdminReturnScanner must be used within AdminReturnScannerProvider');
  }
  return context;
}
