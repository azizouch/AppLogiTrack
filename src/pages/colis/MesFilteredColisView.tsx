import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Package, RefreshCw, Search, Filter, X, Phone, House, MapPin, Building2, History, Info, MessageCircle, Mail, Eye, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { StatusBadge } from '@/components/ui/status-badge';
import { Colis, Statut } from '@/types';
import { api } from '@/lib/supabase';
import { isDateTodayLocal } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useColisModals } from '@/hooks/useColisModals';
import { ColisDetailsModal, ColisReclamationModal, ColisSuiviModal, handleWhatsApp, handleSMS, handleCall } from '@/components/colis';

const STATUS_MAPPING: Record<string, string[]> = {
  a_livrer_aujourdhui: ['en_attente', 'pris_en_charge'],
  en_cours: ['en_cours'],
  livres_aujourdhui: ['livré', 'livre'],
  retournes_livreur: ['retourné', 'retourne'],
};

const STATUS_TITLES: Record<string, string> = {
  a_livrer_aujourdhui: 'À livrer aujourd\'hui',
  en_cours: 'En cours',
  livres_aujourdhui: 'Livrés aujourd\'hui',
  retournes_livreur: 'Retournés',
};

const normalizeStatus = (statut?: string) => (statut || '').toLowerCase().trim();

const isDeliveredStatus = (statut?: string) => {
  const normalized = normalizeStatus(statut);
  return normalized === 'livré' || normalized === 'livre';
};

