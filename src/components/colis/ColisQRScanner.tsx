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

interface ColisQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan?: (colisId: string) => void;
  title?: string;
  description?: string;
  onAssociate?: (colis: Colis) => Promise<void>;
}

export function ColisQRScanner({
  isOpen,
  onClose,
  onScan,
  title = 'Scanner un colis',
  description = 'Scannez le code QR du colis pour afficher ses détails',
  onAssociate,
}: ColisQRScannerProps) {
  const { state: authState } = useAuth();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [scannedColis, setScannedColis] = useState<Colis | null>(null);
  const [associating, setAssociating] = useState(false);
  const [restartTrigger, setRestartTrigger] = useState(0);
  const scanningRef = useRef(false);
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
      setScannedColis(null);
      setError(null);
      setScanning(false);
      return;
    }

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
              
              // Stop scanning immediately
              scanningRef.current = false;
              setScanning(false);
              
              // ✅ STOP CAMERA HERE - stop all tracks
              if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
              }
              
              // Fetch colis details
              try {
                const result = await api.getColisById(qrData.trim());
                const { data: colisData, error: colisError } = result;
                
                if (!colisError && colisData) {
                  setScannedColis(colisData);
                  
                  // Call onScan callback if provided
                  if (onScan) {
                    onScan(qrData.trim());
                  }
                } else {
                  lastScannedRef.current = null;
                }
              } catch (err) {
                console.error('Error fetching colis:', err);
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

  const handleAssociate = async () => {
    if (!scannedColis || !authState.user?.id) return;

    try {
      setAssociating(true);

      if (onAssociate) {
        // Use custom associate function if provided
        await onAssociate(scannedColis);
      } else {
        // Default association logic
        const { error } = await api.updateColis(scannedColis.id, {
          livreur_id: authState.user.id,
          statut: 'Mise en distribution'
        });

        if (error) {
          throw new Error(error.message);
        }

        // Add historique entry for the scan and assignment
        const { error: historiqueError } = await supabase
          .from('historique_colis')
          .insert({
            colis_id: scannedColis.id,
            date: new Date().toISOString(),
            statut: 'Mise en distribution',
            utilisateur: authState.user.id,
            informations: 'Colis scanné et assigné au livreur',
          });

        if (historiqueError) {
          console.error('Error creating historique entry:', historiqueError);
        }
      }

      // Close modal after successful association
      setScannedColis(null);
      onClose();
      // Refresh page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 500);
    } catch (error) {
      setError('Impossible d\'associer le colis');
    } finally {
      setAssociating(false);
    }
  };

  const handleBack = () => {
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
          <DialogTitle>
            {scannedColis ? 'Détails du colis' : title}
          </DialogTitle>
          <DialogDescription>
            {scannedColis ? scannedColis.id : description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Main container - video or loading placeholder - only show when scanning, not when showing details */}
          {!scannedColis && (
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
                scanning && !scannedColis ? 'block' : 'hidden'
              }`}
            />
            
            {/* Loading state */}
            {!scanning && !error && !scannedColis && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Initialisation de la caméra...</p>
                </div>
              </div>
            )}
            
            {/* Camera placeholder on error */}
            {error && !scannedColis && (
              <div className="w-full h-full flex items-center justify-center">
                <Camera className="h-16 w-16 text-gray-400" />
              </div>
            )}
            
            {/* Scanning overlay - only show when actively scanning */}
            {scanning && !scannedColis && (
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
          )}
          
          {/* Error State - Show alert below if there's an error */}
          {error && !scannedColis && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Close button when loading or error */}
          {!scanning && !scannedColis && (
            <Button onClick={onClose} variant="outline" className="w-full">
              Fermer
            </Button>
          )}

          {/* Instructions for Camera - show when actively scanning */}
          {scanning && !scannedColis && (
            <>
              {/* <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="font-semibold text-blue-900 dark:text-blue-100">En cours de scan...</p>
                <ul className="list-disc list-inside space-y-1 text-xs text-blue-800 dark:text-blue-200">
                  <li>Pointez le QR code du colis vers la caméra</li>
                  <li>Le code sera détecté automatiquement</li>
                  <li>Les détails s'afficheront immédiatement</li>
                </ul>
              </div> */}

              {/* Action Buttons for Camera */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                >
                  Fermer
                </Button>
              </div>
            </>
          )}

          {/* Colis Details View */}
          {scannedColis && !scanning && (
            <>
              {/* Main Details Card */}
              <div className="rounded-lg p-4 sm:p-6 border border-gray-200 dark:border-gray-700 space-y-4">
                {/* ID Section - Prominent */}
                <div className="pb-4 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">ID du colis</p>
                  <p className="font-mono font-bold text-lg sm:text-2xl text-gray-900 dark:text-white break-all line-clamp-2">{scannedColis.id}</p>
                </div>

                {/* Client Info */}
                <div className="space-y-4">
                  {/* Client Name */}
                  <div className="flex items-start gap-3">
                    <Package className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Client</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white line-clamp-2">{scannedColis.client?.nom || 'Non défini'}</p>
                    </div>
                  </div>

                  {/* Address */}
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Adresse</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-2">{scannedColis.client?.adresse || 'Non défini'}</p>
                    </div>
                  </div>

                  {/* Status and Price Row */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div className="flex items-start gap-3">
                      <CheckCircle2 className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Statut</p>
                        <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 text-xs sm:text-sm py-1 px-2 sm:px-3 font-semibold">
                          {scannedColis.statut}
                        </Badge>
                      </div>
                    </div>
                    {scannedColis.prix && (
                      <div className="flex items-start gap-3">
                        <DollarSign className="h-5 w-5 text-gray-500 dark:text-gray-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-1">Montant</p>
                          <p className="text-sm font-semibold text-green-600 dark:text-green-400">{scannedColis.prix} DH</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Error State */}
              {error && (
                <Alert variant="destructive" className="text-sm">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Action Buttons - Optimized for Mobile */}
              <div className="flex flex-col gap-2 pt-2">
                {/* Primary Action - Associate */}
                <Button
                  onClick={handleAssociate}
                  disabled={associating || scannedColis.livreur_id === authState.user?.id}
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white text-sm rounded-lg transition-all"
                >
                  {scannedColis.livreur_id === authState.user?.id
                    ? '✓ Déjà associé'
                    : associating
                    ? 'Assignation...'
                    : (
                        <>
                          <Link className="w-4 h-4 mr-2" />
                          Associer
                        </>
                      )}
                </Button>

                {/* Secondary Actions - Side by Side on Mobile */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="w-full text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                  >
                    <RefreshCcw className="w-4 h-4 mr-2" /> Scanner
                  </Button>
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="w-full text-sm bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/40 transition-colors"
                  >
                    <X className="w-4 h-4 mr-2" /> Fermer
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
