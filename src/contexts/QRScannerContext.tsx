import React, { createContext, useContext, useState } from 'react';
import { Colis } from '@/types';

interface QRScannerContextType {
  isQRScannerOpen: boolean;
  setIsQRScannerOpen: (open: boolean) => void;
  scannedColis: Colis | null;
  setScannedColis: (colis: Colis | null) => void;
  isScannedColisDetailsOpen: boolean;
  setIsScannedColisDetailsOpen: (open: boolean) => void;
  scannedColisList: Colis[];
  setScannedColisList: (list: Colis[]) => void;
  isScannedColisTableOpen: boolean;
  setIsScannedColisTableOpen: (open: boolean) => void;
  openScanner: () => void;
  closeScanner: () => void;
  addScannedColis: (colis: Colis) => void;
  removeScannedColis: (colisId: string) => void;
  clearScannedColisList: () => void;
}

const QRScannerContext = createContext<QRScannerContextType | undefined>(undefined);

export function QRScannerProvider({ children }: { children: React.ReactNode }) {
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [scannedColis, setScannedColis] = useState<Colis | null>(null);
  const [isScannedColisDetailsOpen, setIsScannedColisDetailsOpen] = useState(false);
  const [scannedColisList, setScannedColisList] = useState<Colis[]>([]);
  const [isScannedColisTableOpen, setIsScannedColisTableOpen] = useState(false);

  const openScanner = () => setIsQRScannerOpen(true);
  const closeScanner = () => setIsQRScannerOpen(false);

  const addScannedColis = (colis: Colis) => {
    setScannedColisList(prev => {
      if (prev.some(item => item.id === colis.id)) {
        return prev;
      }
      return [...prev, colis];
    });
  };

  const removeScannedColis = (colisId: string) => {
    setScannedColisList(prev => prev.filter(item => item.id !== colisId));
  };

  const clearScannedColisList = () => {
    setScannedColisList([]);
  };

  return (
    <QRScannerContext.Provider value={{
      isQRScannerOpen,
      setIsQRScannerOpen,
      scannedColis,
      setScannedColis,
      isScannedColisDetailsOpen,
      setIsScannedColisDetailsOpen,
      scannedColisList,
      setScannedColisList,
      isScannedColisTableOpen,
      setIsScannedColisTableOpen,
      openScanner,
      closeScanner,
      addScannedColis,
      removeScannedColis,
      clearScannedColisList,
    }}>
      {children}
    </QRScannerContext.Provider>
  );
}

export function useQRScanner() {
  const context = useContext(QRScannerContext);
  if (!context) {
    throw new Error('useQRScanner must be used within QRScannerProvider');
  }
  return context;
}
