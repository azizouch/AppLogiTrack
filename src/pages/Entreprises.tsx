import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, RefreshCw, Eye, Edit, Trash2, Building2, Filter, MapPin, User, Package, X } from 'lucide-react';
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
import { Entreprise, Colis } from '@/types';
import { api } from '@/lib/supabase';
import { useDebounce } from '@/hooks/useDebounce';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export function Entreprises() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Data state
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [allEntreprises, setAllEntreprises] = useState<Entreprise[]>([]);
  const [entrepriseColis, setEntrepriseColis] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [entrepriseToDelete, setEntrepriseToDelete] = useState<Entreprise | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [cityFilter, setCityFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch entreprises data
  const fetchEntreprises = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { data, error } = await api.getEntreprises();

      if (error) {
        console.error('Error fetching entreprises:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les entreprises',
          variant: 'destructive',
        });
        setEntreprises([]);
        setAllEntreprises([]);
        setTotalCount(0);
      } else if (data) {
        setAllEntreprises(data);

        // Fetch colis count for each entreprise
        const colisCountMap: Record<string, number> = {};
        for (const entreprise of data) {
          try {
            const { data: colisData } = await api.getColisByEntrepriseId(entreprise.id);
            colisCountMap[entreprise.id] = colisData?.length || 0;
          } catch (error) {
            colisCountMap[entreprise.id] = 0;
          }
        }
        setEntrepriseColis(colisCountMap);

        // Apply filters
        let filteredEntreprises = data;

        // Search filter
        if (debouncedSearchTerm) {
          filteredEntreprises = filteredEntreprises.filter(entreprise =>
            entreprise.nom.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            entreprise.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            entreprise.telephone?.includes(debouncedSearchTerm) ||
            entreprise.contact?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            entreprise.adresse?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          );
        }

        // City filter
        if (cityFilter && cityFilter !== 'all' && cityFilter !== '') {
          filteredEntreprises = filteredEntreprises.filter(entreprise => {
            const city = entreprise.adresse?.split(',').pop()?.trim().toLowerCase();
            return city?.includes(cityFilter.toLowerCase());
          });
        }

        // Status filter (based on whether they have contact info)
        if (statusFilter && statusFilter !== 'all' && statusFilter !== '') {
          filteredEntreprises = filteredEntreprises.filter(entreprise => {
            switch (statusFilter) {
              case 'complete':
                return entreprise.telephone && entreprise.email && entreprise.contact;
              case 'incomplete':
                return !entreprise.telephone || !entreprise.email || !entreprise.contact;
              case 'no_contact':
                return !entreprise.contact;
              case 'no_phone':
                return !entreprise.telephone;
              default: return true;
            }
          });
        }

        // Apply pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedEntreprises = filteredEntreprises.slice(startIndex, endIndex);

        setEntreprises(paginatedEntreprises);
        setTotalCount(filteredEntreprises.length);
        setTotalPages(Math.ceil(filteredEntreprises.length / itemsPerPage));
        setHasNextPage(endIndex < filteredEntreprises.length);
        setHasPrevPage(currentPage > 1);
      }
    } catch (error) {
      console.error('Error fetching entreprises:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du chargement',
        variant: 'destructive',
      });
      setEntreprises([]);
      setAllEntreprises([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, debouncedSearchTerm, itemsPerPage, cityFilter, statusFilter, toast]);

  // Show delete confirmation
  const showDeleteConfirmation = (entreprise: Entreprise) => {
    setEntrepriseToDelete(entreprise);
    setShowDeleteDialog(true);
  };

  // Delete entreprise
  const handleDelete = async () => {
    if (!entrepriseToDelete) return;

    setDeleting(entrepriseToDelete.id);
    try {
      const { error } = await api.deleteEntreprise(entrepriseToDelete.id);

      if (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer l\'entreprise',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Succès',
          description: 'Entreprise supprimée avec succès',
        });
        fetchEntreprises(true);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
      setEntrepriseToDelete(null);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchEntreprises(true);
  };

  // Reset filters function
  const resetFilters = () => {
    setSearchTerm('');
    setCityFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || (cityFilter && cityFilter !== 'all') || (statusFilter && statusFilter !== 'all');

  // Get unique cities from all entreprises
  const uniqueCities = Array.from(new Set(
    allEntreprises
      .map(e => e.adresse?.split(',').pop()?.trim())
      .filter(Boolean)
  )).sort();

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm, cityFilter, statusFilter]);

  // Initial data fetch and when dependencies change
  useEffect(() => {
    fetchEntreprises();
  }, [fetchEntreprises]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Building2 className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            Gestion des Entreprises
          </h1>
          <p className="text-gray-600 dark:text-gray-400">Gestion des entreprises partenaires</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
            onClick={() => navigate('/entreprises/ajouter')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter une entreprise
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
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
              className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            />
          </div>
          <Select value={cityFilter} onValueChange={setCityFilter}>
            <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
              <SelectValue placeholder="Toutes les villes" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
              <SelectItem value="all" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Toutes les villes</SelectItem>
              {uniqueCities.map((city) => (
                <SelectItem key={city} value={city} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">
                  {city}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
              <SelectItem value="all" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Tous les statuts</SelectItem>
              <SelectItem value="complete" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Informations complètes</SelectItem>
              <SelectItem value="incomplete" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Informations incomplètes</SelectItem>
              <SelectItem value="no_contact" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Sans contact</SelectItem>
              <SelectItem value="no_phone" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">Sans téléphone</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Liste des Entreprises</h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Afficher</span>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-16 h-8 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectItem value="5" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">5</SelectItem>
                  <SelectItem value="10" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">10</SelectItem>
                  <SelectItem value="25" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">25</SelectItem>
                  <SelectItem value="50" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-500 dark:text-gray-400">entrées</span>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Total: {totalCount} entreprises</span>
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow className="border-b border-gray-200 dark:border-gray-600" style={{ backgroundColor: 'hsl(210, 40%, 96.1%)' }}>
              <TableHead className="font-semibold text-gray-900">Nom</TableHead>
              <TableHead className="font-semibold text-gray-900">Adresse</TableHead>
              <TableHead className="font-semibold text-gray-900">Contact Principal</TableHead>
              <TableHead className="font-semibold text-gray-900">Colis</TableHead>
              <TableHead className="font-semibold text-right text-gray-900">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="bg-white dark:bg-transparent border-b border-gray-200 dark:border-gray-600">
                  <TableCell colSpan={5}>
                    <div className="flex items-center space-x-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-1"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : entreprises.length === 0 ? (
              <TableRow className="bg-white dark:bg-transparent border-b border-gray-200 dark:border-gray-600">
                <TableCell colSpan={5} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                    <Building2 className="h-12 w-12 mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-lg font-medium mb-2">Aucune entreprise trouvée</p>
                    <p className="text-sm">
                      {hasActiveFilters
                        ? 'Aucune entreprise ne correspond à vos filtres'
                        : 'Commencez par ajouter votre première entreprise'
                      }
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              entreprises.map((entreprise) => (
                <TableRow key={entreprise.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 bg-white dark:bg-transparent border-b border-gray-200 dark:border-gray-600">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {entreprise.nom}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          ID: ENT-{entreprise.id.slice(-3).toUpperCase()}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">
                        {entreprise.adresse || <span className="text-gray-400 dark:text-gray-500">-</span>}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-white">
                        {entreprise.contact || <span className="text-gray-400 dark:text-gray-500">-</span>}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-900 dark:text-white font-medium">
                        {entrepriseColis[entreprise.id] || 0}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center gap-2 justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/entreprises/${entreprise.id}`)}
                        className="h-8 px-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        Détails
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => showDeleteConfirmation(entreprise)}
                        disabled={deleting === entreprise.id}
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

      {/* Pagination */}
      {!loading && totalCount > 0 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalCount}
          itemsPerPage={itemsPerPage}
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="Supprimer l'entreprise"
        description={`Êtes-vous sûr de vouloir supprimer l'entreprise "${entrepriseToDelete?.nom}" ? Cette action est irréversible et supprimera également tous les colis associés.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        variant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
