import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Building2, Mail, Phone, MapPin, User, Calendar, Package, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Separator } from '@/components/ui/separator';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { api } from '@/lib/supabase';
import { Entreprise, Colis } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function EntrepriseDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [entrepriseColis, setEntrepriseColis] = useState<Colis[]>([]);
  const [loading, setLoading] = useState(true);
  const [colisLoading, setColisLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  // Fetch entreprise data
  useEffect(() => {
    const fetchEntreprise = async () => {
      if (!id) {
        navigate('/entreprises');
        return;
      }

      try {
        const { data, error } = await api.getEntrepriseById(id);

        if (error) {
          toast({
            title: 'Erreur',
            description: 'Impossible de charger les données de l\'entreprise',
            variant: 'destructive',
          });
          navigate('/entreprises');
          return;
        }

        if (data) {
          setEntreprise(data);
        }
      } catch (error) {
        console.error('Error fetching entreprise:', error);
        toast({
          title: 'Erreur',
          description: 'Une erreur est survenue lors du chargement',
          variant: 'destructive',
        });
        navigate('/entreprises');
      } finally {
        setLoading(false);
      }
    };

    fetchEntreprise();
  }, [id, navigate, toast]);

  // Fetch entreprise colis
  useEffect(() => {
    const fetchEntrepriseColis = async () => {
      if (!id) return;

      try {
        const { data, error } = await api.getColisByEntrepriseId(id);
        if (error) {
          console.error('Error fetching entreprise colis:', error);
        } else {
          setEntrepriseColis(data || []);
        }
      } catch (error) {
        console.error('Error fetching entreprise colis:', error);
      } finally {
        setColisLoading(false);
      }
    };

    if (entreprise) {
      fetchEntrepriseColis();
    }
  }, [id, entreprise]);

  // Refresh function
  const handleRefresh = async () => {
    if (!id) return;

    setRefreshing(true);
    try {
      // Refresh entreprise data
      const { data: entrepriseData, error: entrepriseError } = await api.getEntrepriseById(id);
      if (entrepriseError) {
        toast({
          title: 'Erreur',
          description: 'Impossible de rafraîchir les données de l\'entreprise',
          variant: 'destructive',
        });
      } else if (entrepriseData) {
        setEntreprise(entrepriseData);
      }

      // Refresh colis data
      const { data: colisData, error: colisError } = await api.getColisByEntrepriseId(id);
      if (colisError) {
        console.error('Error refreshing entreprise colis:', colisError);
      } else {
        setEntrepriseColis(colisData || []);
      }

      toast({
        title: 'Succès',
        description: 'Données actualisées avec succès',
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de l\'actualisation',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Show delete confirmation
  const showDeleteConfirmation = () => {
    setShowDeleteDialog(true);
  };

  // Delete entreprise
  const handleDelete = async () => {
    if (!entreprise) return;

    setDeleting(true);
    try {
      const { error } = await api.deleteEntreprise(entreprise.id);

      if (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer l\'entreprise',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Succès',
          description: 'Entreprise supprimée avec succès',
        });
        navigate('/entreprises');
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!entreprise) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/entreprises')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Entreprise introuvable</h1>
            <p className="text-gray-600 dark:text-gray-400">L'entreprise demandée n'existe pas</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header Navigation */}
      <div className="mb-2">
        <Button
          variant="ghost"
          onClick={() => navigate('/entreprises')}
          className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors ring-offset-background hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </Button>
      </div>

      {/* Title and Actions */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Détails de l'Entreprise</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(`/entreprises/${entreprise.id}/modifier`)}
            className="text-gray-600 dark:text-gray-400 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Button>
          <Button
            variant="destructive"
            onClick={showDeleteConfirmation}
            disabled={deleting}
            className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entreprise Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Informations de l'entreprise</h2>

            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{entreprise.nom}</h3>
                  <p className="text-gray-500 dark:text-gray-400">ID: ENT-{entreprise.id.slice(-3).toUpperCase()}</p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Adresse</p>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {entreprise.adresse || 'Non renseignée'}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Personne de contact</p>
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-900 dark:text-white">
                      {entreprise.contact || 'Non renseignée'}
                    </span>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">Date de création</p>
                  <p className="text-gray-900 dark:text-white font-medium">
                    {new Date(entreprise.created_at).toLocaleDateString('fr-FR', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric'
                    })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Statistiques</h2>

            <div className="space-y-6">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Nombre de colis</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white">{entrepriseColis.length}</p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-3">Statuts des colis</p>
                <div className="space-y-3">
                  {['Deuxième Appel Pas Réponse', 'Livré'].map(status => {
                    const count = entrepriseColis.filter(c => c.statut === status).length;
                    return (
                      <div key={status} className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">{status}</span>
                        <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Clients</p>
                <p className="text-sm text-blue-600 dark:text-blue-400">
                  La fonctionnalité d'association de clients sera disponible dans une future mise à jour.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Colis Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Colis</h2>
              <p className="text-gray-500 dark:text-gray-400">Liste des colis associés à cette entreprise</p>
            </div>
          </div>

          {colisLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : entrepriseColis.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-500" />
              <p className="text-lg font-medium mb-2">Aucun colis</p>
              <p className="text-sm">Cette entreprise n'a pas encore de colis</p>
            </div>
          ) : (
            <div className="space-y-3">
              {entrepriseColis.map((colis) => (
                <div
                  key={colis.id}
                  className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                  onClick={() => navigate(`/colis/${colis.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{colis.id}</h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {new Date(colis.date_creation).toLocaleDateString('fr-FR', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })} - {colis.statut}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors"
                  >
                    Voir
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Supprimer l'entreprise"
        description={`Êtes-vous sûr de vouloir supprimer l'entreprise "${entreprise?.nom}" ? Cette action est irréversible et supprimera également tous les colis associés.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
