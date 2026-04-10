import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, Search, Filter, RefreshCw, Phone, MessageCircle, MapPin, Building, Calendar, Eye, Info, CheckCircle, AlertCircle, Clock, House, Building2, Save, MessageSquare, CircleAlert, X, Send, Mail, RotateCcw, History, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '@/contexts/AuthContext';
import { api, supabase } from '@/lib/supabase';

import { Colis, HistoriqueColis, Statut } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useColisModals } from '@/hooks/useColisModals';
import { ColisDetailsModal, ColisSuiviModal, ColisReclamationModal, ColisStatusModal, handleWhatsApp, handleSMS, handleCall, getInitials, formatDateTime, formatDate, getActionParLabel, renderInformations, getEtatBadgeClass } from '@/components/colis';

type MesColisProps = {
  initialStatus?: string;
  pageTitle?: string;
  pageDescription?: string;
};

export function MesColis({
  initialStatus = 'tous',
  pageTitle = 'Mes Colis',
  pageDescription = 'Vue détaillée de vos colis avec filtres et tri',
}: MesColisProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAuth();
  const { toast } = useToast();

  // Use shared modal hook
  const {
    selectedColis,
    showReclamationModal,
    showDetailsModal,
    showSuiviModal,
    showStatusModal,
    setShowReclamationModal,
    setShowDetailsModal,
    setShowSuiviModal,
    setShowStatusModal,
    handleSuivi,
    handleReclamation,
    handleViewDetails,
    handleStatusChange,
  } = useColisModals();

  const [colis, setColis] = useState<Colis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);
  const [sortBy, setSortBy] = useState('recent');
  const [dateFilter, setDateFilter] = useState('toutes');
  const [statuts, setStatuts] = useState<Statut[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const isMobile = useIsMobile();

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    statusFilter !== initialStatus ||
    sortBy !== 'recent' ||
    dateFilter !== 'toutes';

  const resetFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setStatusFilter(initialStatus);
    setSortBy('recent');
    setDateFilter('toutes');
    setCurrentPage(1);
  };

  const fetchColis = async (isRefresh = false) => {
    if (!state.user?.id) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      if (debouncedSearchTerm) {
        // When searching, use a broader query that includes related data
        const searchTerm = `%${debouncedSearchTerm}%`;

        // Get all colis for this livreur first
        const { data: allColis, error: allError } = await supabase
          .from('colis')
          .select(`
            *,
            client:clients(*),
            entreprise:entreprises(*),
            livreur:utilisateurs(*)
          `)
          .eq('livreur_id', state.user.id);

        if (allError) {
          console.error('Error fetching all colis:', allError);
          setColis([]);
          setTotalCount(0);
          setLoading(false);
          setRefreshing(false);
          return;
        }

        // Filter results client-side
        let filteredColis = (allColis || []).filter(colis => {
          const searchLower = debouncedSearchTerm.toLowerCase();
          return (
            colis.id.toLowerCase().includes(searchLower) ||
            (colis.client?.nom && colis.client.nom.toLowerCase().includes(searchLower)) ||
            (colis.client?.telephone && colis.client.telephone.toLowerCase().includes(searchLower)) ||
            (colis.entreprise?.nom && colis.entreprise.nom.toLowerCase().includes(searchLower))
          );
        });

        // Apply status filter
        if (statusFilter !== 'tous') {
          const isRelanceAutreGroup = ['Relancé nouveau client', 'Relancé Autre Client'].includes(statusFilter);
          if (isRelanceAutreGroup) {
            filteredColis = filteredColis.filter(c => ['Relancé nouveau client', 'Relancé Autre Client'].includes(c.statut));
          } else {
            filteredColis = filteredColis.filter(c => c.statut === statusFilter);
          }
        }

        // Apply date filter
        if (dateFilter !== 'toutes') {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
          const yesterday = new Date(today);
          yesterday.setDate(yesterday.getDate() - 1);

          filteredColis = filteredColis.filter(colis => {
            const colisDate = new Date(colis.date_creation);
            const colisDateOnly = new Date(colisDate.getFullYear(), colisDate.getMonth(), colisDate.getDate());

            switch (dateFilter) {
              case 'aujourd_hui':
                return colisDateOnly.getTime() === today.getTime();
              case 'hier':
                return colisDateOnly.getTime() === yesterday.getTime();
              case '7_derniers_jours':
                const sevenDaysAgo = new Date(today);
                sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
                return colisDateOnly >= sevenDaysAgo;
              case '30_derniers_jours':
                const thirtyDaysAgo = new Date(today);
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                return colisDateOnly >= thirtyDaysAgo;
              case 'ce_mois':
                return colisDate.getMonth() === now.getMonth() && colisDate.getFullYear() === now.getFullYear();
              case 'le_mois_dernier':
                const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
                const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
                return colisDate.getMonth() === lastMonth && colisDate.getFullYear() === lastMonthYear;
              case 'periode_personnalisee':
                // For now, treat as "all dates" - could be extended with date picker
                return true;
              default:
                return true;
            }
          });
        }

        // Apply sorting
        if (sortBy === 'recent') {
          filteredColis.sort((a, b) => new Date(b.date_creation).getTime() - new Date(a.date_creation).getTime());
        } else if (sortBy === 'oldest') {
          filteredColis.sort((a, b) => new Date(a.date_creation).getTime() - new Date(b.date_creation).getTime());
        } else if (sortBy === 'status') {
          filteredColis.sort((a, b) => (a.statut || '').localeCompare(b.statut || ''));
        }

        // Apply pagination
        const totalCount = filteredColis.length;
        const from = (currentPage - 1) * entriesPerPage;
        const to = from + entriesPerPage;
        const paginatedResults = filteredColis.slice(from, to);

        setColis(paginatedResults);
        setTotalCount(totalCount);
      } else {
        // Normal query without search
        let query = supabase
          .from('colis')
          .select(`
            *,
            client:clients(*),
            entreprise:entreprises(*),
            livreur:utilisateurs(*)
          `, { count: 'exact' })
          .eq('livreur_id', state.user.id);

        // Apply status filter
        if (statusFilter !== 'tous') {
          const isRelanceAutreGroup = ['Relancé nouveau client', 'Relancé Autre Client'].includes(statusFilter);
          if (isRelanceAutreGroup) {
            query = query.in('statut', ['Relancé nouveau client', 'Relancé Autre Client']);
          } else {
            query = query.eq('statut', statusFilter);
          }
        }

        // Apply date filter
        if (dateFilter !== 'toutes') {
          const now = new Date();
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

          switch (dateFilter) {
            case 'aujourd_hui':
              const todayStart = new Date(today);
              const todayEnd = new Date(today);
              todayEnd.setHours(23, 59, 59, 999);
              query = query.gte('date_creation', todayStart.toISOString()).lte('date_creation', todayEnd.toISOString());
              break;
            case 'hier':
              const yesterday = new Date(today);
              yesterday.setDate(yesterday.getDate() - 1);
              const yesterdayStart = new Date(yesterday);
              const yesterdayEnd = new Date(yesterday);
              yesterdayEnd.setHours(23, 59, 59, 999);
              query = query.gte('date_creation', yesterdayStart.toISOString()).lte('date_creation', yesterdayEnd.toISOString());
              break;
            case '7_derniers_jours':
              const sevenDaysAgo = new Date(today);
              sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
              query = query.gte('date_creation', sevenDaysAgo.toISOString());
              break;
            case '30_derniers_jours':
              const thirtyDaysAgo = new Date(today);
              thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
              query = query.gte('date_creation', thirtyDaysAgo.toISOString());
              break;
            case 'ce_mois':
              const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
              const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
              query = query.gte('date_creation', monthStart.toISOString()).lte('date_creation', monthEnd.toISOString());
              break;
            case 'le_mois_dernier':
              const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
              const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
              const lastMonthStart = new Date(lastMonthYear, lastMonth, 1);
              const lastMonthEnd = new Date(lastMonthYear, lastMonth + 1, 0, 23, 59, 59, 999);
              query = query.gte('date_creation', lastMonthStart.toISOString()).lte('date_creation', lastMonthEnd.toISOString());
              break;
            case 'periode_personnalisee':
              // For now, no filtering - could be extended with date picker
              break;
          }
        }

        // Apply sorting
        if (sortBy === 'recent') {
          query = query.order('date_creation', { ascending: false });
        } else if (sortBy === 'oldest') {
          query = query.order('date_creation', { ascending: true });
        } else if (sortBy === 'status') {
          query = query.order('statut');
        }

        // Apply pagination
        const from = (currentPage - 1) * entriesPerPage;
        const to = from + entriesPerPage - 1;
        query = query.range(from, to);

        const { data, error, count } = await query;

        if (error) {
          console.error('MesColis: Query error:', error);
          setColis([]);
          setTotalCount(0);
        } else {
          setColis(data || []);
          setTotalCount(count || 0);
        }
      }
    } catch (error: any) {
      console.error('Error in fetchColis:', error);
      setColis([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchStatuts = async () => {
    try {
      const { data, error } = await supabase
        .from('statuts')
        .select('id, nom, couleur, type, actif, created_at')
        .eq('type', 'colis')
        .eq('actif', true)
        .order('ordre', { ascending: true });

      if (!error && data) {
        setStatuts(data as Statut[]);
      } else {
        console.error('Error fetching statuts:', error);
      }
    } catch (error) {
      console.error('MesColis: Exception fetching statuts:', error);
    }
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500); // 500ms debounce

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchStatuts();
  }, []);

  // Initial load useEffect
  useEffect(() => {
    if (state.user?.id && !isInitialized) {
      setIsInitialized(true);
      fetchColis();
    }
  }, [state.user?.id, isInitialized]);

  // Keep status filter in sync with initial status
  useEffect(() => {
    setStatusFilter(initialStatus);
  }, [initialStatus]);

  // Filter changes useEffect
  useEffect(() => {
    if (state.user?.id && isInitialized) {
      fetchColis();
    }
  }, [debouncedSearchTerm, statusFilter, sortBy, dateFilter, currentPage, entriesPerPage, isInitialized]);

  // Close filters sidebar when filters change
  useEffect(() => {
    if (isMobile && filtersOpen) {
      setFiltersOpen(false);
    }
  }, [debouncedSearchTerm, statusFilter, sortBy, dateFilter]);

  return (
    <div className="space-y-5">
      {/* Page Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{pageTitle}</h1>
        <p className="text-gray-600 dark:text-gray-400">{pageDescription}</p>
      </div>
      {/* Filters */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          {isMobile ? (
            <div className="space-y-3 w-full">
              <div className="flex items-center justify-between w-full gap-2">
                <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                  <SheetTrigger asChild>
                    <button className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity flex-1">
                      <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      <span className="font-medium text-gray-700 dark:text-gray-300">Filtres</span>
                    </button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                    <SheetHeader>
                      <SheetTitle className="flex items-center gap-2">
                        <Filter className="h-5 w-5" />
                        Filtres
                      </SheetTitle>
                    </SheetHeader>
                    <div className="mt-6 space-y-4">
                      {initialStatus === 'tous' && (
                        <div className="space-y-2">
                          <Select 
                            value={statusFilter} 
                            onValueChange={(value) => {
                              setStatusFilter(value);
                              setFiltersOpen(false);
                            }}
                          >
                        <SelectTrigger>
                          <SelectValue placeholder="Tous les statuts" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="tous">Tous les statuts</SelectItem>
                          {statuts.map((statut) => (
                            <SelectItem key={statut.id} value={statut.nom}>
                              {statut.nom}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Select 
                      value={sortBy} 
                      onValueChange={(value) => {
                        setSortBy(value);
                        setFiltersOpen(false);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Plus récent" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="recent">Plus récent</SelectItem>
                        <SelectItem value="oldest">Plus ancien</SelectItem>
                        <SelectItem value="status">Par statut</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Select 
                      value={dateFilter} 
                      onValueChange={(value) => {
                        setDateFilter(value);
                        setFiltersOpen(false);
                      }}
                    >
                      <SelectTrigger>
                        <Calendar className="h-4 w-4 mr-2" />
                        <SelectValue placeholder="Toutes les dates" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="toutes">Toutes les dates</SelectItem>
                        <SelectItem value="aujourd_hui">Aujourd'hui</SelectItem>
                        <SelectItem value="hier">Hier</SelectItem>
                        <SelectItem value="7_derniers_jours">7 derniers jours</SelectItem>
                        <SelectItem value="30_derniers_jours">30 derniers jours</SelectItem>
                        <SelectItem value="ce_mois">Ce mois</SelectItem>
                        <SelectItem value="le_mois_dernier">Le mois dernier</SelectItem>
                        <SelectItem value="periode_personnalisee">Période personnalisée</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Select 
                      value={entriesPerPage.toString()} 
                      onValueChange={(value) => {
                        setEntriesPerPage(Number(value));
                        setCurrentPage(1);
                        setFiltersOpen(false);
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Entrées par page" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5">5 par page</SelectItem>
                        <SelectItem value="10">10 par page</SelectItem>
                        <SelectItem value="25">25 par page</SelectItem>
                        <SelectItem value="50">50 par page</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {hasActiveFilters && (
                    <Button
                      onClick={() => {
                        resetFilters();
                        setFiltersOpen(false);
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
                  onClick={() => fetchColis(true)}
                  variant="outline"
                  size="sm"
                  disabled={refreshing}
                  className="text-sm flex-1"
                >
                  {refreshing ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                  Actualiser
                </Button>
              </div>
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
            </div>
          ) : (
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filtres
            </h2>
          )}
          <div className="flex items-center gap-2">
            {!isMobile && (
              <Button
                onClick={() => fetchColis(true)}
                variant="outline"
                size="sm"
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
            )}

            {!isMobile && hasActiveFilters && (
              <Button
                onClick={resetFilters}
                variant="outline"
                size="sm"
                className="text-sm"
              >
                <X className="mr-2 h-4 w-4" />
                Réinitialiser
              </Button>
            )}
          </div>
        </div>

        {!isMobile && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 w-full">
            <div className="space-y-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {initialStatus === 'tous' && (
              <div className="space-y-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="tous">Tous les statuts</SelectItem>
                    {statuts.map((statut) => (
                      <SelectItem key={statut.id} value={statut.nom}>
                        {statut.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Plus récent" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="recent">Plus récent</SelectItem>
                  <SelectItem value="oldest">Plus ancien</SelectItem>
                  <SelectItem value="status">Par statut</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <Calendar className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Toutes les dates" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toutes">Toutes les dates</SelectItem>
                  <SelectItem value="aujourd_hui">Aujourd'hui</SelectItem>
                  <SelectItem value="hier">Hier</SelectItem>
                  <SelectItem value="7_derniers_jours">7 derniers jours</SelectItem>
                  <SelectItem value="30_derniers_jours">30 derniers jours</SelectItem>
                  <SelectItem value="ce_mois">Ce mois</SelectItem>
                  <SelectItem value="le_mois_dernier">Le mois dernier</SelectItem>
                  <SelectItem value="periode_personnalisee">Période personnalisée</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Select value={entriesPerPage.toString()} onValueChange={(value) => {
                setEntriesPerPage(Number(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Entrées par page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 par page</SelectItem>
                  <SelectItem value="10">10 par page</SelectItem>
                  <SelectItem value="25">25 par page</SelectItem>
                  <SelectItem value="50">50 par page</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Colis Cards */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-8">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto text-gray-400" />
            <p className="text-gray-500 mt-2">Chargement des colis...</p>
          </div>
        ) : colis.length === 0 ? (
          <div className="text-center py-12">
            <Package className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucun colis trouvé</h3>
            <p className="text-gray-500 dark:text-gray-400">Vous n'avez actuellement aucun colis assigné.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {colis.map((colisItem) => (
              <Card key={colisItem.id} className="rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden border hover:shadow-md transition-all">
                <CardContent className="p-0">
                  {/* Header with ID and Date */}
                  <div className="flex justify-between items-center p-3 bg-muted/30">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{colisItem.id}</span>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(colisItem.date_creation).toLocaleDateString('fr-FR')}
                    </div>
                  </div>

                  {/* Main Content */}
                  <div className="p-4">
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-1">
                        <h3 className="font-semibold">{colisItem.client?.nom || 'Client inconnu'}</h3>

                        <div className="flex items-center text-sm text-muted-foreground">
                          <Phone className="h-3 w-3 mr-1 inline" />
                          <span>{colisItem.client?.telephone || 'N/A'}</span>
                        </div>

                        <div className="flex items-center text-sm text-muted-foreground">
                          <House className="h-3 w-3 mr-1 inline" />
                          <span>{colisItem.adresse_livraison || 'Adresse non spécifiée'}</span>
                        </div>

                        <div className="flex items-center text-sm text-muted-foreground">
                          <MapPin className="h-3 w-3 mr-1 inline" />
                          <span>Casablanca</span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <StatusBadge statut={colisItem.statut} statuts={statuts} />
                    </div>

                    {/* Company and Price */}
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground flex items-center">
                        <Building2 className="h-3 w-3 mr-1 inline" />
                        <span>{colisItem.entreprise?.nom || 'N/A'}</span>
                      </div>
                      <div className="text-xl font-bold">
                        {colisItem.prix ? `${colisItem.prix} DH` : '0 DH'}
                        {colisItem.frais && <span className="text-sm text-muted-foreground"> (+{colisItem.frais} frais)</span>}
                      </div>
                    </div>

                    {/* Contact Buttons */}
                    <div className="mt-4 mb-4">
                      <div className="grid grid-cols-4 sm:grid-cols-2 gap-2">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                          <Phone className="h-3 w-3 mr-1" />
                          <span className="sm:hidden">{getInitials("Vendeur B")}</span>
                          <span className="hidden sm:inline">Vendeur B</span>
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          <span className="sm:hidden">{getInitials("Vendeur B")}</span>
                          <span className="hidden sm:inline">Vendeur B</span>
                        </Button>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs">
                          <Phone className="h-3 w-3 mr-1" />
                          <span className="sm:hidden">{getInitials("Vendeur P")}</span>
                          <span className="hidden sm:inline">Vendeur P</span>
                        </Button>
                        <Button size="sm" className="bg-pink-600 hover:bg-pink-700 text-white text-xs">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          <span className="sm:hidden">{getInitials("Vendeur P")}</span>
                          <span className="hidden sm:inline">Vendeur P</span>
                        </Button>
                      </div>
                    </div>

                    {/* Status Change Button - Hidden for delivered packages */}
                    {colisItem.statut !== 'Livré' && colisItem.statut !== 'livre' && (
                      <div className="mb-4">
                        <Button
                          className="w-full bg-amber-600 hover:bg-amber-700 text-white"
                          onClick={() => handleStatusChange(colisItem)}
                        >
                          <Save className="mr-2 h-4 w-4" />
                          Changer le statut
                        </Button>
                      </div>
                    )}

                    {/* Bottom Action Icons */}
                    <div className="flex justify-center gap-3 pb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800"
                        onClick={() => handleSuivi(colisItem)}
                      >
                        <History className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-3 py-2 bg-cyan-50 dark:bg-cyan-900/20 rounded-lg hover:bg-cyan-100 dark:hover:bg-cyan-900/40 border border-cyan-200 dark:border-cyan-800"
                        onClick={() => handleReclamation(colisItem)}
                      >
                        <Info className="h-4 w-4 text-cyan-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800"
                        onClick={() => handleWhatsApp(colisItem)}
                      >
                        <MessageCircle className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/40 border border-yellow-200 dark:border-yellow-800"
                        onClick={() => handleSMS(colisItem)}
                      >
                        <Mail className="h-4 w-4 text-yellow-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800"
                        onClick={() => handleCall(colisItem)}
                      >
                        <Phone className="h-4 w-4 text-purple-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-3 py-2 bg-gray-50 dark:bg-gray-900/20 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900/40 border border-gray-200 dark:border-gray-800"
                        onClick={() => handleViewDetails(colisItem)}
                      >
                        <Eye className="h-4 w-4 text-gray-600" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && colis.length > 0 && totalCount > entriesPerPage && (() => {
        const totalPages = Math.ceil(totalCount / entriesPerPage);
        return (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <p className="text-sm text-muted-foreground">
                Affichage de {((currentPage - 1) * entriesPerPage) + 1} à {Math.min(currentPage * entriesPerPage, totalCount)} sur {totalCount} résultats
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Précédent
              </Button>
              <div className="flex items-center space-x-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <Button
                      key={pageNum}
                      variant={currentPage === pageNum ? "default" : "outline"}
                      size="sm"
                      onClick={() => setCurrentPage(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Suivant
              </Button>
            </div>
          </div>
        );
      })()}

      {/* Shared Modals */}
      <ColisReclamationModal
        open={showReclamationModal}
        onOpenChange={setShowReclamationModal}
        colis={selectedColis}
      />

      <ColisSuiviModal
        open={showSuiviModal}
        onOpenChange={setShowSuiviModal}
        colis={selectedColis}
        statuts={statuts}
      />

      <ColisDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        colis={selectedColis}
        statuts={statuts}
      />

      <ColisStatusModal
        open={showStatusModal}
        onOpenChange={setShowStatusModal}
        colis={selectedColis}
        statuts={statuts}
        onStatusUpdated={() => fetchColis()}
      />
    </div>
  );
}
