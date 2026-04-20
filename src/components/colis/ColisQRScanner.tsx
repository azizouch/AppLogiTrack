import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertCircle, Loader2, Camera, ArrowLeft, Package, MapPin, DollarSign, CheckCircle2, RefreshCcw, Link, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { api, supabase } from '@/lib/supabase';
import { Colis } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { Close } from '@radix-ui/react-toast';
import { toast } from 'sonner';

interface ColisQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete?: (colis: Colis) => Promise<boolean | void> | boolean | void;
  title?: string;
  description?: string;
}

export function ColisQRScanner({
  isOpen,
  onClose,
  onScanComplete,
  title = 'Scanner un colis',
  description = 'Scannez le code QR du colis pour afficher ses détails',
}: ColisQRScannerProps) {
  const { state: authState } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [restartTrigger, setRestartTrigger] = useState(0);
  const scanningRef = useRef(false);

  const generateUUID = (): string => {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  };
  const lastScannedRef = useRef<string | null>(null);
  const frameCountRef = useRef(0);
  const hasStartedRef = useRef(false);
  const initializingRef = useRef(false);
  const scanStartTimeRef = useRef<number | null>(null);

  // Initialize camera and start scanning
  useEffect(() => {
    // Reset everything when modal closes
    if (!isOpen) {
      hasStartedRef.current = false;
      initializingRef.current = false;
      setError(null);
      setScanning(false);
      lastScannedRef.current = null;
      return;
    }

    // Always clear the last scanned code when the modal opens so re-scans are processed
    lastScannedRef.current = null;

    // Guard against double initialization (StrictMode or reruns)
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    let timeoutId: NodeJS.Timeout | null = null;
    let animationFrameId: number | null = null;
    let scanStarted = false;

    const startCamera = async () => {
      try {
        // ✅ SYNCHRONOUS LOCK: Check if already initializing (blocks concurrent calls)
        if (initializingRef.current) {
          return;
        }
        
        // ✅ SET LOCK IMMEDIATELY before any async operations
        initializingRef.current = true;

        // Guard: don't allow concurrent calls
        if (streamRef.current?.active) {
          initializingRef.current = false;
          if (!scanningRef.current) {
            startQRScan();
          }
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        

        
        if (!videoRef.current) {
          console.error('Video element not found');
          setError('Erreur: Élément vidéo non trouvé');
          stream.getTracks().forEach(track => track.stop());
          initializingRef.current = false;
          return;
        }
        
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to be ready
        const videoElement = videoRef.current;
        const onLoadedMetadata = async () => {
          setScanning(true);
          scanningRef.current = true;
          startQRScan();
          initializingRef.current = false;  // ✅ Release lock after scan started
          videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
        };
        
        videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
        
        // Try to play video
        try {
          await videoElement.play();
        } catch (err) {
          setScanning(true);
          scanningRef.current = true;
          startQRScan();
          initializingRef.current = false;  // ✅ Release lock
        }
        
        // Fallback: Start scanning even if video doesn't load
        timeoutId = setTimeout(() => {
          if (!scanningRef.current) {
            setScanning(true);
            scanningRef.current = true;
            startQRScan();
            initializingRef.current = false;  // ✅ Release lock
          }
        }, 1000);
      } catch (err: any) {
        console.error('Camera error:', err);
        if (err.name === 'NotAllowedError') {
          setError('Accès à la caméra refusé. Vérifiez les permissions.');
        } else if (err.name === 'NotFoundError') {
          setError('Aucune caméra trouvée sur cet appareil.');
        } else {
          setError('Erreur lors de l\'accès à la caméra: ' + err.message);
        }
        setScanning(false);
        initializingRef.current = false;
      }
    };

    const startQRScan = () => {
      frameCountRef.current = 0;
      
      // Ensure jsQR is loaded
      const ensureJsQRLoaded = async (): Promise<boolean> => {
        let retries = 10;
        while (retries > 0 && !((window as any).jsQR)) {
          await new Promise(resolve => setTimeout(resolve, 100));
          retries--;
        }
        if ((window as any).jsQR) {
          return true;
        }
        console.error('jsQR library failed to load after retries');
        return false;
      };
      
      ensureJsQRLoaded().then(loaded => {
        if (!loaded) {
          setError('Impossible de charger la librarie de scan QR');
          return;
        }
        
        const scan = async () => {
          if (!scanningRef.current || !videoRef.current || !canvasRef.current) return;
          if (!scanStarted) {
            scanStartTimeRef.current = performance.now();
            scanStarted = true;
          }
          
          try {
            frameCountRef.current++;
            // Process every frame for fast detection (no frame skipping)
            
            const canvas = canvasRef.current;
            const video = videoRef.current;
            const context = canvas.getContext('2d', { willReadFrequently: true });
            
            if (!context || video.videoWidth === 0) {
              animationFrameId = requestAnimationFrame(scan);
              return;
            }
            
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0);
            
            // Try to decode QR code using jsQR
            const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
            
            const qrData = await detectQRCode(imageData.data, canvas.width, canvas.height);
            
            if (qrData && qrData !== lastScannedRef.current) {
              lastScannedRef.current = qrData;

              const trimmedData = qrData.trim();
              if (!trimmedData || trimmedData.toLowerCase() === 'undefined') {
                setError('QR invalide, veuillez rescanner le colis.');
                lastScannedRef.current = null;
                return;
              }

              // Fetch colis details
              try {
                const result = await api.getColisById(trimmedData);
                const { data: colisData, error: colisError } = result;

                if (!colisError && colisData && colisData.id) {
                  // Flatten client data for display
                  const flattenedColis = {
                    ...colisData,
                    client_nom: colisData.client?.nom || colisData.client_nom || 'N/A',
                    client_telephone: colisData.client?.telephone || colisData.client_telephone || '',
                    adresse_livraison: colisData.adresse_livraison || colisData.client?.adresse || 'N/A'
                  };

                  let shouldClose = true;
                  if (onScanComplete) {
                    const scanResult = await onScanComplete(flattenedColis);
                    if (scanResult === false) {
                      shouldClose = false;
                    }
                  }

                  if (shouldClose) {
                    // Stop scanning immediately
                    scanningRef.current = false;
                    setScanning(false);

                    // ✅ STOP CAMERA HERE - stop all tracks
                    if (streamRef.current) {
                      streamRef.current.getTracks().forEach(track => track.stop());
                      streamRef.current = null;
                    }

                    onClose();
                  } else {
                    // Allow the same QR to be scanned again after rejection
                    lastScannedRef.current = null;
                  }
                } else {
                  setError('Colis introuvable ou identifiant invalide.');
                  lastScannedRef.current = null;
                }
              } catch (err) {
                console.error('Error fetching colis:', err);
                setError('Erreur lors de la récupération du colis.');
                lastScannedRef.current = null;
              }
            }
          } catch (err) {
            console.error('Scan error:', err);
          }
          
          animationFrameId = requestAnimationFrame(scan);
        };
        
        animationFrameId = requestAnimationFrame(scan);
      });
    };

    startCamera();

    return () => {
      initializingRef.current = false;
      scanningRef.current = false;
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId);
      }
      if (timeoutId) clearTimeout(timeoutId);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setScanning(false);
    };
  }, [isOpen, restartTrigger]);

  // QR code detection helper
  const detectQRCode = async (imageData: Uint8ClampedArray, width: number, height: number): Promise<string | null> => {
    try {
      const jsQR = (window as any).jsQR;
      if (!jsQR) {
        console.warn('jsQR library not loaded yet, retrying...');
        // Wait a bit and retry
        await new Promise(resolve => setTimeout(resolve, 100));
        const jsQRRetry = (window as any).jsQR;
        if (!jsQRRetry) {
          console.error('jsQR library still not available');
          return null;
        }
        return detectQRCode(imageData, width, height);
      }
      
      // Try normal detection first (fast)
      let result = jsQR(imageData, width, height);
      if (result && result.data) {
        return result.data;  // ✅ Fast path - found on first try
      }
      
      // Only try inverted if normal failed (inversion is slower)
      result = jsQR(imageData, width, height, { inversionAttempts: 'attemptBoth' });
      if (result && result.data) {
        return result.data;
      }
    } catch (err) {
      console.error('QR detection error:', err);
    }
    return null;
  };

  const handleRescan = () => {
    // Reset state to show scanner again
    setScannedColis(null);
    setError(null);
    lastScannedRef.current = null;
    frameCountRef.current = 0;
    scanningRef.current = false;
    scanStartTimeRef.current = null;
    
    // Reset flags to allow camera to restart
    hasStartedRef.current = false;
    initializingRef.current = false;
    
    // Trigger effect to restart camera
    setRestartTrigger(t => t + 1);
  };

  const stopScanning = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setScanning(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Main container - video or loading placeholder */}
          <div className={`relative w-full rounded-lg overflow-hidden aspect-square ${
            scanning ? 'bg-black' : 'bg-gray-100 dark:bg-gray-700'
          }`}>
            {/* Canvas for processing (hidden) */}
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Video element - always rendered internally */}
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${
                scanning ? 'block' : 'hidden'
              }`}
            />
            
            {/* Loading state */}
            {!scanning && !error && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Initialisation de la caméra...</p>
                </div>
              </div>
            )}
            
            {/* Camera placeholder on error */}
            {error && (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="h-16 w-16 text-gray-400" />
              </div>
            )}
            
            {/* Scanning overlay - only show when actively scanning */}
            {scanning && (
              <>
                {/* Scanning Guide Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 border-2 border-white rounded-lg opacity-50"></div>
                </div>

                {/* Loading State During Capture */}
                {loading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                      <p className="text-white text-sm">Traitement du code...</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
          
          {/* Error State - Show alert below if there's an error */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Close button when loading or error */}
          {!scanning && (
            <Button onClick={onClose} variant="outline" className="w-full">
              Fermer
            </Button>
          )}

          {/* Instructions for Camera - show when actively scanning */}
          {scanning && (
            <>
              {/* <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="font-semibold text-blue-900 dark:text-blue-100">En cours de scan...</p>
                <ul className="list-disc list-inside space-y-1 text-xs text-blue-800 dark:text-blue-200">
                  <li>Pointez le QR code du colis vers la caméra</li>
                  <li>Le code sera détecté automatiquement</li>
                  <li>Les détails s'afficheront dans une nouvelle fenêtre</li>
                </ul>
              </div> */}

              {/* Action Buttons for Camera */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                >
                  <X className="h-4 w-4 mr-2" />
                  Fermer
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
