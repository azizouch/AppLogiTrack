import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, Building, Mail, Phone, MapPin, User, Calendar, Package } from 'lucide-react';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/entreprises')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Retour à la liste</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/entreprises/${entreprise.id}/modifier`)}
            className="text-blue-600 dark:text-blue-400 border-blue-600 dark:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30"
          >
            <Edit className="mr-2 h-4 w-4" />
            Modifier
          </Button>
          <Button
            variant="destructive"
            className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-800"
          >
            Supprimer
          </Button>
        </div>
      </div>

      {/* Title */}
      <div className="flex items-center gap-3">
        <Building className="w-6 h-6 text-purple-600 dark:text-purple-400" />
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Détails de l'Entreprise</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Entreprise Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informations de l'entreprise</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <Building className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{entreprise.nom}</h3>
                <p className="text-gray-600 dark:text-gray-400">ID: {entreprise.id}</p>
              </div>
            </div>

            <div className="space-y-3">
              {entreprise.telephone && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Phone className="w-4 h-4" />
                  <span>{entreprise.telephone}</span>
                </div>
              )}

              {entreprise.email && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span>{entreprise.email}</span>
                </div>
              )}

              {entreprise.adresse && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>{entreprise.adresse}</span>
                </div>
              )}

              {entreprise.contact && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <User className="w-4 h-4" />
                  <span>Contact: {entreprise.contact}</span>
                </div>
              )}
            </div>

            {entreprise.description && (
              <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-lg">
                <p className="text-sm text-purple-600 dark:text-purple-400">
                  {entreprise.description}
                </p>
              </div>
            )}

            <div className="text-gray-600 dark:text-gray-400">
              <p className="text-sm font-medium">Date de création</p>
              <p className="text-lg">{new Date(entreprise.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}</p>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Statistiques</h2>

          <div className="space-y-4">
            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-1">Nombre de colis</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{entrepriseColis.length}</p>
            </div>

            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">Statuts des colis</p>
              <div className="space-y-2">
                {['En cours', 'Mise en distribution'].map(status => {
                  const count = entrepriseColis.filter(c => c.statut === status).length;
                  return (
                    <div key={status} className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">{status}</span>
                      <span className="font-semibold text-gray-900 dark:text-white">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Colis Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Colis</h2>
              <p className="text-gray-600 dark:text-gray-400">Liste des colis associés à cette entreprise</p>
            </div>
            <Button className="bg-purple-600 hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-800">
              Créer un nouveau colis
            </Button>
          </div>
        </div>

        <div className="p-6">
          {colisLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-600"></div>
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
                    <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                      <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
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
                    className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30"
                  >
                    Voir
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
