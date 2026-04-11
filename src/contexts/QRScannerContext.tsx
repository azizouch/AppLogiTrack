import React, { createContext, useContext, useState } from 'react';
import { Colis } from '@/types';

interface QRScannerContextType {
  isQRScannerOpen: boolean;
  setIsQRScannerOpen: (open: boolean) => void;
  scannedColis: Colis | null;
  setScannedColis: (colis: Colis | null) => void;
  isScannedColisModalOpen: boolean;
  setIsScannedColisModalOpen: (open: boolean) => void;
  scannedColisLoading: boolean;
  setScannedColisLoading: (loading: boolean) => void;
  openScanner: () => void;
  closeScanner: () => void;
}

const QRScannerContext = createContext<QRScannerContextType | undefined>(undefined);

export function QRScannerProvider({ children }: { children: React.ReactNode }) {
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [scannedColis, setScannedColis] = useState<Colis | null>(null);
  const [isScannedColisModalOpen, setIsScannedColisModalOpen] = useState(false);
  const [scannedColisLoading, setScannedColisLoading] = useState(false);

  const openScanner = () => setIsQRScannerOpen(true);
  const closeScanner = () => setIsQRScannerOpen(false);

  return (
    <QRScannerContext.Provider value={{
      isQRScannerOpen,
      setIsQRScannerOpen,
      scannedColis,
      setScannedColis,
      isScannedColisModalOpen,
      setIsScannedColisModalOpen,
      scannedColisLoading,
      setScannedColisLoading,
      openScanner,
      closeScanner,
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
