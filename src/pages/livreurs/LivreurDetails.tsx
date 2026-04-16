import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RefreshCw, User, Edit, Trash2, Package, FileText, Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
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
import { api, supabase } from '@/lib/supabase';
import { User as UserType, Colis, Statut } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useDebounce } from '@/hooks/useDebounce';
import { AddColisModal } from '@/components/modals/AddColisModal';
import { AssignColisModal } from '@/components/modals/AssignColisModal';

export function LivreurDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [livreur, setLivreur] = useState<UserType | null>(null);
  const [colis, setColis] = useState<Colis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statuts, setStatuts] = useState<Statut[]>([]);

  // Add colis modal state
  const [showAddColisModal, setShowAddColisModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

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
      console.error('LivreurDetails: Exception fetching statuts:', error);
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
      const { data, error } = await api.deleteUser(livreur.id);

      if (error) {
        toast({
          title: 'Erreur',
          description: error.message || 'Impossible de supprimer le livreur',
          variant: 'destructive',
        });
      } else {
        // Provide feedback based on auth deletion status
        let description = 'Livreur supprimé avec succès';

        if (data?.authDeletionStatus === 'auth_success') {
          description = 'Livreur et compte d\'authentification supprimés avec succès';
        } else if (data?.authDeletionStatus === 'auth_failed') {
          description = 'Livreur supprimé, mais le compte d\'authentification n\'a pas pu être supprimé. Veuillez contacter l\'administrateur.';
        } else if (data?.authDeletionStatus === 'no_auth') {
          description = 'Livreur supprimé avec succès (aucun compte d\'authentification associé)';
        }

        toast({
          title: 'Succès',
          description,
        });
        navigate('/livreurs');
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la suppression',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  // Handle colis assigned callback
  const handleColisAssigned = async () => {
    // Refresh livreur data to update colis count
    await fetchLivreur(true);
  };

  // Handle new colis creation
  const handleColisCreated = (newColis: any) => {
    toast({
      title: 'Succès',
      description: 'Colis créé et assigné avec succès',
    });
    // Close the add colis modal
    setShowAddColisModal(false);
    // Refresh livreur data to update colis list
    fetchLivreur(true);
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
    fetchStatuts();
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
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
            variant="ghost"
            onClick={() => navigate('/livreurs')}
            className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors ring-offset-background hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la liste
          </Button>
      </div>

      {/* Livreur Info Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between">
        {/* Title Row */}
        <div className="flex items-center gap-4 mb-3">
          <Avatar className="w-10 h-10 sm:w-12 sm:h-12">
            <AvatarImage
              src={livreur.image_url}
              alt={`${livreur.prenom || ''} ${livreur.nom}`.trim()}
            />
            <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-lg font-bold">
              {livreur.prenom?.[0] || livreur.nom?.[0] || '?'}
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              {livreur.nom} {livreur.prenom} (LIV-{livreur.id.slice(-3).toUpperCase()})
            </h1>
            <Badge className={getStatusColor(livreur.statut)}>
              {livreur.statut}
            </Badge>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Button
                variant="outline"
                onClick={() => navigate(`/livreurs/${livreur.id}/modifier`)}
                className="w-full lg:w-auto text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white flex items-center justify-center gap-2"
              >
                <Edit className="h-4 w-4" />
                Modifier
              </Button>
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    variant="destructive"
                    className="w-full lg:w-auto bg-red-600 hover:bg-red-700 flex items-center justify-center gap-2"
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
          <Button
            variant="default"
            onClick={() => setShowAssignModal(true)}
            className="w-full lg:w-auto bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
          >
            <User className="h-4 w-4" />
            Assigner
          </Button>
        </div>
      </div>

      {/* Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {/* Left Column - Livreur Information */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
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
                    <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                      <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                    </svg>
                    <span className="text-gray-900 dark:text-white break-all">
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

            {/* Address Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Ville
                </label>
                <div className="flex items-center gap-2 mt-1">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-gray-900 dark:text-white">
                    {livreur.ville || '-'}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Adresse
                </label>
                <div className="flex items-start gap-2 mt-1">
                  <svg className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" clipRule="evenodd" />
                    <path d="M8 6h4v2H8V6zM8 10h4v2H8v-2z" />
                  </svg>
                  <span className="text-gray-900 dark:text-white break-words">
                    {livreur.adresse || '-'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notes
                  </label>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    Aucune note spécifiée
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Colis associés
                  </label>
                  <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {colis.length}
                  </p>
                </div>
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
        <div className="space-y-3">
          {/* Colis associés */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
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
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
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
      <AssignColisModal
        livreur={livreur}
        isOpen={showAssignModal}
        onOpenChange={setShowAssignModal}
        onColisAssigned={handleColisAssigned}
      />

      {/* Add Colis Modal */}
      {livreur && (
        <AddColisModal
          open={showAddColisModal}
          onOpenChange={setShowAddColisModal}
          livreurId={livreur.id}
          livreurName={`${livreur.nom} ${livreur.prenom} (LIV-${livreur.id.slice(-3).toUpperCase()})`}
          onColisCreated={handleColisCreated}
        />
      )}
    </div>
  );
}
