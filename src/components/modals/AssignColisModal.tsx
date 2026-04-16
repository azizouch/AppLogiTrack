import React, { useState, useEffect } from 'react';
import { User, Plus, Search, Package, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { StatusBadge } from '@/components/ui/status-badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Colis, Statut, User as UserType } from '@/types';
import { api, supabase } from '@/lib/supabase';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AddColisModal } from './AddColisModal';

interface AssignColisModalProps {
  livreur: UserType | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onColisAssigned?: () => void;
}

export function AssignColisModal({
  livreur,
  isOpen,
  onOpenChange,
  onColisAssigned
}: AssignColisModalProps) {
  const { state: authState } = useAuth();
  const { toast } = useToast();

  // Modal state
  const [unassignedColis, setUnassignedColis] = useState<Colis[]>([]);
  const [colisSearchTerm, setColisSearchTerm] = useState('');
  const [loadingColis, setLoadingColis] = useState(false);
  const [selectedColisIds, setSelectedColisIds] = useState<string[]>([]);
  const [statuts, setStatuts] = useState<Statut[]>([]);
  const [showAddColisModal, setShowAddColisModal] = useState(false);

  const debouncedColisSearch = useDebounce(colisSearchTerm, 300);

  // Handle checkbox selection
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedColisIds(unassignedColis.map(colis => colis.id));
    } else {
      setSelectedColisIds([]);
    }
  };

  const handleSelectColis = (colisId: string, checked: boolean) => {
    if (checked) {
      setSelectedColisIds(prev => [...prev, colisId]);
    } else {
      setSelectedColisIds(prev => prev.filter(id => id !== colisId));
    }
  };

  const isAllSelected = unassignedColis.length > 0 && selectedColisIds.length === unassignedColis.length;
  const isIndeterminate = selectedColisIds.length > 0 && selectedColisIds.length < unassignedColis.length;

  // Fetch statuts
  const fetchStatuts = async () => {
    try {
      const { data, error } = await supabase
        .from('statuts')
        .select('id, nom, couleur, type, actif, created_at')
        .eq('type', 'colis')
        .eq('actif', true)
        .order('ordre', { ascending: true });

      if (!error && data) {
        setStatuts(data as Statut[]);
      } else {
        console.error('Error fetching statuts:', error);
      }
    } catch (error) {
      console.error('AssignColisModal: Exception fetching statuts:', error);
    }
  };

  // Fetch unassigned colis
  const fetchUnassignedColis = async () => {
    if (!livreur) return;

    setLoadingColis(true);
    try {
      const { data, error } = await api.getColis({
        livreurId: 'unassigned',
        limit: 100 // Get more colis for assignment
      });

      if (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les colis non assignés',
          variant: 'destructive',
        });
      } else {
        setUnassignedColis(data || []);
      }
    } catch (error) {
      console.error('Error fetching unassigned colis:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du chargement',
        variant: 'destructive',
      });
    } finally {
      setLoadingColis(false);
    }
  };

  // Assign selected colis
  const assignSelectedColis = async () => {
    if (!livreur || selectedColisIds.length === 0) return;

    try {
      // Assign all selected colis to the livreur
      const updatePromises = selectedColisIds.map(async (colisId) => {
        // Update colis with new livreur and status
        const { error: updateError } = await api.updateColis(colisId, { 
          livreur_id: livreur.id,
          statut: 'Mise en distribution'
        });

        if (updateError) {
          throw new Error(updateError.message);
        }

        // Add historique entry for the assignment
        const { error: historiqueError } = await supabase
          .from('historique_colis')
          .insert({
            colis_id: colisId,
            date: new Date().toISOString(),
            statut: 'Mise en distribution',
            utilisateur: authState.user?.id,
            informations: `Assigné à ${livreur.prenom} ${livreur.nom}`,
          });

        if (historiqueError) {
          console.error('Error creating historique entry:', historiqueError);
        }
      });

      const results = await Promise.allSettled(updatePromises);

      const successCount = results.filter(result => result.status === 'fulfilled').length;
      const errorCount = results.filter(result => result.status === 'rejected').length;

      if (errorCount > 0) {
        toast({
          title: 'Erreur partielle',
          description: `${successCount} colis assignés, ${errorCount} échecs`,
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Succès',
          description: `${successCount} colis assignés avec succès`,
        });
      }

      setSelectedColisIds([]);
      onOpenChange(false);
      onColisAssigned?.();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'assigner les colis',
        variant: 'destructive',
      });
    } finally {
      setLoadingColis(false);
    }
  };

  // Handle colis created
  const handleColisCreated = async (newColis: Colis) => {
    toast({
      title: 'Succès',
      description: 'Colis créé et assigné avec succès',
    });

    // Refresh the unassigned colis list
    await fetchUnassignedColis();

    // Call callback if provided
    onColisAssigned?.();
  };

  // Close modal
  const closeModal = () => {
    setColisSearchTerm('');
    setUnassignedColis([]);
    setSelectedColisIds([]);
    onOpenChange(false);
  };

  // Fetch data when modal opens
  useEffect(() => {
    if (isOpen) {
      fetchStatuts();
      fetchUnassignedColis();
    }
  }, [isOpen, livreur]);

  if (!livreur) return null;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent
          className="md:max-w-2xl lg:max-w-4xl xl:max-w-7xl max-h-[90vh] flex flex-col"
          preventOutsideClick={true}
        >
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Assigner des colis à {livreur.nom} {livreur.prenom} (LIV-{livreur.id.slice(-3).toUpperCase()})
            </DialogTitle>
            <DialogDescription>
              Sélectionnez les colis à assigner à ce livreur ou créez un nouveau colis.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex flex-col space-y-4 min-h-0">
            {/* Search and New Colis Button */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 flex-shrink-0">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher un colis..."
                  value={colisSearchTerm}
                  onChange={(e) => setColisSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => setShowAddColisModal(true)}
                className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau colis
              </Button>
            </div>

            {/* Colis List */}
            <div className="border rounded-lg flex-1 flex flex-col min-h-0">
              <div className="p-4 border-b bg-gray-50 dark:bg-gray-800 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    Colis non assignés
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {unassignedColis.length} colis disponibles
                  </p>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loadingColis ? (
                  <div className="p-8 text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Chargement...</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={isAllSelected}
                            ref={(el) => {
                              if (el) el.indeterminate = isIndeterminate;
                            }}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>ID</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Entreprise</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead>Statut</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {unassignedColis
                        .filter(colis =>
                          !debouncedColisSearch ||
                          colis.id.toLowerCase().includes(debouncedColisSearch.toLowerCase()) ||
                          colis.client?.nom.toLowerCase().includes(debouncedColisSearch.toLowerCase())
                        )
                        .map((colis) => (
                          <TableRow key={colis.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedColisIds.includes(colis.id)}
                                onCheckedChange={(checked) => handleSelectColis(colis.id, checked as boolean)}
                              />
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {colis.id}
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="font-medium">{colis.client?.nom}</div>
                                <div className="text-sm text-gray-500">{colis.client?.telephone}</div>
                              </div>
                            </TableCell>
                            <TableCell>
                              {colis.entreprise?.nom || '-'}
                            </TableCell>
                            <TableCell>
                              {colis.prix} DH
                            </TableCell>
                            <TableCell>
                              <StatusBadge statut={colis.statut} statuts={statuts} />
                            </TableCell>
                          </TableRow>
                        ))}
                    </TableBody>
                  </Table>
                )}

                {!loadingColis && unassignedColis.length === 0 && (
                  <div className="p-8 text-center">
                    <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">
                      Aucun colis non assigné disponible
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer - Fixed at bottom */}
          <div className="flex justify-between pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {selectedColisIds.length} colis sélectionnés
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={closeModal}
              >
                Fermer
              </Button>
              <Button
                onClick={assignSelectedColis}
                disabled={selectedColisIds.length === 0}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <User className="h-4 w-4 mr-2" />
                Assigner ({selectedColisIds.length})
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Colis Modal */}
      <AddColisModal
        open={showAddColisModal}
        onOpenChange={setShowAddColisModal}
        livreurId={livreur.id}
        livreurName={`${livreur.nom} ${livreur.prenom} (LIV-${livreur.id.slice(-3).toUpperCase()})`}
        onColisCreated={handleColisCreated}
      />
    </>
  );
}