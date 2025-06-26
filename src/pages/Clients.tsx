import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, RefreshCw, Eye, Edit, Trash2, Users, X } from 'lucide-react';
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
import { Client } from '@/types';
import { api } from '@/lib/supabase';
import { useDebounce } from '@/hooks/useDebounce';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export function Clients() {
  const navigate = useNavigate();
  const { toast } = useToast();

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

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || cityFilter !== 'all' || entrepriseFilter !== 'all';



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

  // Initial data fetch and when dependencies change
  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Users className="h-6 w-6 sm:h-7 sm:w-7 text-blue-600 dark:text-blue-400" />
            Gestion des Clients
          </h1>
        </div>
        <Button
          className="bg-blue-600 hover:bg-blue-700"
          onClick={() => navigate('/clients/nouveau')}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nouveau Client
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            <span className="font-medium text-gray-700 dark:text-gray-300">Filtres</span>
          </div>
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

      {/* Liste des Clients */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
          <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white">Liste des Clients</h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
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
        <div className="overflow-x-auto w-full">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-200 dark:border-gray-600" style={{ backgroundColor: 'hsl(210, 40%, 96.1%)' }}>
                <TableHead className="font-semibold text-gray-900 w-1/5 min-w-[80px]">Nom</TableHead>
                <TableHead className="font-semibold text-gray-900 w-1/4 min-w-[100px]">Contact</TableHead>
                <TableHead className="font-semibold text-gray-900 w-1/4 min-w-[100px]">Adresse</TableHead>
                <TableHead className="font-semibold text-gray-900 w-1/5 min-w-[80px]">Entreprise</TableHead>
                <TableHead className="font-semibold text-right text-gray-900 w-[80px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
                  {loading ? (
                    Array.from({ length: 5 }).map((_, index) => (
                      <TableRow key={index} className="border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-transparent">
                        <TableCell colSpan={5}>
                          <div className="flex items-center space-x-4">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-1"></div>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : clients.length === 0 ? (
                    <TableRow className="border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-transparent">
                      <TableCell colSpan={5} className="text-center py-8">
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
                        <TableCell className="max-w-0">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center flex-shrink-0">
                              <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="font-medium text-gray-900 dark:text-white truncate">
                              {client.nom}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-0">
                          <div className="space-y-1">
                            {client.telephone && (
                              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                                </svg>
                                <span className="truncate">{client.telephone}</span>
                              </div>
                            )}
                            {client.email && (
                              <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                                <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                  <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                                  <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                                </svg>
                                <span className="truncate">{client.email}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                            </svg>
                            {client.adresse || '-'}
                          </div>
                        </TableCell>
                        <TableCell>
                          {client.entreprise ? (
                            <Badge variant="secondary" className="bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                              {client.entreprise}
                            </Badge>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/clients/${client.id}`)}
                              className="h-8 px-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors"
                            >
                              Détails
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => showDeleteConfirmation(client)}
                              disabled={deleting === client.id}
                              className="h-8 px-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
        description={`Êtes-vous sûr de vouloir supprimer le client "${clientToDelete?.nom}" ? Cette action est irréversible et supprimera également tous les colis associés.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
