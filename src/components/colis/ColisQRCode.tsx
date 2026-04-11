import React, { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ColisQRCodeProps {
  colisId: string;
  colisNumber?: string;
}

export function ColisQRCode({ colisId, colisNumber }: ColisQRCodeProps) {
  const qrRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(colisId)}`;

  const handleDownload = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `colis-${colisId}-qrcode.png`;
      link.click();
      window.URL.revokeObjectURL(url);
      toast({
        title: 'Succès',
        description: 'Code QR téléchargé avec succès',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de télécharger le code QR',
        variant: 'destructive',
      });
    }
  };

  const handleCopyToClipboard = async () => {
    try {
      const response = await fetch(qrCodeUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob })
      ]);
      toast({
        title: 'Succès',
        description: 'Code QR copié dans le presse-papiers',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de copier le code QR',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 p-6 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
      {/* Title */}
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        Code QR du Colis
      </h3>

      {/* QR Code Container */}
      <div
        ref={qrRef}
        className="p-4 bg-white rounded-lg border border-gray-200 dark:border-gray-600"
      >
        <img
          src={qrCodeUrl}
          alt={`QR Code for ${colisId}`}
          className="w-48 h-48 object-contain"
        />
      </div>

      {/* Colis ID Display */}
      <div className="text-center">
        <p className="text-sm text-gray-600 dark:text-gray-400">ID du Colis</p>
        <p className="text-lg font-mono font-bold text-gray-900 dark:text-white">
          {colisNumber || colisId}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2 w-full">
        <Button
          onClick={handleDownload}
          variant="outline"
          className="flex-1 flex items-center justify-center gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <Download className="h-4 w-4" />
          Télécharger
        </Button>
        <Button
          onClick={handleCopyToClipboard}
          variant="outline"
          className="flex-1 flex items-center justify-center gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <Copy className="h-4 w-4" />
          Copier
        </Button>
      </div>

      {/* Description */}
      <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
        Scannez ce code QR avec l'application mobile pour accéder rapidement aux détails du colis
      </p>
    </div>
  );
}
