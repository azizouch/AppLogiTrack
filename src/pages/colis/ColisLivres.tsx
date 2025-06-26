import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, RefreshCw, Eye, CheckCircle, Phone, MessageCircle, MapPin, Building, Package, Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
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
import { Colis, User } from '@/types';
import { api, supabase } from '@/lib/supabase';
import { useDebounce } from '@/hooks/useDebounce';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

// Type for livreur dropdown items
type LivreurOption = Pick<User, 'id' | 'nom' | 'prenom' | 'statut'>;

export function ColisLivres() {
  const navigate = useNavigate();
  const { state } = useAuth();

  // Check if user is livreur
  const isLivreur = state.user?.role?.toLowerCase() === 'livreur';

  // Data state
  const [colis, setColis] = useState<Colis[]>([]);
  const [livreurs, setLivreurs] = useState<LivreurOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [delivererFilter, setDelivererFilter] = useState('all');
  const [sortBy, setSortBy] = useState<'recent' | 'oldest'>('recent');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);

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

      // Direct Supabase query for delivered packages
      let query = supabase
        .from('colis')
        .select(`
          *,
          client:clients(*),
          entreprise:entreprises(*),
          livreur:utilisateurs(*)
        `, { count: 'exact' })
        .eq('statut', 'Livré'); // Only get delivered packages

      // Apply livreur filter
      if (isLivreur && state.user?.id) {
        query = query.eq('livreur_id', state.user.id);
      } else if (delivererFilter !== 'all') {
        query = query.eq('livreur_id', delivererFilter);
      }

      // Apply search filter
      if (debouncedSearchTerm) {
        query = query.or(`id.ilike.%${debouncedSearchTerm}%,client.nom.ilike.%${debouncedSearchTerm}%`);
      }

      // Apply sorting
      if (sortBy === 'recent') {
        query = query.order('date_mise_a_jour', { ascending: false });
      } else if (sortBy === 'oldest') {
        query = query.order('date_mise_a_jour', { ascending: true });
      } else {
        query = query.order('date_creation', { ascending: false });
      }

      // Apply pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('ColisLivres: Query error:', error);
        setColis([]);
        setTotalCount(0);
        setTotalPages(0);
        setHasNextPage(false);
        setHasPrevPage(false);
      } else {
        setColis(data || []);
        const total = count || 0;
        setTotalCount(total);
        const pages = Math.ceil(total / itemsPerPage);
        setTotalPages(pages);
        setHasNextPage(currentPage < pages);
        setHasPrevPage(currentPage > 1);
      }
    } catch (error) {
      console.error('Error in fetchColis:', error);
      setColis([]);
      setTotalCount(0);
      setTotalPages(0);
      setHasNextPage(false);
      setHasPrevPage(false);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, debouncedSearchTerm, delivererFilter, sortBy, itemsPerPage, state.user?.id, isLivreur]);

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

  // Initial data fetch
  useEffect(() => {
    fetchLivreurs();
  }, [fetchLivreurs]);

  // Fetch colis when filters or pagination change
  useEffect(() => {
    fetchColis();
  }, [fetchColis]);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, delivererFilter, sortBy]);

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

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 dark:text-white ">
            <CheckCircle className="h-7 w-7 text-green-600" />
            {isLivreur ? 'Mes Colis Livrés' : 'Colis Livrés'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isLivreur
              ? `Total: ${totalCount} colis livrés`
              : 'Liste des colis qui ont été livrés avec succès'
            }
          </p>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={refreshing}
            className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
            Actualiser
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
          {(searchTerm || delivererFilter !== 'all' || sortBy !== 'recent') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('');
                setDelivererFilter('all');
                setSortBy('recent');
              }}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
            >
              <X className="mr-2 h-4 w-4" />
              Réinitialiser
            </Button>
          )}
        </div>

        <div className={`grid gap-4 ${isLivreur ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          {!isLivreur && (
            <Select value={delivererFilter} onValueChange={setDelivererFilter}>
              <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                <SelectValue placeholder="Tous les livreurs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les livreurs</SelectItem>
                <SelectItem value="unassigned">Non assigné</SelectItem>
                {livreurs.map((livreur) => (
                  <SelectItem key={livreur.id} value={livreur.id}>
                    <div className="flex items-center gap-2">
                      <div className="flex-shrink-0 h-6 w-6 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        {livreur.prenom?.[0] || livreur.nom[0]}
                      </div>
                      <span>{`${livreur.prenom || ''} ${livreur.nom}`.trim()}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <Select value={sortBy} onValueChange={(value) => setSortBy(value as 'recent' | 'oldest')}>
            <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
              <SelectValue placeholder="Plus récent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Plus récent</SelectItem>
              <SelectItem value="oldest">Plus ancien</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Colis Table */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>Colis Livrés</span>
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Afficher</span>
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
              <span className="text-sm text-gray-500 dark:text-gray-400">entrées</span>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {loading ? (
                'Chargement...'
              ) : (
                `Total: ${totalCount} colis`
              )}
            </span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="bg-transparent min-w-full">
            <TableHeader>
              <TableRow className="border-b border-gray-200 dark:border-gray-600" style={{ backgroundColor: 'hsl(210, 40%, 96.1%)' }}>
                <TableHead className="text-gray-900 font-medium">ID Colis</TableHead>
                <TableHead className="text-gray-900 font-medium">Client</TableHead>
                <TableHead className="text-gray-900 font-medium hidden sm:table-cell">Entreprise</TableHead>
                <TableHead className="text-gray-900 font-medium hidden md:table-cell">Date de livraison</TableHead>
                <TableHead className="text-gray-900 font-medium hidden lg:table-cell">Livreur</TableHead>
                <TableHead className="text-gray-900 font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className="border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-transparent">
                    <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                    <TableCell className="hidden sm:table-cell"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                    <TableCell className="hidden md:table-cell"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                    <TableCell className="hidden lg:table-cell"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-16"></div></TableCell>
                  </TableRow>
                ))
              ) : colis.length > 0 ? (
                colis.map((colisItem) => (
                  <TableRow key={colisItem.id} className="border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700/20">
                    <TableCell className="font-mono text-sm text-gray-900 dark:text-gray-100">{colisItem.id}</TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100">{colisItem.client?.nom}</TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100 hidden sm:table-cell">{colisItem.entreprise?.nom}</TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100 hidden md:table-cell">
                      {colisItem.date_mise_a_jour ? formatDate(colisItem.date_mise_a_jour) : formatDate(colisItem.date_creation)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                      {getLivreurInfo(colisItem)}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 hover:bg-blue-200 dark:hover:bg-blue-900/40 transition-colors"
                          onClick={() => navigate(`/colis/${colisItem.id}`)}
                          title="Voir détails du colis"
                        >
                          Colis
                        </Button>
                        {colisItem.client?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 hover:bg-green-200 dark:hover:bg-green-900/40 transition-colors"
                            onClick={() => navigate(`/clients/${colisItem.client.id}`)}
                            title="Voir détails du client"
                          >
                            Client
                          </Button>
                        )}
                        {colisItem.entreprise?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 hover:bg-purple-200 dark:hover:bg-purple-900/40 transition-colors"
                            onClick={() => navigate(`/entreprises/${colisItem.entreprise.id}`)}
                            title="Voir détails de l'entreprise"
                          >
                            Entreprise
                          </Button>
                        )}
                        {colisItem.livreur?.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 px-2 bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 hover:bg-orange-200 dark:hover:bg-orange-900/40 transition-colors"
                            onClick={() => navigate(`/livreurs/${colisItem.livreur.id}`)}
                            title="Voir détails du livreur"
                          >
                            Livreur
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-transparent">
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-300" />
                    <p>Aucun colis livré trouvé</p>
                  </TableCell>
                </TableRow>
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
          onPageChange={handlePageChange}
          loading={loading}
          totalItems={totalCount}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
}
