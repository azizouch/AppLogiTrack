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
  vehicule: z.string().optional(),
  zone: z.string().optional(),
  notes: z.string().optional(),
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
      vehicule: '',
      zone: '',
      notes: '',
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

        if (data && (data.role?.toLowerCase() === 'livreur' || data.role === 'Livreur')) {
          setLivreur(data);
          // Update form with livreur data
          form.reset({
            nom: data.nom || '',
            prenom: data.prenom || '',
            email: data.email || '',
            telephone: data.telephone || '',
            vehicule: data.vehicule || '',
            zone: data.zone || '',
            notes: data.notes || '',
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
        vehicule: values.vehicule || null,
        zone: values.zone || null,
        notes: values.notes || null,
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
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/livreurs')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modifier le livreur</h1>
            <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
          </div>
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
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate(`/livreurs/${id}`)}
          className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Retour aux détails
        </Button>
      </div>

      <div>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* ID Livreur */}
              <div>
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  ID Livreur
                </label>
                <Input
                  value={livreur?.id || ''}
                  disabled
                  className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 mt-1"
                />
              </div>

              {/* Nom */}
              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Nom *
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 mt-1"
                        placeholder={`${livreur?.nom} ${livreur?.prenom} (LIV-${livreur?.id.slice(-3).toUpperCase()})`}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Téléphone */}
              <FormField
                control={form.control}
                name="telephone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Téléphone
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 mt-1"
                        placeholder="07 22 33 44 55"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Email
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 mt-1"
                        placeholder="martin.dupont@example.com"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Véhicule */}
              <FormField
                control={form.control}
                name="vehicule"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Véhicule
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 mt-1"
                        placeholder="Scooter"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Zone de livraison */}
              <FormField
                control={form.control}
                name="zone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Zone de livraison
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 mt-1"
                        placeholder="Centre"
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
                  <FormLabel className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Notes
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 mt-1 min-h-[100px]"
                      placeholder="Informations supplémentaires"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Footer */}
            <div className="flex justify-end gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/livreurs/${id}`)}
                disabled={loading}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                Annuler
              </Button>
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
            </div>
          </form>
        </Form>
      </div>
    </div>
  );
}
