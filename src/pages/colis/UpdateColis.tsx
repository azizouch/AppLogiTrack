import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Save, ArrowLeft, Search, ChevronDown, X, Plus } from 'lucide-react';
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
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
  id: z.string(), // This is the ref_colis (the ID of the colis)
  client_id: z.string({ required_error: 'Le client est requis' }),
  entreprise_id: z.string().optional(),
  livreur_id: z.string().optional(),
  statut: z.string({ required_error: 'Le statut est requis' }),
  prix: z.coerce.number().min(0, 'Le prix doit être positif').optional(),
  frais: z.coerce.number().min(0, 'Les frais doivent être positifs').optional(),
  notes: z.string().optional(),
});

// Client form schema
const clientFormSchema = z.object({
  id: z.string().min(1, 'L\'ID client est requis'),
  nom: z.string().min(1, 'Le nom est requis'),
  telephone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  adresse: z.string().optional(),
  ville: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;
type ClientFormValues = z.infer<typeof clientFormSchema>;

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
  const [dataLoaded, setDataLoaded] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [openClientCombobox, setOpenClientCombobox] = useState(false);
  const [clientSearchValue, setClientSearchValue] = useState('');
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientModalLoading, setClientModalLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenClientCombobox(false);
      }
    };

    if (openClientCombobox) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openClientCombobox]);

  // Initialize form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      id: '',
      client_id: '',
      entreprise_id: undefined,
      livreur_id: undefined,
      statut: '',
      prix: undefined,
      frais: undefined,
      notes: '',
    },
  });

  // Initialize client form
  const clientForm = useForm<ClientFormValues>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      id: 'CLI-' + Math.floor(Math.random() * 1000),
      nom: '',
      telephone: '',
      email: '',
      adresse: '',
      ville: '',
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

        // Find and set selected client
        if (colisData.client_id && clientsRes.data) {
          const client = clientsRes.data.find(c => c.id === colisData.client_id);
          if (client) {
            setSelectedClient(client);
          }
        }

        // Set form values
        form.reset({
          id: colisData.id,
          client_id: colisData.client_id,
          entreprise_id: colisData.entreprise_id || undefined,
          livreur_id: colisData.livreur_id || undefined,
          statut: colisData.statut,
          prix: colisData.prix,
          frais: colisData.frais,
          notes: colisData.notes || '',
        });

        // Mark data as loaded
        setDataLoaded(true);
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
        id: values.id, // This is the ref_colis
        client_id: values.client_id,
        entreprise_id: values.entreprise_id === 'none' ? null : values.entreprise_id || null,
        livreur_id: values.livreur_id === 'none' ? null : values.livreur_id || null,
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

  // Handle client creation
  const onClientSubmit = async (values: ClientFormValues) => {
    try {
      setClientModalLoading(true);

      const { data, error } = await api.createClient(values);

      if (error) {
        toast({
          title: 'Erreur',
          description: error.message || 'Erreur lors de la création du client',
          variant: 'destructive',
        });
        return;
      }

      if (data) {
        // Add new client to the list
        setClients(prev => [...prev, data]);

        // Select the new client
        form.setValue('client_id', data.id);
        setSelectedClient(data);

        // Close modal and reset form
        setShowClientModal(false);
        clientForm.reset({
          id: 'CLI-' + Math.floor(Math.random() * 1000),
          nom: '',
          telephone: '',
          email: '',
          adresse: '',
          ville: '',
        });

        toast({
          title: 'Succès',
          description: 'Client créé et sélectionné avec succès',
        });
      }
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: 'Erreur',
        description: 'Erreur lors de la création du client',
        variant: 'destructive',
      });
    } finally {
      setClientModalLoading(false);
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
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          onClick={() => navigate(`/colis/${id}`)}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-md"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-gray-700 dark:text-gray-300">Retour aux détails</span>
        </Button>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Modifier le Colis</h1>

      {/* Form Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Informations du colis</h2>
          <p className="text-gray-600 dark:text-gray-400">Modifiez les informations du colis #{id}</p>
        </div>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* First Row - Ref Colis and Status */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Ref Colis */}
              <FormField
                control={form.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">
                      Ref Colis <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        placeholder="COL-2024-XXXX"
                      />
                    </FormControl>
                    <FormDescription className="text-sm text-blue-600 dark:text-blue-400">
                      Référence du colis (modifiable)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={form.control}
                name="statut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">
                      Statut <span className="text-red-500">*</span> {
                        !dataLoaded
                          ? '(Chargement...)'
                          : Array.isArray(statuts) && statuts.length > 0
                            ? `(${statuts.length} disponibles)`
                            : '(0 trouvés)'
                      }
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                          <SelectValue placeholder={
                            !dataLoaded
                              ? "Chargement des statuts..."
                              : "Sélectionner un statut"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                        {!dataLoaded ? (
                          <SelectItem value="loading" disabled className="text-gray-900 dark:text-white">
                            Chargement des statuts...
                          </SelectItem>
                        ) : Array.isArray(statuts) && statuts.length > 0 ? (
                          statuts.map((status) => (
                            <SelectItem key={status.id} value={status.nom} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                              {status.nom}
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-statuses" disabled className="text-gray-900 dark:text-white">
                            Aucun statut trouvé
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Second Row - Prix and Frais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Prix */}
              <FormField
                control={form.control}
                name="prix"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">Prix (DH)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-sm text-gray-500 dark:text-gray-400">
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
                    <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">Frais de livraison (DH)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0"
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription className="text-sm text-gray-500 dark:text-gray-400">
                      Frais supplémentaires de livraison
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Third Row - Client and Entreprise */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Client Selection with Search */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">
                    Client <span className="text-red-500">*</span>
                  </FormLabel>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowClientModal(true)}
                    className="flex items-center gap-1 h-8 px-3 text-xs border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Plus className="h-3 w-3" />
                    Nouveau Client
                  </Button>
                </div>
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <div className="relative" ref={dropdownRef}>
                        {/* Main Input Container */}
                        <div
                          className={`relative w-full h-10 rounded-md border bg-white dark:bg-gray-700 px-3 py-2 text-sm flex items-center justify-between transition-colors ${
                            openClientCombobox
                              ? 'border-blue-500 border-2'
                              : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
                          }`}
                          onClick={() => {
                            if (selectedClient && !clientSearchValue) {
                              // If client is selected, clear it to allow searching
                              setClientSearchValue('');
                              setOpenClientCombobox(true);
                            }
                            inputRef.current?.focus();
                          }}
                        >
                          <div className="flex-1 flex items-center">
                            <Search className="h-4 w-4 text-gray-400 dark:text-gray-500 mr-2 flex-shrink-0" />
                            {selectedClient && !clientSearchValue ? (
                              // Show selected client
                              <div className="flex-1 text-sm text-gray-900 dark:text-white font-medium">
                                {selectedClient.nom}
                              </div>
                            ) : (
                              // Show search input
                              <input
                                ref={inputRef}
                                type="text"
                                className="w-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 p-0 text-sm text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
                                placeholder="Rechercher un client..."
                                value={clientSearchValue}
                                onChange={(e) => {
                                  setClientSearchValue(e.target.value);
                                  // Only open dropdown when user types (not on focus)
                                  if (e.target.value.length > 0) {
                                    setOpenClientCombobox(true);
                                  }
                                }}
                                onFocus={() => {
                                  // Don't automatically open dropdown on focus
                                  // Only open if there's already text or if user starts typing
                                }}
                              />
                            )}
                          </div>
                          <div className="flex items-center">
                            {/* Clear button - shows when there's text in input */}
                            {clientSearchValue && (
                              <X
                                className="h-4 w-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 cursor-pointer mr-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setClientSearchValue('');
                                  setOpenClientCombobox(false);
                                  inputRef.current?.focus();
                                }}
                              />
                            )}
                            {/* Clear button for selected client - shows when client is selected */}
                            {selectedClient && !clientSearchValue && (
                              <X
                                className="h-4 w-4 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 cursor-pointer mr-1"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  field.onChange('');
                                  setSelectedClient(null);
                                  setClientSearchValue('');
                                  setOpenClientCombobox(false);
                                  inputRef.current?.focus();
                                }}
                              />
                            )}
                            <ChevronDown
                              className={`h-4 w-4 transition-transform cursor-pointer text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400 ${
                                openClientCombobox ? 'rotate-180' : ''
                              }`}
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenClientCombobox(!openClientCombobox);
                                if (!openClientCombobox) {
                                  inputRef.current?.focus();
                                }
                              }}
                            />
                          </div>
                        </div>

                        {/* Hidden input for form */}
                        <input type="hidden" {...field} value={field.value || ''} />

                        {/* Dropdown */}
                        {openClientCombobox && (
                          <div className="absolute top-full left-0 right-0 z-50 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-md shadow-lg max-h-64 overflow-auto">
                            {!dataLoaded ? (
                              <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                Chargement des clients...
                              </div>
                            ) : (
                              <>
                                {(() => {
                                  const filteredClients = Array.isArray(clients) ? clients.filter(client =>
                                    client.nom.toLowerCase().includes(clientSearchValue.toLowerCase()) ||
                                    (client.telephone && client.telephone.includes(clientSearchValue))
                                  ) : [];

                                  return (
                                    <>
                                      {filteredClients.length > 0 ? (
                                        filteredClients.map((client) => (
                                          <div
                                            key={client.id}
                                            onClick={() => {
                                              field.onChange(client.id);
                                              setSelectedClient(client);
                                              setClientSearchValue('');
                                              setOpenClientCombobox(false);
                                            }}
                                            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer"
                                          >
                                            <div className="flex items-center">
                                              <div className="flex-1">
                                                <div className="font-medium text-gray-900 dark:text-white">{client.nom}</div>
                                                <div className="text-xs text-gray-500 dark:text-gray-400">{client.telephone}</div>
                                              </div>
                                            </div>
                                          </div>
                                        ))
                                      ) : (
                                        <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                                          Aucun client trouvé
                                        </div>
                                      )}
                                    </>
                                  );
                                })()}
                              </>
                            )}
                          </div>
                        )}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Entreprise Selection */}
              <FormField
                control={form.control}
                name="entreprise_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">
                      Entreprise (optionnel) {
                        !dataLoaded
                          ? '(Chargement...)'
                          : Array.isArray(entreprises) && entreprises.length > 0
                            ? `(${entreprises.length} disponibles)`
                            : '(0 trouvées)'
                      }
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                          <SelectValue placeholder={
                            !dataLoaded
                              ? "Chargement des entreprises..."
                              : "Aucune"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                        {!dataLoaded ? (
                          <SelectItem value="loading" disabled className="text-gray-900 dark:text-white">
                            Chargement des entreprises...
                          </SelectItem>
                        ) : Array.isArray(entreprises) && entreprises.length > 0 ? (
                          <>
                            <SelectItem value="none" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                              Aucun
                            </SelectItem>
                            {entreprises.map((entreprise) => (
                              <SelectItem key={entreprise.id} value={entreprise.id} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                                {entreprise.nom}
                              </SelectItem>
                            ))}
                          </>
                        ) : (
                          <SelectItem value="no-entreprises" disabled className="text-gray-900 dark:text-white">
                            Aucune entreprise trouvée
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Fourth Row - Livreur */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="livreur_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">
                      Livreur (optionnel) {
                        !dataLoaded
                          ? '(Chargement...)'
                          : Array.isArray(livreurs) && livreurs.length > 0
                            ? `(${livreurs.length} disponibles)`
                            : '(0 trouvés)'
                      }
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || undefined}>
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                          <SelectValue placeholder={
                            !dataLoaded
                              ? "Chargement des livreurs..."
                              : !Array.isArray(livreurs) || livreurs.length === 0
                                ? "Aucun livreur disponible"
                                : "Aucun"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                        {!dataLoaded ? (
                          <SelectItem value="loading" disabled className="text-gray-900 dark:text-white">
                            Chargement des livreurs...
                          </SelectItem>
                        ) : Array.isArray(livreurs) && livreurs.length > 0 ? (
                          <>
                            <SelectItem value="none" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                              Aucun
                            </SelectItem>
                            {livreurs.map((livreur) => (
                              <SelectItem key={livreur.id} value={livreur.id} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                                {`${livreur.prenom || ''} ${livreur.nom}`.trim()}
                              </SelectItem>
                            ))}
                          </>
                        ) : (
                          <SelectItem value="no-livreurs" disabled className="text-gray-900 dark:text-white">
                            Aucun livreur trouvé
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                    {dataLoaded && (!Array.isArray(livreurs) || livreurs.length === 0) && (
                      <FormDescription className="text-sm text-orange-600 dark:text-orange-400">
                        Aucun livreur actif trouvé. Vérifiez la base de données.
                      </FormDescription>
                    )}
                  </FormItem>
                )}
              />
            </div>

            {/* Notes Section */}
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">Notes (optionnel)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informations supplémentaires sur le colis..."
                      className="resize-none bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />



            {/* Action Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(`/colis/${id}`)}
                disabled={saving}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={saving}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
              >
                {saving ? (
                  'Enregistrement...'
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer
                  </>
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Client Creation Modal */}
      <Dialog open={showClientModal} onOpenChange={setShowClientModal}>
        <DialogContent className="sm:max-w-[500px] bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <DialogHeader>
            <DialogTitle className="text-gray-900 dark:text-white">Nouveau Client</DialogTitle>
          </DialogHeader>
          <Form {...clientForm}>
            <form onSubmit={clientForm.handleSubmit(onClientSubmit)} className="space-y-4">
              {/* Client ID */}
              <FormField
                control={clientForm.control}
                name="id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">
                      ID Client <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                        placeholder="CLI-XXXX"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Client Name */}
              <FormField
                control={clientForm.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">
                      Nom <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                        placeholder="Nom du client"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Phone and Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={clientForm.control}
                  name="telephone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">Téléphone</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                          placeholder="0X XX XX XX XX"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={clientForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">Email</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="email"
                          className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                          placeholder="client@example.com"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Address and City */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={clientForm.control}
                  name="adresse"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">Adresse</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                          placeholder="Adresse du client"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={clientForm.control}
                  name="ville"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">Ville</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white"
                          placeholder="Ville du client"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setShowClientModal(false)}
                  disabled={clientModalLoading}
                  className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300"
                >
                  Annuler
                </Button>
                <Button
                  type="submit"
                  disabled={clientModalLoading}
                  className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
                >
                  {clientModalLoading ? (
                    'Création...'
                  ) : (
                    <>
                      <Plus className="w-4 h-4 mr-2" />
                      Créer Client
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
