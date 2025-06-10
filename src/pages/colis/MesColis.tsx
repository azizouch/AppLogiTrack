import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Package, Search, Filter, RefreshCw, Phone, MessageCircle, MapPin, Building, Calendar, Eye, Info, CheckCircle, AlertCircle, Clock, House, Building2, Save, MessageSquare, CircleAlert, X, Send, Mail, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { api, supabase } from '@/lib/supabase';

import { Colis, Statut } from '@/types';
import { useToast } from '@/hooks/use-toast';

export function MesColis() {
  const navigate = useNavigate();
  const location = useLocation();
  const { state } = useAuth();
  const { toast } = useToast();

  const [colis, setColis] = useState<Colis[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('tous');
  const [sortBy, setSortBy] = useState('recent');
  const [dateFilter, setDateFilter] = useState('toutes');
  const [statuts, setStatuts] = useState<Statut[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // Modal states
  const [selectedColis, setSelectedColis] = useState<Colis | null>(null);
  const [showReclamationModal, setShowReclamationModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [reclamationText, setReclamationText] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [statusNote, setStatusNote] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchColis = async (isRefresh = false) => {
    if (!state.user?.id) return;

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      console.log('MesColis: Fetching colis for user:', state.user.id);

      // Direct Supabase query - no complex recovery logic
      let query = supabase
        .from('colis')
        .select(`
          *,
          client:clients(*),
          entreprise:entreprises(*),
          livreur:utilisateurs(*)
        `, { count: 'exact' })
        .eq('livreur_id', state.user.id);

      // Apply filters
      if (debouncedSearchTerm) {
        query = query.or(`id.ilike.%${debouncedSearchTerm}%,client.nom.ilike.%${debouncedSearchTerm}%`);
      }
      if (statusFilter !== 'tous') {
        query = query.eq('statut', statusFilter);
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

      console.log('MesColis: Direct query result:', { data: data?.length, error, count });

      if (error) {
        console.error('MesColis: Query error:', error);
        setColis([]);
        setTotalCount(0);
      } else {
        console.log('MesColis: Setting colis data:', data?.length, 'items');
        setColis(data || []);
        setTotalCount(count || 0);
      }
    } catch (error: any) {
      console.error('MesColis: Error in fetchColis:', error);
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
        .select('id, nom, couleur, type, actif')
        .eq('type', 'colis')
        .eq('actif', true)
        .order('ordre', { ascending: true });

      if (!error && data) {
        console.log('MesColis: Fetched statuts:', data);
        setStatuts(data);
      } else {
        console.error('MesColis: Error fetching statuts:', error);
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

  // Filter changes useEffect
  useEffect(() => {
    if (state.user?.id && isInitialized) {
      fetchColis();
    }
  }, [debouncedSearchTerm, statusFilter, sortBy, dateFilter, currentPage, entriesPerPage, isInitialized]);

  const getStatusColor = (statut: string) => {
    const statutData = statuts.find(s => s.nom === statut);
    if (statutData) {
      return `text-white`;
    }

    // Fallback colors for unknown status
    switch (statut) {
      case 'Livré':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'En cours de livraison':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Pris en charge':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Refusé':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'Annulé':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

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
    console.log('MesColis: getStatusBadge called with:', statut);
    console.log('MesColis: Available statuts:', statuts);

    const statutData = statuts.find(s => s.nom === statut);
    console.log('MesColis: Found statutData:', statutData);

    if (statutData && statutData.couleur) {
      const colorClass = getColorClass(statutData.couleur);
      console.log('MesColis: Using color class:', colorClass);
      return (
        <Badge className={`${colorClass} border-0`}>
          {statutData.nom}
        </Badge>
      );
    }

    // Fallback for unknown status
    console.log('MesColis: Using fallback for status:', statut);
    return <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">{statut}</Badge>;
  };

  const getStatusIcon = (statut: string) => {
    switch (statut) {
      case 'livre':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'en_cours':
      case 'pris_en_charge':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'mise_en_distribution':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      default:
        return <Info className="h-4 w-4 text-gray-600" />;
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setDebouncedSearchTerm('');
    setStatusFilter('tous');
    setSortBy('recent');
    setDateFilter('toutes');
    setCurrentPage(1);
  };

  const hasActiveFilters = searchTerm || statusFilter !== 'tous' || sortBy !== 'recent' || dateFilter !== 'toutes';

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

  const handleStatusChange = (colisItem: Colis) => {
    setSelectedColis(colisItem);
    setNewStatus(colisItem.statut || '');
    setStatusNote('');
    setShowStatusModal(true);
  };

  const updateColisStatus = async () => {
    if (!selectedColis || !newStatus) return;

    setIsUpdating(true);
    try {
      const { error } = await withRecovery(() => api.updateColis(selectedColis.id, {
        statut: newStatus
      }));

      if (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de mettre à jour le statut',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Succès',
          description: 'Statut mis à jour avec succès',
        });
        setShowStatusModal(false);
        fetchColis(); // Refresh the list
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const submitReclamation = async () => {
    if (!selectedColis || !reclamationText.trim() || !state.user) {
      return;
    }

    try {
      // Get admin and gestionnaire users to notify
      const { data: adminUsers, error: adminError } = await api.getAdminAndGestionnaireUsers();

      if (adminError) {
        console.error('Error fetching admin users:', adminError);
        toast({
          title: 'Erreur',
          description: 'Impossible de récupérer les administrateurs',
          variant: 'destructive',
        });
        return;
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

        const results = await Promise.all(notificationPromises);

        // Check if any notifications failed
        const failures = results.filter(r => r.error);
        if (failures.length > 0) {
          console.error('Some notifications failed:', failures);
          toast({
            title: 'Réclamation envoyée',
            description: 'Réclamation envoyée mais certaines notifications ont échoué',
            variant: 'destructive',
          });
        } else {
          toast({
            title: 'Réclamation envoyée',
            description: 'Votre réclamation a été envoyée avec succès',
          });
        }
      } else {
        // No admin users found - let's check what users exist
        const { data: allUsers } = await supabase
          .from('utilisateurs')
          .select('id, nom, prenom, role, statut, email')
          .limit(10);

        console.log('No admin users found. All users in database:', allUsers?.map(u => ({
          id: u.id,
          role: u.role,
          statut: u.statut,
          nom: u.nom,
          email: u.email
        })));

        toast({
          title: 'Réclamation envoyée',
          description: 'Réclamation enregistrée (aucun administrateur trouvé)',
        });
      }

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



  const submitStatusChange = async () => {
    if (!selectedColis || !newStatus) return;

    try {
      // Update colis status
      const { error: updateError } = await supabase
        .from('colis')
        .update({
          statut: newStatus,
          date_mise_a_jour: new Date().toISOString()
        })
        .eq('id', selectedColis.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Get current user for historique
      const { data: userData } = await supabase.auth.getUser();
      const currentUserId = userData?.user?.id || null;

      // Add to historique
      const historiqueEntry = {
        colis_id: selectedColis.id,
        statut: newStatus,
        date: new Date().toISOString(),
        utilisateur: currentUserId
      };

      await supabase
        .from('historique_colis')
        .insert(historiqueEntry);

      toast({
        title: 'Statut mis à jour',
        description: 'Le statut du colis a été mis à jour avec succès',
      });
      setShowStatusModal(false);
      setStatusNote('');
      fetchColis(true);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la mise à jour',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-6">
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

                    {/* Status Change Button - Hidden for delivered packages */}
                    {colisItem.statut !== 'Livré' && colisItem.statut !== 'livre' && (
                      <div className="mt-4 mb-4">
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
                    <div className="flex justify-center gap-3 pt-2 pb-2">
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

      {/* Status Change Modal */}
      <Dialog open={showStatusModal} onOpenChange={setShowStatusModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <Save className="mr-2 h-5 w-5" />
              Changer le statut du colis
            </DialogTitle>
            <DialogDescription>
              Mettre à jour le statut du colis #{selectedColis?.id}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <p className="text-sm font-medium">Statut actuel:</p>
                {selectedColis && (
                  <Badge variant="outline" className={getStatusColor(selectedColis.statut || 'En attente')}>
                    {selectedColis.statut || 'En attente'}
                  </Badge>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="newStatus">Nouveau statut</Label>
              <Select
                defaultValue={selectedColis?.statut}
                value={newStatus}
                onValueChange={setNewStatus}
              >
                <SelectTrigger id="newStatus">
                  <SelectValue placeholder="Sélectionner un statut" />
                </SelectTrigger>
                <SelectContent>
                  {statuts && statuts.length > 0 ? (
                    statuts.map((status) => (
                      <SelectItem key={status.id} value={status.nom}>
                        {status.nom}
                      </SelectItem>
                    ))
                  ) : (
                    // Fallback options if statuses aren't loaded
                    <>
                      <SelectItem value="En attente">En attente</SelectItem>
                      <SelectItem value="Pris en charge">Pris en charge</SelectItem>
                      <SelectItem value="En cours de livraison">En cours de livraison</SelectItem>
                      <SelectItem value="Livré">Livré</SelectItem>
                      <SelectItem value="Refusé">Refusé</SelectItem>
                      <SelectItem value="Annulé">Annulé</SelectItem>
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="statusNote">Note (optionnel)</Label>
              <Textarea
                id="statusNote"
                placeholder="Ajouter une note concernant le changement de statut..."
                value={statusNote}
                onChange={(e) => setStatusNote(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStatusModal(false)}>
              Annuler
            </Button>
            <Button
              onClick={updateColisStatus}
              disabled={isUpdating || newStatus === selectedColis?.statut}
            >
              {isUpdating ? (
                <>
                  <RotateCcw className="mr-2 h-4 w-4 animate-spin" />
                  Mise à jour...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Mettre à jour
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
