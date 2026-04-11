import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertCircle, Loader2, Camera } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ColisQRScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (colisId: string) => void;
  title?: string;
  description?: string;
}

export function ColisQRScanner({
  isOpen,
  onClose,
  onScan,
  title = 'Scanner un Code QR',
  description = 'Utilisez votre appareil photo pour scanner le code QR du colis',
}: ColisQRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const streamRef = useRef<MediaStream | null>(null);

  // Initialize camera when dialog opens
  useEffect(() => {
    if (!isOpen) return;

    const startCamera = async () => {
      try {
        setError(null);
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
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');
      
      if (!context) return;

      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);

      // Prompt user to enter the colis ID they see from their device
      const colisId = prompt('Entrez l\'ID du colis (lisible sur le QR code affiché à l\'écran):');
      
      if (colisId && colisId.trim()) {
        setLoading(false);
        setScanning(false);
        
        // Call the onScan callback with the colis ID
        onScan(colisId.trim());
        
        // Close the dialog after a short delay
        setTimeout(() => {
          onClose();
        }, 500);
      } else {
        setLoading(false);
        setError('Action annulée');
      }
    } catch (err) {
      console.error('Capture error:', err);
      setError('Erreur lors de la capture. Réessayez.');
      setLoading(false);
    }
  }, [onScan, onClose]);

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
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Camera View */}
          {scanning && (
            <div className="relative w-full bg-black rounded-lg overflow-hidden aspect-square">
              <video
                ref={videoRef}
                autoPlay
                playsInline
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
          )}

          {/* Camera Icon When Not Scanning */}
          {!scanning && !error && (
            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-lg aspect-square flex items-center justify-center">
              <Camera className="h-16 w-16 text-gray-400" />
            </div>
          )}

          {/* Error State */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Instructions */}
          <div className="text-sm text-gray-600 dark:text-gray-400 space-y-2">
            <p className="font-semibold">Instructions:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Ouvrez la caméra sur l'étiquette/QR du colis</li>
              <li>Lisez l'ID du colis (numéro visible sur le QR)</li>
              <li>Cliquez sur "Capturer et confirmer"</li>
              <li>Entrez l'ID du colis dans la boîte de dialogue</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1"
            >
              Annuler
            </Button>
            {scanning && (
              <>
                <Button
                  onClick={handleCapture}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                >
                  {loading ? 'Traitement...' : 'Capturer et confirmer'}
                </Button>
                <Button
                  onClick={stopScanning}
                  variant="destructive"
                  className="flex-1"
                >
                  Arrêter
                </Button>
              </>
            )}
            {!scanning && !error && (
              <Button
                onClick={() => setScanning(true)}
                className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
              >
                Recommencer
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