export function MesFilteredColisView() {
  const { state } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  const statusParam = searchParams.get('status') || 'all';

  const [colis, setColis] = useState<Colis[]>([]);
  const [filteredColis, setFilteredColis] = useState<Colis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(statusParam);
  const [entrepriseFilter, setEntrepriseFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(12);
  const [statuts, setStatuts] = useState<Statut[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Use shared modal hook
  const {
    selectedColis,
    showReclamationModal,
    showDetailsModal,
    showSuiviModal,
    setShowReclamationModal,
    setShowDetailsModal,
    setShowSuiviModal,
    handleSuivi,
    handleReclamation,
    handleViewDetails,
  } = useColisModals();

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const title = statusFilter !== 'all' ? STATUS_TITLES[statusFilter] ?? 'Colis filtrés' : 'Colis filtrés';

  useEffect(() => {
    setStatusFilter(statusParam);
  }, [statusParam]);

  const fetchColis = useCallback(async () => {
    if (!state.user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await api.getColis({
        livreurId: state.user.id,
        limit: 1000,
      });

      if (error) {
        console.error('Error fetching colis:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les colis.',
          variant: 'destructive',
        });
        return;
      }

      setColis(data || []);
    } catch (error) {
      console.error('Error fetching colis:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du chargement des colis.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [state.user?.id, toast]);

  useEffect(() => {
    fetchColis();
  }, [fetchColis]);

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

  useEffect(() => {
    fetchStatuts();
  }, [fetchStatuts]);

  // Auto-close filter sidebar on mobile when filters change
  useEffect(() => {
    if (isMobile && filtersOpen) {
      setFiltersOpen(false);
    }
  }, [searchTerm, entrepriseFilter, isMobile]);

  const resetFilters = () => {
    setSearchTerm('');
    setEntrepriseFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm.trim() !== '' || entrepriseFilter !== 'all';

  useEffect(() => {
    let filtered = colis;

    if (statusFilter && statusFilter !== 'all') {
      if (statusFilter === 'livres_aujourdhui') {
        filtered = filtered.filter(colisItem =>
          isDeliveredStatus(colisItem.statut) && isDateTodayLocal(colisItem.date_mise_a_jour)
        );
      } else {
        const mapping = STATUS_MAPPING[statusFilter];
        if (mapping) {
          filtered = filtered.filter(colisItem => mapping.includes(normalizeStatus(colisItem.statut)));
        } else {
          filtered = filtered.filter(colisItem => normalizeStatus(colisItem.statut) === normalizeStatus(statusFilter));
        }
      }
    }

    if (entrepriseFilter !== 'all') {
      filtered = filtered.filter(colisItem => colisItem.entreprise?.nom === entrepriseFilter);
    }

    if (debouncedSearchTerm) {
      const term = debouncedSearchTerm.toLowerCase();
      filtered = filtered.filter(colisItem =>
        colisItem.id?.toLowerCase().includes(term) ||
        colisItem.numero_colis?.toLowerCase().includes(term) ||
        colisItem.client_nom?.toLowerCase().includes(term) ||
        colisItem.client_prenom?.toLowerCase().includes(term) ||
        colisItem.client?.nom?.toLowerCase().includes(term) ||
        colisItem.client?.telephone?.toLowerCase().includes(term) ||
        colisItem.adresse_livraison?.toLowerCase().includes(term) ||
        colisItem.entreprise?.nom?.toLowerCase().includes(term)
      );
    }

    setFilteredColis(filtered);
    setCurrentPage(1);
  }, [colis, entrepriseFilter, debouncedSearchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredColis.length / itemsPerPage);
  const currentColis = filteredColis.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getInitials = (text: string) =>
    text
      .split(' ')
      .map(word => word[0] ?? '')
      .join('')
      .toUpperCase();

  const renderColisCard = (colisItem: Colis) => (
    <Card key={colisItem.id} className="rounded-lg bg-card text-card-foreground shadow-sm overflow-hidden border hover:shadow-md transition-all">
      <CardContent className="p-0">
        <div className="flex justify-between items-center p-3 bg-muted/30">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">{colisItem.id}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            {colisItem.date_creation ? new Date(colisItem.date_creation).toLocaleDateString('fr-FR') : ''}
          </div>
        </div>

        <div className="p-4">
          <div className="flex justify-between items-start mb-4">
            <div className="space-y-1">
              <h3 className="font-semibold">{colisItem.client?.nom || colisItem.client_nom || 'Client inconnu'}</h3>
              <div className="flex items-center text-sm text-muted-foreground">
                <Phone className="h-3 w-3 mr-1 inline" />
                <span>{colisItem.client?.telephone || colisItem.client_telephone || 'N/A'}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <House className="h-3 w-3 mr-1 inline" />
                <span>{colisItem.adresse_livraison || 'Adresse non spécifiée'}</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <MapPin className="h-3 w-3 mr-1 inline" />
                <span>{colisItem.client?.ville || 'Ville non spécifiée'}</span>
              </div>
            </div>
            <StatusBadge statut={colisItem.statut} statuts={statuts} />
          </div>

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

          <div className="mt-4 mb-4">
            <div className="grid grid-cols-4 sm:grid-cols-2 gap-2">
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                <Phone className="h-3 w-3 mr-1" />
                <span className="sm:hidden">{getInitials(colisItem.client?.nom || 'V')}</span>
                <span className="hidden sm:inline">Contact</span>
              </Button>
              <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs">
                <MessageCircle className="h-3 w-3 mr-1" />
                <span className="sm:hidden">MSG</span>
                <span className="hidden sm:inline">Message</span>
              </Button>
              <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs">
                <Phone className="h-3 w-3 mr-1" />
                <span className="sm:hidden">{getInitials(colisItem.client?.nom || 'P')}</span>
                <span className="hidden sm:inline">Suivi</span>
              </Button>
              <Button size="sm" className="bg-pink-600 hover:bg-pink-700 text-white text-xs">
                <MessageCircle className="h-3 w-3 mr-1" />
                <span className="sm:hidden">R</span>
                <span className="hidden sm:inline">Reclamation</span>
              </Button>
            </div>
          </div>

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
              className="px-3 py-2 bg-gray-50 dark:bg-gray-900/20 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900/40 border border-gray-200 dark:border-gray-800"
              onClick={() => handleCall(colisItem)}
            >
              <Phone className="h-4 w-4 text-gray-600" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800"
              onClick={() => handleViewDetails(colisItem)}
            >
              <Eye className="h-4 w-4 text-purple-600" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 border border-gray-200 dark:border-gray-800"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-xl">{title}</h1>
        </div>
        <div>
            <p className="text-sm text-gray-600 dark:text-gray-400">{filteredColis.length} colis trouvés</p>
        </div>
      </div>

      <div className="space-y-3">
        {isMobile ? (
          <div className="space-y-2 w-full">
            {/* Row 1: Filtres button + Actualiser button */}
            <div className="flex items-center justify-between w-full gap-2">
              <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
                <SheetTrigger asChild>
                  <button className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity flex-1">
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
                  </SheetHeader>
                  <div className="space-y-4 mt-6">
                    <Select value={entrepriseFilter} onValueChange={setEntrepriseFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Toutes les entreprises" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les entreprises</SelectItem>
                        {Array.from(new Set(colis
                          .map(colisItem => colisItem.entreprise?.nom)
                          .filter((nom): nom is string => Boolean(nom))
                        ))
                          .sort()
                          .map((nom) => (
                            <SelectItem key={nom} value={nom}>{nom}</SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                    <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                      <SelectTrigger>
                        <SelectValue placeholder="12 par page" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="6">6 par page</SelectItem>
                        <SelectItem value="12">12 par page</SelectItem>
                        <SelectItem value="24">24 par page</SelectItem>
                        <SelectItem value="48">48 par page</SelectItem>
                      </SelectContent>
                    </Select>
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
                variant="outline"
                onClick={fetchColis}
                disabled={false}
                className="text-sm flex-1"
              >
                <RefreshCw className="h-4 w-4" />
                Actualiser
              </Button>
            </div>
            {/* Row 2: Search input only */}
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
          <>
            <div className="flex items-center justify-between">
              <h2 className="font-medium flex items-center gap-2 text-gray-700 dark:text-gray-300">
                <Filter className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                Filtres
              </h2>
              <div className="flex items-center gap-2">
                <Button onClick={fetchColis} variant="outline" size="sm" className="text-sm">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Actualiser
                </Button>
                {hasActiveFilters && (
                  <Button onClick={resetFilters} variant="outline" size="sm" className="text-sm">
                    <X className="mr-2 h-4 w-4" />
                    Réinitialiser
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Rechercher par numéro, client, adresse ou entreprise..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="flex-1 sm:w-64">
                <Select value={entrepriseFilter} onValueChange={setEntrepriseFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Toutes les entreprises" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les entreprises</SelectItem>
                    {Array.from(new Set(colis
                      .map(colisItem => colisItem.entreprise?.nom)
                      .filter((nom): nom is string => Boolean(nom))
                    ))
                      .sort()
                      .map((nom) => (
                        <SelectItem key={nom} value={nom}>{nom}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 sm:w-48">
                <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="12 par page" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="6">6 par page</SelectItem>
                    <SelectItem value="12">12 par page</SelectItem>
                    <SelectItem value="24">24 par page</SelectItem>
                    <SelectItem value="48">48 par page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </>
        )}
      </div>

      {currentColis.length > 0 ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {currentColis.map(renderColisCard)}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 mt-6">
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))} disabled={currentPage === 1}>
                Précédent
              </Button>
              <span className="text-sm text-gray-600 dark:text-gray-400">Page {currentPage} sur {totalPages}</span>
              <Button variant="outline" size="sm" onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))} disabled={currentPage === totalPages}>
                Suivant
              </Button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucun colis trouvé</h3>
          <p className="text-gray-600 dark:text-gray-400">Aucun colis ne correspond aux critères de recherche.</p>
        </div>
      )}

      <ColisDetailsModal
        open={showDetailsModal}
        onOpenChange={setShowDetailsModal}
        colis={selectedColis}
        statuts={statuts}
      />

      <ColisSuiviModal
        open={showSuiviModal}
        onOpenChange={setShowSuiviModal}
        colis={selectedColis}
        statuts={statuts}
      />

      <ColisReclamationModal
        open={showReclamationModal}
        onOpenChange={setShowReclamationModal}
        colis={selectedColis}
      />
    </div>
  );
}
