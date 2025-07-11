import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Package, RefreshCw, Search, Filter, Phone, House, MapPin, Building2, Clock, CheckCircle, XCircle, Truck, AlertCircle, MessageCircle, Info, Mail, Eye, Save, Send, MessageSquare } from 'lucide-react';
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Colis, User } from '@/types';
import { api } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';

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

  // Modal states
  const [selectedColis, setSelectedColis] = useState<Colis | null>(null);
  const [showReclamationModal, setShowReclamationModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [reclamationText, setReclamationText] = useState('');

  const debouncedSearchTerm = useDebounce(searchTerm, 300);
  const isLivreur = state.user?.role?.toLowerCase() === 'livreur';

  // Status badge component
  const getStatusBadge = (status: string) => {
    const statusConfig = {
      'en_attente': { color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300', icon: Clock, label: 'En attente' },
      'pris_en_charge': { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300', icon: Truck, label: 'Pris en charge' },
      'en_cours': { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300', icon: Package, label: 'En cours' },
      'Livré': { color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300', icon: CheckCircle, label: 'Livré' },
      'Retourné': { color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300', icon: XCircle, label: 'Retourné' },
      'Annulé': { color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300', icon: AlertCircle, label: 'Annulé' }
    };

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig['en_attente'];
    const IconComponent = config.icon;

    return (
      <Badge className={`${config.color} flex items-center gap-1 w-fit`}>
        <IconComponent className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

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
        // Detailed card view for livreur (like Mes Colis)
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
              <p className="text-gray-500 dark:text-gray-400">Aucun colis trouvé pour ce statut.</p>
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
                          <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white text-xs" onClick={() => handleCall(colisItem)}>
                            <Phone className="h-3 w-3 mr-1" />
                            Vendeur B
                          </Button>
                          <Button size="sm" className="bg-green-600 hover:bg-green-700 text-white text-xs" onClick={() => handleWhatsApp(colisItem)}>
                            <MessageCircle className="h-3 w-3 mr-1" />
                            Vendeur B
                          </Button>
                          <Button size="sm" className="bg-purple-600 hover:bg-purple-700 text-white text-xs" onClick={() => handleCall(colisItem)}>
                            <Phone className="h-3 w-3 mr-1" />
                            Vendeur P
                          </Button>
                          <Button size="sm" className="bg-pink-600 hover:bg-pink-700 text-white text-xs" onClick={() => handleWhatsApp(colisItem)}>
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
                      <TableCell className="font-mono text-sm text-gray-900 dark:text-gray-100">{colisItem.id}</TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">{colisItem.client?.nom}</TableCell>
                      <TableCell className="text-gray-900 dark:text-gray-100">{colisItem.entreprise?.nom}</TableCell>
                      <TableCell>{getStatusBadge(colisItem.statut)}</TableCell>
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
                <div className="space-y-3">
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
