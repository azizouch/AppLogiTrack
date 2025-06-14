import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, Search, Filter, RefreshCw, Phone, MessageCircle, MapPin, Building, CheckCircle, Info, Eye, Mail, House, Building2, Calendar, Send, MessageSquare, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { api, supabase } from '@/lib/supabase';

import { Colis } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function MesColisLivres() {
  const navigate = useNavigate();
  const location = useLocation();
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

  // Modal states
  const [selectedColis, setSelectedColis] = useState<Colis | null>(null);
  const [showReclamationModal, setShowReclamationModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [reclamationText, setReclamationText] = useState('');
  const [statuts, setStatuts] = useState<any[]>([]);

  const fetchColis = async (isRefresh = false) => {
    if (!state.user?.id) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Direct Supabase query for delivered packages only
      let query = supabase
        .from('colis')
        .select(`
          *,
          client:clients(*),
          entreprise:entreprises(*),
          livreur:utilisateurs(*)
        `, { count: 'exact' })
        .eq('livreur_id', state.user.id)
        .eq('statut', 'Livré'); // Only get delivered packages

      // Apply search filter
      if (debouncedSearchTerm) {
        query = query.or(`id.ilike.%${debouncedSearchTerm}%,client.nom.ilike.%${debouncedSearchTerm}%`);
      }

      // Apply date filter
      if (dateFilter !== 'toutes') {
        const today = new Date();
        let startDate: Date;

        switch (dateFilter) {
          case 'aujourd_hui':
            startDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
            query = query.gte('date_mise_a_jour', startDate.toISOString());
            break;
          case 'hier':
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);
            query = query.gte('date_mise_a_jour', startDate.toISOString()).lt('date_mise_a_jour', endDate.toISOString());
            break;
          case '7_derniers_jours':
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 7);
            query = query.gte('date_mise_a_jour', startDate.toISOString());
            break;
          case '30_derniers_jours':
            startDate = new Date(today);
            startDate.setDate(startDate.getDate() - 30);
            query = query.gte('date_mise_a_jour', startDate.toISOString());
            break;
          case 'ce_mois':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1);
            query = query.gte('date_mise_a_jour', startDate.toISOString());
            break;
          case 'le_mois_dernier':
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 1);
            query = query.gte('date_mise_a_jour', lastMonth.toISOString()).lt('date_mise_a_jour', endOfLastMonth.toISOString());
            break;
        }
      }

      // Apply sorting
      if (sortBy === 'recent') {
        query = query.order('date_mise_a_jour', { ascending: false });
      } else if (sortBy === 'oldest') {
        query = query.order('date_mise_a_jour', { ascending: true });
      }

      // Apply pagination
      const from = (currentPage - 1) * entriesPerPage;
      const to = from + entriesPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) {
        console.error('Query error:', error);
        setColis([]);
        setTotalCount(0);
      } else {
        setColis(data || []);
        setTotalCount(count || 0);
      }
    } catch (error: any) {
      console.error('MesColisLivres: Error in fetchColis:', error);
      setColis([]);
      setTotalCount(0);
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

  // Initial load useEffect
  useEffect(() => {
    if (state.user?.id) {
      fetchColis();
    }
  }, [state.user?.id]);

  // Filter changes useEffect
  useEffect(() => {
    if (state.user?.id) {
      fetchColis();
    }
  }, [debouncedSearchTerm, sortBy, dateFilter, currentPage, entriesPerPage]);

  const fetchStatuts = async () => {
    try {
      const { data, error } = await supabase
        .from('statuts')
        .select('id, nom, couleur, type, actif')
        .eq('type', 'colis')
        .eq('actif', true)
        .order('ordre', { ascending: true });

      if (!error && data) {
        setStatuts(data);
      }
    } catch (error) {
      console.error('Error fetching statuts:', error);
    }
  };

  useEffect(() => {
    fetchStatuts();
  }, []);

  const getColorClass = (couleur: string) => {
    const colorMap: { [key: string]: string } = {
      'blue': 'bg-blue-500 text-white',
      'green': 'bg-green-500 text-white',
      'red': 'bg-red-500 text-white',
      'yellow': 'bg-yellow-500 text-black',
      'orange': 'bg-orange-500 text-white',
      'purple': 'bg-purple-500 text-white',
      'pink': 'bg-pink-500 text-white',
      'gray': 'bg-gray-500 text-white',
      'teal': 'bg-teal-500 text-white',
      'indigo': 'bg-indigo-500 text-white',
      'lime': 'bg-lime-500 text-black',
      'cyan': 'bg-cyan-500 text-white',
      'amber': 'bg-amber-500 text-black',
    };
    return colorMap[couleur] || 'bg-gray-500 text-white';
  };

  const getStatusBadge = (statut: string) => {
    const statutData = statuts.find(s => s.nom === statut);
    if (statutData && statutData.couleur) {
      return (
        <Badge className={`${getColorClass(statutData.couleur)} border-0`}>
          {statutData.nom}
        </Badge>
      );
    }

    // Fallback for unknown status
    return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">{statut}</Badge>;
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

  // Modal handlers
  const handleReclamation = (colisItem: Colis) => {
    setSelectedColis(colisItem);
    setShowReclamationModal(true);
  };

  const handleWhatsApp = (colisItem: Colis) => {
    if (colisItem.client?.telephone) {
      const phoneNumber = colisItem.client.telephone.replace(/\D/g, '');
      const message = `Bonjour, concernant votre colis ${colisItem.id}`;
      window.open(`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleSMS = (colisItem: Colis) => {
    if (colisItem.client?.telephone) {
      const phoneNumber = colisItem.client.telephone.replace(/\D/g, '');
      const message = `Bonjour, concernant votre colis ${colisItem.id}`;
      window.open(`sms:${phoneNumber}?body=${encodeURIComponent(message)}`, '_blank');
    }
  };

  const handleCall = (colisItem: Colis) => {
    if (colisItem.client?.telephone) {
      window.open(`tel:${colisItem.client.telephone}`, '_blank');
    }
  };

  const handleViewDetails = (colisItem: Colis) => {
    setSelectedColis(colisItem);
    setShowDetailsModal(true);
  };

  const submitReclamation = async () => {
    if (!selectedColis || !reclamationText.trim() || !state.user) return;

    try {
      // Get admin and gestionnaire users to notify
      const { data: adminUsers, error: adminError } = await api.getAdminAndGestionnaireUsers();

      if (adminError) {
        console.error('Error fetching admin users:', adminError);
      }

      // Create notifications for each admin/gestionnaire
      if (adminUsers && adminUsers.length > 0) {
        const notificationPromises = adminUsers.map(admin =>
          api.createNotification({
            utilisateur_id: admin.id,
            titre: 'Nouvelle réclamation',
            message: `Le livreur ${state.user.prenom} ${state.user.nom} a envoyé une réclamation pour le colis ${selectedColis.id}: "${reclamationText.substring(0, 100)}${reclamationText.length > 100 ? '...' : ''}"`,
            lu: false,
            type: 'reclamation'
          })
        );

        await Promise.all(notificationPromises);
      }

      toast({
        title: 'Réclamation envoyée',
        description: 'Votre réclamation a été envoyée avec succès',
      });
      setShowReclamationModal(false);
      setReclamationText('');
    } catch (error) {
      console.error('Error submitting reclamation:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'envoyer la réclamation',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Colis Livrés</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Total: {totalCount} colis livrés
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
                <X className="mr-2 h-4 w-4" />
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
            <CheckCircle className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Aucun colis livré</h3>
            <p className="text-gray-500 dark:text-gray-400">Vous n'avez actuellement aucun colis livré.</p>
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
                        onClick={() => handleReclamation(colisItem)}
                      >
                        <Info className="h-4 w-4 text-blue-600" />
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
          <DialogFooter>
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
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
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
                    <p className="font-mono bg-muted p-1 rounded text-xs">{selectedColis.id}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground">Date</h4>
                    <p>{new Date(selectedColis.date_creation).toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-muted-foreground">Statut</h4>
                    {getStatusBadge(selectedColis.statut)}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium text-muted-foreground">Vendeur B</h4>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-xs"
                      >
                        <Phone className="mr-1 h-3 w-3" />
                        Appeler
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-xs"
                      >
                        <MessageCircle className="mr-1 h-3 w-3" />
                        WhatsApp
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-medium text-muted-foreground">Vendeur P</h4>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-xs"
                      >
                        <Phone className="mr-1 h-3 w-3" />
                        Appeler
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 h-7 text-xs"
                      >
                        <MessageCircle className="mr-1 h-3 w-3" />
                        WhatsApp
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
