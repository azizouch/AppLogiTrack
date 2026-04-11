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

  // Initialize camera when dialog opens
  useEffect(() => {
    if (!isOpen) return;

    const startCamera = async () => {
      try {
        setError(null);
        setScannedColis(null);
        setScanning(false);
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' }
        });
        
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          setScanning(true);
        }
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

    startCamera();

    return () => {
      // Stop camera when dialog closes
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setScanning(false);
    };
  }, [isOpen]);

  const handleCapture = useCallback(async () => {
    if (!videoRef.current || !canvasRef.current) return;

    try {
      setLoading(true);
      setError(null);
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);

      // Prompt user to enter the colis ID they see from their device
      const colisId = prompt('Entrez l\'ID du colis (lisible sur le QR code affiché à l\'écran):');
      
      if (colisId && colisId.trim()) {
        // Fetch colis details
        const result = await api.getColisById(colisId.trim());
        const { data: colisData, error: colisError } = result;

        if (colisError || !colisData) {
          setError(`Colis ${colisId} non trouvé`);
          setLoading(false);
          return;
        }

        // Stop camera and show details
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
          streamRef.current = null;
        }
        setScanning(false);
        setScannedColis(colisData);
        
        // Call onScan callback if provided
        if (onScan) {
          onScan(colisId.trim());
        }
      } else {
        setError('Action annulée');
      }
    } catch (err) {
      console.error('Capture error:', err);
      setError('Erreur lors de la capture. Réessayez.');
    } finally {
      setLoading(false);
    }
  }, [onScan]);

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
          {/* Error State - Show first if there's an error */}
          {error && !scannedColis && (
            <>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg aspect-square flex items-center justify-center">
                <Camera className="h-16 w-16 text-gray-400" />
              </div>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <div className="flex gap-2 pt-2">
                <Button onClick={onClose} className="flex-1">
                  Fermer
                </Button>
              </div>
            </>
          )}

          {/* Loading/Initializing Camera */}
          {!scanning && !error && !scannedColis && (
            <>
              <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg aspect-square flex items-center justify-center">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
                  <p className="text-sm text-gray-600 dark:text-gray-400">Initialisation de la caméra...</p>
                </div>
              </div>
              <Button onClick={onClose} variant="outline" className="w-full">
                Fermer
              </Button>
            </>
          )}

          {/* Camera View */}
          {scanning && !scannedColis && (
            <>
              <div className="relative w-full bg-black rounded-lg overflow-hidden aspect-square">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                
                {/* Scanning Guide Overlay */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 border-2 border-white rounded-lg opacity-50"></div>
                </div>

                {/* Loading State */}
                {loading && (
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="h-8 w-8 animate-spin text-white" />
                      <p className="text-white text-sm">Traitement du code...</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Instructions for Camera */}
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2 bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="font-semibold">Instructions:</p>
                <ul className="list-disc list-inside space-y-1 text-xs">
                  <li>Ouvrez la caméra sur l'étiquette/QR du colis</li>
                  <li>Lisez l'ID du colis (numéro visible sur le QR)</li>
                  <li>Cliquez sur "Capturer et confirmer"</li>
                  <li>Entrez l'ID du colis dans la boîte de dialogue</li>
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
                <Button
                  onClick={handleCapture}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
                >
                  {loading ? 'Traitement...' : 'Capturer et confirmer'}
                </Button>
              </div>
            </>
          )}

          {/* Colis Details View */}
          {scannedColis && !scanning && (
            <>
              <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="border-b border-gray-200 dark:border-gray-700 pb-3">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase font-mono">ID du colis</p>
                  <p className="font-mono font-bold text-lg text-gray-900 dark:text-white">{scannedColis.id}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">CLIENT</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{scannedColis.client?.nom || 'Non défini'}</p>
                </div>

                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">ADRESSE DE LIVRAISON</p>
                  <p className="text-sm text-gray-900 dark:text-white">{scannedColis.client?.adresse || 'Non défini'}</p>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">STATUT</p>
                    <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100">
                      {scannedColis.statut}
                    </Badge>
                  </div>
                  {scannedColis.prix && (
                    <div className="text-right">
                      <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold mb-1">PRIX</p>
                      <p className="font-bold text-gray-900 dark:text-white">{scannedColis.prix} DH</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Error State */}
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {/* Action Buttons for Details */}
              <div className="flex gap-2 pt-2">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 flex items-center justify-center gap-2"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Retour
                </Button>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="flex-1"
                >
                  Annuler
                </Button>
                <Button
                  onClick={handleAssociate}
                  disabled={associating || scannedColis.livreur_id === authState.user?.id}
                  className="flex-1 bg-green-600 hover:bg-green-700 dark:bg-green-700 dark:hover:bg-green-800 text-white"
                >
                  {scannedColis.livreur_id === authState.user?.id
                    ? 'Déjà associé'
                    : associating
                    ? 'Association...'
                    : 'Associer'}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
