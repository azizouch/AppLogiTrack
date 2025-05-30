import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Edit, User, Mail, Phone, MapPin, RefreshCw, Trash2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { api } from '@/lib/supabase';
import { Client, Colis } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function ClientDetails() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

  // Refresh data
  const handleRefresh = async () => {
    if (!id) return;

    setRefreshing(true);
    try {
      // Refresh client data
      const { data: clientData, error: clientError } = await api.getClientById(id);
      if (clientError) {
        toast({
          title: 'Erreur',
          description: 'Impossible de rafraîchir les données du client',
          variant: 'destructive',
        });
      } else if (clientData) {
        setClient(clientData);
      }

      // Refresh colis data
      const { data: colisData, error: colisError } = await api.getColisByClientId(id);
      if (colisError) {
        console.error('Error refreshing client colis:', colisError);
      } else {
        setClientColis(colisData || []);
      }

      toast({
        title: 'Succès',
        description: 'Données actualisées avec succès',
      });
    } catch (error) {
      console.error('Error refreshing data:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de l\'actualisation',
        variant: 'destructive',
      });
    } finally {
      setRefreshing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Client introuvable</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Le client demandé n'existe pas</p>
            <Button
              onClick={() => navigate('/clients')}
              className="mt-4"
            >
              Retour à la liste
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-6">
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/clients')}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold">Détails du Client</h1>
            <Button
              variant="ghost"
              size="icon"
              className="ml-2"
              onClick={handleRefresh}
              disabled={refreshing}
              title="Rafraîchir les données"
            >
              <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={() => navigate(`/clients/${client.id}/modifier`)}
            >
              <Edit className="mr-2 h-4 w-4" />
              Modifier
            </Button>
            <Button
              variant="destructive"
              disabled={refreshing}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informations du client</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{client.nom}</h2>
                  <p className="text-sm text-muted-foreground">ID: {client.id}</p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {client.telephone && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Téléphone</h3>
                    <p className="text-lg font-medium flex items-center">
                      <Phone className="mr-2 h-4 w-4 text-muted-foreground" />
                      {client.telephone}
                    </p>
                  </div>
                )}

                {client.email && (
                  <div>
                    <h3 className="text-sm font-medium text-muted-foreground">Email</h3>
                    <p className="text-lg font-medium flex items-center">
                      <Mail className="mr-2 h-4 w-4 text-muted-foreground" />
                      {client.email}
                    </p>
                  </div>
                )}
              </div>

              {client.adresse && (
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground">Adresse</h3>
                  <p className="text-lg font-medium flex items-start">
                    <MapPin className="mr-2 h-4 w-4 text-muted-foreground mt-1" />
                    {client.adresse}
                  </p>
                </div>
              )}

              {/* Entreprise section - Hidden until the feature is implemented */}
              <div className="bg-muted p-3 rounded-md">
                <p className="text-sm text-muted-foreground">
                  La fonctionnalité d'association d'entreprise sera disponible dans une future mise à jour.
                </p>
              </div>

              <div>
                <h3 className="text-sm font-medium text-muted-foreground">Date de création</h3>
                <p className="text-lg font-medium">
                  {new Date(client.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Colis</CardTitle>
                  <CardDescription>
                    Liste des colis associés à ce client
                  </CardDescription>
                </div>
                <Button onClick={() => navigate(`/colis/nouveau?client=${id}`)}>
                  Créer un nouveau colis
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {clientColis.length > 0 ? (
                <div className="space-y-4">
                  {clientColis.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors">
                      <div className="flex items-center space-x-3">
                        <Package className="h-5 w-5 text-primary" />
                        <div>
                          <p className="font-medium">{item.id}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(item.date_creation).toLocaleDateString('fr-FR', {
                              day: 'numeric',
                              month: 'long',
                              year: 'numeric'
                            })} - {item.statut}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/colis/${item.id}`)}
                        className="h-8 px-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        Voir
                      </Button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground">Aucun colis associé à ce client</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div>
          <Card>
            <CardHeader>
              <CardTitle>Statistiques</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-muted p-4 rounded-md">
                  <h3 className="font-medium">Nombre de colis</h3>
                  <p className="text-3xl font-bold">{clientColis.length}</p>
                </div>

                {clientColis.length > 0 && (
                  <div className="bg-muted p-4 rounded-md">
                    <h3 className="font-medium">Statuts des colis</h3>
                    <div className="mt-2 space-y-2">
                      {Object.entries(
                        clientColis.reduce((acc: any, colis) => {
                          acc[colis.statut] = (acc[colis.statut] || 0) + 1;
                          return acc;
                        }, {})
                      ).map(([statut, count]: [string, any]) => (
                        <div key={statut} className="flex justify-between">
                          <span>{statut}</span>
                          <span className="font-medium">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

    </div>
  );
}
