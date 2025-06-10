import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, ArrowLeft, Truck, User as UserIcon, Building } from 'lucide-react';
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
import { Client, Entreprise, User, Colis, Statut } from '@/types';
import { useToast } from '@/hooks/use-toast';

// Form schema
const formSchema = z.object({
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

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
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
          client_id: colisData.client_id,
          entreprise_id: colisData.entreprise_id,
          livreur_id: colisData.livreur_id || '',
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

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    if (!id) return;
    
    setSaving(true);
    try {
      // Prepare data for submission
      const colisData = {
        client_id: values.client_id,
        entreprise_id: values.entreprise_id,
        livreur_id: values.livreur_id || null,
        statut: values.statut,
        prix: values.prix || 0,
        frais: values.frais || 0,
        notes: values.notes || '',
        date_mise_a_jour: new Date().toISOString(),
      };

      // Call API to update colis
      const { error } = await supabase.from('colis').update(colisData).eq('id', id);

      if (error) {
        throw new Error(error.message);
      }

      // Add to history if status changed
      if (colis && colis.statut !== values.statut) {
        await supabase.from('historique_colis').insert({
          colis_id: id,
          date: new Date().toISOString(),
          statut: values.statut,
          utilisateur: (await supabase.auth.getUser()).data.user?.id,
        });
      }

      toast({
        title: 'Succès',
        description: 'Le colis a été mis à jour avec succès',
      });

      // Navigate back to colis list
      navigate('/colis');
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modifier le Colis</h1>
        </div>
      </div>

      <Card className="border-gray-600 dark:border-gray-600 bg-transparent">
        <CardHeader>
          <CardTitle>Informations du Colis #{id}</CardTitle>
          <CardDescription>
            Modifiez les détails du colis
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {/* Client Selection */}
              <FormField
                control={form.control}
                name="client_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <UserIcon className="h-4 w-4" /> Client
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-transparent border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white">
                          <SelectValue placeholder="Sélectionner un client" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clients.map((client) => (
                          <SelectItem key={client.id} value={client.id}>
                            {client.nom} {client.telephone && `- ${client.telephone}`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    <FormLabel className="flex items-center gap-2">
                      <Building className="h-4 w-4" /> Entreprise
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-transparent border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white">
                          <SelectValue placeholder="Sélectionner une entreprise" />
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

              {/* Status Selection */}
              <FormField
                control={form.control}
                name="statut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-transparent border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white">
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

              {/* Livreur Selection */}
              <FormField
                control={form.control}
                name="livreur_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Truck className="h-4 w-4" /> Livreur
                    </FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger className="bg-transparent border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white">
                          <SelectValue placeholder="Sélectionner un livreur (optionnel)" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="max-h-[300px]">
                        <SelectItem value="">
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0 h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <UserIcon className="h-4 w-4 text-gray-500" />
                            </div>
                            <span>Non assigné</span>
                          </div>
                        </SelectItem>
                        {livreurs.map((livreur) => (
                          <SelectItem key={livreur.id} value={livreur.id}>
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0 h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                                {livreur.prenom?.[0] || livreur.nom[0]}
                              </div>
                              <div className="flex flex-col">
                                <span className="font-medium">{`${livreur.prenom || ''} ${livreur.nom}`.trim()}</span>
                                {livreur.telephone && (
                                  <span className="text-sm text-gray-500">{livreur.telephone}</span>
                                )}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Prix */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="prix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prix</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="bg-transparent border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white"
                          {...field}
                        />
                      </FormControl>
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
                      <FormLabel>Frais de livraison</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          className="bg-transparent border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Notes */}
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Informations supplémentaires..."
                        className="resize-none bg-transparent border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
            <CardFooter className="flex justify-end space-x-2 pt-6 border-t border-gray-600 dark:border-gray-600">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/colis')}
                className="bg-transparent border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white hover:bg-gray-700/10 dark:hover:bg-gray-700/20"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {saving ? (
                  <span className="flex items-center gap-2">
                    <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    Enregistrement...
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Save className="h-4 w-4" />
                    Enregistrer
                  </span>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
