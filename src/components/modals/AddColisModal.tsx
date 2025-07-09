import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, Plus, User, Package } from 'lucide-react';
import { ClientCombobox } from '@/components/ui/client-combobox';
import { AddClientModal } from '@/components/modals/AddClientModal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { api, supabase } from '@/lib/supabase';
import type { Client, Entreprise, User as UserType, Statut } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Form schema
const formSchema = z.object({
  id: z.string(),
  statut: z.string({ required_error: 'Le statut est requis' }),
  client_id: z.string({ required_error: 'Le client est requis' }),
  entreprise_id: z.string().optional(),
  prix: z.coerce.number().min(0, 'Le prix doit être positif').optional(),
  frais: z.coerce.number().min(0, 'Les frais doivent être positifs').optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface AddColisModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  livreurId: string;
  livreurName?: string;
  onColisCreated: (colis: any) => void;
}

export function AddColisModal({ open, onOpenChange, livreurId, livreurName, onColisCreated }: AddColisModalProps) {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
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
      prix: undefined,
      frais: undefined,
    },
  });

  // Fetch data for dropdowns
  useEffect(() => {
    if (open) {
      const fetchData = async () => {
        try {
          const [clientsRes, entreprisesRes, statutsRes] = await Promise.all([
            api.getClients(),
            api.getEntreprises(),
            api.getStatuts('colis'),
          ]);

          if (clientsRes.data) setClients(clientsRes.data);
          if (entreprisesRes.data) setEntreprises(entreprisesRes.data);
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
    }
  }, [open, toast]);

  // Handle new client creation
  const handleClientCreated = (newClient: any) => {
    setClients(prev => [...prev, newClient]);
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
        livreur_id: livreurId,
        prix: values.prix || 0,
        frais: values.frais || 0,
        notes: '',
      };

      // Call API to create colis
      const { error } = await supabase.from('colis').insert(colisData);

      if (error) {
        throw new Error(error.message);
      }

      // Add initial status to historique
      try {
        const { data: authUser } = await supabase.auth.getUser();
        const supabaseAuthId = authUser?.user?.id;

        const { data: utilisateur, error: userError } = await supabase
          .from('utilisateurs')
          .select('id')
          .eq('auth_id', supabaseAuthId)
          .single();

        if (userError || !utilisateur) {
          console.error('Current user not found in utilisateurs table:', userError);
        } else {
          await supabase.from('historique_colis').insert({
            colis_id: values.id,
            date: new Date().toISOString(),
            statut: values.statut,
            utilisateur: utilisateur.id,
          });
        }
      } catch (historiqueError) {
        console.error('Error adding initial status to historique:', historiqueError);
      }

      toast({
        title: 'Succès',
        description: 'Le colis a été créé avec succès',
      });

      // Call the callback with the new colis data
      onColisCreated(colisData);
      
      // Reset form and close modal
      form.reset({
        id: 'COL-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 10000),
        statut: 'En cours',
        client_id: '',
        entreprise_id: '',
        prix: undefined,
        frais: undefined,
      });
      onOpenChange(false);
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

  const handleClose = () => {
    form.reset({
      id: 'COL-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 10000),
      statut: 'En cours',
      client_id: '',
      entreprise_id: '',
      prix: undefined,
      frais: undefined,
    });
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent
          className="max-w-4xl max-h-[90vh] overflow-y-auto"
          preventOutsideClick={true}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              Créer un nouveau colis{livreurName ? ` pour ${livreurName}` : ''}
            </DialogTitle>
            <DialogDescription className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-500" />
              Remplissez les informations pour créer un nouveau colis qui sera automatiquement assigné à {livreurName || 'ce livreur'}.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* ID Colis */}
                <FormField
                  control={form.control}
                  name="id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ID Colis *</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
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
                      <FormLabel>Statut *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
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
                      <FormLabel>Prix (DH)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>
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
                      <FormLabel>Frais de livraison (DH)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormDescription>
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
                        <FormLabel>
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
                      <FormLabel>Entreprise (optionnel)</FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(value === "none" ? "" : value)}
                        value={field.value || "none"}
                      >
                        <FormControl>
                          <SelectTrigger>
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
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={handleClose} disabled={loading}>
                  Annuler
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? (
                    'Création...'
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      Créer le colis
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Add Client Modal */}
      <AddClientModal
        open={showAddClientModal}
        onOpenChange={setShowAddClientModal}
        onClientCreated={handleClientCreated}
      />
    </>
  );
}
