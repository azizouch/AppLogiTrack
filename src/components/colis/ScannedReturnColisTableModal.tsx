import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertCircle, Loader2, Trash2, QrCode, CheckCircle2, X, Package, AlertTriangle, RotateCcw } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Colis } from '@/types';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminReturnScanner } from '@/contexts/AdminReturnScannerContext';
import { toast } from 'sonner';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';

interface ScannedReturnColisTableModalProps {
  isOpen: boolean;
  onClose: () => void;
  scannedReturnColisList: Colis[];
  onScanAgain: () => void;
  onFinalize: () => void;
  loading?: boolean;
  selectedLivreur?: { nom: string; prenom?: string } | null;
}

export function ScannedReturnColisTableModal({
  isOpen,
  onClose,
  scannedReturnColisList,
  onScanAgain,
  onFinalize,
  loading = false,
  selectedLivreur,
}: ScannedReturnColisTableModalProps) {
  const { state: authState } = useAuth();
  const { removeScannedReturnColis, clearScannedReturnColisList } = useAdminReturnScanner();
  const [removing, setRemoving] = useState<string | null>(null);
  const [finalizing, setFinalizing] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);

  const handleClose = () => {
    if (scannedReturnColisList.length > 0) {
      setShowCloseConfirm(true);
    } else {
      onClose();
    }
  };

  const confirmClose = () => {
    setShowCloseConfirm(false);
    clearScannedReturnColisList();
    onClose();
  };

  const handleRemoveColis = async (colisId: string) => {
    setRemoving(colisId);
    try {
      removeScannedReturnColis(colisId);
    } catch (error) {
      console.error('Error removing colis from scanned list:', error);
      toast.error('Erreur lors de la suppression du colis');
    } finally {
      setRemoving(null);
    }
  };

  const handleFinalize = async () => {
    if (scannedReturnColisList.length === 0) {
      toast.error('Aucun colis à traiter');
      return;
    }

    setFinalizing(true);
    try {
      await onFinalize();
    } catch (error: any) {
      console.error('Error finalizing:', error);
      toast.error('Erreur lors de la finalisation');
    } finally {
      setFinalizing(false);
    }
  };

  const totalAmount = scannedReturnColisList.reduce((sum, colis) => sum + (colis.prix || 0), 0);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => {
        if (!open) handleClose();
      }}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <RotateCcw className="h-5 w-5" />
              Bon de Retour - Colis scannés
            </DialogTitle>
            <DialogDescription>
              Gérez les colis scannés pour le retour et finalisez le bon
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 min-w-full">
            {/* Stats Summary */}
            <div className="grid grid grid-cols-2 sm:grid-cols-4 gap-2">
              <div className="bg-orange-50 dark:bg-orange-950 p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Nombre de colis</p>
                <p className="text-xs sm:text-lg font-bold text-orange-600 dark:text-orange-400">
                  {scannedReturnColisList.length}
                </p>
              </div>
              <div className="bg-green-50 dark:bg-green-950 p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Montant total</p>
                <p className="text-xs sm:text-lg font-bold text-green-600 dark:text-green-400">
                  {totalAmount.toFixed(2)} DH
                </p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Responsable</p>
                <p className="text-xs sm:text-lg font-bold text-blue-600 dark:text-blue-400 truncate">
                  {authState.user?.prenom} {authState.user?.nom}
                </p>
              </div>
              <div className="bg-purple-50 dark:bg-purple-950 p-4 rounded-lg">
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Livreur</p>
                <p className="text-xs sm:text-lg font-bold text-purple-600 dark:text-purple-400">
                  {selectedLivreur ? `${selectedLivreur.prenom || ''} ${selectedLivreur.nom}`.trim() : 'Non sélectionné'}
                </p>
              </div>
            </div>

            {/* Empty State */}
            {scannedReturnColisList.length === 0 && (
              <Alert className="bg-yellow-50 dark:bg-yellow-950 border-yellow-200 dark:border-yellow-800">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <AlertDescription className="text-yellow-700 dark:text-yellow-300">
                  Aucun colis scanné. Commencez par scanner un colis pour le retour.
                </AlertDescription>
              </Alert>
            )}

            {/* Colis Table */}
            {scannedReturnColisList.length > 0 && (
              <div className="border rounded-lg overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader className="bg-gray-50 dark:bg-gray-900">
                    <TableRow>
                      <TableHead className="font-bold">ID Colis</TableHead>
                      <TableHead className="font-bold">Client</TableHead>
                      <TableHead className="font-bold">Adresse</TableHead>
                      <TableHead className="font-bold text-right">Prix</TableHead>
                      <TableHead className="font-bold">Statut</TableHead>
                      <TableHead className="font-bold">Livreur</TableHead>
                      <TableHead className="font-bold text-center w-12">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {scannedReturnColisList.map((colis) => (
                      <TableRow key={colis.id} className="hover:bg-gray-50 dark:hover:bg-gray-900">
                        <TableCell className="font-mono text-sm font-semibold">
                          {colis.id}
                        </TableCell>
                        <TableCell className="text-sm">
                          {colis.client_nom || colis.client?.nom || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm max-w-[200px] truncate">
                          {colis.adresse_livraison || colis.client?.adresse || 'N/A'}
                        </TableCell>
                        <TableCell className="text-sm text-right font-medium">
                          {colis.prix ? `${colis.prix.toFixed(2)} DH` : '-'}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {colis.statut || 'Inconnu'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {colis.livreur_id ? (
                            <span className="text-green-600">Assigné</span>
                          ) : (
                            <span className="text-gray-400">Non assigné</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => handleRemoveColis(colis.id)}
                            disabled={removing === colis.id}
                            title="Supprimer"
                          >
                            {removing === colis.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 pt-4 border-t">
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  disabled={loading || finalizing}
                  className="w-full sm:w-auto"
                >
                  <X className="h-4 w-4" />
                  Annuler
                </Button>

                {scannedReturnColisList.length > 0 && (
                  <Button
                    variant="outline"
                    onClick={onScanAgain}
                    disabled={loading || finalizing}
                    className="w-full sm:w-auto"
                  >
                    <QrCode className="h-4 w-4" />
                    Scanner plus de colis
                  </Button>
                )}
              </div>

              {scannedReturnColisList.length > 0 && (
                <Button
                  onClick={handleFinalize}
                  disabled={loading || finalizing}
                  className="flex items-center gap-2 bg-orange-600 hover:bg-orange-700 w-full sm:w-auto justify-center"
                >
                  {finalizing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Finaliser le bon de retour
                </Button>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Confirmation Dialog */}
      <AlertDialog open={showCloseConfirm} onOpenChange={setShowCloseConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la fermeture</AlertDialogTitle>
            <AlertDialogDescription>
              Vous avez {scannedReturnColisList.length} colis dans la liste. 
              Si vous fermez, tous les colis scannés seront perdus. Voulez-vous continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClose} className="bg-red-600 hover:bg-red-700">
              Fermer et perdre les colis
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}