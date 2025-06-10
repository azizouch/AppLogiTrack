import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, Search, Filter, RefreshCw, Phone, MessageCircle, MapPin, Building, Ban, Info, Eye, Mail, House, Building2, Calendar } from 'lucide-react';
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

export function MesColisAnnules() {
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

      // Direct Supabase query for cancelled packages only
      let query = supabase
        .from('colis')
        .select(`
          *,
          client:clients(*),
          entreprise:entreprises(*),
          livreur:utilisateurs(*)
        `, { count: 'exact' })
        .eq('livreur_id', state.user.id)
        .eq('statut', 'Annulé'); // Only get cancelled packages

      // Apply search filter
      if (debouncedSearchTerm) {
        query = query.or(`id.ilike.%${debouncedSearchTerm}%,client.nom.ilike.%${debouncedSearchTerm}%`);
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
      console.log('MesColisAnnules: Direct query result:', { data: data?.length, error, count });

      if (error) {
        console.error('MesColisAnnules: API error:', error);
        toast({
          title: 'Erreur',
          description: `Erreur API: ${error.message || 'Impossible de charger les colis'}`,
          variant: 'destructive',
        });
        setColis([]);
        setTotalCount(0);
      } else {
        console.log('MesColisAnnules: Setting colis data:', data?.length, 'items');
        setColis(data || []);
        setTotalCount(count || 0);
      }
    } catch (error) {
      console.error('MesColisAnnules: Unexpected error:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du chargement',
        variant: 'destructive',
      });
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

  useEffect(() => {
    if (state.user?.id && location.pathname === '/colis/mes-annules') {
      // Reset loading state and fetch immediately
      setLoading(false);
      fetchColis();
    }
  }, [state.user?.id, debouncedSearchTerm, sortBy, dateFilter, currentPage, entriesPerPage, location.pathname]);

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
    return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">{statut}</Badge>;
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
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Envoyer une réclamation</DialogTitle>
            <DialogDescription>
              Décrivez votre réclamation concernant ce colis.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="colis-id" className="text-sm font-medium">
                Colis ID
              </Label>
              <div className="text-sm text-muted-foreground">
                {selectedColis?.id}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="client-name" className="text-sm font-medium">
                Client
              </Label>
              <div className="text-sm text-muted-foreground">
                {selectedColis?.client?.nom}
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reclamation" className="text-sm font-medium">
                Réclamation
              </Label>
              <Textarea
                id="reclamation"
                placeholder="Décrivez votre réclamation..."
                value={reclamationText}
                onChange={(e) => setReclamationText(e.target.value)}
                className="min-h-[100px]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReclamationModal(false)}>
              Annuler
            </Button>
            <Button onClick={submitReclamation} disabled={!reclamationText.trim()}>
              Envoyer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Détails du colis</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {selectedColis && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">ID Colis</Label>
                  <div className="text-sm">{selectedColis.id}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Statut</Label>
                  <div className="text-sm">{getStatusBadge(selectedColis.statut)}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Client</Label>
                  <div className="text-sm">{selectedColis.client?.nom || 'N/A'}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Téléphone</Label>
                  <div className="text-sm">{selectedColis.client?.telephone || 'N/A'}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Entreprise</Label>
                  <div className="text-sm">{selectedColis.entreprise?.nom || 'N/A'}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Prix</Label>
                  <div className="text-sm">{selectedColis.prix ? `${selectedColis.prix} DH` : '0 DH'}</div>
                </div>
                <div className="space-y-2 col-span-2">
                  <Label className="text-sm font-medium">Adresse de livraison</Label>
                  <div className="text-sm">{selectedColis.adresse_livraison || 'N/A'}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date de création</Label>
                  <div className="text-sm">{new Date(selectedColis.date_creation).toLocaleDateString('fr-FR')}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Date de mise à jour</Label>
                  <div className="text-sm">{selectedColis.date_mise_a_jour ? new Date(selectedColis.date_mise_a_jour).toLocaleDateString('fr-FR') : 'N/A'}</div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowDetailsModal(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
