import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, ArrowLeft, Truck, User, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormDescription,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { api } from '@/lib/supabase';
import type { Client, Entreprise, Livreur } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Form schema
const formSchema = z.object({
  ref_colis: z.string(),
  statut: z.string({ required_error: 'Le statut est requis' }),
  client_id: z.string({ required_error: 'Le client est requis' }),
  entreprise_id: z.string().optional(),
  livreur_id: z.string().optional(),
  prix: z.coerce.number().min(0, 'Le prix doit être positif').optional(),
  frais: z.coerce.number().min(0, 'Les frais doivent être positifs').optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddColis() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [livreurs, setLivreurs] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      ref_colis: 'COL-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 10000),
      statut: 'En cours',
      client_id: '',
      entreprise_id: '',
      livreur_id: '',
      prix: undefined,
      frais: undefined,
      notes: '',
    },
  });

  // Fetch data for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [clientsRes, entreprisesRes, livreursRes] = await Promise.all([
          api.getClients(),
          api.getEntreprises(),
          api.getLivreurs(),
        ]);

        if (clientsRes.data) setClients(clientsRes.data);
        if (entreprisesRes.data) setEntreprises(entreprisesRes.data);
        if (livreursRes.data) setLivreurs(livreursRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données',
          variant: 'destructive',
        });
      }
    };

    fetchData();
  }, [toast]);

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      // Prepare data for submission
      const colisData = {
        ref_colis: values.ref_colis,
        statut: values.statut,
        client_id: values.client_id,
        entreprise_id: values.entreprise_id || null,
        livreur_id: values.livreur_id === 'unassigned' ? null : values.livreur_id || null,
        prix: values.prix || 0,
        frais: values.frais || 0,
        notes: values.notes || '',
      };

      // Call API to create colis
      const { error } = await supabase.from('colis').insert(colisData);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: 'Succès',
        description: 'Le colis a été créé avec succès',
      });

      // Navigate back to colis list
      navigate('/colis');
    } catch (error) {
      console.error('Error creating colis:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le colis',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/colis')}
            className="h-8 w-8"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ajouter un Colis</h1>
        </div>
      </div>

      <Card className="bg-white shadow-sm border-0">
        <CardHeader className="pb-4">
          <CardTitle>Informations du colis</CardTitle>
          <CardDescription>
            Remplissez les informations pour créer un nouveau colis
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ref Colis */}
              <FormField
                control={form.control}
                name="ref_colis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Ref Colis *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white"
                      />
                    </FormControl>
                    <FormDescription className="text-sm text-gray-500">
                      Référence générée automatiquement (modifiable)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Statut */}
              <FormField
                control={form.control}
                name="statut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Statut *</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statuses.map((status) => (
                          <SelectItem key={status.id} value={status.nom}>
                            {status.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Prix */}
              <FormField
                control={form.control}
                name="prix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Prix (DH)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        className="bg-white"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-sm text-gray-500">
                      Montant à payer par le client
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Frais */}
              <FormField
                control={form.control}
                name="frais"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Frais de livraison (DH)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        className="bg-white"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-sm text-gray-500">
                      Frais supplémentaires de livraison
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Client Selection */}
              <div className="flex items-center gap-2">
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel className="text-base font-semibold">Client *</FormLabel>
                      <div className="relative">
                        <FormControl>
                          <Input
                            placeholder="Rechercher un client..."
                            value={searchClient}
                            onChange={(e) => setSearchClient(e.target.value)}
                            className="bg-white"
                          />
                        </FormControl>
                        {searchClient && (
                          <div className="absolute w-full mt-1 bg-white border rounded-md shadow-lg z-50 max-h-64 overflow-auto">
                            {clients
                              .filter(client =>
                                client.nom.toLowerCase().includes(searchClient.toLowerCase()) ||
                                (client.telephone && client.telephone.includes(searchClient))
                              )
                              .map((client) => (
                                <div
                                  key={client.id}
                                  className="p-2 hover:bg-gray-100 cursor-pointer"
                                  onClick={() => {
                                    field.onChange(client.id);
                                    setSearchClient(client.nom);
                                  }}
                                >
                                  <div className="font-medium">{client.nom}</div>
                                  {client.telephone && (
                                    <div className="text-sm text-gray-500">{client.telephone}</div>
                                  )}
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button
                  type="button"
                  variant="outline"
                  className="mt-8"
                  onClick={() => navigate('/clients/new')}
                >
                  Nouveau Client
                </Button>
              </div>

              {/* Entreprise Selection */}
              <FormField
                control={form.control}
                name="entreprise_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Entreprise (optionnel)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Aucune" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {entreprises.map((entreprise) => (
                          <SelectItem key={entreprise.id} value={entreprise.id}>
                            {entreprise.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Livreur Selection */}
              <FormField
                control={form.control}
                name="livreur_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Livreur (optionnel)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Aucun" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {livreurs.map((livreur) => (
                          <SelectItem key={livreur.id} value={livreur.id}>
                            {`${livreur.prenom || ''} ${livreur.nom}`.trim()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel className="text-base font-semibold">Notes (optionnel - fonctionnalité future)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Informations supplémentaires sur le colis..."
                        className="resize-none bg-white"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-sm text-gray-500">
                      Note: Cette fonctionnalité sera disponible dans une future mise à jour.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-between space-x-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/colis')}
                disabled={loading}
                className="border-t-0"
              >
                Annuler
              </Button>
              <Button 
                type="submit" 
                disabled={loading}
                className="border-t-0"
              >
                {loading ? (
                  'Création...'
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
