import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, User, Edit, Trash2, Package, FileText, Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { api } from '@/lib/supabase';
import { User as UserType, Colis } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';

export function LivreurDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [livreur, setLivreur] = useState<UserType | null>(null);
  const [colis, setColis] = useState<Colis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [unassignedColis, setUnassignedColis] = useState<Colis[]>([]);
  const [colisSearchTerm, setColisSearchTerm] = useState('');
  const [loadingColis, setLoadingColis] = useState(false);
  const debouncedColisSearch = useDebounce(colisSearchTerm, 300);

  // Fetch livreur details
  const fetchLivreur = async (isRefresh = false) => {
    if (!id) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { data, error } = await api.getUserById(id);

      if (error) {
        console.error('Error fetching livreur:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les détails du livreur',
          variant: 'destructive',
        });
        navigate('/livreurs');
      } else if (data) {
        setLivreur(data);

        // Fetch colis assigned to this livreur
        const { data: colisData } = await api.getColis({
          livreurId: id,
          limit: 100
        });

        if (colisData) {
          setColis(colisData);
        }
      }
    } catch (error) {
      console.error('Error fetching livreur:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du chargement',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchLivreur(true);
  };

  // Handle delete
  const handleDelete = async () => {
    if (!livreur) return;

    setDeleting(true);
    try {
      const { error } = await api.deleteUser(livreur.id);

      if (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer le livreur',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Succès',
          description: 'Livreur supprimé avec succès',
        });
        navigate('/livreurs');
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  // Assignment modal functions
  const openAssignModal = async () => {
    setShowAssignModal(true);
    await fetchUnassignedColis();
  };

  const closeAssignModal = () => {
    setShowAssignModal(false);
    setColisSearchTerm('');
    setUnassignedColis([]);
  };

  const fetchUnassignedColis = async () => {
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

  const assignColis = async (colisId: string) => {
    if (!livreur) return;

    try {
      const { error } = await api.updateColis(colisId, {
        livreur_id: livreur.id
      });

      if (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible d\'assigner le colis',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Succès',
          description: 'Colis assigné avec succès',
        });

        // Remove assigned colis from the list
        setUnassignedColis(prev => prev.filter(c => c.id !== colisId));

        // Refresh livreur data to update colis count
        await fetchLivreur(true);
      }
    } catch (error) {
      console.error('Error assigning colis:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'actif':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'inactif':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'suspendu':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  // Get colis status badge
  const getColisStatusBadge = (status: string) => {
    const colors = {
      'En cours': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300',
      'Livré': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
      'En attente': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
      'Annulé': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    };

    return (
      <Badge className={colors[status as keyof typeof colors] || colors['En attente']}>
        {status}
      </Badge>
    );
  };

  useEffect(() => {
    fetchLivreur();
  }, [id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-10 w-24 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
        </div>
      </div>
    );
  }

  if (!livreur) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 dark:text-gray-400">Livreur non trouvé</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/livreurs')}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à la liste
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Livreur Info Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
            <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              {livreur.nom} {livreur.prenom} (LIV-{livreur.id.slice(-3).toUpperCase()})
            </h1>
            <Badge className={getStatusColor(livreur.statut)}>
              {livreur.statut}
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="default"
            onClick={openAssignModal}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <User className="h-4 w-4 mr-2" />
            Assigner
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/livreurs/${livreur.id}/modifier`)}
            className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <Edit className="h-4 w-4 mr-2" />
            Modifier
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="destructive"
                className="bg-red-600 hover:bg-red-700"
                disabled={deleting}
              >
                {deleting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Suppression...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer
                  </>
                )}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                <AlertDialogDescription>
                  Êtes-vous sûr de vouloir supprimer le livreur "{livreur.nom} {livreur.prenom}" ?
                  Cette action est irréversible et supprimera toutes les données associées.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Supprimer
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Livreur Information */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Informations du livreur
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Détails et coordonnées
              </p>
            </div>

            <div className="space-y-6">
              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Téléphone
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    <span className="text-gray-900 dark:text-white">
                      {livreur.telephone || '-'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Email
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span className="text-gray-900 dark:text-white">
                      {livreur.email || '-'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Separator Line */}
              <div className="border-t border-gray-200 dark:border-gray-700"></div>

              {/* Location Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Véhicule
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-900 dark:text-white">
                      {livreur.vehicule || '-'}
                    </span>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Zone de livraison
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                    </svg>
                    <span className="text-gray-900 dark:text-white">
                      {livreur.zone || '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Notes
                </label>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Aucune note spécifiée
                </p>
              </div>

              <div className="mt-4">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Date de création
                </label>
                <p className="text-gray-900 dark:text-white mt-1">
                  {new Date(livreur.date_creation).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Colis and Bons */}
        <div className="space-y-6">
          {/* Colis associés */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <Package className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Colis associés
              </h2>
            </div>

            <div className="space-y-3">
              {colis.length > 0 ? (
                colis.slice(0, 3).map((colisItem) => (
                  <div key={colisItem.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">
                        {colisItem.id}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {colisItem.client?.nom}
                      </div>
                    </div>
                    <div className="text-right">
                      {getColisStatusBadge(colisItem.statut)}
                      <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {new Date(colisItem.date_creation).toLocaleDateString('fr-FR')}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  Aucun colis assigné
                </p>
              )}
            </div>
          </div>

          {/* Bons de distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Bons de distribution
              </h2>
            </div>

            <div className="space-y-3">
              {/* Mock data for bons */}
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    BD-2025-0002
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    En cours
                  </div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  14 Avril 2025
                </div>
              </div>

              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    BD-2025-0005
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    Annulé
                  </div>
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  11 Avril 2025
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Assignment Modal */}
      <Dialog open={showAssignModal} onOpenChange={closeAssignModal}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Assigner des colis à {livreur?.nom} {livreur?.prenom} (LIV-{livreur?.id.slice(-3).toUpperCase()})
            </DialogTitle>
            <DialogDescription>
              Sélectionnez les colis à assigner à ce livreur ou créez un nouveau colis.
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 flex flex-col space-y-4 min-h-0">
            {/* Search and New Colis Button */}
            <div className="flex items-center gap-4 flex-shrink-0">
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
                onClick={() => navigate('/colis/nouveau')}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nouveau colis
              </Button>
            </div>

            {/* Colis List */}
            <div className="border rounded-lg flex-1 flex flex-col min-h-0">
              <div className="p-4 border-b bg-gray-50 dark:bg-gray-800 flex-shrink-0">
                <h3 className="font-medium text-gray-900 dark:text-white">
                  Colis non assignés
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {unassignedColis.length} colis disponibles
                </p>
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
                        <TableHead>ID</TableHead>
                        <TableHead>Client</TableHead>
                        <TableHead>Entreprise</TableHead>
                        <TableHead>Prix</TableHead>
                        <TableHead>Statut</TableHead>
                        <TableHead>Action</TableHead>
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
                              {colis.prix} €
                            </TableCell>
                            <TableCell>
                              <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                                {colis.statut}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Button
                                size="sm"
                                onClick={() => assignColis(colis.id)}
                                className="bg-blue-600 hover:bg-blue-700"
                              >
                                <User className="h-4 w-4 mr-1" />
                                Assigner
                              </Button>
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
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
            <Button
              variant="outline"
              onClick={closeAssignModal}
            >
              Fermer
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
