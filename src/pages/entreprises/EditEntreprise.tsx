import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { api } from '@/lib/supabase';
import { Entreprise } from '@/types';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

// Form schema
const formSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  telephone: z.string().optional(),
  telephone_2: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  adresse: z.string().optional(),
  contact: z.string().optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function EditEntreprise() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom: '',
      telephone: '',
      telephone_2: '',
      email: '',
      adresse: '',
      contact: '',
      description: '',
    },
  });

  // Fetch entreprise data
  useEffect(() => {
    const fetchEntreprise = async () => {
      if (!id) {
        navigate('/entreprises');
        return;
      }

      try {
        const { data, error } = await api.getEntrepriseById(id);

        if (error) {
          toast({
            title: 'Erreur',
            description: 'Impossible de charger les données de l\'entreprise',
            variant: 'destructive',
          });
          navigate('/entreprises');
          return;
        }

        if (data) {
          setEntreprise(data);
          // Update form with entreprise data
          form.reset({
            nom: data.nom || '',
            telephone: data.telephone || '',
            telephone_2: data.telephone_2 || '',
            email: data.email || '',
            adresse: data.adresse || '',
            contact: data.contact || '',
            description: data.description || '',
          });
        }
      } catch (error) {
        console.error('Error fetching entreprise:', error);
        toast({
          title: 'Erreur',
          description: 'Une erreur est survenue lors du chargement',
          variant: 'destructive',
        });
        navigate('/entreprises');
      } finally {
        setInitialLoading(false);
      }
    };

    fetchEntreprise();
  }, [id, navigate, toast, form]);

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    if (!id) return;

    setLoading(true);
    try {
      // Prepare data for submission
      const entrepriseData = {
        nom: values.nom,
        telephone: values.telephone || null,
        telephone_2: values.telephone_2 || null,
        email: values.email || null,
        adresse: values.adresse || null,
        contact: values.contact || null,
        description: values.description || null,
      };

      // Call API to update entreprise
      const { error } = await api.updateEntreprise(id, entrepriseData);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: 'Succès',
        description: 'L\'entreprise a été modifiée avec succès',
      });

      // Navigate back to entreprises list
      navigate('/entreprises');
    } catch (error) {
      console.error('Error updating entreprise:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la modification de l\'entreprise',
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
            onClick={() => navigate('/entreprises')}
            className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors ring-offset-background hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour aux détails
          </Button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modifier l'entreprise</h1>
          <p className="text-gray-600 dark:text-gray-400">Chargement...</p>
        </div>
        <Card className="bg-white dark:bg-gray-800 shadow-sm border-0">
          <CardContent className="p-8">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!entreprise) {
    return (
      <div className="space-y-6">
        <div className="mb-2">
          <Button
            variant="ghost"
            onClick={() => navigate('/entreprises')}
            className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors ring-offset-background hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour à la liste
          </Button>
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Entreprise introuvable</h1>
          <p className="text-gray-600 dark:text-gray-400">L'entreprise demandée n'existe pas</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button
          variant="ghost"
          onClick={() => navigate(`/entreprises/${id}`)}
          className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors ring-offset-background hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour aux détails
        </Button>

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Modifier l'entreprise</h1>
        <p className="text-gray-600 dark:text-gray-400">Modifier les informations de {entreprise.nom}</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-600" />
            Informations de l'entreprise
          </h2>
          <p className="text-gray-600 dark:text-gray-400">Modifiez les informations de l'entreprise</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* Nom */}
              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Nom de l'entreprise *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white dark:bg-gray-700"
                        placeholder="Nom de l'entreprise"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Contact */}
              <FormField
                control={form.control}
                name="contact"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Personne de contact</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white dark:bg-gray-700"
                        placeholder="Nom de la personne de contact"
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
                    <FormLabel className="text-base font-semibold">Téléphone (Vendeur B)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white dark:bg-gray-700"
                        placeholder="Numéro de téléphone principal"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Téléphone 2 */}
              <FormField
                control={form.control}
                name="telephone_2"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Téléphone 2 (Vendeur P)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white dark:bg-gray-700"
                        placeholder="Numéro de téléphone secondaire"
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
                    <FormLabel className="text-base font-semibold">Email</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="email"
                        className="bg-white dark:bg-gray-700"
                        placeholder="Adresse email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Adresse */}
              <FormField
                control={form.control}
                name="adresse"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel className="text-base font-semibold">Adresse</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white dark:bg-gray-700"
                        placeholder="Adresse complète de l'entreprise"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Description */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel className="text-base font-semibold">Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        className="bg-white dark:bg-gray-700"
                        placeholder="Description de l'entreprise ou notes"
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      Informations supplémentaires sur l'entreprise (optionnel)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4 pt-6">
              <Button
                type="submit"
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Modification...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Modifier l'entreprise
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/entreprises')}
                disabled={loading}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
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
