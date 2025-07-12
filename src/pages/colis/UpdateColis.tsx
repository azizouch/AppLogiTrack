import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, ArrowLeft, Truck, User as UserIcon, Building, Plus } from 'lucide-react';
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
import { Client, Entreprise, User, Colis, Statut, HistoriqueColis } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Form schema
const formSchema = z.object({
  id: z.string({ required_error: 'L\'ID du colis est requis' }).min(1, 'L\'ID du colis ne peut pas être vide'),
  client_id: z.string({ required_error: 'Le client est requis' }),
  entreprise_id: z.string({ required_error: 'L\'entreprise est requise' }),
  livreur_id: z.string().optional(),
  statut: z.string({ required_error: 'Le statut est requis' }),
  prix: z.coerce.number().min(0, 'Le prix doit être positif').optional(),
  frais: z.coerce.number().min(0, 'Les frais doivent être positifs').optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function UpdateColis() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [livreurs, setLivreurs] = useState<User[]>([]);
  const [statuts, setStatuts] = useState<Statut[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [colis, setColis] = useState<Colis | null>(null);
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [historique, setHistorique] = useState<HistoriqueColis[]>([]);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [updating, setUpdating] = useState(false);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: '',
      client_id: '',
      entreprise_id: '',
      livreur_id: '',
      statut: '',
      prix: undefined,
      frais: undefined,
      notes: '',
    },
  });

  // Fetch colis data and dropdown options
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch colis data
        const { data: colisData, error: colisError } = await api.getColisById(id!);
        
        if (colisError) {
          throw new Error(colisError.message);
        }
        
        if (!colisData) {
          throw new Error('Colis non trouvé');
        }
        
        setColis(colisData);
        
        // Fetch dropdown data
        const [clientsRes, entreprisesRes, livreursRes, statutsRes] = await Promise.all([
          api.getClients(),
          api.getEntreprises(),
          api.getLivreurs(),
          api.getStatuts('colis'),
        ]);

        if (clientsRes.data) setClients(clientsRes.data);
        if (entreprisesRes.data) setEntreprises(entreprisesRes.data);
        if (livreursRes.data) setLivreurs(livreursRes.data);
        if (statutsRes.data) setStatuts(statutsRes.data);
        
        // Set form values
        form.reset({
          id: colisData.id,
          client_id: colisData.client_id,
          entreprise_id: colisData.entreprise_id || 'none',
          livreur_id: colisData.livreur_id || 'none',
          statut: colisData.statut,
          prix: colisData.prix,
          frais: colisData.frais,
          notes: colisData.notes || '',
        });
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données du colis',
          variant: 'destructive',
        });
        navigate('/colis');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchData();
    }
  }, [id, navigate, toast, form]);

  // Handle new client creation
  const handleClientCreated = (newClient: any) => {
    // Add the new client to the list
    setClients(prev => [...prev, newClient]);
    // Select the new client
    form.setValue('client_id', newClient.id);
  };

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    if (!id) return;
    
    setSaving(true);
    try {
      // Prepare data for submission
      const colisData = {
        id: values.id,
        client_id: values.client_id,
        entreprise_id: values.entreprise_id === 'none' ? null : values.entreprise_id || null,
        livreur_id: values.livreur_id === 'none' ? null : values.livreur_id || null,
        statut: values.statut,
        prix: values.prix || 0,
        frais: values.frais || 0,
        notes: values.notes || '',
        date_mise_a_jour: new Date().toISOString(),
      };

      // Check if ID has changed
      const idChanged = values.id !== id;

      if (idChanged) {
        // Check if new ID already exists
        const { data: existingColis } = await supabase
          .from('colis')
          .select('id')
          .eq('id', values.id)
          .single();

        if (existingColis) {
          throw new Error(`Un colis avec l'ID "${values.id}" existe déjà`);
        }

        // Create new colis with new ID and delete old one
        const { error: insertError } = await supabase.from('colis').insert(colisData);
        if (insertError) {
          throw new Error(insertError.message);
        }

        // Delete old colis
        const { error: deleteError } = await supabase.from('colis').delete().eq('id', id);
        if (deleteError) {
          throw new Error(deleteError.message);
        }

        // Update historique_colis references
        await supabase.from('historique_colis').update({ colis_id: values.id }).eq('colis_id', id);
      } else {
        // Normal update
        const { error } = await supabase.from('colis').update(colisData).eq('id', id);
        if (error) {
          throw new Error(error.message);
        }
      }

      // Add to history if status changed
      if (colis && colis.statut !== values.statut) {
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
          await supabase.from('historique_colis').insert({
            colis_id: values.id, // Use the new ID
            date: new Date().toISOString(),
            statut: values.statut,
            utilisateur: utilisateur.id,
          });
        }
      }

      toast({
        title: 'Succès',
        description: 'Le colis a été mis à jour avec succès',
      });

      // Navigate to the updated colis (with potentially new ID)
      navigate(`/colis/${values.id}`);
    } catch (error) {
      console.error('Error updating colis:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le colis',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate(`/colis/${form.getValues('id') || id}`)}
          className="mb-2"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Retour aux détails
        </Button>
        <h1 className="text-2xl font-bold">Modifier le Colis</h1>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <Card>
            <CardHeader className="p-4 md:p-6">
              <CardTitle>Informations du colis</CardTitle>
              <CardDescription>Modifiez les informations du colis</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 md:space-y-6 p-4 md:p-6 pt-0">
              {/* ID Colis and Status Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <FormField
                  control={form.control}
                  name="id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="id">
                        ID Colis <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          id="id"
                          placeholder="ID du colis"
                          {...field}
                        />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">Identifiant unique du colis</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="statut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="statut">Statut</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger id="statut">
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
              </div>

              {/* Prix and Frais Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <FormField
                  control={form.control}
                  name="prix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="prix">Prix (DH)</FormLabel>
                      <FormControl>
                        <Input
                          id="prix"
                          type="number"
                          min="0"
                          step="0.01"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">Montant à payer par le client</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="frais"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel htmlFor="frais">Frais de livraison (DH)</FormLabel>
                      <FormControl>
                        <Input
                          id="frais"
                          type="number"
                          min="0"
                          step="0.01"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <p className="text-sm text-muted-foreground">Frais supplémentaires de livraison</p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Client and Entreprise Row */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
                      <FormLabel htmlFor="entreprise">Entreprise (optionnel)</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger id="entreprise">
                            <SelectValue placeholder="Sélectionner une entreprise" />
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

              {/* Livreur Selection */}
              <FormField
                control={form.control}
                name="livreur_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel htmlFor="livreur">Livreur (optionnel)</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger id="livreur">
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
                  <FormItem>
                    <FormLabel htmlFor="notes">Notes (optionnel - fonctionnalité future)</FormLabel>
                    <FormControl>
                      <Textarea
                        id="notes"
                        placeholder="Informations supplémentaires sur le colis..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <p className="text-sm text-muted-foreground">Note: Cette fonctionnalité sera disponible dans une future mise à jour.</p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-start gap-3 px-4 md:px-6 pb-4 md:pb-6">
              <Button
                type="submit"
                disabled={saving}
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    Enregistrement...
                  </span>
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
                onClick={() => navigate(`/colis/${form.getValues('id') || id}`)}
              >
                Annuler
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>

      {/* Add Client Modal */}
      <AddClientModal
        open={showAddClientModal}
        onOpenChange={setShowAddClientModal}
        onClientCreated={handleClientCreated}
      />
    </div>
  );
}
