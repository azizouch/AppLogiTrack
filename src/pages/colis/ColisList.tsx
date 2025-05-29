
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, RefreshCw } from 'lucide-react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TablePagination } from '@/components/ui/table-pagination';
import { Colis, User, Statut } from '@/types';
import { api } from '@/lib/supabase';
import { useDebounce } from '@/hooks/useDebounce';
import { useNavigate } from 'react-router-dom';

export function ColisList() {
  const navigate = useNavigate();
  // Data state
  const [colis, setColis] = useState<Colis[]>([]);
  const [livreurs, setLivreurs] = useState<User[]>([]);
  const [statuts, setStatuts] = useState<Statut[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [delivererFilter, setDelivererFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest' | 'status'>('recent');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const itemsPerPage = 20;

  // Debounced search term for performance
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch colis data with filters and pagination
  const fetchColis = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { data, error, count, totalPages: pages, hasNextPage: hasNext, hasPrevPage: hasPrev } = await api.getColis({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm,
        status: statusFilter,
        livreurId: delivererFilter,
        sortBy: sortBy
      });

      if (error) {
        console.error('Error fetching colis:', error);
        setColis([]);
        setTotalCount(0);
        setTotalPages(0);
        setHasNextPage(false);
        setHasPrevPage(false);
      } else if (data) {
        setColis(data);
        setTotalCount(count || 0);
        setTotalPages(pages);
        setHasNextPage(hasNext);
        setHasPrevPage(hasPrev);
      }
    } catch (error) {
      console.error('Error fetching colis:', error);
      setColis([]);
      setTotalCount(0);
      setTotalPages(0);
      setHasNextPage(false);
      setHasPrevPage(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, debouncedSearchTerm, statusFilter, delivererFilter, sortBy, itemsPerPage]);

  // Fetch livreurs for filter dropdown
  const fetchLivreurs = useCallback(async () => {
    try {
      const { data, error } = await api.getLivreurs();
      if (error) {
        console.error('Error fetching livreurs:', error);
      } else if (data) {
        setLivreurs(data);
      }
    } catch (error) {
      console.error('Error fetching livreurs:', error);
    }
  }, []);

  // Fetch statuts for filter dropdown
  const fetchStatuts = useCallback(async () => {
    try {
      const { data, error } = await api.getStatuts('colis');
      if (error) {
        console.error('Error fetching statuts:', error);
      } else if (data) {
        setStatuts(data);
      }
    } catch (error) {
      console.error('Error fetching statuts:', error);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchLivreurs();
    fetchStatuts();
  }, [fetchLivreurs, fetchStatuts]);

  // Fetch colis when filters or pagination change
  useEffect(() => {
    fetchColis();
  }, [fetchColis]);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, statusFilter, delivererFilter, sortBy]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'En cours':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-300">En cours</Badge>;
      case 'Livré':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">Livré</Badge>;
      case 'Retourné':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300">Retourné</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLivreurInfo = (colis: Colis) => {
    if (!colis.livreur_id || !colis.livreur) {
      return 'Non assigné';
    }

    return `${colis.livreur.prenom || ''} ${colis.livreur.nom}`.trim();
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchColis(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Liste des Colis</h1>
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
            className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
            onClick={() => navigate('/colis/nouveau')}
          >
            <Plus className="mr-2 h-4 w-4" />
            Ajouter un colis
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
            <span className="font-medium text-gray-700 dark:text-gray-300">Filtres</span>
          </div>
          {(searchTerm || statusFilter !== 'all' || delivererFilter !== 'all' || sortBy !== 'recent') && (
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
                setDelivererFilter('all');
                setSortBy('recent');
              }}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Réinitialiser
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-transparent border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-transparent border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {statuts.map((statut) => (
                <SelectItem key={statut.id} value={statut.nom}>
                  {statut.nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={delivererFilter} onValueChange={setDelivererFilter}>
            <SelectTrigger className="bg-transparent border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white">
              <SelectValue placeholder="Tous les livreurs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les livreurs</SelectItem>
              <SelectItem value="unassigned">Non assigné</SelectItem>
              {livreurs.map((livreur) => (
                <SelectItem key={livreur.id} value={livreur.id}>
                  {`${livreur.prenom || ''} ${livreur.nom}`.trim()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'recent' | 'oldest' | 'status')}>
            <SelectTrigger className="bg-transparent border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white">
              <SelectValue placeholder="Plus récent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Plus récent</SelectItem>
              <SelectItem value="oldest">Plus ancien</SelectItem>
              <SelectItem value="status">Par statut</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Colis Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Liste des Colis</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {loading ? (
              'Chargement...'
            ) : (
              `${totalCount} colis trouvé${totalCount > 1 ? 's' : ''}`
            )}
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table className="bg-transparent min-w-full">
            <TableHeader>
              <TableRow className="border-b border-gray-600 dark:border-gray-600" style={{ backgroundColor: 'hsl(217.2, 32.6%, 17.5%)' }}>
                <TableHead className="text-gray-300 font-medium">ID Colis</TableHead>
                <TableHead className="text-gray-300 font-medium">Client</TableHead>
                <TableHead className="text-gray-300 font-medium hidden sm:table-cell">Entreprise</TableHead>
                <TableHead className="text-gray-300 font-medium">Statut</TableHead>
                <TableHead className="text-gray-300 font-medium hidden md:table-cell">Date de création</TableHead>
                <TableHead className="text-gray-300 font-medium hidden lg:table-cell">Livreur</TableHead>
                <TableHead className="text-gray-300 font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className="border-b border-gray-600 dark:border-gray-600 bg-transparent">
                    <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                    <TableCell className="hidden sm:table-cell"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-6 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-16"></div></TableCell>
                    <TableCell className="hidden md:table-cell"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                    <TableCell className="hidden lg:table-cell"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-16"></div></TableCell>
                  </TableRow>
                ))
              ) : colis.length > 0 ? (
                colis.map((colisItem) => (
                  <TableRow key={colisItem.id} className="border-b border-gray-600 dark:border-gray-600 bg-transparent hover:bg-gray-700/10 dark:hover:bg-gray-700/20">
                    <TableCell className="font-mono text-sm text-gray-900 dark:text-gray-100">{colisItem.id}</TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100">{colisItem.client?.nom}</TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100 hidden sm:table-cell">{colisItem.entreprise?.nom}</TableCell>
                    <TableCell>{getStatusBadge(colisItem.statut)}</TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100 hidden md:table-cell">
                      {new Date(colisItem.date_creation).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                      {getLivreurInfo(colisItem)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/colis/${colisItem.id}`)}
                        className="bg-transparent border-gray-600 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-700/10 dark:hover:bg-gray-700/20"
                      >
                        Voir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="border-b border-gray-600 dark:border-gray-600 bg-transparent">
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Aucun colis trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <TablePagination
            currentPage={currentPage}
            totalPages={totalPages}
            hasNextPage={hasNextPage}
            hasPrevPage={hasPrevPage}
            onPageChange={handlePageChange}
            loading={loading}
            totalItems={totalCount}
            itemsPerPage={itemsPerPage}
          />
        )}
      </div>
    </div>
  );
}
