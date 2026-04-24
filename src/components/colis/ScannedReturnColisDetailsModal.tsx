import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertCircle, Loader2, MapPin, DollarSign, Phone, User, Package, CheckCircle2, X, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Colis } from '@/types';
import { toast } from 'sonner';

interface ScannedReturnColisDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  colis: Colis | null;
  onAssociate: (colis: Colis) => Promise<void>;
  loading?: boolean;
  isAlreadyAdded?: boolean;
}

export function ScannedReturnColisDetailsModal({
  isOpen,
  onClose,
  colis,
  onAssociate,
  loading = false,
  isAlreadyAdded = false,
}: ScannedReturnColisDetailsModalProps) {
  const [associating, setAssociating] = useState(false);

  const handleAssociate = async () => {
    if (!colis || isAlreadyAdded) return;

    setAssociating(true);
    try {
      await onAssociate(colis);
      toast.success('Colis ajouté au bon de retour');
      onClose();
    } catch (error) {
      console.error('Error associating colis:', error);
      toast.error('Erreur lors de l\'ajout du colis');
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
            <RotateCcw className="h-5 w-5" />
            Détails du colis - Retour
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

            {/* Livreur */}
            {colis.livreur_id && (
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-indigo-600 dark:text-indigo-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-sm text-gray-600 dark:text-gray-400">Livreur assigné</p>
                  <p className="font-semibold text-gray-900 dark:text-white">Oui</p>
                </div>
              </div>
            )}
          </div>

          {/* Warning for already scanned */}
          {isAlreadyAdded && (
            <Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                Ce colis est déjà dans la liste des retours.
              </AlertDescription>
            </Alert>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            {!isAlreadyAdded && (
              <Button
                onClick={handleAssociate}
                disabled={loading || associating}
                className="bg-orange-600 hover:bg-orange-700"
              >
                {associating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <RotateCcw className="h-4 w-4 mr-2" />
                )}
                Ajouter au retour
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}