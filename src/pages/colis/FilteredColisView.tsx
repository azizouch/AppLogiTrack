import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Package, RefreshCw, Search, Filter, Phone, House, MapPin, Building2, Clock, CheckCircle, XCircle, Truck, AlertCircle, MessageCircle, Info, Mail, Eye, Save, Send, MessageSquare, PanelLeftOpen, X } from 'lucide-react';
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { TablePagination } from '@/components/ui/table-pagination';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { StatusBadge } from '@/components/ui/status-badge';
import { Colis, User, Statut } from '@/types';
import { api } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';

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
  const { toast } = useToast();
  const navigate = useNavigate();
  const isMobile = useIsMobile();
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
  const [statuts, setStatuts] = useState<any[]>([]);

  // Mobile state
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Modal states
  const [selectedColis, setSelectedColis] = useState<Colis | null>(null);
  const [showReclamationModal, setShowReclamationModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [reclamationText, setReclamationText] = useState('');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Check if any filters are active
  const hasActiveFilters = searchTerm || livreurFilter !== 'all' || sortBy !== 'recent';

  // Reset filters function
  const resetFilters = () => {
    setSearchTerm('');
    setLivreurFilter('all');
    setSortBy('recent');
    setCurrentPage(1);
  };

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

  // Get the database statuses to filter by
  const getFilterStatuses = useCallback(() => {
    const mapping = STATUS_MAPPING[statusFilter as keyof typeof STATUS_MAPPING];
    if (mapping === 'exclude') {
      // For "En traitement": exclude en_attente, Livré, Retourné
      return 'exclude';
    }
    return mapping || [];
  }, [statusFilter]);

  const fetchStatuts = useCallback(async () => {
    try {
      const result = await api.getStatuts('colis');
      if (result.data) {
        setStatuts(result.data);
      }
    } catch (error) {
      console.error('Error fetching statuts:', error);
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

      // Add livreur filter when selected
      if (livreurFilter && livreurFilter !== 'all') {
        params.livreurId = livreurFilter;
      }

      // Decide whether to ask server to filter by a single status
      const useServerStatusFilter = filterStatuses !== 'exclude' && Array.isArray(filterStatuses) && filterStatuses.length === 1;

      if (useServerStatusFilter) {
        params.status = filterStatuses[0];
      } else {
        // For multi-status or exclude cases, fetch all matching items so we can filter client-side
        // Use a large limit to get the full result set (acceptable for moderate datasets)
        params.page = 1;
        params.limit = 10000;
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
        if (useServerStatusFilter) {
          // Server already filtered by single status — use server counts and pages
          setColis(Array.isArray(data) ? data : []);
          setTotalCount(count || 0);
          setTotalPages(pages || 0);
          setHasNextPage(hasNext || false);
          setHasPrevPage(hasPrev || false);
        } else {
          // Client-side filtering for multi-status or exclude
          let filteredData;
          if (filterStatuses === 'exclude') {
            filteredData = data.filter(colisItem => !['en_attente', 'Livré', 'Retourné'].includes(colisItem.statut));
          } else {
            filteredData = data.filter(colisItem => filterStatuses.includes(colisItem.statut));
          }

          setColis(filteredData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage));
          setTotalCount(filteredData.length);
          setTotalPages(Math.ceil(filteredData.length / itemsPerPage));
          setHasNextPage(currentPage < Math.ceil(filteredData.length / itemsPerPage));
          setHasPrevPage(currentPage > 1);
        }
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
  }, [currentPage, debouncedSearchTerm, itemsPerPage, sortBy, livreurFilter, getFilterStatuses]);

  useEffect(() => {
    fetchColis();
    fetchLivreurs();
    fetchStatuts();
  }, [fetchColis, fetchLivreurs, fetchStatuts]);

  // Handle refresh
  const handleRefresh = () => {
    fetchColis(true);
  };

  // Auto-close filter sidebar on mobile when filters change
  useEffect(() => {
    if (isMobile && isFilterOpen) {
      setIsFilterOpen(false);
    }
  }, [searchTerm, livreurFilter, sortBy, isMobile]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Action handlers for colis cards
  const handleReclamation = (colis: Colis) => {
    setSelectedColis(colis);
    setShowReclamationModal(true);
  };

  const handleWhatsApp = (colis: Colis) => {
    // Handle WhatsApp action
    if (colis.client?.telephone) {
      const message = `Bonjour, concernant votre colis ${colis.id}`;
      const whatsappUrl = `https://wa.me/${colis.client.telephone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
    }
  };

  const handleSMS = (colis: Colis) => {
    // Handle SMS action
    if (colis.client?.telephone) {
      const message = `Bonjour, concernant votre colis ${colis.id}`;
      const smsUrl = `sms:${colis.client.telephone}?body=${encodeURIComponent(message)}`;
      window.open(smsUrl);
    }
  };

  const handleCall = (colis: Colis) => {
    // Handle call action
    if (colis.client?.telephone) {
      window.open(`tel:${colis.client.telephone}`);
    }
  };

  const handleViewDetails = (colis: Colis) => {
    setSelectedColis(colis);
    setShowDetailsModal(true);
  };

  const handleStatusChange = (colis: Colis) => {
    // Handle status change - for now just navigate to details
    navigate(`/colis/${colis.id}?returnTo=${encodeURIComponent(`/colis/filtered?status=${statusFilter}`)}`);
  };

  const submitReclamation = async () => {
    if (!selectedColis || !reclamationText.trim() || !state.user) {
      return;
    }

    try {
      // Here you would typically send the reclamation to your API
      // For now, we'll just show a success toast
      toast({
        title: "Réclamation envoyée",
        description: `Votre réclamation pour le colis ${selectedColis.id} a été envoyée avec succès.`,
      });

      setReclamationText('');
      setShowReclamationModal(false);
      setSelectedColis(null);
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'envoi de la réclamation.",
        variant: "destructive",
      });
    }
  };



  // Get page title
  const getPageTitle = () => {
    const displayName = STATUS_DISPLAY_NAMES[statusFilter as keyof typeof STATUS_DISPLAY_NAMES];
    return displayName ? `Colis ${displayName}` : 'Colis Filtrés';
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="flex items-center bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
              {getPageTitle()}
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Liste des colis avec le statut: {STATUS_DISPLAY_NAMES[statusFilter as keyof typeof STATUS_DISPLAY_NAMES]}
            </p>
            {/* <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Total: {totalCount} colis</p> */}
          </div>
        </div>
      </div>

      {/* Search and Filters */}
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
                  <SheetTitle>Filtres des Colis</SheetTitle>
                  <SheetDescription>
                    Filtrez les colis par livreur et tri
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  {/* Livreur Filter */}
                  <Select value={livreurFilter} onValueChange={setLivreurFilter}>
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                      <SelectValue placeholder="Tous les livreurs" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                      <SelectItem value="all" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Tous les livreurs</SelectItem>
                      {livreurs.map((livreur) => (
                        <SelectItem key={livreur.id} value={livreur.id} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">
                          {`${livreur.prenom || ''} ${livreur.nom}`.trim()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Sort Filter */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                      <SelectValue placeholder="Plus récent" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                      <SelectItem value="recent" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Plus récent</SelectItem>
                      <SelectItem value="oldest" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Plus ancien</SelectItem>
                      <SelectItem value="price_high" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Prix décroissant</SelectItem>
                      <SelectItem value="price_low" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Prix croissant</SelectItem>
                    </SelectContent>
                  </Select>
                  {hasActiveFilters && (
                    <Button
                      onClick={() => {
                        resetFilters();
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
              <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="font-medium text-gray-700 dark:text-gray-300">Filtres</span>
            </div>
            <div className="flex items-center gap-2">
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher par ID, client, entreprise..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400"
              />
            </div>

            {/* Livreur Filter */}
            <Select value={livreurFilter} onValueChange={setLivreurFilter}>
              <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                <SelectValue placeholder="Tous les livreurs" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                <SelectItem value="all" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Tous les livreurs</SelectItem>
                {livreurs.map((livreur) => (
                  <SelectItem key={livreur.id} value={livreur.id} className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">
                    {`${livreur.prenom || ''} ${livreur.nom}`.trim()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Sort Filter */}
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white">
                <SelectValue placeholder="Plus récent" />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600">
                <SelectItem value="recent" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Plus récent</SelectItem>
                <SelectItem value="oldest" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Plus ancien</SelectItem>
                <SelectItem value="price_high" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Prix décroissant</SelectItem>
                <SelectItem value="price_low" className="text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-600">Prix croissant</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Table view - admin/gestionnaire only */}
      {loading ? (
        <div className="text-center py-8">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
          <p className="text-gray-500 mt-2">Chargement des colis...</p>
        </div>
      ) : colis.length === 0 ? (
        <div className="text-center py-12">
          <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucun colis trouvé</h3>
          <p className="text-gray-500 dark:text-gray-400">Aucun colis trouvé pour ce statut.</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex justify-between items-center py-1">
            <h2 className="text-sm sm:text-xl font-semibold text-gray-900 dark:text-white">
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
                    <SelectItem value="100">100</SelectItem>
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
                  <TableHead className="text-gray-900 font-medium">Entreprise</TableHead>
                  <TableHead className="text-gray-900 font-medium">Statut</TableHead>
                  <TableHead className="text-gray-900 font-medium">Prix</TableHead>
                  <TableHead className="text-gray-900 font-medium">Date</TableHead>
                  <TableHead className="text-gray-900 font-medium">Livreur</TableHead>
                  <TableHead className="text-gray-900 font-medium text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  Array.from({ length: 5 }).map((_, index) => (
                    <TableRow key={index} className="border-b border-gray-600 dark:border-gray-600 bg-transparent">
                      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                      <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                    </TableRow>
                  ))
                ) : colis.length > 0 ? (
                  colis.map((colisItem) => (
                    <TableRow key={colisItem.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-transparent">
                      <TableCell className="text-sm text-gray-900 dark:text-gray-100">{colisItem.id}</TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">{colisItem.client?.nom}</TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">{colisItem.entreprise?.nom}</TableCell>
                      <TableCell><StatusBadge statut={colisItem.statut} statuts={statuts} /></TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">
                        {colisItem.prix ? `${colisItem.prix} DH` : '-'}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">
                        {new Date(colisItem.date_creation).toLocaleDateString('fr-FR')}
                      </TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">
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

      {/* Réclamation Modal */}
      <Dialog open={showReclamationModal} onOpenChange={setShowReclamationModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Envoyer une réclamation</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Colis ID: <span className="font-medium text-foreground">{selectedColis?.id}</span>
              </p>
              <p className="text-sm text-muted-foreground">
                Client: <span className="font-medium text-foreground">{selectedColis?.client?.nom}</span>
              </p>
            </div>
            <Textarea
              placeholder="Décrivez votre réclamation ici..."
              value={reclamationText}
              onChange={(e) => setReclamationText(e.target.value)}
              rows={5}
            />
          </div>
          <DialogFooter className="flex-row gap-2">
            <Button variant="outline" onClick={() => setShowReclamationModal(false)}>
              Annuler
            </Button>
            <Button onClick={submitReclamation} disabled={!reclamationText.trim()}>
              <Send className="mr-2 h-5 w-5" />
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Colis Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-2xl lg:max-w-4xl xl:max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center">
              <Package className="mr-2 h-5 w-5" />
              Détails du Colis
            </DialogTitle>
            <DialogDescription>
              Informations complètes sur le colis et options de gestion
            </DialogDescription>
          </DialogHeader>

          {selectedColis && (
            <div className="space-y-4 py-3">
              {/* Colis Information */}
              <div>
                <h3 className="text-base font-semibold mb-2 border-b pb-1 flex items-center">
                  <Package className="mr-2 h-4 w-4" />
                  Informations du Colis
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground">ID Colis</h4>
                    <p className="bg-muted p-1 rounded text-xs">{selectedColis.id}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground">Date</h4>
                    <p>{new Date(selectedColis.date_creation).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground">Statut</h4>
                    <StatusBadge statut={selectedColis.statut} statuts={statuts} />
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground">Prix</h4>
                    <p className="font-semibold">{selectedColis.prix || 0} DH</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground">Frais</h4>
                    <p>{selectedColis.frais > 0 ? `${selectedColis.frais} DH` : 'Aucun'}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground">Total</h4>
                    <p className="font-bold">{(selectedColis.prix || 0) + (selectedColis.frais || 0)} DH</p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Client Information */}
                <div>
                  <h3 className="text-base font-semibold mb-2 border-b pb-1 flex items-center">
                    <Phone className="mr-2 h-4 w-4" />
                    Client
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground">Nom</h4>
                      <p>{selectedColis.client?.nom || 'N/A'}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground">Téléphone</h4>
                      <p>{selectedColis.client?.telephone || 'Non disponible'}</p>
                    </div>
                    {selectedColis.adresse_livraison && selectedColis.adresse_livraison !== '' && (
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground">Adresse</h4>
                        <p>{selectedColis.adresse_livraison}</p>
                      </div>
                    )}
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground">Ville</h4>
                      <p>Casablanca</p>
                    </div>

                    {selectedColis.client?.telephone && (
                      <div>
                        <h4 className="text-xs font-medium text-muted-foreground">Contacts</h4>
                        <div className="flex gap-2 mt-1">
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleCall(selectedColis)} title="Appeler">
                            <Phone className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleSMS(selectedColis)} title="SMS">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="icon" className="h-8 w-8 rounded-full" onClick={() => handleWhatsApp(selectedColis)} title="WhatsApp">
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Entreprise Information */}
                <div>
                  <h3 className="text-base font-semibold mb-2 border-b pb-1 flex items-center">
                    <Building2 className="mr-2 h-4 w-4" />
                    Entreprise
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground">Nom</h4>
                      <p>{selectedColis.entreprise?.nom !== 'N/A' ? selectedColis.entreprise?.nom : 'Aucune entreprise associée'}</p>
                    </div>

                    {selectedColis.entreprise?.nom !== 'N/A' && selectedColis.entreprise?.nom && (
                      <>
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground">Email</h4>
                          <p>{selectedColis.entreprise?.email || `contact@${selectedColis.entreprise?.nom.toLowerCase().replace(/\s+/g, '')}.com`}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground">Téléphone</h4>
                          <p>{selectedColis.entreprise?.telephone || '+212 5XX-XXXXXX'}</p>
                        </div>
                        <div>
                          <h4 className="text-xs font-medium text-muted-foreground">Adresse</h4>
                          <p>{selectedColis.entreprise?.adresse || 'Casablanca, Maroc'}</p>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Vendor Contacts */}
              <div>
                <h3 className="text-base font-semibold mb-2 border-b pb-1 flex items-center">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Contacts Vendeurs
                </h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Vendeur B */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Vendeur B</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {selectedColis.entreprise?.telephone || '0661234567'}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                        onClick={() => window.open(`tel:${selectedColis.entreprise?.telephone || '0661234567'}`, '_self')}
                      >
                        <Phone className="mr-1 h-3 w-3" />
                        Vendeur B
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => window.open(`https://wa.me/${(selectedColis.entreprise?.telephone || '0661234567').replace(/\D/g, '')}`, '_blank')}
                      >
                        <MessageCircle className="mr-1 h-3 w-3" />
                        Vendeur B
                      </Button>
                    </div>
                  </div>

                  {/* Vendeur P */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white">Vendeur P</h4>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {selectedColis.entreprise?.telephone_2 || '0671234567'}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="flex-1 bg-purple-600 hover:bg-purple-700 text-white"
                        onClick={() => window.open(`tel:${selectedColis.entreprise?.telephone_2 || '0671234567'}`, '_self')}
                      >
                        <Phone className="mr-1 h-3 w-3" />
                        Vendeur P
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1 bg-pink-600 hover:bg-pink-700 text-white"
                        onClick={() => window.open(`https://wa.me/${(selectedColis.entreprise?.telephone_2 || '0671234567').replace(/\D/g, '')}`, '_blank')}
                      >
                        <MessageCircle className="mr-1 h-3 w-3" />
                        Vendeur P
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-end gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetailsModal(false)}
            >
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
