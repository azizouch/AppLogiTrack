import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, User, Mail, Phone, MapPin, Building, Calendar, Package } from 'lucide-react';
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
import { Client, Colis } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function ClientDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [client, setClient] = useState<Client | null>(null);
  const [clientColis, setClientColis] = useState<Colis[]>([]);
  const [colisLoading, setColisLoading] = useState(true);

  // Fetch client data
  useEffect(() => {
    const fetchClient = async () => {
      if (!id) {
        navigate('/clients');
        return;
      }

      try {
        const { data, error } = await api.getClientById(id);

        if (error) {
          toast({
            title: 'Erreur',
            description: 'Impossible de charger les données du client',
            variant: 'destructive',
          });
          navigate('/clients');
          return;
        }

        if (data) {
          setClient(data);
        } else {
          navigate('/clients');
        }
      } catch (error) {
        console.error('Error fetching client:', error);
        toast({
          title: 'Erreur',
          description: 'Une erreur est survenue lors du chargement',
          variant: 'destructive',
        });
        navigate('/clients');
      } finally {
        setLoading(false);
      }
    };

    fetchClient();
  }, [id, navigate, toast]);

  // Fetch client's colis
  useEffect(() => {
    const fetchClientColis = async () => {
      if (!id) return;

      try {
        setColisLoading(true);
        const { data, error } = await api.getColisByClientId(id);

        if (error) {
          console.error('Error fetching client colis:', error);
        } else {
          setClientColis(data || []);
        }
      } catch (error) {
        console.error('Error fetching client colis:', error);
      } finally {
        setColisLoading(false);
      }
    };

    if (client) {
      fetchClientColis();
    }
  }, [id, client]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'livré':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'en cours':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
      case 'en attente':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'annulé':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
      case 'refusé':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/clients')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Détails du client</h1>
            <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
          </div>
        </div>
        <Card className="bg-white dark:bg-gray-800 shadow-sm border-0">
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/clients')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Client introuvable</h1>
            <p className="text-gray-600 dark:text-gray-400">Le client demandé n'existe pas</p>
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
            onClick={() => navigate('/clients')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Retour à la liste</h1>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => navigate(`/clients/${client.id}/modifier`)}
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
        <svg className="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Détails du Client</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Information */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informations du client</h2>

          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{client.nom}</h3>
                <p className="text-gray-600 dark:text-gray-400">ID: {client.id}</p>
              </div>
            </div>

            <div className="space-y-3">
              {client.telephone && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Phone className="w-4 h-4" />
                  <span>{client.telephone}</span>
                </div>
              )}

              {client.email && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <Mail className="w-4 h-4" />
                  <span>{client.email}</span>
                </div>
              )}

              {client.adresse && (
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MapPin className="w-4 h-4" />
                  <span>{client.adresse}</span>
                </div>
              )}
            </div>

            <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                La fonctionnalité d'association d'entreprise sera disponible dans une future mise à jour.
              </p>
            </div>

            <div className="text-gray-600 dark:text-gray-400">
              <p className="text-sm font-medium">Date de création</p>
              <p className="text-lg">{new Date(client.created_at).toLocaleDateString('fr-FR', {
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
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{clientColis.length}</p>
            </div>

            <div>
              <p className="text-gray-600 dark:text-gray-400 mb-2">Statuts des colis</p>
              <div className="space-y-2">
                {['En cours', 'Mise en distribution'].map(status => {
                  const count = clientColis.filter(c => c.statut === status).length;
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
              <p className="text-gray-600 dark:text-gray-400">Liste des colis associés à ce client</p>
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800">
              Créer un nouveau colis
            </Button>
          </div>
        </div>

        <div className="p-6">
          {colisLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
            </div>
          ) : clientColis.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <Package className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-500" />
              <p className="text-lg font-medium mb-2">Aucun colis</p>
              <p className="text-sm">Ce client n'a pas encore de colis</p>
            </div>
          ) : (
            <div className="space-y-3">
              {clientColis.map((colis) => (
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
                    className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30"
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
