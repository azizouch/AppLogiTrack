import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, RefreshCw, Eye, Edit, Trash2, Building2 } from 'lucide-react';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Entreprise } from '@/types';
import { api } from '@/lib/supabase';
import { useDebounce } from '@/hooks/useDebounce';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

export function Entreprises() {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Data state
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
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
        setTotalCount(0);
      } else if (data) {
        // Filter entreprises based on search term
        let filteredEntreprises = data;
        if (debouncedSearchTerm) {
          filteredEntreprises = data.filter(entreprise =>
            entreprise.nom.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            entreprise.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            entreprise.telephone?.includes(debouncedSearchTerm) ||
            entreprise.contact?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          );
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
      setTotalCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, debouncedSearchTerm, itemsPerPage, toast]);

  // Delete entreprise
  const handleDelete = async (entrepriseId: string) => {
    setDeleting(entrepriseId);
    try {
      const { error } = await api.deleteEntreprise(entrepriseId);

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
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchEntreprises(true);
  };

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Initial data fetch and when dependencies change
  useEffect(() => {
    fetchEntreprises();
  }, [fetchEntreprises]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Entreprises</h1>
          <p className="text-gray-600 dark:text-gray-400">Gestion des entreprises partenaires</p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-transparent border-gray-600 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-700/10 dark:hover:bg-gray-700/20"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
          <Button
            className="bg-purple-600 hover:bg-purple-700 flex-1 sm:flex-none"
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
            <svg className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
            </svg>
            <span className="font-medium text-gray-700 dark:text-gray-300">Filtres</span>
          </div>
          {searchTerm && (
            <Button
              variant="outline"
              onClick={() => setSearchTerm('')}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Réinitialiser
            </Button>
          )}
        </div>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher par nom, email, téléphone ou contact..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
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
        </div>
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 dark:bg-gray-900/50">
              <TableHead className="font-semibold">Nom</TableHead>
              <TableHead className="font-semibold">Contact</TableHead>
              <TableHead className="font-semibold">Personne de contact</TableHead>
              <TableHead className="font-semibold">Adresse</TableHead>
              <TableHead className="font-semibold">Date création</TableHead>
              <TableHead className="font-semibold text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell colSpan={6}>
                    <div className="flex items-center space-x-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-1"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : entreprises.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                    <Building2 className="h-12 w-12 mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-lg font-medium mb-2">Aucune entreprise trouvée</p>
                    <p className="text-sm">
                      {debouncedSearchTerm
                        ? 'Aucune entreprise ne correspond à votre recherche'
                        : 'Commencez par ajouter votre première entreprise'
                      }
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              entreprises.map((entreprise) => (
                <TableRow key={entreprise.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <TableCell>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {entreprise.nom}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {entreprise.email && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {entreprise.email}
                        </div>
                      )}
                      {entreprise.telephone && (
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {entreprise.telephone}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {entreprise.contact || <span className="text-gray-400 dark:text-gray-500">-</span>}
                  </TableCell>
                  <TableCell>
                    {entreprise.adre || <span className="text-gray-400 dark:text-gray-500">-</span>}
                  </TableCell>
                  <TableCell>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(entreprise.created_at).toLocaleDateString('fr-FR')}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/entreprises/${entreprise.id}`)}
                        className="h-8 w-8 p-0 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                      >
                        <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/entreprises/${entreprise.id}/modifier`)}
                        className="h-8 w-8 p-0 hover:bg-green-100 dark:hover:bg-green-900/30"
                      >
                        <Edit className="h-4 w-4 text-green-600 dark:text-green-400" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0 hover:bg-red-100 dark:hover:bg-red-900/30"
                            disabled={deleting === entreprise.id}
                          >
                            <Trash2 className="h-4 w-4 text-red-600 dark:text-red-400" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer l'entreprise "{entreprise.nom}" ?
                              Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDelete(entreprise.id)}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
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
          totalCount={totalCount}
          itemsPerPage={itemsPerPage}
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}
