import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Package, Search, Filter, RefreshCw, Phone, MessageCircle, MapPin, Building, Ban, Info, Eye, Mail, House, Building2, Calendar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/supabase';
import { Colis } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function MesColisAnnules() {
  const navigate = useNavigate();
  const { state } = useAuth();
  const { toast } = useToast();

  const [colis, setColis] = useState<Colis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('recent');
  const [dateFilter, setDateFilter] = useState('toutes');
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  const fetchColis = async (isRefresh = false) => {
    if (!state.user?.id) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { data, error, count } = await api.getColis({
        livreurId: state.user.id,
        search: debouncedSearchTerm || undefined,
        status: 'Annulé',
        sortBy: sortBy as 'recent' | 'oldest' | 'status',
        dateFilter: dateFilter !== 'toutes' ? dateFilter : undefined,
        page: currentPage,
        limit: entriesPerPage
      });

      if (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les colis',
          variant: 'destructive',
        });
      } else {
        setColis(data || []);
        setTotalCount(count || 0);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du chargement',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    if (state.user?.id) {
      fetchColis();
    }
  }, [state.user?.id, debouncedSearchTerm, sortBy, dateFilter, currentPage, entriesPerPage]);

  const getStatusBadge = (statut: string) => {
    return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">Annulé</Badge>;
  };

  const resetFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setSortBy('recent');
    setDateFilter('toutes');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || sortBy !== 'recent' || dateFilter !== 'toutes';
  const totalPages = Math.ceil(totalCount / entriesPerPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Colis Annulés</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Total: {totalCount} colis annulés
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filtres
          </h2>
          <div className="flex items-center gap-2">
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
            {hasActiveFilters && (
              <Button
                onClick={resetFilters}
                variant="outline"
                size="sm"
                className="text-sm"
              >
                Réinitialiser
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

          <div className="space-y-2">
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="Plus récent" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Plus récent</SelectItem>
                <SelectItem value="oldest">Plus ancien</SelectItem>
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
            <Ban className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucun colis annulé</h3>
            <p className="text-gray-500 dark:text-gray-400">Vous n'avez actuellement aucun colis annulé.</p>
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
                      {getStatusBadge(colisItem.statut)}
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
                    <div className="mt-4">
                      <div className="grid grid-cols-2 gap-2">
                        <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs">
                          <Phone className="h-3 w-3 mr-1" />
                          Vendeur B
                        </Button>
                        <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Vendeur B
                        </Button>
                        <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs">
                          <Phone className="h-3 w-3 mr-1" />
                          Vendeur P
                        </Button>
                        <Button size="sm" className="bg-pink-600 hover:bg-pink-700 text-white text-xs">
                          <MessageCircle className="h-3 w-3 mr-1" />
                          Vendeur P
                        </Button>
                      </div>
                    </div>

                    {/* Bottom Action Icons */}
                    <div className="flex justify-center gap-3 pt-4 pb-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/40 border border-blue-200 dark:border-blue-800"
                      >
                        <Info className="h-4 w-4 text-blue-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-3 py-2 bg-green-50 dark:bg-green-900/20 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 border border-green-200 dark:border-green-800"
                      >
                        <MessageCircle className="h-4 w-4 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-3 py-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg hover:bg-yellow-100 dark:hover:bg-yellow-900/40 border border-yellow-200 dark:border-yellow-800"
                      >
                        <Mail className="h-4 w-4 text-yellow-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-3 py-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/40 border border-purple-200 dark:border-purple-800"
                      >
                        <Phone className="h-4 w-4 text-purple-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="px-3 py-2 bg-gray-50 dark:bg-gray-900/20 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-900/40 border border-gray-200 dark:border-gray-800"
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
      {!loading && colis.length > 0 && totalCount > entriesPerPage && (
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
      )}
    </div>
  );
}
