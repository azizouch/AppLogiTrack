import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { TablePagination } from '@/components/ui/table-pagination';
import { Plus, Search, Download, Eye, Printer, Truck, RefreshCw, FileSpreadsheet, X, Filter, PanelLeftOpen, History } from 'lucide-react';
import { api } from '@/lib/supabase';
import { Bon, Entreprise } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { downloadBonAsPDF, downloadMobileBonAsPDF, printBon, downloadBonAsExcel } from '@/utils/pdfGenerator';
import { BonHistoryModal } from '@/components/modals/BonHistoryModal';

export function Distribution() {
  const navigate = useNavigate();
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
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const [downloadingExcel, setDownloadingExcel] = useState<string | null>(null);
  const [printing, setPrinting] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [companySettings, setCompanySettings] = useState<any>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedBonForHistory, setSelectedBonForHistory] = useState<Bon | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  // Fetch company settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const { data } = await api.getCompanySettings();
        if (data) setCompanySettings(data);
      } catch (error) {
        console.error('Error fetching company settings:', error);
      }
    };
    fetchSettings();
  }, []);

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
        type: 'distribution',
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
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearchTerm, selectedStatus, selectedEntreprise, currentPage, itemsPerPage]);

  // Initial fetch and when search changes
  useEffect(() => {
    fetchBons();
  }, [fetchBons]);

  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, selectedStatus, selectedEntreprise]);

  // Check if any filters are active
  const hasActiveFilters = searchTerm || selectedStatus !== 'all' || selectedEntreprise !== 'all';

  // Reset filters function
  const resetFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedEntreprise('all');
    setCurrentPage(1);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchBons(true);
  };

  const getStatusBadge = (statut: string) => {
    switch (statut.toLowerCase()) {
      case 'en cours':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">En cours</Badge>;
      case 'complété':
      case 'complete':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Complété</Badge>;
      case 'annulé':
      case 'annule':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Annulé</Badge>;
      default:
        return <Badge variant="secondary">{statut}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  // Check if user is on mobile device (via user agent)
  const isMobileUserAgent = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const handleDownloadPdf = async (bon: Bon) => {
    try {
      setDownloadingPdf(bon.id);

      // Fetch colis data
      const { data: colisData } = await api.getColisByBonId(bon.id);

      // Use mobile PDF generator if on mobile device
      if (isMobileUserAgent()) {
        await downloadMobileBonAsPDF(bon, colisData || undefined, companySettings || undefined);
        toast({
          title: 'PDF Mobile téléchargé',
          description: 'Le fichier PDF optimisé mobile a été téléchargé dans votre dossier Téléchargements',
        });
      } else {
        await downloadBonAsPDF(bon, colisData || undefined, companySettings || undefined);
        toast({
          title: 'PDF téléchargé',
          description: 'Le fichier PDF a été téléchargé dans votre dossier Téléchargements',
        });
      }

    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le PDF',
        variant: 'destructive',
      });
    } finally {
      setDownloadingPdf(null);
    }
  };

  const handlePrint = async (bon: Bon) => {
    try {
      setPrinting(bon.id);

      // Fetch colis data
      const { data: colisData } = await api.getColisByBonId(bon.id);

      await printBon(bon, colisData || undefined, companySettings || undefined);

      toast({
        title: 'Impression',
        description: 'Le bon de distribution a été ouvert pour impression',
      });

    } catch (error) {
      console.error('Error printing bon:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ouvrir l\'impression',
        variant: 'destructive',
      });
    } finally {
      setPrinting(null);
    }
  };

  const handleDownloadExcel = async (bon: Bon) => {
    try {
      setDownloadingExcel(bon.id);

      // Fetch colis data
      const { data: colisData } = await api.getColisByBonId(bon.id);

      await downloadBonAsExcel(bon, colisData || undefined, companySettings || undefined);

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

  const handleOpenHistory = (bon: Bon) => {
    setSelectedBonForHistory(bon);
    setIsHistoryModalOpen(true);
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Truck className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            Bons de Distribution
          </h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none">
              <Plus className="h-4 w-4 mr-2" />
              <span className="sm:hidden">Nouveau</span>
              <span className="hidden sm:inline">Nouveau bon de distribution</span>
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
                      Filtrez les bons de distribution par statut et entreprise
                    </SheetDescription>
                  </SheetHeader>
                  <div className="space-y-4 mt-6">
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                        <SelectValue placeholder="Filtrer par statut" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Tous les statuts</SelectItem>
                        <SelectItem value="En cours">En cours</SelectItem>
                        <SelectItem value="Complété">Complété</SelectItem>
                        <SelectItem value="Annulé">Annulé</SelectItem>
                        <SelectItem value="Livré">Livré</SelectItem>
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
                  <SelectItem value="En cours">En cours</SelectItem>
                  <SelectItem value="Complété">Complété</SelectItem>
                  <SelectItem value="Annulé">Annulé</SelectItem>
                  <SelectItem value="Livré">Livré</SelectItem>
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
            Liste des Bons de Distribution
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
            <table className="w-full bg-transparent">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-600" style={{ backgroundColor: 'hsl(210, 40%, 96.1%)' }}>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Référence
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Livreur
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Zone
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Statut
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Nb Colis
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Date de création
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  Array.from({ length: itemsPerPage }).map((_, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-20"></div>
                      </td>
                    </tr>
                  ))
                ) : (
                  bons.map((bon) => (
                    <tr key={bon.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-transparent">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                        {bon.id}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {bon.user ? `${bon.user.nom} ${bon.user.prenom || ''}`.trim() : 'N/A'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {bon.user?.zone || 'N/A'}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {getStatusBadge(bon.statut)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {bon.nb_colis || 0}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                        {formatDate(bon.date_creation)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => navigate(`/bons/distribution/${bon.id}`)}
                            title="Voir les détails"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleOpenHistory(bon)}
                            title="Voir l'historique"
                          >
                            <History className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handlePrint(bon)}
                            disabled={printing === bon.id}
                            title="Imprimer"
                          >
                            {printing === bon.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                            ) : (
                              <Printer className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            onClick={() => handleDownloadPdf(bon)}
                            disabled={downloadingPdf === bon.id}
                            title="Télécharger PDF"
                          >
                            {downloadingPdf === bon.id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div>
                            ) : (
                              <Download className="h-4 w-4" />
                            )}
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
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="h-12 w-12 text-gray-300 dark:text-gray-600 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Aucun bon de distribution trouvé</p>
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

      {/* Bon History Modal */}
      {selectedBonForHistory && (
        <BonHistoryModal
          open={isHistoryModalOpen}
          onOpenChange={setIsHistoryModalOpen}
          bonId={selectedBonForHistory.id}
          bonReference={selectedBonForHistory.id}
        />
      )}
    </div>
  );
}
