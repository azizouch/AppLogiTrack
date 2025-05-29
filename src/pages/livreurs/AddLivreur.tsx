import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Truck } from 'lucide-react';
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
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

// Form schema
const formSchema = z.object({
  nom: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  prenom: z.string().min(2, 'Le prénom doit contenir au moins 2 caractères'),
  email: z.string().email('Email invalide'),
  telephone: z.string().optional(),
  adre: z.string().optional(),
  ville: z.string().optional(),
  vehicule: z.string().optional(),
  zone: z.string().optional(),
  statut: z.enum(['actif', 'inactif', 'suspendu'], {
    required_error: 'Le statut est requis',
  }),
});

type FormValues = z.infer<typeof formSchema>;

export function AddLivreur() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      adre: '',
      ville: '',
      vehicule: '',
      zone: '',
      statut: 'actif',
    },
  });

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    try {
      // Prepare data for submission
      const livreurData = {
        nom: values.nom,
        prenom: values.prenom,
        email: values.email,
        telephone: values.telephone || null,
        adre: values.adre || null,
        ville: values.ville || null,
        vehicule: values.vehicule || null,
        zone: values.zone || null,
        role: 'livreur' as const,
        statut: values.statut,
        mot_de_passe: '', // Will be set by auth system
      };

      // Call API to create livreur
      const { error } = await api.createUser(livreurData);

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: 'Succès',
        description: 'Le livreur a été créé avec succès',
      });

      // Navigate back to livreurs list
      navigate('/livreurs');
    } catch (error) {
      console.error('Error creating livreur:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la création du livreur',
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
          onClick={() => navigate('/livreurs')}
          className="p-2"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ajouter un livreur</h1>
          <p className="text-gray-600 dark:text-gray-400">Créer un nouveau livreur</p>
        </div>
      </div>

      <Card className="bg-white dark:bg-gray-800 shadow-sm border-0">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-green-600" />
            Informations du livreur
          </CardTitle>
          <CardDescription>
            Remplissez les informations pour créer un nouveau livreur
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
                    <FormLabel className="text-base font-semibold">Nom *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white dark:bg-gray-700"
                        placeholder="Nom du livreur"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Prénom */}
              <FormField
                control={form.control}
                name="prenom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Prénom *</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white dark:bg-gray-700"
                        placeholder="Prénom du livreur"
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
                    <FormLabel className="text-base font-semibold">Email *</FormLabel>
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

              {/* Zone */}
              <FormField
                control={form.control}
                name="zone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Zone de livraison</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white dark:bg-gray-700"
                        placeholder="Zone de livraison assignée"
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
                    <FormLabel className="text-base font-semibold">Véhicule</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white dark:bg-gray-700"
                        placeholder="Type de véhicule"
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
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Adresse</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white dark:bg-gray-700"
                        placeholder="Adresse complète"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Ville */}
              <FormField
                control={form.control}
                name="ville"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-base font-semibold">Ville</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white dark:bg-gray-700"
                        placeholder="Ville"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Statut */}
              <FormField
                control={form.control}
                name="statut"
                render={({ field }) => (
                  <FormItem className="md:col-span-2">
                    <FormLabel className="text-base font-semibold">Statut *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-gray-700">
                          <SelectValue placeholder="Sélectionner le statut" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="actif">Actif</SelectItem>
                        <SelectItem value="inactif">Inactif</SelectItem>
                        <SelectItem value="suspendu">Suspendu</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      Statut du livreur dans le système
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
                onClick={() => navigate('/livreurs')}
                disabled={loading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-green-600 hover:bg-green-700"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Création...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Créer le livreur
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
