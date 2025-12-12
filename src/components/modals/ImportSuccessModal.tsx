import React from 'react';
import { CheckCircle, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';

interface ImportedColis {
  id?: string;
  numero_suivi?: string;
  client_id?: string;
  client_nom?: string;
  entreprise_id?: string;
  adresse_livraison?: string;
  prix?: number;
  statut?: string;
  [key: string]: any;
}

interface ImportSuccessModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  importedData: ImportedColis[];
  successCount: number;
}

export function ImportSuccessModal({
  open,
  onOpenChange,
  importedData,
  successCount,
}: ImportSuccessModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="import-colis-modal max-w-5xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <CheckCircle className="h-8 w-8 text-green-500" />
            <div>
              <DialogTitle>Import Réussi!</DialogTitle>
              <DialogDescription>
                {successCount} colis ont été importés avec succès
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total importé</p>
              <p className="text-3xl font-bold text-green-600">{successCount}</p>
              <p className="text-xs text-gray-500 mt-1">colis</p>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Statut</p>
              <p className="text-2xl font-bold text-blue-600">Terminé</p>
              <p className="text-xs text-gray-500 mt-1">avec succès</p>
            </div>
          </div>

          {/* Imported Colis Table */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
              Détails des colis importés
            </h3>

            <div className="border rounded-lg overflow-hidden">
              <div className="table-preview-scroll max-h-96">
                <Table>
                  <TableHeader className="bg-gray-50 dark:bg-gray-800 sticky top-0">
                    <TableRow>
                      <TableHead className="text-xs font-semibold">N° Suivi</TableHead>
                      <TableHead className="text-xs font-semibold">Client</TableHead>
                      <TableHead className="text-xs font-semibold">Adresse Livraison</TableHead>
                      <TableHead className="text-xs font-semibold">Prix</TableHead>
                      <TableHead className="text-xs font-semibold">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {importedData.length > 0 ? (
                      importedData.map((colis, idx) => (
                        <TableRow key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                          <TableCell className="text-xs font-mono text-gray-900 dark:text-gray-100">
                            {colis.numero_suivi || colis.id || '-'}
                          </TableCell>
                          <TableCell className="text-xs text-gray-700 dark:text-gray-300">
                            {colis.client_nom || colis.client_id || '-'}
                          </TableCell>
                          <TableCell className="text-xs text-gray-700 dark:text-gray-300 max-w-xs truncate">
                            {colis.adresse_livraison || '-'}
                          </TableCell>
                          <TableCell className="text-xs font-semibold text-gray-900 dark:text-gray-100">
                            {colis.prix ? `${colis.prix.toLocaleString('fr-FR')} DZD` : '-'}
                          </TableCell>
                          <TableCell className="text-xs">
                            <Badge
                              variant="outline"
                              className={`text-xs ${
                                colis.statut === 'nouveau'
                                  ? 'bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-700'
                                  : 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600'
                              }`}
                            >
                              {colis.statut || 'nouveau'}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center py-8 text-gray-500">
                          Aucun colis à afficher
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>

            {importedData.length > 10 && (
              <p className="text-xs text-gray-500 text-center">
                Affichage de 1 à 10 sur {importedData.length} colis
              </p>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 p-3 rounded-lg">
            <p className="text-xs text-blue-800 dark:text-blue-200">
              ℹ️ Mode Test - Les données affichées ne sont pas enregistrées dans la base de données. 
              Cette fonction vous permet de vérifier et valider vos données avant l'import réel.
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            onClick={() => onOpenChange(false)}
            className="bg-green-600 hover:bg-green-700"
          >
            <CheckCircle className="mr-2 h-4 w-4" />
            Fermer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
