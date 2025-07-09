import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Building2 } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { api } from '@/lib/supabase';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

// Form schema
const formSchema = z.object({
  id: z.string().min(1, 'ID requis'),
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  telephone: z.string().optional(),
  telephone_2: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  adresse: z.string().optional(),
  contact: z.string().optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddEntreprise() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Generate entreprise ID
  const generateEntrepriseId = () => {
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `ENT-${randomNum}`;
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: generateEntrepriseId(),
      nom: '',
      telephone: '',
      telephone_2: '',
      email: '',
      adresse: '',
      contact: '',
      description: '',
    },
  });

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      // Prepare data for submission
      const entrepriseData = {
        id: values.id,
        nom: values.nom,
        telephone: values.telephone || null,
        telephone_2: values.telephone_2 || null,
        email: values.email || null,
        adresse: values.adresse || null,
        contact: values.contact || null,
        description: values.description || null,
      };

      // Call API to create entreprise
      const { error } = await api.createEntreprise(entrepriseData);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: 'Succès',
        description: 'L\'entreprise a été créée avec succès',
      });

      // Navigate back to entreprises list
      navigate('/entreprises');
    } catch (error) {
      console.error('Error creating entreprise:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la création de l\'entreprise',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Button
          variant="ghost"
          onClick={() => navigate('/entreprises')}
          className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors ring-offset-background hover:bg-gray-100 dark:hover:bg-gray-800"
        >
          <ArrowLeft className="h-4 w-4" />
          Retour à la liste
        </Button>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ajouter une entreprise</h1>
      </div>

      {/* Form Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 md:p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Informations de l'entreprise</h2>
          <p className="text-gray-600 dark:text-gray-400">Remplissez les informations pour créer une nouvelle entreprise</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
              {/* ID */}
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Entreprise</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="ID de l'entreprise"
                        className="bg-gray-50 dark:bg-gray-700"
                      />
                    </FormControl>
                    <FormDescription>
                      ID généré automatiquement (vous pouvez le modifier)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Nom */}
              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom de l'entreprise *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
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
                    <FormLabel>Personne de contact</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
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
                    <FormLabel>Téléphone (Vendeur B)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
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
                    <FormLabel>Téléphone 2 (Vendeur P)</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
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
                    <FormLabel>Email</FormLabel>
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

              {/* Adresse */}
              <FormField
                control={form.control}
                name="adresse"
                render={({ field }) => (
                  <FormItem className="col-span-1 md:col-span-2">
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
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
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
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
                    Créer l'entreprise
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
