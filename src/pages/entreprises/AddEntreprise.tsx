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
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  telephone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  adre: z.string().optional(),
  contact: z.string().optional(),
  description: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

export function AddEntreprise() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom: '',
      telephone: '',
      email: '',
      adre: '',
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
        nom: values.nom,
        telephone: values.telephone || null,
        email: values.email || null,
        adre: values.adre || null,
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
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => navigate('/entreprises')}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ajouter une entreprise</h1>
          <p className="text-gray-600 dark:text-gray-400">Créer une nouvelle entreprise partenaire</p>
        </div>
      </div>

      <Card className="bg-white dark:bg-gray-800 shadow-sm border-0">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-purple-600" />
            Informations de l'entreprise
          </CardTitle>
          <CardDescription>
            Remplissez les informations pour créer une nouvelle entreprise
          </CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <FormLabel className="text-base font-semibold">Téléphone</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white dark:bg-gray-700"
                        placeholder="Numéro de téléphone"
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
                name="adre"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
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
                  <FormItem className="md:col-span-2">
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
            </CardContent>
            <CardFooter className="flex justify-end gap-4 pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/entreprises')}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-purple-600 hover:bg-purple-700"
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
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
}
