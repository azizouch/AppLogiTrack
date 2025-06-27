import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Package, RefreshCw, Search, Filter } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Colis, User } from '@/types';
import { api } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';

// Status mapping for dashboard cards to database statuses
const STATUS_MAPPING = {
  // Admin/Gestionnaire statuses
  'en_attente': ['en_attente'],
  'en_traitement': 'exclude', // Special case: all statuses except en_attente, Livré, Retourné
  'livres': ['Livré'],
  'retournes': ['Retourné'],

  // Livreur statuses
  'a_livrer_aujourdhui': ['en_attente', 'pris_en_charge'],
  'en_cours': ['en_cours'],
  'livres_aujourdhui': ['Livré'],
  'retournes_livreur': ['Retourné']
};

// Status display names
const STATUS_DISPLAY_NAMES = {
  'en_attente': 'En attente',
  'en_traitement': 'En traitement',
  'livres': 'Livrés',
  'retournes': 'Retournés',
  'a_livrer_aujourdhui': 'À livrer aujourd\'hui',
  'en_cours': 'En cours',
  'livres_aujourdhui': 'Livrés aujourd\'hui',
  'retournes_livreur': 'Retournés'
};

export function FilteredColisView() {
  const { state } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const statusFilter = searchParams.get('status') || '';
  
  const [colis, setColis] = useState<Colis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [livreurFilter, setLivreurFilter] = useState('all');
  const [sortBy, setSortBy] = useState('recent');
  const [livreurs, setLivreurs] = useState<User[]>([]);

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const isLivreur = state.user?.role?.toLowerCase() === 'livreur';

  // Get the database statuses to filter by
  const getFilterStatuses = useCallback(() => {
    const mapping = STATUS_MAPPING[statusFilter as keyof typeof STATUS_MAPPING];
    if (mapping === 'exclude') {
      // For "En traitement": exclude en_attente, Livré, Retourné
      return 'exclude';
    }
    return mapping || [];
  }, [statusFilter]);

  // Fetch livreurs for filter dropdown
  const fetchLivreurs = useCallback(async () => {
    try {
      const result = await api.getLivreurs();
      if (result?.data) {
        setLivreurs(result.data);
      }
    } catch (error) {
      console.error('Error fetching livreurs:', error);
    }
  }, []);

  // Fetch colis data with filters
  const fetchColis = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const filterStatuses = getFilterStatuses();
      if (filterStatuses !== 'exclude' && filterStatuses.length === 0) {
        setColis([]);
        setTotalCount(0);
        setTotalPages(0);
        return;
      }

      const params: any = {
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm,
        sortBy: sortBy,
      };

      // Add livreur filter for livreur users or when filter is selected
      if (isLivreur && state.user?.id) {
        params.livreurId = state.user.id;
      } else if (livreurFilter && livreurFilter !== 'all') {
        params.livreurId = livreurFilter;
      }

      const result = await api.getColis(params);
      const { data, error, count, totalPages: pages, hasNextPage: hasNext, hasPrevPage: hasPrev } = result;

      if (error) {
        console.error('Error fetching colis:', error);
        setColis([]);
        setTotalCount(0);
        setTotalPages(0);
        setHasNextPage(false);
        setHasPrevPage(false);
      } else if (data) {
        // Filter by status on the client side
        let filteredData;
        if (filterStatuses === 'exclude') {
          // For "En traitement": exclude en_attente, Livré, Retourné
          filteredData = data.filter(colisItem =>
            !['en_attente', 'Livré', 'Retourné'].includes(colisItem.statut)
          );
        } else {
          filteredData = data.filter(colisItem =>
            filterStatuses.includes(colisItem.statut)
          );
        }

        setColis(filteredData);
        setTotalCount(filteredData.length);
        setTotalPages(Math.ceil(filteredData.length / itemsPerPage));
        setHasNextPage(currentPage < Math.ceil(filteredData.length / itemsPerPage));
        setHasPrevPage(currentPage > 1);
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
  }, [currentPage, debouncedSearchTerm, itemsPerPage, sortBy, livreurFilter, getFilterStatuses, isLivreur, state.user?.id]);

  useEffect(() => {
    fetchColis();
    if (!isLivreur) {
      fetchLivreurs();
    }
  }, [fetchColis, fetchLivreurs, isLivreur]);

  // Handle refresh
  const handleRefresh = () => {
    fetchColis(true);
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'en_attente':
        return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">En attente</Badge>;
      case 'pris_en_charge':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">Pris en charge</Badge>;
      case 'en_cours':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">En cours</Badge>;
      case 'Livré':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Livré</Badge>;
      case 'Retourné':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Retourné</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Get page title
  const getPageTitle = () => {
    const displayName = STATUS_DISPLAY_NAMES[statusFilter as keyof typeof STATUS_DISPLAY_NAMES];
    return displayName ? `Colis ${displayName}` : 'Colis Filtrés';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="p-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Package className="h-7 w-7 text-blue-600 dark:text-blue-400" />
              {getPageTitle()}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Liste des colis avec le statut: {STATUS_DISPLAY_NAMES[statusFilter as keyof typeof STATUS_DISPLAY_NAMES]}
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher par ID, client, entreprise..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>

        {/* Livreur Filter - Only show for admin/gestionnaire */}
        {!isLivreur && (
          <Select value={livreurFilter} onValueChange={setLivreurFilter}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Tous les livreurs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les livreurs</SelectItem>
              {livreurs.map((livreur) => (
                <SelectItem key={livreur.id} value={livreur.id}>
                  {`${livreur.prenom || ''} ${livreur.nom}`.trim()}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Sort Filter */}
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Plus récent" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="recent">Plus récent</SelectItem>
            <SelectItem value="oldest">Plus ancien</SelectItem>
            <SelectItem value="price_high">Prix décroissant</SelectItem>
            <SelectItem value="price_low">Prix croissant</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Content based on user role */}
      {isLivreur ? (
        // Card view for livreur
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 6 }).map((_, index) => (
              <Card key={index} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
                    <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded"></div>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : colis.length > 0 ? (
            colis.map((colisItem) => (
              <Card key={colisItem.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-mono">{colisItem.id}</CardTitle>
                  {getStatusBadge(colisItem.statut)}
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Client:</span> {colisItem.client?.nom || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Entreprise:</span> {colisItem.entreprise?.nom || 'N/A'}
                    </div>
                    <div>
                      <span className="font-medium">Prix:</span> {colisItem.prix ? `${colisItem.prix} DH` : 'N/A'}
                    </div>
                    <Button
                      size="sm"
                      className="w-full mt-2"
                      onClick={() => navigate(`/colis/${colisItem.id}?returnTo=${encodeURIComponent(`/colis/filtered?status=${statusFilter}`)}`)}
                    >
                      Voir détails
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-gray-500 dark:text-gray-400">
              Aucun colis trouvé pour ce statut
            </div>
          )}
        </div>
      ) : (
        // Table view for admin/gestionnaire
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              Liste des Colis ({totalCount} résultats)
            </h2>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500 dark:text-gray-400">Afficher</span>
                <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}>
                  <SelectTrigger className="w-16 h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <Table className="bg-transparent min-w-full">
              <TableHeader>
                <TableRow className="border-b border-gray-200 dark:border-gray-600" style={{ backgroundColor: 'hsl(210, 40%, 96.1%)' }}>
                  <TableHead className="text-gray-900 font-medium">ID Colis</TableHead>
                  <TableHead className="text-gray-900 font-medium">Client</TableHead>
                  <TableHead className="text-gray-900 font-medium hidden sm:table-cell">Entreprise</TableHead>
                  <TableHead className="text-gray-900 font-medium">Statut</TableHead>
                  <TableHead className="text-gray-900 font-medium hidden md:table-cell">Prix</TableHead>
                  <TableHead className="text-gray-900 font-medium hidden md:table-cell">Date</TableHead>
                  <TableHead className="text-gray-900 font-medium hidden lg:table-cell">Livreur</TableHead>
                  <TableHead className="text-gray-900 font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index} className="border-b border-gray-600 dark:border-gray-600 bg-transparent">
                      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                      <TableCell className="hidden sm:table-cell"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                      <TableCell className="hidden md:table-cell"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                      <TableCell className="hidden md:table-cell"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                      <TableCell className="hidden lg:table-cell"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                    </TableRow>
                  ))
                ) : colis.length > 0 ? (
                  colis.map((colisItem) => (
                    <TableRow key={colisItem.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-transparent">
                      <TableCell className="font-mono text-sm text-gray-900 dark:text-gray-100">{colisItem.id}</TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">{colisItem.client?.nom}</TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100 hidden sm:table-cell">{colisItem.entreprise?.nom}</TableCell>
                      <TableCell>{getStatusBadge(colisItem.statut)}</TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100 hidden md:table-cell">
                        {colisItem.prix ? `${colisItem.prix} DH` : '-'}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100 hidden md:table-cell">
                        {new Date(colisItem.date_creation).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100 hidden lg:table-cell">
                        {colisItem.livreur ? `${colisItem.livreur.prenom || ''} ${colisItem.livreur.nom}`.trim() : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/colis/${colisItem.id}?returnTo=${encodeURIComponent(`/colis/filtered?status=${statusFilter}`)}`)}
                        >
                          Voir
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow className="border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-transparent">
                    <TableCell colSpan={8} className="text-center py-8 text-gray-500 dark:text-gray-400">
                      Aucun colis trouvé pour ce statut
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
      )}
    </div>
  );
}
