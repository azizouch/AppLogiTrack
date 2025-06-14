import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Truck } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { api } from '@/lib/supabase';
import { User } from '@/types';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

// Form schema
const formSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  telephone: z.string().optional(),
  adresse: z.string().optional(),
  ville: z.string().optional(),
  vehicule: z.string().optional(),
  zone: z.string().optional(),
  statut: z.enum(['Actif', 'Inactif', 'Suspendu'], {
    required_error: 'Le statut est requis',
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function EditLivreur() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [livreur, setLivreur] = useState<User | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      adresse: '',
      ville: '',
      vehicule: '',
      zone: '',
      statut: 'Actif',
    },
  });

  // Fetch livreur data
  useEffect(() => {
    const fetchLivreur = async () => {
      if (!id) {
        navigate('/livreurs');
        return;
      }

      try {
        const { data, error } = await api.getUserById(id);

        if (error) {
          toast({
            title: 'Erreur',
            description: 'Impossible de charger les données du livreur',
            variant: 'destructive',
          });
          navigate('/livreurs');
          return;
        }

        if (data && data.role === 'Livreur') {
          setLivreur(data);
          // Update form with livreur data
          form.reset({
            nom: data.nom || '',
            prenom: data.prenom || '',
            email: data.email || '',
            telephone: data.telephone || '',
            adresse: data.adresse || '',
            ville: data.ville || '',
            vehicule: data.vehicule || '',
            zone: data.zone || '',
            statut: data.statut || 'Actif',
          });
        } else {
          navigate('/livreurs');
        }
      } catch (error) {
        console.error('Error fetching livreur:', error);
        toast({
          title: 'Erreur',
          description: 'Une erreur est survenue lors du chargement',
          variant: 'destructive',
        });
        navigate('/livreurs');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchLivreur();
  }, [id, navigate, toast, form]);

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    if (!id) return;

    setLoading(true);
    try {
      // Prepare data for submission
      const livreurData = {
        nom: values.nom,
        prenom: values.prenom,
        email: values.email,
        telephone: values.telephone || null,
        adresse: values.adresse || null,
        ville: values.ville || null,
        vehicule: values.vehicule || null,
        zone: values.zone || null,
        statut: values.statut,
      };

      // Call API to update livreur
      const { error } = await api.updateUser(id, livreurData);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: 'Succès',
        description: 'Le livreur a été modifié avec succès',
      });

      // Navigate back to livreur details
      navigate(`/livreurs/${id}`);
    } catch (error) {
      console.error('Error updating livreur:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la modification du livreur',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-2">
          <Button
            variant="ghost"
            onClick={() => navigate('/livreurs')}
            className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors ring-offset-background hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux détails
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modifier le livreur</h1>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
        <Card className="bg-white dark:bg-gray-800 shadow-sm border-0">
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!livreur) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/livreurs')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Livreur introuvable</h1>
            <p className="text-gray-600 dark:text-gray-400">Le livreur demandé n'existe pas</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button
          variant="ghost"
          onClick={() => navigate(`/livreurs/${id}`)}
          className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors ring-offset-background hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux détails
        </Button>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modifier le Livreur</h1>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Informations du livreur
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Modifiez les informations du livreur
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-6">
              {/* ID Livreur (Read-only) */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  ID Livreur
                </label>
                <Input
                  value={`LIV-${livreur?.id.slice(-3).toUpperCase()}`}
                  disabled
                  className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 mt-1"
                />
              </div>

              {/* Nom et Prénom */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="nom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nom *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Nom du livreur"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="prenom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prénom *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Prénom du livreur"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Téléphone et Ville */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="telephone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Téléphone</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Numéro de téléphone"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ville"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ville</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Ville"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Véhicule et Zone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="vehicule"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Véhicule</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Type de véhicule"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="zone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zone de livraison</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="Zone de livraison assignée"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Adresse */}
              <FormField
                control={form.control}
                name="adresse"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Adresse complète"
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email et Statut */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email *</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          placeholder="Adresse email"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="statut"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Statut *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner le statut" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Actif">Actif</SelectItem>
                          <SelectItem value="Inactif">Inactif</SelectItem>
                          <SelectItem value="Suspendu">Suspendu</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Statut du livreur dans le système
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>


            {/* Footer */}
            <div className="flex gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Enregistrement...
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
                onClick={() => navigate(`/livreurs/${id}`)}
                disabled={loading}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Annuler
              </Button>
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
