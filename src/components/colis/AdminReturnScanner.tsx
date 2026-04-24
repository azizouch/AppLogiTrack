import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertCircle, Loader2, Camera, ArrowLeft, Package, MapPin, DollarSign, CheckCircle2, RefreshCcw, Link, X, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { api, supabase } from '@/lib/supabase';
import { Colis } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface AdminReturnScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScanComplete?: (colis: Colis) => Promise<boolean | void> | boolean | void;
  title?: string;
  description?: string;
}

export function AdminReturnScanner({
  isOpen,
  onClose,
  onScanComplete,
  title = 'Scanner un colis pour retour',
  description = 'Scannez le code QR du colis pour le retourner',
}: AdminReturnScannerProps) {
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
    if (!isOpen) {
      hasStartedRef.current = false;
      initializingRef.current = false;
      setError(null);
      setScanning(false);
      lastScannedRef.current = null;
      return;
    }

    lastScannedRef.current = null;

    if (hasStartedRef.current) return;
    hasStartedRef.current = true;

    let timeoutId: NodeJS.Timeout | null = null;
    let animationFrameId: number | null = null;
    let scanStarted = false;

    const startCamera = async () => {
      try {
        if (initializingRef.current) {
          return;
        }
        
        initializingRef.current = true;

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
        
        const videoElement = videoRef.current;
        const onLoadedMetadata = async () => {
          setScanning(true);
          scanningRef.current = true;
          startQRScan();
          initializingRef.current = false;
          videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
        };
        
        videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
        
        try {
          await videoElement.play();
        } catch (err) {
          setScanning(true);
          scanningRef.current = true;
          startQRScan();
          initializingRef.current = false;
        }
        
        timeoutId = setTimeout(() => {
          if (!scanningRef.current) {
            setScanning(true);
            scanningRef.current = true;
            startQRScan();
            initializingRef.current = false;
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

              try {
                const result = await api.getColisById(trimmedData);
                const { data: colisData, error: colisError } = result;

                if (!colisError && colisData && colisData.id) {
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
                    scanningRef.current = false;
                    setScanning(false);

                    if (streamRef.current) {
                      streamRef.current.getTracks().forEach(track => track.stop());
                      streamRef.current = null;
                    }

                    onClose();
                  } else {
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

  const detectQRCode = async (data: Uint8ClampedArray, width: number, height: number): Promise<string | null> => {
    try {
      if ((window as any).jsQR) {
        const code = (window as any).jsQR(data, width, height);
        if (code && code.data) {
          return code.data;
        }
      }
    } catch (err) {
      console.error('QR detection error:', err);
    }
    return null;
  };

  const handleRestart = () => {
    // Fully stop the current camera stream before restarting
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    // Reset all refs to allow camera to restart
    hasStartedRef.current = false;
    initializingRef.current = false;
    scanningRef.current = false;
    lastScannedRef.current = null;
    setRestartTrigger(prev => prev + 1);
    setError(null);
    setScanning(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        scanningRef.current = false;
        setScanning(false);
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            {title}
          </DialogTitle>
          <DialogDescription>
            {description}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 flex flex-col min-h-0">
          {/* Camera View */}
          <div className="relative flex-1 min-h-[300px] bg-black rounded-lg overflow-hidden">
            <video 
              ref={videoRef} 
              className="absolute inset-0 w-full h-full object-cover"
              playsInline
              muted
              autoPlay
            />
            <canvas ref={canvasRef} className="hidden" />
            
            {/* Scanning Overlay */}
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 border-2 border-orange-500 rounded-lg relative">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-500 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-500 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-500 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-500 rounded-br-lg"></div>
                </div>
              </div>
            )}

            {/* Error Display */}
            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80 p-4">
                <Alert className="max-w-sm bg-red-900/80 border-red-700 text-white">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}

            {/* Loading State */}
            {loading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/80">
                <div className="text-white flex flex-col items-center gap-2">
                  <Loader2 className="h-8 w-8 animate-spin" />
                  <span>Chargement...</span>
                </div>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              onClick={handleRestart}
              className="flex items-center gap-2"
            >
              <RefreshCcw className="h-4 w-4" />
              Redémarrer
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                if (streamRef.current) {
                  streamRef.current.getTracks().forEach(track => track.stop());
                  streamRef.current = null;
                }
                scanningRef.current = false;
                setScanning(false);
                onClose();
              }}
              className="flex items-center gap-2"
            >
              <X className="h-4 w-4" />
              Fermer
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}