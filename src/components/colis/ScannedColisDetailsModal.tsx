import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertCircle, Loader2, MapPin, DollarSign, Phone, User, Package, CheckCircle2, X } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Colis } from '@/types';
import { toast } from 'sonner';

interface ScannedColisDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  colis: Colis | null;
  onAssociate: (colis: Colis) => Promise<void>;
  loading?: boolean;
  isAlreadyAdded?: boolean;
}

export function ScannedColisDetailsModal({
  isOpen,
  onClose,
  colis,
  onAssociate,
  loading = false,
  isAlreadyAdded = false,
}: ScannedColisDetailsModalProps) {
  const [associating, setAssociating] = useState(false);

  const handleAssociate = async () => {
    if (!colis || isAlreadyAdded) return;

    setAssociating(true);
    try {
      await onAssociate(colis);
      toast.success('Colis associé avec succès');
      onClose();
    } catch (error) {
      console.error('Error associating colis:', error);
      toast.error('Erreur lors de l\'association du colis');
    } finally {
      setAssociating(false);
    }
  };

  if (!colis) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Détails du colis
          </DialogTitle>
          <DialogDescription>
            {colis.id}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Colis Information */}
          <div className="space-y-3 bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            {/* Client Information */}
            <div className="flex items-start gap-3">
              <User className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Client</p>
                <p className="font-semibold text-gray-900 dark:text-white">{colis.client_nom || 'N/A'}</p>
                {colis.client_telephone && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">{colis.client_telephone}</p>
                )}
              </div>
            </div>

            {/* Address */}
            <div className="flex items-start gap-3">
              <MapPin className="h-5 w-5 text-green-600 dark:text-green-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Adresse de livraison</p>
                <p className="font-semibold text-gray-900 dark:text-white">{colis.adresse_livraison || 'N/A'}</p>
              </div>
            </div>

            {/* Price */}
            <div className="flex items-start gap-3">
              <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Montant</p>
                <p className="font-semibold text-gray-900 dark:text-white">{(colis.prix || 0).toFixed(2)} DH</p>
              </div>
            </div>

            {/* Status */}
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400">Statut</p>
                <Badge className="mt-1" variant="outline">
                  {colis.statut}
                </Badge>
              </div>
            </div>

            {/* Notes */}
            {colis.notes && (
              <div className="flex items-start gap-3 pt-2 border-t border-gray-200 dark:border-gray-700">
                <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Notes</p>
                  <p className="text-sm text-gray-900 dark:text-white mt-1">{colis.notes}</p>
                </div>
              </div>
            )}
          </div>

          {/* Warning if already added */}
          {isAlreadyAdded && (
            <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
              <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <AlertDescription className="text-blue-700 dark:text-blue-300">
                Ce colis est déjà dans la liste de balayage
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={associating}
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              onClick={handleAssociate}
              disabled={loading || associating || isAlreadyAdded}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {associating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Association...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Associer le colis
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
