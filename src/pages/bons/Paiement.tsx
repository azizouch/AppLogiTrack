import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { TablePagination } from '@/components/ui/table-pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, FileText, Edit, Trash2, CreditCard, RefreshCw, Eye, Download, FileSpreadsheet, X, Filter, PanelLeftOpen } from 'lucide-react';
import { api } from '@/lib/supabase';
import { Bon, Entreprise } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { downloadBonAsExcel } from '@/utils/pdfGenerator';

export function Paiement() {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedEntreprise, setSelectedEntreprise] = useState<string>('all');
  const [bons, setBons] = useState<Bon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch entreprises
  const fetchEntreprises = useCallback(async () => {
    try {
      const { data, error } = await api.getEntreprises();
      if (!error && data) {
        setEntreprises(data);
      }
    } catch (error) {
      console.error('Error fetching entreprises:', error);
    }
  }, []);

  useEffect(() => {
    fetchEntreprises();
  }, [fetchEntreprises]);

  // Fetch bons data
  const fetchBons = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      // Check if getBons function exists
      if (!api.getBons) {
        console.error('getBons function not available');
        setBons([]);
        return;
      }

      const { data, error, count, totalPages: pages, hasNextPage: hasNext, hasPrevPage: hasPrev } = await api.getBons({
        type: 'paiement',
        sourceType: 'admin',
        statut: selectedStatus && selectedStatus !== 'all' ? selectedStatus : undefined,
        entrepriseId: selectedEntreprise && selectedEntreprise !== 'all' ? selectedEntreprise : undefined,
        search: debouncedSearchTerm,
        sortBy: 'recent',
        page: currentPage,
        limit: itemsPerPage
      });

      if (error) {
        console.error('Error fetching bons:', error);
        setBons([]);
        setTotalCount(0);
        setTotalPages(0);
        setHasNextPage(false);
        setHasPrevPage(false);
      } else {
        setBons(Array.isArray(data) ? data : []);
        setTotalCount(count || 0);
        setTotalPages(pages || 0);
        setHasNextPage(hasNext || false);
        setHasPrevPage(hasPrev || false);
      }
    } catch (error) {
      console.error('Error fetching bons:', error);
      setBons([]); // Ensure we always set an array on error
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearchTerm, selectedStatus, selectedEntreprise, currentPage, itemsPerPage]);

  // Initial fetch and when search changes
  useEffect(() => {
    fetchBons();
  }, [fetchBons]);

  // Reset to first page when search or filter changes
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, selectedStatus, selectedEntreprise]);

  const hasActiveFilters = searchTerm || selectedStatus !== 'all' || selectedEntreprise !== 'all';
  const resetFilters = () => { setSearchTerm(''); setSelectedStatus('all'); setSelectedEntreprise('all'); setCurrentPage(1); };

  // Handle refresh
  const handleRefresh = () => {
    fetchBons(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'Payé':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Payé</Badge>;
      case 'En attente':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">En attente</Badge>;
      default:
        return <Badge variant="secondary">{statut}</Badge>;
    }
  };

  const handleDownloadExcel = async (bon: Bon) => {
    try {
      setDownloadingExcel(bon.id);

      // Fetch colis data
      const { data: colisData } = await api.getColisByBonId(bon.id);

      await downloadBonAsExcel(bon, colisData || undefined, companySettings || undefined, companySettings || undefined);

      toast({
        title: 'Excel téléchargé',
        description: 'Le fichier Excel a été téléchargé dans votre dossier Téléchargements',
      });

    } catch (error) {
      console.error('Error downloading Excel:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le fichier Excel',
        variant: 'destructive',
      });
    } finally {
      setDownloadingExcel(null);
    }
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <CreditCard className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            Bons de paiement
          </h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none">
              <Plus className="h-4 w-4 mr-2" />
              <span className="sm:hidden">Nouveau</span>
              <span className="hidden sm:inline">Nouveau bon de paiement</span>
            </Button>
          </div>
        </div>

        {/* Filters */}
        {isMobile ? (
          <div className="space-y-3 w-full">
            {/* Row 1: Filtres button + Actualiser button */}
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
                    <SheetTitle>Filtres des Bons</SheetTitle>
                    <SheetDescription>
                      Filtrez les bons de paiement par statut et entreprise
                    </SheetDescription>
                  </SheetHeader>
                  <div className="space-y-4 mt-6">
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                        <SelectValue placeholder="Filtrer par statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="En attente">En attente</SelectItem>
                        <SelectItem value="Payé">Payé</SelectItem>
                        <SelectItem value="Annulé">Annulé</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select value={selectedEntreprise} onValueChange={setSelectedEntreprise}>
                      <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                        <SelectValue placeholder="Sélectionner une entreprise" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Toutes les entreprises</SelectItem>
                        {entreprises.map((entreprise) => (
                          <SelectItem key={entreprise.id} value={entreprise.id}>
                            {entreprise.nom}
                          </SelectItem>
                        ))}
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
                onClick={() => fetchBons(true)}
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
            {/* Row 2: Search input only */}
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-full bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600"
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
                  onClick={() => fetchBons(true)}
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
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Rechercher un bon..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-full"
                />
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-48 flex-1">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="En attente">En attente</SelectItem>
                  <SelectItem value="Payé">Payé</SelectItem>
                  <SelectItem value="Annulé">Annulé</SelectItem>
                </SelectContent>
              </Select>
              <Select value={selectedEntreprise} onValueChange={setSelectedEntreprise}>
                <SelectTrigger className="w-full sm:w-48 flex-1">
                  <SelectValue placeholder="Filtrer par entreprise" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les entreprises</SelectItem>
                  {entreprises.map((entreprise) => (
                    <SelectItem key={entreprise.id} value={entreprise.id}>
                      {entreprise.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      {/* Table Container */}
      <div className="space-y-3">
        {/* Table Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Liste des Bons de Paiement
          </h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Afficher</span>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                <SelectTrigger className="w-16 h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600 dark:text-gray-400">entrées</span>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Total: {totalCount} bons
            </span>
          </div>
        </div>

        {/* Table or Empty State */}
        {loading || bons.length > 0 ? (
          <div className="overflow-x-auto">
            <Table className="w-full bg-transparent">
              <TableHeader>
                <TableRow className="bg-gray-200 dark:bg-gray-800">
                  <TableHead className="font-medium">
                    Référence
                  </TableHead>
                  <TableHead className="font-medium">
                    Livreur
                  </TableHead>
                  <TableHead className="font-medium">
                    Zone
                  </TableHead>
                  <TableHead className="font-medium">
                    Statut
                  </TableHead>
                  <TableHead className="text-center font-medium">
                    Nb Colis
                  </TableHead>
                  <TableHead className="text-center font-medium">
                    Date de création
                  </TableHead>
                  <TableHead className="text-center font-medium">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  Array.from({ length: itemsPerPage }).map((_, index) => (
                    <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <TableCell className="px-4 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap">
                        <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-20"></div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  bons.map((bon) => (
                    <TableRow key={bon.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-transparent">
                      <TableCell className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {bon.id}
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {bon.user ? `${bon.user.nom} ${bon.user.prenom || ''}`.trim() : 'N/A'}
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {bon.user?.zone || 'N/A'}
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap">
                        {getStatusBadge(bon.statut)}
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {bon.nb_colis || 0}
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDate(bon.date_creation)}
                      </TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Télécharger PDF"
                          >
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleDownloadExcel(bon)}
                            disabled={downloadingExcel === bon.id}
                            title="Télécharger Excel"
                          >
                            {downloadingExcel === bon.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                            ) : (
                              <FileSpreadsheet className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Aucun bon de paiement trouvé</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && totalCount > 0 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          hasNextPage={hasNextPage}
          hasPrevPage={hasPrevPage}
          totalItems={totalCount}
          itemsPerPage={itemsPerPage}
        />
      )}
    </div>
  );
}
