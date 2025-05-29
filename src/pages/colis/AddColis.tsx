import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Search, Save, Check, ChevronDown, ChevronsUpDown, X } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { api } from '@/lib/supabase';
import { Client, Entreprise, Statut, User } from '@/types';
import { z } from 'zod';
import { useToast } from '@/components/ui/use-toast';

// Form schema
const formSchema = z.object({
  id: z.string(), // This is the ref_colis (the ID of the colis)
  statut: z.string({ required_error: 'Le statut est requis' }),
  client_id: z.string({ required_error: 'Le client est requis' }),
  entreprise_id: z.string().optional(),
  livreur_id: z.string().optional(),
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

export function AddColis() {
  const navigate = useNavigate();
  const { toast } = useToast();  type PartialStatut = Pick<Statut, 'id' | 'nom' | 'type' | 'couleur' | 'ordre' | 'actif'>;

  const [clients, setClients] = useState<Client[]>([]);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [livreurs, setLivreurs] = useState<User[]>([]);
  const [statuses, setStatuses] = useState<PartialStatut[]>([]);
  const [dataLoaded, setDataLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [showClientModal, setShowClientModal] = useState(false);
  const [clientModalLoading, setClientModalLoading] = useState(false);
  const [openClientCombobox, setOpenClientCombobox] = useState(false);
  const [clientSearchValue, setClientSearchValue] = useState('');
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
      id: 'COL-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 10000),
      statut: 'En cours',
      client_id: '',
      entreprise_id: undefined,
      livreur_id: undefined,
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

  // Fetch data for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🚀 Starting to fetch data...');
        // Try both approaches to see which works
        const [clientsRes, entreprisesRes, allUsersRes, livreursRes, statusesRes] = await Promise.all([
          api.getClients(),
          api.getEntreprises(),
          api.getUsers(), // Get all users
          api.getLivreurs(), // Get filtered livreurs
          api.getStatuts('colis'), // Filter by type 'colis'
        ]);
        console.log('✅ All API calls completed');

        // Handle clients data with proper error checking
        console.log('📋 Clients response:', clientsRes);
        if (clientsRes.data && Array.isArray(clientsRes.data)) {
          console.log('✅ Setting clients:', clientsRes.data.length, 'clients found');
          setClients(clientsRes.data);
        } else {
          console.log('❌ Clients data issue:', clientsRes.error || 'Data is not an array');
          setClients([]);
        }

        // Handle entreprises data with proper error checking
        console.log('🏢 Entreprises response:', entreprisesRes);
        if (entreprisesRes.data && Array.isArray(entreprisesRes.data)) {
          console.log('✅ Setting entreprises:', entreprisesRes.data.length, 'entreprises found');
          setEntreprises(entreprisesRes.data);
        } else {
          console.log('❌ Entreprises data issue:', entreprisesRes.error || 'Data is not an array');
          setEntreprises([]);
        }

        // Debug both approaches
        console.log('=== LIVREURS DEBUG ===');
        console.log('📊 All users approach:');
        if (allUsersRes.data) {
          const livreursFromAllUsers = allUsersRes.data.filter(user => user.role === 'livreur');
          console.log('- All users count:', allUsersRes.data.length);
          console.log('- Users with role=livreur:', livreursFromAllUsers.length);
          console.log('- Livreurs from all users:', livreursFromAllUsers);
        } else {
          console.log('- All users error:', allUsersRes.error);
        }

        console.log('🎯 Direct livreurs approach:');
        if (livreursRes.data) {
          console.log('- Direct livreurs count:', livreursRes.data.length);
          console.log('- Direct livreurs:', livreursRes.data);
          setLivreurs(livreursRes.data);
        } else {
          console.log('- Direct livreurs error:', livreursRes.error);
          // Fallback to filtering all users
          if (allUsersRes.data) {
            const livreursFromAllUsers = allUsersRes.data.filter(user => user.role === 'livreur');
            console.log('- Using fallback, found:', livreursFromAllUsers.length, 'livreurs');
            setLivreurs(livreursFromAllUsers);
          } else {
            setLivreurs([]);
          }
        }
        console.log('=== END DEBUG ===');
        if (statusesRes.data) setStatuses(statusesRes.data);

        // Mark data as loaded
        setDataLoaded(true);
        console.log('✅ Data loading completed');
      } catch (error) {
        console.error('Error fetching data:', error);
        setDataLoaded(true); // Still mark as loaded even on error
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les données',
          variant: 'destructive',
        });
      }
    };

    fetchData();
  }, [toast]);

  // Client creation handler
  const onCreateClient = async (values: ClientFormValues) => {
    console.log('👤 Client creation started with values:', values);
    setClientModalLoading(true);
    try {
      const { data: newClient, error } = await api.createClient(values);

      if (error) {
        throw new Error(error.message);
      }

      if (newClient) {
        // Add new client to the list
        setClients(prev => [newClient, ...prev]);

        // Select the new client
        form.setValue('client_id', newClient.id);
        setSelectedClient(newClient);
        setOpenClientCombobox(false);

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
          description: 'Le client a été créé avec succès',
        });
      }
    } catch (error) {
      console.error('Error creating client:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer le client',
        variant: 'destructive',
      });
    } finally {
      setClientModalLoading(false);
    }
  };

  // Form submission handler
  const onSubmit = async (values: FormValues) => {
    console.log('🚀 Colis form submission started with values:', values);
    setLoading(true);
    try {
      // Validate required fields
      if (!values.client_id) {
        throw new Error('Veuillez sélectionner un client');
      }

      // Prepare data for submission
      const colisData = {
        id: values.id, // This is the ref_colis
        statut: values.statut,
        client_id: values.client_id,
        entreprise_id: values.entreprise_id === 'none' ? null : values.entreprise_id || null,
        livreur_id: values.livreur_id === 'none' ? null : values.livreur_id || null,
        prix: values.prix || 0,
        frais: values.frais || 0,
        notes: values.notes || '',
      };

      console.log('📦 Creating colis with data:', colisData);
      // Call API to create colis
      const { error: createError } = await api.createColis(colisData);

      if (createError) {
        throw new Error(createError.message);
      }

      toast({
        title: 'Succès',
        description: 'Le colis a été créé avec succès',
      });

      // Navigate back to colis list
      navigate('/colis');
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          onClick={() => navigate('/colis')}
          className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 rounded-md"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-gray-700 dark:text-gray-300">Retour à la liste</span>
        </Button>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Nouveau Colis</h1>

      {/* Form Card */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Informations du colis</h2>
          <p className="text-gray-600 dark:text-gray-400">Remplissez les informations pour créer un nouveau colis</p>
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
                      Référence générée automatiquement (modifiable)
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
                          : Array.isArray(statuses) && statuses.length > 0
                            ? `(${statuses.length} disponibles)`
                            : '(0 trouvés)'
                      }
                    </FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                          <SelectValue placeholder={
                            !dataLoaded
                              ? "Chargement des statuts..."
                              : "En cours"
                          } />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                        {!dataLoaded ? (
                          <SelectItem value="loading" disabled className="text-gray-900 dark:text-white">
                            Chargement des statuts...
                          </SelectItem>
                        ) : Array.isArray(statuses) && statuses.length > 0 ? (
                          statuses.map((status) => (
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
                    className="flex items-center gap-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 px-3 py-1 h-8 text-sm"
                    onClick={() => setShowClientModal(true)}
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
                                        filteredClients.map((client, index) => (
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
                                                <div className="font-medium text-gray-900 dark:text-white">{client.nom} {client.prenom}</div>
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
                                      <div className="p-2 border-t border-gray-200 dark:border-gray-600">
                                        <button
                                          onClick={() => {
                                            setOpenClientCombobox(false);
                                            setShowClientModal(true);
                                          }}
                                          className="inline-flex items-center justify-center gap-2 whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-900 dark:text-white h-9 rounded-md px-3 w-full"
                                          type="button"
                                        >
                                          <Plus className="h-4 w-4 mr-2" />
                                          Ajouter un nouveau client
                                        </button>
                                      </div>
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
                  <FormLabel className="text-sm font-medium text-gray-900 dark:text-white">Notes (optionnel - fonctionnalité future)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Informations supplémentaires sur le colis..."
                      className="resize-none bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-sm text-blue-600 dark:text-blue-400">
                    Note: Cette fonctionnalité sera disponible dans une future mise à jour.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Action Buttons */}
            <div className="flex justify-between pt-6">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/colis')}
                disabled={loading}
                className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Annuler
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 text-white"
              >
                {loading ? (
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
            <form onSubmit={clientForm.handleSubmit(onCreateClient)} className="space-y-4">
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
