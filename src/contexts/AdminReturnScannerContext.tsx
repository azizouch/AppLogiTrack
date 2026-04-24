import React, { createContext, useContext, useState } from 'react';
import { Colis } from '@/types';

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
  openReturnScanner: () => void;
  closeReturnScanner: () => void;
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

  const openReturnScanner = () => setIsAdminReturnScannerOpen(true);
  const closeReturnScanner = () => setIsAdminReturnScannerOpen(false);

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
      openReturnScanner,
      closeReturnScanner,
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