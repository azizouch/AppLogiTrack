import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, RefreshCw, Eye, Edit, Trash2, Truck, User, X, Package, PanelLeftOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { TablePagination } from '@/components/ui/table-pagination';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { User as UserType, Colis } from '@/types';
import { api } from '@/lib/supabase';
import { useDebounce } from '@/hooks/useDebounce';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { AddColisModal } from '@/components/modals/AddColisModal';
import { AssignColisModal } from '@/components/modals/AssignColisModal';

export function Livreurs() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();

  // Data state
  const [livreurs, setLivreurs] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [vehiculeFilter, setVehiculeFilter] = useState('all');
  const [nombreFilter, setNombreFilter] = useState('all');
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Mobile state
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Available filter options
  const [zones, setZones] = useState<string[]>([]);
  const [vehicules, setVehicules] = useState<string[]>([]);

  // Assignment modal state
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedLivreur, setSelectedLivreur] = useState<UserType | null>(null);

  // Add colis modal state
  const [showAddColisModal, setShowAddColisModal] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch livreurs data
  const fetchLivreurs = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { data, error } = await api.getUsers();

      if (error) {
        console.error('Error fetching users:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les livreurs',
          variant: 'destructive',
        });
        setLivreurs([]);
        setTotalCount(0);
      } else if (data) {
        // Filter only livreurs (case insensitive)
        const livreursOnly = data.filter(user =>
          user.role?.toLowerCase() === 'livreur' || user.role === 'Livreur'
        );

        // Extract unique zones and vehicules for filters
        const uniqueZones = [...new Set(livreursOnly.map(l => l.zone).filter(Boolean))];
        const uniqueVehicules = [...new Set(livreursOnly.map(l => l.vehicule).filter(Boolean))];
        setZones(uniqueZones);
        setVehicules(uniqueVehicules);

        // Apply filters
        let filteredLivreurs = livreursOnly;

        // Search filter
        if (debouncedSearchTerm) {
          filteredLivreurs = filteredLivreurs.filter(livreur =>
            livreur.nom.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            livreur.prenom?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            livreur.email?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            livreur.telephone?.includes(debouncedSearchTerm) ||
            livreur.zone?.toLowerCase().includes(debouncedSearchTerm.toLowerCase()) ||
            livreur.vehicule?.toLowerCase().includes(debouncedSearchTerm.toLowerCase())
          );
        }

        // Zone filter
        if (zoneFilter !== 'all') {
          filteredLivreurs = filteredLivreurs.filter(livreur => livreur.zone === zoneFilter);
        }

        // Vehicule filter
        if (vehiculeFilter !== 'all') {
          filteredLivreurs = filteredLivreurs.filter(livreur => livreur.vehicule === vehiculeFilter);
        }

        // Nombre filter (based on assigned colis count - we'll implement this later)
        // For now, we'll just sort by name
        if (nombreFilter === 'plus') {
          filteredLivreurs.sort((a, b) => b.nom.localeCompare(a.nom));
        } else if (nombreFilter === 'moins') {
          filteredLivreurs.sort((a, b) => a.nom.localeCompare(b.nom));
        }

        // Apply pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedLivreurs = filteredLivreurs.slice(startIndex, endIndex);

        setLivreurs(paginatedLivreurs);
        setTotalCount(filteredLivreurs.length);
        setTotalPages(Math.ceil(filteredLivreurs.length / itemsPerPage));
        setHasNextPage(endIndex < filteredLivreurs.length);
        setHasPrevPage(currentPage > 1);
      }
    } catch (error) {
      console.error('Error fetching livreurs:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du chargement',
        variant: 'destructive',
      });
      setLivreurs([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [currentPage, debouncedSearchTerm, zoneFilter, vehiculeFilter, nombreFilter, itemsPerPage, toast]);

  // Delete livreur
  const handleDelete = async (livreurId: string) => {
    setDeleting(livreurId);
    try {
      const { data, error } = await api.deleteUser(livreurId);

      if (error) {
        toast({
          title: 'Erreur',
          description: error.message || 'Impossible de supprimer le livreur',
          variant: 'destructive',
        });
      } else {
        // Provide feedback based on auth deletion status
        let description = 'Livreur supprimé avec succès';

        if (data?.authDeletionStatus === 'auth_success') {
          description = 'Livreur et compte d\'authentification supprimés avec succès';
        } else if (data?.authDeletionStatus === 'auth_failed') {
          description = 'Livreur supprimé, mais le compte d\'authentification n\'a pas pu être supprimé. Veuillez contacter l\'administrateur.';
        } else if (data?.authDeletionStatus === 'no_auth') {
          description = 'Livreur supprimé avec succès (aucun compte d\'authentification associé)';
        }

        toast({
          title: 'Succès',
          description,
        });
        fetchLivreurs(true);
      }
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la suppression',
        variant: 'destructive',
      });
    } finally {
      setDeleting(null);
    }
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchLivreurs(true);
  };

  // Open assignment modal
  const openAssignModal = (livreur: UserType) => {
    setSelectedLivreur(livreur);
    setShowAssignModal(true);
  };

  // Handle colis assigned callback
  const handleColisAssigned = async () => {
    // Refresh the livreurs list to update counts
    await fetchLivreurs();
  };

  // Handle new colis creation
  const handleColisCreated = (newColis: any) => {
    toast({
      title: 'Succès',
      description: 'Colis créé et assigné avec succès',
    });
    // Close the add colis modal
    setShowAddColisModal(false);
  };

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'actif':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
      case 'inactif':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
      case 'suspendu':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300';
    }
  };

  // Reset to first page when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchTerm]);

  // Initial data fetch and when dependencies change
  useEffect(() => {
    fetchLivreurs();
  }, [fetchLivreurs]);

  // Auto-close filter sidebar on mobile when filters change
  useEffect(() => {
    if (isMobile && isFilterOpen) {
      setIsFilterOpen(false);
    }
  }, [searchTerm, zoneFilter, vehiculeFilter, nombreFilter, isMobile]);

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Truck className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
          Gestion des Livreurs
        </h1>
        <div className="flex items-center gap-1 sm:gap-2 w-full sm:w-auto">
          <Button
            className="bg-green-600 hover:bg-green-700 flex-1 sm:flex-none px-2 sm:px-4 py-1 sm:py-2 text-xs sm:text-sm"
            onClick={() => navigate('/livreurs/ajouter')}
          >
            <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
            Ajouter un livreur
          </Button>
        </div>
      </div>

      {/* Filters */}
      {isMobile ? (
        <div className="space-y-3 w-full">
          {/* Row 1: Filtres + Actualiser */}
          <div className="flex items-center justify-between w-full gap-2">
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <button className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity">
                  {/* <svg className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
                  </svg> */}
                  <PanelLeftOpen className="h-4 w-4 text-gray-700 dark:text-gray-300" />
                  <span className="font-medium text-gray-700 dark:text-gray-300">Filtres</span>
                </button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Filtres des Livreurs</SheetTitle>
                  <SheetDescription>
                    Filtrez les livreurs par zone, véhicule et nombre de colis
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  <Select value={zoneFilter} onValueChange={setZoneFilter}>
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="Toutes les zones" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toutes les zones</SelectItem>
                      {zones.map((zone) => (
                        <SelectItem key={zone} value={zone}>
                          {zone}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={vehiculeFilter} onValueChange={setVehiculeFilter}>
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="Tous les véhicules" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les véhicules</SelectItem>
                      {vehicules.map((vehicule) => (
                        <SelectItem key={vehicule} value={vehicule}>
                          {vehicule}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={nombreFilter} onValueChange={setNombreFilter}>
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="Tous les nombres" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les nombres</SelectItem>
                      <SelectItem value="plus">Plus de colis</SelectItem>
                      <SelectItem value="moins">Moins de colis</SelectItem>
                    </SelectContent>
                  </Select>
                  {(searchTerm || zoneFilter !== 'all' || vehiculeFilter !== 'all' || nombreFilter !== 'all') && (
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm('');
                        setZoneFilter('all');
                        setVehiculeFilter('all');
                        setNombreFilter('all');
                      }}
                      className="w-full text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
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
          {/* Row 2: Search */}
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4 z-10" />
            <Input
              name="search"
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <svg className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
              </svg>
              <span className="font-medium text-gray-700 dark:text-gray-300">Filtres</span>
            </div>
            <div className="flex items-center gap-2">
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
              {(searchTerm || zoneFilter !== 'all' || vehiculeFilter !== 'all' || nombreFilter !== 'all') && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchTerm('');
                    setZoneFilter('all');
                    setVehiculeFilter('all');
                    setNombreFilter('all');
                  }}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <X className="mr-2 h-4 w-4" />
                  Réinitialiser
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                name="search"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
              />
            </div>

            <Select value={zoneFilter} onValueChange={setZoneFilter}>
              <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                <SelectValue placeholder="Toutes les zones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les zones</SelectItem>
                {zones.map((zone) => (
                  <SelectItem key={zone} value={zone}>
                    {zone}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={vehiculeFilter} onValueChange={setVehiculeFilter}>
              <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                <SelectValue placeholder="Tous les véhicules" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les véhicules</SelectItem>
                {vehicules.map((vehicule) => (
                  <SelectItem key={vehicule} value={vehicule}>
                    {vehicule}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={nombreFilter} onValueChange={setNombreFilter}>
              <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                <SelectValue placeholder="Tous les nombres" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les nombres</SelectItem>
                <SelectItem value="plus">Plus de colis</SelectItem>
                <SelectItem value="moins">Moins de colis</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="space-y-4">
        <div className="space-y-3 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Liste des Livreurs</h2>
            <div className="flex justify-between items-center sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Afficher</span>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-16 h-8 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                  <SelectValue />
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
            <span className="text-sm text-gray-500 dark:text-gray-400">Total: {totalCount} livreurs</span>
            </div>
          </div>
        </div>
        <div className="overflow-x-auto">
          <Table className="bg-transparent min-w-full">
          <TableHeader>
            <TableRow className="border-b border-gray-200 dark:border-gray-600" style={{ backgroundColor: 'hsl(210, 40%, 96.1%)' }}>
              <TableHead className="font-semibold text-gray-900">Nom</TableHead>
              <TableHead className="font-semibold text-gray-900">Contact</TableHead>
              <TableHead className="font-semibold text-gray-900">Activité</TableHead>
              <TableHead className="font-semibold text-right text-gray-900">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index} className="bg-white dark:bg-transparent border-b border-gray-200 dark:border-gray-600">
                  <TableCell colSpan={4}>
                    <div className="flex items-center space-x-4">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded animate-pulse flex-1"></div>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            ) : livreurs.length === 0 ? (
              <TableRow className="bg-white dark:bg-transparent border-b border-gray-200 dark:border-gray-600">
                <TableCell colSpan={4} className="text-center py-8">
                  <div className="flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
                    <Truck className="h-12 w-12 mb-4 text-gray-300 dark:text-gray-600" />
                    <p className="text-lg font-medium mb-2">Aucun livreur trouvé</p>
                    <p className="text-sm">
                      {debouncedSearchTerm
                        ? 'Aucun livreur ne correspond à votre recherche'
                        : 'Commencez par ajouter votre premier livreur'
                      }
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              livreurs.map((livreur) => (
                <TableRow key={livreur.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 bg-white dark:bg-transparent border-b border-gray-200 dark:border-gray-600">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage
                          src={livreur.image_url}
                          alt={`${livreur.prenom || ''} ${livreur.nom}`.trim()}
                        />
                        <AvatarFallback className="bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-400 text-sm font-bold">
                          {livreur.prenom?.[0] || livreur.nom?.[0] || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {livreur.nom} {livreur.prenom}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          (LIV-{livreur.id.slice(-3).toUpperCase()})
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {livreur.telephone && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                          </svg>
                          {livreur.telephone}
                        </div>
                      )}
                      {livreur.email && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-400">
                          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                            <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                          </svg>
                          {livreur.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                          </svg>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">3</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">colis</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          <span className="text-sm font-medium text-gray-900 dark:text-white">2</span>
                          <span className="text-sm text-gray-500 dark:text-gray-400">bons</span>
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openAssignModal(livreur)}
                        className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 dark:text-blue-400 dark:hover:text-blue-300 dark:hover:bg-blue-900/20"
                      >
                        <User className="w-4 h-4 mr-1" />
                        Assigner
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/livreurs/${livreur.id}`)}
                        className="h-8 px-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        Détails
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Pagination */}
      {!loading && totalCount > 0 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalCount={totalCount}
          itemsPerPage={itemsPerPage}
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
          onPageChange={setCurrentPage}
        />
      )}

      {/* Assignment Modal */}
      <AssignColisModal
        livreur={selectedLivreur}
        isOpen={showAssignModal}
        onOpenChange={setShowAssignModal}
        onColisAssigned={handleColisAssigned}
      />

      {/* Add Colis Modal */}
      {selectedLivreur && (
        <AddColisModal
          open={showAddColisModal}
          onOpenChange={setShowAddColisModal}
          livreurId={selectedLivreur.id}
          livreurName={`${selectedLivreur.nom} ${selectedLivreur.prenom} (LIV-${selectedLivreur.id.slice(-3).toUpperCase()})`}
          onColisCreated={handleColisCreated}
        />
      )}
    </div>
  );
}
