import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, RefreshCw, Eye, Edit, Trash2, Users, X, Filter, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Client } from '@/types';
import { api } from '@/lib/supabase';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { Checkbox } from '@/components/ui/checkbox';

export function Clients() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Data state
  const [clients, setClients] = useState<Client[]>([]);
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [entreprises, setEntreprises] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [entrepriseFilter, setEntrepriseFilter] = useState('all');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Mobile state
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Bulk operations state
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);

  // Fetch clients data
  const fetchClients = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Fetch both clients and entreprises
      const [clientsResponse, entreprisesResponse] = await Promise.all([
        api.getClients(),
        api.getEntreprises()
      ]);

      const { data, error } = clientsResponse;

      // Set entreprises data
      if (entreprisesResponse.data) {
        setEntreprises(entreprisesResponse.data);
      }

      if (error) {
        console.error('Error fetching clients:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les clients',
          variant: 'destructive',
        });
        setClients([]);
        setAllClients([]);
        setTotalCount(0);
      } else if (data) {
        // Store all clients for filtering
        setAllClients(data);

        // Filter clients based on search term
        let filteredClients = data;
        if (debouncedSearchTerm) {
          filteredClients = filteredClients.filter(client =>
            client.nom.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            client.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            client.telephone?.includes(debouncedSearchTerm) ||
            client.entreprise?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          );
        }

        // City filter - ONLY use ville field from database
        if (cityFilter && cityFilter !== 'all') {
          filteredClients = filteredClients.filter(client => {
            if (cityFilter === 'sans_ville') {
              // Show clients without ville
              return !client.ville || client.ville.trim() === '' || client.ville.toLowerCase() === 'null';
            } else {
              // Only use the ville field, no fallback to address
              return client.ville?.toLowerCase() === cityFilter.toLowerCase();
            }
          });
        }

        // Entreprise filter
        if (entrepriseFilter && entrepriseFilter !== 'all') {
          filteredClients = filteredClients.filter(client => {
            if (entrepriseFilter === 'sans_entreprise') {
              // Show clients without entreprise
              return !client.entreprise || client.entreprise.trim() === '';
            } else {
              // Show clients with specific entreprise
              return client.entreprise?.toLowerCase() === entrepriseFilter.toLowerCase();
            }
          });
        }

        // Apply pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedClients = filteredClients.slice(startIndex, endIndex);

        setClients(paginatedClients);
        setTotalCount(filteredClients.length);
        setTotalPages(Math.ceil(filteredClients.length / itemsPerPage));
        setHasNextPage(endIndex < filteredClients.length);
        setHasPrevPage(currentPage > 1);
        // Clear selected clients when data changes
        setSelectedClientIds([]);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du chargement',
        variant: 'destructive',
      });
      setClients([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, debouncedSearchTerm, cityFilter, entrepriseFilter, itemsPerPage, toast]);

  // Show delete confirmation
  const showDeleteConfirmation = (client: Client) => {
    setClientToDelete(client);
    setShowDeleteDialog(true);
  };

  // Delete client
  const handleDelete = async () => {
    if (!clientToDelete) return;

    setDeleting(clientToDelete.id);
    try {
      const { error } = await api.deleteClient(clientToDelete.id);

      if (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer le client',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Succès',
          description: 'Client supprimé avec succès',
        });
        fetchClients(true);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
      setClientToDelete(null);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchClients(true);
  };

  // Reset filters function
  const resetFilters = () => {
    setSearchTerm('');
    setCityFilter('all');
    setEntrepriseFilter('all');
    setCurrentPage(1);
    setSelectedClientIds([]); // Clear selected clients when resetting filters
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || cityFilter !== 'all' || entrepriseFilter !== 'all';

  // Bulk operations functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClientIds(clients.map(c => c.id));
    } else {
      setSelectedClientIds([]);
    }
  };

  const handleSelectClient = (clientId: string, checked: boolean) => {
    if (checked) {
      setSelectedClientIds(prev => [...prev, clientId]);
    } else {
      setSelectedClientIds(prev => prev.filter(id => id !== clientId));
    }
  };

  const isAllSelected = clients.length > 0 && selectedClientIds.length === clients.length;
  const isIndeterminate = selectedClientIds.length > 0 && selectedClientIds.length < clients.length;

  const handleBulkDelete = () => {
    if (selectedClientIds.length === 0) return;
    setDeleteConfirmationOpen(true);
  };

  const confirmBulkDelete = async () => {
    try {
      const deletePromises = selectedClientIds.map(id => api.deleteClient(id));
      await Promise.allSettled(deletePromises);

      setSelectedClientIds([]);
      await fetchClients();
      setDeleteConfirmationOpen(false);
    } catch (error) {
      console.error('Error deleting clients:', error);
    }
  };



  // Get unique cities from all clients - ONLY use ville field from database
  const uniqueCities = Array.from(new Set(
    allClients
      .map(client => client.ville) // Only use the ville field
      .filter(Boolean) // Remove null/undefined/empty values
      .filter(city => city.trim() !== '') // Remove empty strings
      .filter(city => city.toLowerCase() !== 'null') // Remove 'NULL' values
      .map(city => city.trim()) // Clean whitespace
  )).sort();

  // Check if there are clients without ville
  const hasClientsWithoutVille = allClients.some(client =>
    !client.ville || client.ville.trim() === '' || client.ville.toLowerCase() === 'null'
  );

  // Check if there are clients without entreprise
  const hasClientsWithoutEntreprise = allClients.some(client =>
    !client.entreprise || client.entreprise.trim() === ''
  );

  // Get all entreprises from the entreprises table
  const allEntrepriseNames = entreprises.map(entreprise => entreprise.nom).sort();

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, cityFilter, entrepriseFilter]);

  // Auto-close filter sidebar on mobile when filters change
  useEffect(() => {
    if (isMobile && isFilterOpen) {
      setIsFilterOpen(false);
    }
  }, [searchTerm, cityFilter, entrepriseFilter, isMobile]);

  // Initial data fetch and when dependencies change
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Users className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
            Gestion des Clients
          </h1>
        </div>
        <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
          <Button
            className="bg-blue-600 hover:bg-blue-700 px-2 sm:px-4 py-1 sm:py-2 text-sm flex-1 sm:flex-none"
            onClick={() => navigate('/clients/nouveau')}
          >
            <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Nouveau Client
          </Button>
        </div>
      </div>

      {/* Filters */}
      {isMobile ? (
        <div className="space-y-3 w-full">
          {/* Row 1: Filtres + Actualiser */}
          <div className="flex items-center justify-between w-full gap-2">
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <button className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity">
                  <svg className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                  </svg>
                  <span className="font-medium text-gray-700 dark:text-gray-300">Filtres</span>
                  <PanelLeftOpen className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                  
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Filtres des Clients</SheetTitle>
                  <SheetDescription>
                    Filtrez les clients par ville et entreprise
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                      <SelectValue placeholder="Toutes les villes" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                      <SelectItem value="all" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Toutes les villes</SelectItem>
                      {hasClientsWithoutVille && (
                        <SelectItem value="sans_ville" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">
                          <span className="text-orange-600 dark:text-orange-400">Sans ville</span>
                        </SelectItem>
                      )}
                      {uniqueCities.map((city) => (
                        <SelectItem key={city} value={city} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={entrepriseFilter} onValueChange={setEntrepriseFilter}>
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                      <SelectValue placeholder="Toutes les entreprises" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                      <SelectItem value="all" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Toutes les entreprises</SelectItem>
                      {hasClientsWithoutEntreprise && (
                        <SelectItem value="sans_entreprise" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">
                          <span className="text-orange-600 dark:text-orange-400">Sans entreprise</span>
                        </SelectItem>
                      )}
                      {allEntrepriseNames.map((entreprise) => (
                        <SelectItem key={entreprise} value={entreprise} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">
                          {entreprise}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {hasActiveFilters && (
                    <Button
                      variant="outline"
                      onClick={resetFilters}
                      className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                    >
                      <X className="mr-2 h-4 w-4" />
                      Réinitialiser
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 px-2 py-1 text-xs h-9 inline-flex items-center gap-2"
            >
              {refreshing ? (
                <RefreshCw className="h-3 w-3 animate-spin" />
              ) : (
                <RefreshCw className="h-3 w-3" />
              )}
              Actualiser
            </Button>
          </div>
          {/* Row 2: Search */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
              </svg>
              <span className="font-medium text-gray-700 dark:text-gray-300">Filtres</span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={handleRefresh}
                disabled={refreshing}
                className="text-sm"
              >
                {refreshing ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Actualiser
              </Button>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={resetFilters}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <X className="mr-2 h-4 w-4" />
                  Réinitialiser
                </Button>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </div>
            <Select value={cityFilter} onValueChange={setCityFilter}>
              <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                <SelectValue placeholder="Toutes les villes" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                <SelectItem value="all" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Toutes les villes</SelectItem>
                {hasClientsWithoutVille && (
                  <SelectItem value="sans_ville" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">
                    <span className="text-orange-600 dark:text-orange-400">Sans ville</span>
                  </SelectItem>
                )}
                {uniqueCities.map((city) => (
                  <SelectItem key={city} value={city} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">
                    {city}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={entrepriseFilter} onValueChange={setEntrepriseFilter}>
              <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                <SelectValue placeholder="Toutes les entreprises" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                <SelectItem value="all" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Toutes les entreprises</SelectItem>
                {hasClientsWithoutEntreprise && (
                  <SelectItem value="sans_entreprise" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">
                    <span className="text-orange-600 dark:text-orange-400">Sans entreprise</span>
                  </SelectItem>
                )}
                {allEntrepriseNames.map((entreprise) => (
                  <SelectItem key={entreprise} value={entreprise} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">
                    {entreprise}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Liste des Clients */}
      <div className="space-y-3">
        <div className="space-y-3 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 gap-3">
            <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Liste des Clients</h2>
            <div className="flex justify-between items-center sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Afficher</span>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-16 h-8 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                  <SelectValue placeholder={itemsPerPage.toString()} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectItem value="5" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">5</SelectItem>
                  <SelectItem value="10" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">10</SelectItem>
                  <SelectItem value="25" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">25</SelectItem>
                  <SelectItem value="50" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">entrées</span>
            </div>
            <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">Total: {totalCount} clients</span>
            </div>
          </div>
        </div>
        {/* Bulk Operations Bar */}
        {selectedClientIds.length > 0 && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  <span className="font-medium text-blue-900 dark:text-blue-100">
                    {selectedClientIds.length} client{selectedClientIds.length > 1 ? 's' : ''} sélectionné{selectedClientIds.length > 1 ? 's' : ''}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedClientIds([])}
                  className="text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-700 hover:bg-blue-100 dark:hover:bg-blue-900/40"
                >
                  <X className="h-4 w-4 mr-2" />
                  Désélectionner
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleBulkDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* <div className="w-full"> */}
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-200 dark:bg-gray-800">
                  <TableHead className="w-12">
                    <Checkbox
                      checked={isAllSelected}
                      ref={(el) => {
                        if (el) el.indeterminate = isIndeterminate;
                      }}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead className="font-medium">Nom</TableHead>
                  <TableHead className="font-medium">Contact</TableHead>
                  <TableHead className="font-medium">Adresse</TableHead>
                  <TableHead className="font-medium">Entreprise</TableHead>
                  <TableHead className="font-medium">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, index) => (
                        <TableRow key={index} className="border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-transparent">
                          <TableCell colSpan={6}>
                            <div className="flex items-center space-x-4">
                              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-1"></div>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : clients.length === 0 ? (
                      <TableRow className="border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-transparent">
                        <TableCell colSpan={6} className="text-center py-8">
                          <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                            <Users className="h-12 w-12 mb-4 text-gray-300 dark:text-gray-600" />
                            <p className="text-lg font-medium mb-2">Aucun client trouvé</p>
                            <p className="text-sm">
                              {hasActiveFilters
                                ? 'Aucun client ne correspond aux filtres sélectionnés'
                                : 'Commencez par ajouter votre premier client'
                              }
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    ) : (
                      clients.map((client) => (
                        <TableRow key={client.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-transparent">
                          <TableCell>
                            <Checkbox
                              checked={selectedClientIds.includes(client.id)}
                              onCheckedChange={(checked) => handleSelectClient(client.id, checked as boolean)}
                            />
                          </TableCell>
                          <TableCell>
                            <div className="font-medium">{client.nom}</div>
                          </TableCell>
                          <TableCell>
                            <div>
                              {client.telephone && (
                                <div className="text-sm text-gray-500">{client.telephone}</div>
                              )}
                              {client.email && (
                                <div className="text-sm text-gray-500">{client.email}</div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {client.adresse || '-'}
                          </TableCell>
                          <TableCell>
                            {client.entreprise ? (
                              <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                {client.entreprise}
                              </Badge>
                            ) : (
                              '-'
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => navigate(`/clients/${client.id}`)}
                              >
                                Voir
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => showDeleteConfirmation(client)}
                                disabled={deleting === client.id}
                                className="text-red-600 hover:text-red-700"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
              </TableBody>
            </Table>
            </div>
          {/* </div> */}
        </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
          onPageChange={setCurrentPage}
          loading={loading}
          totalItems={totalCount}
          itemsPerPage={itemsPerPage}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Supprimer le client"
        description={`Êtes-vous sûr de vouloir supprimer le client "${clientToDelete?.nom}" ? \n\nCette action supprimera :\n• Le client et tous ses colis\n• L'historique complet de tous les colis du client\n\nCette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
        onConfirm={handleDelete}
      />
      {/* Bulk Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={deleteConfirmationOpen}
        onOpenChange={setDeleteConfirmationOpen}
        title="Supprimer les clients sélectionnés"
        description={`Êtes-vous sûr de vouloir supprimer ${selectedClientIds.length} client${selectedClientIds.length > 1 ? 's' : ''} ? \n\nCette action supprimera :\n• Les clients sélectionnés et tous leurs colis\n• L'historique complet de tous les colis des clients\n\nCette action est irréversible.`}
        confirmText="Supprimer tout"
        cancelText="Annuler"
        variant="destructive"
        onConfirm={confirmBulkDelete}
      />    </div>
  );
}
