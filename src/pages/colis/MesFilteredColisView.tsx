import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Package, RefreshCw, Search, Filter, X, Phone, House, MapPin, Building2, History, Info, MessageCircle, Mail, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { StatusBadge } from '@/components/ui/status-badge';
import { Colis, Statut } from '@/types';
import { api } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';
import { isDateTodayLocal } from '@/lib/utils';

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

  const statusParam = searchParams.get('status') || 'all';

  const [colis, setColis] = useState<Colis[]>([]);
  const [filteredColis, setFilteredColis] = useState<Colis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>(statusParam);
  const [entrepriseFilter, setEntrepriseFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  const [selectedColis, setSelectedColis] = useState<Colis | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [statuts, setStatuts] = useState<Statut[]>([]);

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

  const handleSuivi = (colisItem: Colis) => {
    setSelectedColis(colisItem);
    setShowDetailsDialog(true);
  };

  const handleReclamation = (colisItem: Colis) => {
    toast({
      title: 'Information',
      description: 'Fonctionnalité de réclamation non disponible pour le moment.',
    });
  };

  const handleWhatsApp = (colisItem: Colis) => {
    toast({
      title: 'Information',
      description: 'Fonctionnalité WhatsApp non disponible pour le moment.',
    });
  };

  const handleSMS = (colisItem: Colis) => {
    toast({
      title: 'Information',
      description: 'Fonctionnalité SMS non disponible pour le moment.',
    });
  };

  const handleCall = (colisItem: Colis) => {
    toast({
      title: 'Information',
      description: 'Fonctionnalité appel non disponible pour le moment.',
    });
  };

  const handleViewDetails = (colisItem: Colis) => {
    setSelectedColis(colisItem);
    setShowDetailsDialog(true);
  };

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{title}</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">{filteredColis.length} colis trouvés</p>
          </div>
        </div>
        <Button onClick={fetchColis} variant="outline" size="sm" className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
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
        </div>
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

      <Dialog open={showDetailsDialog} onOpenChange={setShowDetailsDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du colis #{selectedColis?.numero_colis}</DialogTitle>
            <DialogDescription>Informations complètes sur le colis</DialogDescription>
          </DialogHeader>
          {selectedColis && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Client</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedColis.client_nom} {selectedColis.client_prenom}</p>
                  {selectedColis.client_telephone && <p className="text-sm text-gray-600 dark:text-gray-400">📞 {selectedColis.client_telephone}</p>}
                  {selectedColis.client_email && <p className="text-sm text-gray-600 dark:text-gray-400">✉️ {selectedColis.client_email}</p>}
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Adresse</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedColis.adresse_livraison}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Détails</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Poids: {selectedColis.poids || 'N/A'} kg</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Nombre: {selectedColis.nombre_colis || 1}</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Valeur: {selectedColis.valeur_colis ? selectedColis.valeur_colis + '€' : 'N/A'}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Statut</h4>
                  <StatusBadge statut={selectedColis.statut} />
                  {selectedColis.date_livraison_prevue && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">📅 Livraison prévue: {new Date(selectedColis.date_livraison_prevue).toLocaleDateString('fr-FR')}</p>
                  )}
                </div>
              </div>
              {selectedColis.commentaires && (
                <div>
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Commentaires</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{selectedColis.commentaires}</p>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailsDialog(false)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
