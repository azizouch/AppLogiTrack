import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Save } from 'lucide-react';
import { ClientCombobox } from '@/components/ui/client-combobox';
import { AddClientModal } from '@/components/modals/AddClientModal';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

import { api } from '@/lib/supabase';
import { Client, Entreprise, Statut, User } from '@/types';
import { z } from 'zod';
import { useToast } from '@/components/ui/use-toast';

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

  type PartialLivreur = Pick<User, 'id' | 'nom' | 'prenom' | 'statut'>;
  type PartialStatut = Pick<Statut, 'id' | 'nom' | 'type' | 'couleur' | 'ordre' | 'actif'>;
  
  const [clients, setClients] = useState<Client[]>([]);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [livreurs, setLivreurs] = useState<PartialLivreur[]>([]);
  const [statuses, setStatuses] = useState<PartialStatut[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddClientModal, setShowAddClientModal] = useState(false);

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
        const [clientsRes, entreprisesRes, livreursRes, statusesRes] = await Promise.all([
          api.getClients(),
          api.getEntreprises(),
          api.getLivreurs(),
          api.getStatuts(),
        ]);        if (clientsRes.data) setClients(clientsRes.data);
        if (entreprisesRes.data) setEntreprises(entreprisesRes.data);
        if (livreursRes.data) setLivreurs(livreursRes.data);
        if (statusesRes.data) setStatuses(statusesRes.data);
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
      };      // Call API to create colis
      const { error: createError } = await api.createColis(colisData);

      if (createError) {
        throw new Error(createError.message);
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

  const handleClientCreated = (newClient: Client) => {
    setClients(prev => [...prev, newClient]);
    form.setValue('client_id', newClient.id);
    setShowAddClientModal(false);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button
          variant="ghost"
          onClick={() => navigate('/colis')}
          className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors ring-offset-background text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </Button>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ajouter un Colis</h1>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Informations du colis</h2>
          <p className="text-gray-600 dark:text-gray-400">Remplissez les informations pour créer un nouveau colis</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* ID Colis */}
              <FormField
                control={form.control}
                name="ref_colis"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Colis *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}

                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">Identifiant unique du colis</p>
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
                    <FormLabel>Statut</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
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
                    <FormLabel>Prix (DH)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"

                        {...field}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">Montant à payer par le client</p>
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
                    <FormLabel>Frais de livraison (DH)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"

                        {...field}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">Frais supplémentaires de livraison</p>
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
                      <FormLabel>
                        Client <span className="text-red-500">*</span>
                      </FormLabel>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowAddClientModal(true)}
                        className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
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
                    <FormLabel>Entreprise (optionnel)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
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
                    <FormLabel>Livreur (optionnel)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
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
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>Notes (optionnel)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Informations supplémentaires sur le colis..."
                        className="resize-none"
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
            </div>

            <div className="flex gap-4 mt-6">
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Création...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Enregistrer
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/colis')}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Annuler
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Add Client Modal */}
      <AddClientModal
        open={showAddClientModal}
        onOpenChange={setShowAddClientModal}
        onClientCreated={handleClientCreated}
      />
    </div>
  );
}
