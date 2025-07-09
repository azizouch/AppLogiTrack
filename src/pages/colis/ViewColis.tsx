import { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Edit, Package, User, Building, Truck, Calendar, MapPin, Phone, Mail, Clock, DollarSign, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { api, supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

import { Colis, HistoriqueColis, Statut } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function ViewColis() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { state } = useAuth();

  // Get the return URL from query parameters
  const returnTo = searchParams.get('returnTo') || '/colis';


  const [colis, setColis] = useState<Colis | null>(null);
  const [historique, setHistorique] = useState<HistoriqueColis[]>([]);
  const [statuses, setStatuses] = useState<Statut[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [updating, setUpdating] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch colis data using the API function
        const colisResult = await api.getColisById(id!);

        if (!colisResult) {
          throw new Error('Impossible de charger les données du colis');
        }

        const { data: colisData, error: colisError } = colisResult;

        if (colisError) {
          throw new Error(colisError.message);
        }

        if (!colisData) {
          throw new Error('Colis non trouvé');
        }

        setColis(colisData);
        setSelectedStatus(colisData.statut);

        // Fetch historique with optimized query - join with users to get names
        const { data: historiqueData, error: historiqueError } = await supabase
          .from('historique_colis')
          .select(`
            id,
            date,
            statut,
            utilisateur,
            user:utilisateurs(nom, prenom)
          `)
          .eq('colis_id', id)
          .order('date', { ascending: false })
          .limit(20); // Limit to last 20 status changes for performance

        if (historiqueError) {
          console.error('Error fetching historique:', historiqueError);
        } else {
          setHistorique(historiqueData || []);
        }

        // Fetch statuses for the select dropdown
        try {
          const statusesResult = await api.getStatuts('colis');

          if (statusesResult?.data) {
            setStatuses(statusesResult.data);
          }
        } catch (error) {
          console.error('Error fetching statuses:', error);
        }
      } catch (error) {
        console.error('Error in fetchData:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données du colis',
          variant: 'destructive',
        });
        navigate(returnTo);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, navigate, toast, returnTo]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'En cours':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-300 dark:bg-orange-900 dark:text-orange-200 dark:border-orange-700">En cours</Badge>;
      case 'Livré':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-200 dark:border-green-700">Livré</Badge>;
      case 'Retourné':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-200 dark:border-red-700">Retourné</Badge>;
      case 'Annulé':
        return <Badge variant="secondary" className="bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-600">Annulé</Badge>;
      case 'Refusé':
        return <Badge variant="secondary" className="bg-purple-100 text-purple-800 border-purple-300 dark:bg-purple-900 dark:text-purple-200 dark:border-purple-700">Refusé</Badge>;
      default:
        return <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const handleStatusUpdate = async () => {
    if (!colis || !id || selectedStatus === colis.statut) {
      return;
    }

    setUpdating(true);
    try {
      // Update colis status
      const updateResult = await supabase
        .from('colis')
        .update({
          statut: selectedStatus,
          date_mise_a_jour: new Date().toISOString()
        })
        .eq('id', id);

      if (!updateResult || updateResult.error) {
        throw new Error(updateResult?.error?.message || 'Erreur lors de la mise à jour');
      }

      // Get the Supabase auth user ID
      const { data: authUser } = await supabase.auth.getUser();
      const supabaseAuthId = authUser?.user?.id;

      // Find the corresponding utilisateur record using the auth_id field
      const { data: utilisateur, error: userError } = await supabase
        .from('utilisateurs')
        .select('id, nom, prenom, auth_id')
        .eq('auth_id', supabaseAuthId)
        .single();

      if (userError || !utilisateur) {
        throw new Error('Current user not found in utilisateurs table. Please contact administrator to create your user profile.');
      }

      // Add to historique using the utilisateur ID (not the auth_id)
      const historiqueEntry = {
        colis_id: id,
        statut: selectedStatus,
        date: new Date().toISOString(),
        utilisateur: utilisateur.id
      };

      // Insert historique entry with better error handling
      const { error: insertError } = await supabase
        .from('historique_colis')
        .insert(historiqueEntry);

      if (insertError) {
        console.error('Error inserting historique:', insertError);
        throw new Error(`Failed to insert historique: ${insertError.message}`);
      }

      // Update local state immediately for better UX
      setColis(prev => prev ? {
        ...prev,
        statut: selectedStatus,
        date_mise_a_jour: new Date().toISOString()
      } : null);

      // Small delay to ensure the historique entry is inserted before refreshing
      await new Promise(resolve => setTimeout(resolve, 300));

      // Refresh historique to show the new entry immediately
      const { data: historiqueRefreshData, error: refreshError } = await supabase
        .from('historique_colis')
        .select(`
          id,
          date,
          statut,
          utilisateur,
          user:utilisateurs(nom, prenom)
        `)
        .eq('colis_id', id)
        .order('date', { ascending: false })
        .limit(20);

      if (refreshError) {
        console.error('Error refreshing historique:', refreshError);
      } else {
        setHistorique(historiqueRefreshData || []);
      }

      toast({
        title: 'Succès',
        description: 'Le statut du colis a été mis à jour',
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
      // Reset selected status to current colis status
      setSelectedStatus(colis.statut);
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!colis || !id) {
      return;
    }

    setDeleting(true);
    try {
      // First, delete all related historique entries
      const { error: historiqueError } = await supabase
        .from('historique_colis')
        .delete()
        .eq('colis_id', id);

      if (historiqueError) {
        console.error('Error deleting historique:', historiqueError);
        throw new Error('Erreur lors de la suppression de l\'historique');
      }

      // Then delete the colis
      const { error: colisError } = await supabase
        .from('colis')
        .delete()
        .eq('id', id);

      if (colisError) {
        console.error('Error deleting colis:', colisError);
        throw new Error('Erreur lors de la suppression du colis');
      }

      toast({
        title: 'Succès',
        description: 'Le colis a été supprimé avec succès',
      });

      // Navigate back to colis list
      navigate(returnTo);
    } catch (error) {
      console.error('Error deleting colis:', error);
      toast({
        title: 'Erreur',
        description: error instanceof Error ? error.message : 'Impossible de supprimer le colis',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!colis) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Package className="h-16 w-16 text-gray-400 mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Colis non trouvé</h2>
        <p className="text-gray-500 mb-4">Le colis que vous recherchez n'existe pas ou a été supprimé.</p>
        <Button onClick={() => navigate(returnTo)}>Retour à la liste</Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="mb-2">
        <Button
          variant="ghost"
          onClick={() => navigate(returnTo)}
          className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors ring-offset-background hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </Button>
      </div>

      {/* Title Section */}
      <div className="mb-8">
        {/* Title Row */}
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
            <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{colis.id}</h1>
            <p className="text-gray-500 dark:text-gray-400">
              Créé le {new Intl.DateTimeFormat('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              }).format(new Date(colis.date_creation))}
            </p>
          </div>
        </div>

        {/* Buttons Row */}
        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate(`/colis/${id}/modifier`)}
            className="flex items-center gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Edit className="h-4 w-4" />
            Modifier
          </Button>
          <Button
            variant="destructive"
            onClick={() => setShowDeleteModal(true)}
            className="flex items-center gap-2 bg-red-500 hover:bg-red-600 dark:bg-red-600 dark:hover:bg-red-700"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </Button>
          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-40 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
              {statuses.map((status) => (
                <SelectItem key={status.id} value={status.nom} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                  {status.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            onClick={handleStatusUpdate}
            disabled={updating || selectedStatus === colis.statut}
            className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {updating ? 'Mise à jour...' : 'Mettre à jour'}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Main Info */}
        <div className="lg:col-span-2 space-y-8">
          {/* Informations du colis */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Informations du colis</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Détails et statut actuel du colis</p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Statut actuel */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mt-1">
                  <Clock className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">Statut actuel</h3>
                  {getStatusBadge(colis.statut)}
                </div>
              </div>

              {/* Prix */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mt-1">
                  <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">Prix</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {colis.prix ? `${colis.prix} DH` : 'Non défini'}
                  </p>
                </div>
              </div>

              {/* Frais de livraison */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900 rounded-full flex items-center justify-center mt-1">
                  <DollarSign className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">Frais de livraison</h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {colis.frais ? `${colis.frais} DH` : 'Non défini'}
                  </p>
                </div>
              </div>

              {/* Bon de distribution */}
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mt-1">
                  <Package className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 dark:text-white mb-1">Bon de distribution</h3>
                  <p className="text-gray-600 dark:text-gray-400">Aucun bon associé</p>
                </div>
              </div>
            </div>
          </div>

          {/* Historique des statuts */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">Historique des statuts</h2>
            {historique.length > 0 ? (
              <div className="space-y-4">
                {historique.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                      <Clock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getStatusBadge(item.statut)}
                        <span className="text-sm text-gray-500 dark:text-gray-400">
                          {formatDate(item.date)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        Par {item.user ? `${item.user.prenom || ''} ${item.user.nom}`.trim() : 'Système'}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
                <p>Aucun historique disponible</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Client, Entreprise, Livreur */}
        <div className="space-y-6">
          {/* Client */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Client</h2>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-gray-900 dark:text-white">{colis.client?.nom || 'Non défini'}</h3>

              {colis.client?.adresse && (
                <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{colis.client.adresse}</span>
                </div>
              )}

              {colis.client?.telephone && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{colis.client.telephone}</span>
                </div>
              )}

              {colis.client?.email && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Mail className="h-4 w-4" />
                  <span className="text-sm">{colis.client.email}</span>
                </div>
              )}

              <Button
                variant="outline"
                className="w-full mt-4 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                onClick={() => navigate(`/clients/${colis.client?.id}`)}
              >
                Voir le profil
              </Button>
            </div>
          </div>

          {/* Entreprise */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <Building className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Entreprise</h2>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-gray-900 dark:text-white">{colis.entreprise?.nom || 'Non définie'}</h3>

              {colis.entreprise?.adresse && (
                <div className="flex items-start gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <span className="text-sm">{colis.entreprise.adresse}</span>
                </div>
              )}

              {colis.entreprise?.telephone && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Phone className="h-4 w-4" />
                  <span className="text-sm">{colis.entreprise.telephone}</span>
                </div>
              )}

              {colis.entreprise?.contact && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <User className="h-4 w-4" />
                  <span className="text-sm">Contact: {colis.entreprise.contact}</span>
                </div>
              )}

              {colis.entreprise && (
                <Button
                  variant="outline"
                  className="w-full mt-4 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  onClick={() => navigate(`/entreprises/${colis.entreprise?.id}`)}
                >
                  Voir le profil
                </Button>
              )}
            </div>
          </div>

          {/* Livreur */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 md:p-6">
            <div className="flex items-center gap-3 mb-4">
              <Truck className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Livreur</h2>
            </div>

            <div className="space-y-3">
              {colis.livreur ? (
                <>
                  <h3 className="font-medium text-gray-900 dark:text-white">
                    {`${colis.livreur.prenom || ''} ${colis.livreur.nom}`.trim()}
                  </h3>

                  {colis.livreur.telephone && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Phone className="h-4 w-4" />
                      <span className="text-sm">{colis.livreur.telephone}</span>
                    </div>
                  )}

                  {colis.livreur.email && (
                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">{colis.livreur.email}</span>
                    </div>
                  )}

                  <Button
                    variant="outline"
                    className="w-full mt-4 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => navigate(`/livreurs/${colis.livreur?.id}`)}
                  >
                    Voir le profil
                  </Button>
                </>
              ) : (
                <p className="text-gray-500 dark:text-gray-400">Aucun livreur associé</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmationDialog
        open={showDeleteModal}
        onOpenChange={setShowDeleteModal}
        title="Confirmer la suppression"
        description={`Êtes-vous sûr de vouloir supprimer le colis ${colis.id} ? Cette action est irréversible et supprimera également tout l'historique associé.`}
        confirmText={deleting ? 'Suppression...' : 'Supprimer'}
        cancelText="Annuler"
        onConfirm={handleDelete}
        variant="destructive"
      />
    </div>
  );
}
