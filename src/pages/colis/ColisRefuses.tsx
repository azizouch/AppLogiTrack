import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, RefreshCw, XCircle, X, PanelLeftOpen } from 'lucide-react';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Colis, User, Entreprise } from '@/types';
import { api } from '@/lib/supabase';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

export function ColisRefuses() {
  const navigate = useNavigate();
  const { state } = useAuth();
  const isMobile = useIsMobile();

  // Check if user is livreur
  const isLivreur = state.user?.role?.toLowerCase() === 'livreur';

  // Mobile filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Data state
  const [colis, setColis] = useState<Colis[]>([]);
  const [livreurs, setLivreurs] = useState<User[]>([]);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [delivererFilter, setDelivererFilter] = useState('all');
  const [entrepriseFilter, setEntrepriseFilter] = useState('all');

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

      // Get colis with status "Refusé" - filter by current livreur if user is livreur
      const { data, error, count, totalPages: pages, hasNextPage: hasNext, hasPrevPage: hasPrev } = await api.getColis({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm,
        status: 'Refusé',
        livreurId: isLivreur ? state.user?.id : (delivererFilter !== 'all' ? delivererFilter : undefined),
        entrepriseId: entrepriseFilter !== 'all' ? entrepriseFilter : undefined,
        sortBy: 'recent'
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
  }, [currentPage, debouncedSearchTerm, delivererFilter, entrepriseFilter, itemsPerPage, isLivreur, state.user?.id]);

  // Fetch livreurs for filter dropdown
  const fetchLivreurs = useCallback(async () => {
    if (!isLivreur) {
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
    }
  }, [isLivreur]);

  // Fetch entreprises for filter dropdown
  const fetchEntreprises = useCallback(async () => {
    try {
      const { data, error } = await api.getEntreprises();
      if (error) {
        console.error('Error fetching entreprises:', error);
      } else if (data) {
        setEntreprises(data);
      }
    } catch (error) {
      console.error('Error fetching entreprises:', error);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchLivreurs();
    fetchEntreprises();
  }, [fetchLivreurs, fetchEntreprises]);

  // Fetch colis when filters or pagination change
  useEffect(() => {
    fetchColis();
  }, [fetchColis]);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, delivererFilter, entrepriseFilter]);

  // Auto-close mobile filter sidebar when filters change
  useEffect(() => {
    if (isMobile && isFilterOpen) {
      setIsFilterOpen(false);
    }
  }, [debouncedSearchTerm, delivererFilter, entrepriseFilter, isMobile]);

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
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <XCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600 dark:text-red-400" />
            {isLivreur ? 'Mes Colis Refusés' : 'Colis Refusés'}
          </h1>
        </div>
      </div>

      {/* Filters */}
      {isMobile ? (
        <div className="space-y-3 w-full">
          {/* Row 1: Filtres button + Actualiser button */}
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
                  <SheetTitle>Filtres des Colis Refusés</SheetTitle>
                  <SheetDescription>
                    Filtrez les colis refusés par livreur et tri
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  {!isLivreur && (
                    <Select value={delivererFilter} onValueChange={setDelivererFilter}>
                        <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
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
                    <Select value={entrepriseFilter} onValueChange={setEntrepriseFilter}>
                      <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                        <SelectValue placeholder="Sélectionner une entreprise" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les entreprises</SelectItem>
                        {entreprises.map((entreprise) => (
                          <SelectItem key={entreprise.id} value={entreprise.id}>
                            {entreprise.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {(searchTerm || delivererFilter !== 'all' || entrepriseFilter !== 'all') && (
                      <Button
                        onClick={() => {
                          setSearchTerm('');
                          setDelivererFilter('all');
                          setEntrepriseFilter('all');
                          setIsFilterOpen(false);
                        }}
                        variant="outline"
                        size="sm"
                        className="w-full text-sm"
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
          {/* Row 2: Search input only */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              name="search"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 w-full"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
              </svg>
              <span className="font-medium text-gray-700 dark:text-gray-300">Filtres</span>
            </div>
            <div className="flex items-center gap-2">
              {(searchTerm || delivererFilter !== 'all' || entrepriseFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setDelivererFilter('all');
                    setEntrepriseFilter('all');
                  }}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                >
                  <X className="mr-2 h-4 w-4" />
                  Réinitialiser
                </Button>
              )}
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
            </div>
          </div>

          <div className={`grid gap-4 ${isLivreur ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3'}`}>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
              <Input
                name="search"
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

            <Select value={entrepriseFilter} onValueChange={setEntrepriseFilter}>
              <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                <SelectValue placeholder="Sélectionner une entreprise" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les entreprises</SelectItem>
                {entreprises.map((entreprise) => (
                  <SelectItem key={entreprise.id} value={entreprise.id}>
                    {entreprise.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Colis Table */}
      <div className="space-y-4">
        <div className="space-y-3 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              <span>Liste Colis Refusés</span>
            </h2>
            <div className="flex justify-between items-center sm:gap-4">
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
        </div>

        <div className="overflow-x-auto">
          <Table className="bg-transparent min-w-full">
            <TableHeader>
              <TableRow className="border-b border-gray-200 dark:border-gray-600" style={{ backgroundColor: 'hsl(210, 40%, 96.1%)' }}>
                <TableHead className="text-gray-900 font-medium">ID Colis</TableHead>
                <TableHead className="text-gray-900 font-medium">Client</TableHead>
                <TableHead className="text-gray-900 font-medium">Entreprise</TableHead>
                <TableHead className="text-gray-900 font-medium">Date de refus</TableHead>
                <TableHead className="text-gray-900 font-medium">Livreur</TableHead>
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
                    <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-16"></div></TableCell>
                  </TableRow>
                ))
              ) : colis.length > 0 ? (
                colis.map((colisItem) => (
                  <TableRow key={colisItem.id} className="border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-transparent hover:bg-gray-50 dark:hover:bg-gray-700/20">
                    <TableCell className="text-sm text-gray-900 dark:text-gray-100">{colisItem.id}</TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100">{colisItem.client?.nom}</TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100">{colisItem.entreprise?.nom}</TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100">
                      {colisItem.date_mise_a_jour ? formatDate(colisItem.date_mise_a_jour) : formatDate(colisItem.date_creation)}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400">
                      {getLivreurInfo(colisItem)}
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 px-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors"
                        onClick={() => navigate(`/colis/${colisItem.id}`)}
                      >
                        Voir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-transparent">
                  <TableCell colSpan={6} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <XCircle className="h-12 w-12 mx-auto mb-4 text-red-300" />
                    <p>Aucun colis refusé trouvé</p>
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
