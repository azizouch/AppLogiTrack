import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertCircle, Loader2, Trash2, QrCode, CheckCircle2, X, Package, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Colis } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useQRScanner } from '@/contexts/QRScannerContext';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface ScannedColisTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  scannedColisList: Colis[];
  onScanAgain: () => void;
  onFinalize: () => void;
  loading?: boolean;
}

export function ScannedColisTableModal({
  isOpen,
  onClose,
  scannedColisList,
  onScanAgain,
  onFinalize,
  loading = false,
}: ScannedColisTableModalProps) {
  const { state: authState } = useAuth();
  const { removeScannedColis, clearScannedColisList } = useQRScanner();
  const [removing, setRemoving] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const handleClose = () => {
    if (scannedColisList.length > 0) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  const confirmClose = () => {
    setShowCloseConfirm(false);
    clearScannedColisList();
    onClose();
  };

  const handleRemoveColis = async (colisId: string) => {
    setRemoving(colisId);
    try {
      removeScannedColis(colisId);
    } catch (error) {
      console.error('Error removing colis from scanned list:', error);
      toast.error('Erreur lors de la suppression du colis');
    } finally {
      setRemoving(null);
    }
  };

  const handleFinalize = async () => {
    if (scannedColisList.length === 0) {
      toast.error('Aucun colis à traiter');
      return;
    }

    setFinalizing(true);
    try {
      // Call the onFinalize callback
      await onFinalize();
    } catch (error: any) {
      console.error('Error finalizing:', error);
      toast.error('Erreur lors de la finalisation');
    } finally {
      setFinalizing(false);
    }
  };

  const totalAmount = scannedColisList.reduce((sum, colis) => sum + (colis.prix || 0), 0);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) handleClose();
      }}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
          </DialogTitle>
          <DialogDescription>
            Gérez les colis scannés et finalisez la distribution
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 min-w-full">
          {/* Stats Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Nombre de colis</p>
              <p className="text-sm sm:text-lg  font-bold text-blue-600 dark:text-blue-400">
                {scannedColisList.length}
              </p>
            </div>
            <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Montant total</p>
              <p className="text-sm sm:text-lg  font-bold text-green-600 dark:text-green-400">
                {totalAmount.toFixed(2)} DH
              </p>
            </div>
            <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
              <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Livreur</p>
              <p className="text-sm sm:text-lg font-bold text-purple-600 dark:text-purple-400">
                {authState.user?.prenom} {authState.user?.nom}
              </p>
            </div>
          </div>

          {/* Empty State */}
          {scannedColisList.length === 0 && (
            <Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
              <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
              <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                Aucun colis scanné. Commencez par scanner un colis.
              </AlertDescription>
            </Alert>
          )}

          {/* Colis Table */}
          {scannedColisList.length > 0 && (
            <div className="border rounded-lg overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader className="bg-gray-50 dark:bg-gray-900">
                  <TableRow>
                    <TableHead className="font-bold">ID Colis</TableHead>
                    <TableHead className="font-bold">Client</TableHead>
                    <TableHead className="font-bold">Adresse</TableHead>
                    <TableHead className="font-bold text-right">Prix</TableHead>
                    <TableHead className="font-bold">Statut</TableHead>
                    <TableHead className="font-bold text-center w-12">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {scannedColisList.map((colis) => (
                    <TableRow key={colis.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                      <TableCell className="font-mono text-sm font-semibold">
                        {colis.id}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{colis.client_nom || 'N/A'}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {colis.client_telephone || ''}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-sm max-w-xs truncate">
                        {colis.adresse_livraison || 'N/A'}
                      </TableCell>
                      <TableCell className="text-right font-semibold">
                        {(colis.prix || 0).toFixed(2)} DH
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${
                            colis.livreur_id === authState.user?.id
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          }`}
                        >
                          {colis.statut}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <button
                          onClick={() => handleRemoveColis(colis.id)}
                          disabled={removing === colis.id}
                          className="text-red-600 hover:text-red-800 disabled:opacity-50"
                          title="Supprimer de la liste"
                        >
                          {removing === colis.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={handleClose}
              disabled={loading || finalizing}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              Fermer
            </Button>

            <Button
              variant="outline"
              onClick={onScanAgain}
              disabled={loading || finalizing}
              className="w-full sm:w-auto border-blue-500 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950"
            >
              <QrCode className="h-4 w-4 mr-2" />
              Scanner un autre colis
            </Button>

            <Button
              onClick={handleFinalize}
              disabled={scannedColisList.length === 0 || loading || finalizing}
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700"
            >
              {finalizing ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Finalisation...
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Finaliser la distribution
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Confirmer la fermeture
          </AlertDialogTitle>
          <AlertDialogDescription>
            Êtes-vous sûr de vouloir fermer cette fenêtre ? Tous les colis scannés ({scannedColisList.length}) seront supprimés de la liste et vous devrez recommencer le balayage.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setShowCloseConfirm(false)}>
            Annuler
          </AlertDialogCancel>
          <AlertDialogAction onClick={confirmClose} className="bg-red-600 hover:bg-red-700">
            Fermer et supprimer
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
    </>
  );
}
