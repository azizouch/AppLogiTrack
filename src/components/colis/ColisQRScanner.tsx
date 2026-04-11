import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertCircle, Loader2, Camera, ArrowLeft } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { api } from '@/lib/supabase';
import { Colis } from '@/types';
import { useAuth } from '@/contexts/AuthContext';

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
  const scanningRef = useRef(false);
  const lastScannedRef = useRef<string | null>(null);

  // Initialize camera and start scanning
  useEffect(() => {
    if (!isOpen) return;

    let timeoutId: NodeJS.Timeout | null = null;
    let animationFrameId: number | null = null;

    const startCamera = async () => {
      try {
        setError(null);
        setScannedColis(null);
        lastScannedRef.current = null;
        
        console.log('Starting camera...');
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 }
          }
        });
        
        console.log('Stream obtained:', stream);
        
        if (!videoRef.current) {
          console.error('Video element not found');
          setError('Erreur: Élément vidéo non trouvé');
          return;
        }
        
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        // Wait for video to be ready
        const videoElement = videoRef.current;
        const onLoadedMetadata = async () => {
          console.log('Video loaded, starting QR scan');
          setScanning(true);
          scanningRef.current = true;
          startQRScan();
          videoElement.removeEventListener('loadedmetadata', onLoadedMetadata);
        };
        
        videoElement.addEventListener('loadedmetadata', onLoadedMetadata);
        
        // Try to play video
        try {
          await videoElement.play();
        } catch (err) {
          console.log('Autoplay blocked, but will try scanning anyway');
          setScanning(true);
          scanningRef.current = true;
          startQRScan();
        }
        
        // Fallback: Start scanning even if video doesn't load
        timeoutId = setTimeout(() => {
          if (!scanningRef.current) {
            console.log('Starting scan anyway after timeout');
            setScanning(true);
            scanningRef.current = true;
            startQRScan();
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
      }
    };

    const startQRScan = () => {
      const scan = async () => {
        if (!scanningRef.current || !videoRef.current || !canvasRef.current) return;
        if (scannedColis) return; // Don't scan if already found one
        
        try {
          const canvas = canvasRef.current;
          const video = videoRef.current;
          const context = canvas.getContext('2d');
          
          if (!context || video.videoWidth === 0) {
            animationFrameId = requestAnimationFrame(scan);
            return;
          }
          
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          context.drawImage(video, 0, 0);
          
          // Try to decode QR code using jsQR if available
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          
          // Simple QR detection: look for the black and white pattern
          // This is a basic implementation - for production, use jsQR library
          const qrData = await detectQRCode(imageData.data, canvas.width, canvas.height);
          
          if (qrData && qrData !== lastScannedRef.current) {
            console.log('QR Code detected:', qrData);
            lastScannedRef.current = qrData;
            
            // Fetch colis details
            try {
              const result = await api.getColisById(qrData.trim());
              const { data: colisData, error: colisError } = result;
              
              if (!colisError && colisData) {
                console.log('Colis found:', colisData.id);
                setScannedColis(colisData);
                scanningRef.current = false;
                
                // Call onScan callback if provided
                if (onScan) {
                  onScan(qrData.trim());
                }
              } else {
                console.log('Colis not found:', qrData);
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
    };

    startCamera();

    return () => {
      // Cleanup
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
  }, [isOpen, onScan, scannedColis]);

  // QR code detection helper
  const detectQRCode = async (imageData: Uint8ClampedArray, width: number, height: number): Promise<string | null> => {
    try {
      const jsQR = (window as any).jsQR;
      if (!jsQR) {
        console.warn('jsQR library not loaded yet');
        return null;
      }
      
      const result = jsQR(imageData, width, height, {
        inversionAttempts: 'dontInvert'
      });
      
      if (result && result.data) {
        return result.data;
      }
    } catch (err) {
      console.error('QR detection error:', err);
    }
    return null;
  };

  const handleCapture = useCallback(async () => {
    // This button now just retriggers manual scan if automatic fails
    // The automatic scanning is handled by the continuous scan loop
    setError('Scannez un code QR valide avec la caméra');
  }, []);

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
          statut: scannedColis.statut === 'en_attente' ? 'pris_en_charge' : scannedColis.statut
        });

        if (error) {
          throw new Error(error.message);
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
    setScannedColis(null);
    setError(null);
    // Restart camera
    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setScanning(true);
        }
      } catch (err) {
        console.error('Camera error:', err);
        setError('Erreur lors de l\'accès à la caméra');
      }
    };
    startCamera();
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {scannedColis ? 'Détails du colis' : title}
          </DialogTitle>
          <DialogDescription>
            {scannedColis ? scannedColis.id : description}
          </DialogDescription>
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
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="font-semibold text-blue-900 dark:text-blue-100">En cours de scan...</p>
                <ul className="list-disc list-inside space-y-1 text-xs text-blue-800 dark:text-blue-200">
                  <li>Pointez le QR code du colis vers la caméra</li>
                  <li>Le code sera détecté automatiquement</li>
                  <li>Les détails s'afficheront immédiatement</li>
                </ul>
              </div>

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
              {/* Header Info */}
              <div className="space-y-4">
                {/* Main Details Card */}
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-6 border border-blue-200 dark:border-blue-800 space-y-4">
                  {/* ID Section - Prominent */}
                  <div className="pb-4 border-b border-blue-200 dark:border-blue-700">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">ID du colis</p>
                    <p className="font-mono font-bold text-2xl text-blue-600 dark:text-blue-400 break-all">{scannedColis.id}</p>
                  </div>

                  {/* Client Info */}
                  <div className="space-y-4">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">📦 Récepteur</p>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{scannedColis.client?.nom || 'Non défini'}</p>
                    </div>

                    <div className="space-y-1">
                      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">📍 Adresse de livraison</p>
                      <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{scannedColis.client?.adresse || 'Non défini'}</p>
                    </div>

                    {/* Status and Price Row */}
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div>
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Statut</p>
                        <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100 text-sm py-1 px-3 font-semibold">
                          {scannedColis.statut}
                        </Badge>
                      </div>
                      {scannedColis.prix && (
                        <div className="text-right">
                          <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">Montant</p>
                          <p className="text-lg font-bold text-green-600 dark:text-green-400">{scannedColis.prix} DH</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Additional Info if available */}
                {scannedColis.description && (
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider mb-2">📝 Description</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">{scannedColis.description}</p>
                  </div>
                )}
              </div>

              {/* Error State */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Action Buttons for Details */}
              <div className="flex flex-col gap-3 pt-2">
                {/* Primary Action - Associate */}
                <Button
                  onClick={handleAssociate}
                  disabled={associating || scannedColis.livreur_id === authState.user?.id}
                  className="w-full bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white font-semibold py-6 text-base rounded-lg transition-all"
                >
                  {scannedColis.livreur_id === authState.user?.id
                    ? '✓ Déjà associé à votre compte'
                    : associating
                    ? 'Assignation en cours...'
                    : '🔗 Associer à mon compte'}
                </Button>

                {/* Secondary Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handleBack}
                    variant="outline"
                    className="w-full"
                  >
                    ↺ Scanner un autre
                  </Button>
                  <Button
                    onClick={onClose}
                    variant="outline"
                    className="w-full"
                  >
                    Fermer
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
