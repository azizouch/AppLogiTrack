import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, ArrowLeft, Truck, User, Building, Plus } from 'lucide-react';
import { ClientCombobox } from '@/components/ui/client-combobox';
import { AddClientModal } from '@/components/modals/AddClientModal';
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
import { api, supabase } from '@/lib/supabase';
import type { Client, Entreprise, User as UserType, Statut } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Form schema
const formSchema = z.object({
  id: z.string(),
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
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [livreurs, setLivreurs] = useState<User[]>([]);
  const [statuts, setStatuts] = useState<Statut[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: 'COL-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 10000),
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
        const [clientsRes, entreprisesRes, livreursRes, statutsRes] = await Promise.all([
          api.getClients(),
          api.getEntreprises(),
          api.getLivreurs(),
          api.getStatuts('colis'),
        ]);

        if (clientsRes.data) {
          setClients(clientsRes.data);

          // Pre-select client if provided in URL params
          const clientId = searchParams.get('client');
          if (clientId) {
            const clientExists = clientsRes.data.find(c => c.id === clientId);
            if (clientExists) {
              form.setValue('client_id', clientId);
            }
          }
        }

        if (entreprisesRes.data) setEntreprises(entreprisesRes.data);

        if (livreursRes.data) {
          setLivreurs(livreursRes.data);

          // Pre-select livreur if provided in URL params
          const livreurId = searchParams.get('livreur');
          if (livreurId) {
            const livreurExists = livreursRes.data.find(l => l.id === livreurId);
            if (livreurExists) {
              form.setValue('livreur_id', livreurId);
            }
          }
        }

        if (statutsRes.data) setStatuts(statutsRes.data);
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
  }, [toast, searchParams, form]);

  // Handle new client creation
  const handleClientCreated = (newClient: any) => {
    // Add the new client to the list
    setClients(prev => [...prev, newClient]);
    // Select the new client
    form.setValue('client_id', newClient.id);
  };

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      // Prepare data for submission
      const colisData = {
        id: values.id,
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

      // Add initial status to historique
      try {
        // Get the Supabase auth user ID
        const { data: authUser } = await supabase.auth.getUser();
        const supabaseAuthId = authUser?.user?.id;

        // Find the corresponding utilisateur record using the auth_id field
        const { data: utilisateur, error: userError } = await supabase
          .from('utilisateurs')
          .select('id')
          .eq('auth_id', supabaseAuthId)
          .single();

        if (userError || !utilisateur) {
          console.error('Current user not found in utilisateurs table:', userError);
        } else {
          // Add initial status to historique
          await supabase.from('historique_colis').insert({
            colis_id: values.id,
            date: new Date().toISOString(),
            statut: values.statut,
            utilisateur: utilisateur.id,
          });
        }
      } catch (historiqueError) {
        console.error('Error adding initial status to historique:', historiqueError);
        // Don't fail the entire operation if historique fails
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
    <div>
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/colis')}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour à la liste
        </Button>
        <h1 className="text-2xl font-bold">Créer un Colis</h1>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Informations du colis</CardTitle>
          <CardDescription>
            Remplissez les informations pour créer un nouveau colis
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ID Colis */}
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">ID Colis *</FormLabel>
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
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Sélectionner un statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {statuts.map((statut) => (
                          <SelectItem key={statut.id} value={statut.nom}>
                            {statut.nom}
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
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
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
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex justify-between items-center">
                      <FormLabel className="text-base font-semibold">
                        Client <span className="text-red-500">*</span>
                      </FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddClientModal(true)}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Nouveau Client
                      </Button>
                    </div>
                    <FormControl>
                      <ClientCombobox
                        clients={clients}
                        value={field.value}
                        onValueChange={field.onChange}
                        onNewClientClick={() => setShowAddClientModal(true)}
                        placeholder="Rechercher un client..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Entreprise Selection */}
              <FormField
                control={form.control}
                name="entreprise_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Entreprise (optionnel)</FormLabel>
                    <Select
                      onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Aucune" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Aucune</SelectItem>
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
                      onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                      value={field.value || "none"}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Aucun" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="none">Aucun</SelectItem>
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

      {/* Add Client Modal */}
      <AddClientModal
        open={showAddClientModal}
        onOpenChange={setShowAddClientModal}
        onClientCreated={handleClientCreated}
      />
    </div>
  );
}
