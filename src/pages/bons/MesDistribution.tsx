import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TablePagination } from '@/components/ui/table-pagination';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Search, Download, Eye, Printer, Truck, RefreshCw, FileSpreadsheet, Filter, PanelLeftOpen, X, History } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from '@/components/ui/sheet';
import { api } from '@/lib/supabase';
import { Bon } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { downloadBonAsPDF, downloadMobileBonAsPDF, printBon, downloadBonAsExcel } from '@/utils/pdfGenerator';
import { useAuth } from '@/contexts/AuthContext';
import { BonHistoryModal } from '@/components/modals/BonHistoryModal';

interface CompanySettings {
  id?: string;
  nom?: string;
  adresse?: string;
  ville?: string;
  telephone?: string;
  email?: string;
}

export function MesDistribution() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state: authState } = useAuth();
  const isMobile = useIsMobile();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [bons, setBons] = useState<Bon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState<string | null>(null);
  const [downloadingExcel, setDownloadingExcel] = useState<string | null>(null);
  const [printing, setPrinting] = useState<string | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedBonForHistory, setSelectedBonForHistory] = useState<Bon | null>(null);
  const debouncedSearchTerm = useDebounce(searchTerm, 300);

  const fetchBons = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true); else setLoading(true);

      if (!api.getBons) {
        console.error('getBons not available');
        setBons([]);
        return;
      }

      const userId = authState.user?.role?.toLowerCase() === 'livreur' ? authState.user?.id : undefined;

      const { data, error, count, totalPages: pages, hasNextPage: hasNext, hasPrevPage: hasPrev } = await api.getBons({
        type: 'distribution',
        sourceType: 'livreur',
        userId,
        statut: selectedStatus && selectedStatus !== 'all' ? selectedStatus : undefined,
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
  }, [debouncedSearchTerm, selectedStatus, currentPage, itemsPerPage, authState.user?.id]);

  useEffect(() => { fetchBons(); }, [fetchBons]);

  useEffect(() => { if (currentPage !== 1) setCurrentPage(1); }, [debouncedSearchTerm, selectedStatus]);

  useEffect(() => {
    const fetchCompanySettings = async () => {
      try {
        const { data, error } = await api.getCompanySettings();
        if (!error && data) {
          setCompanySettings(data);
        }
      } catch (error) {
        console.error('Error fetching company settings:', error);
      }
    };

    fetchCompanySettings();
  }, []);

  const handleRefresh = () => fetchBons(true);

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

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('fr-FR');

  const handleDownloadPdf = async (bon: Bon) => {
    try {
      setDownloadingPdf(bon.id);
      const bonWithUser = { ...bon, user: authState.user };
      
      // Fetch colis data
      const { data: colisData } = await api.getColisByBonId(bon.id);
      
      if (isMobile) {
        await downloadMobileBonAsPDF(bonWithUser, colisData || undefined, companySettings || undefined);
        toast({ title: 'PDF Mobile téléchargé' });
      } else {
        await downloadBonAsPDF(bonWithUser, colisData || undefined, companySettings || undefined);
        toast({ title: 'PDF téléchargé' });
      }
    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({ title: 'Erreur', description: 'Impossible de générer le PDF', variant: 'destructive' });
    } finally { setDownloadingPdf(null); }
  };

  const handlePrint = async (bon: Bon) => {
    try {
      setPrinting(bon.id);
      
      // Fetch colis data
      const { data: colisData } = await api.getColisByBonId(bon.id);
      
      const bonWithUser = { ...bon, user: authState.user };
      await printBon(bonWithUser, colisData || undefined, companySettings || undefined);
      toast({ title: 'Impression', description: 'Le bon a été ouvert pour impression' });
    } catch (error) {
      console.error('Error printing bon:', error);
      toast({ title: 'Erreur', description: 'Impossible d\'ouvrir l\'impression', variant: 'destructive' });
    } finally { setPrinting(null); }
  };

  const handleDownloadExcel = async (bon: Bon) => {
    try {
      setDownloadingExcel(bon.id);
      
      // Fetch colis data
      const { data: colisData } = await api.getColisByBonId(bon.id);
      
      const bonWithUser = { ...bon, user: authState.user };
      await downloadBonAsExcel(bonWithUser, colisData || undefined, companySettings || undefined);
      toast({ title: 'Excel téléchargé' });
    } catch (error) {
      console.error('Error downloading Excel:', error);
      toast({ title: 'Erreur', description: 'Impossible de générer le fichier Excel', variant: 'destructive' });
    } finally { setDownloadingExcel(null); }
  };

  const handleOpenHistory = (bon: Bon) => {
    setSelectedBonForHistory(bon);
    setIsHistoryModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <Truck className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            Mes Bons de Distribution
          </h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 flex-1 sm:flex-none">
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
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
                      Filtrez vos bons de distribution par statut
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
                  </div>
                </SheetContent>
              </Sheet>
              <Button
                variant="outline"
                onClick={handleRefresh}
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
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Rechercher un bon par numéro" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full" />
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-48">
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
            </div>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-1 gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Liste de mes Bons de Distribution</h2>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Afficher</span>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                <SelectTrigger className="w-16 h-9"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-600 dark:text-gray-400">entrées</span>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Total: {totalCount} bons</span>
          </div>
        </div>

        {loading || bons.length > 0 ? (
          <div className="overflow-x-auto">
            <Table className="w-full bg-transparent">
              <TableHeader>
                <TableRow className="dark:border-gray-600" style={{ backgroundColor: 'hsl(210, 40%, 96.1%)' }}>
                  <TableHead className="px-4 py-3 text-left text-sm font-medium text-gray-900">Référence</TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-medium text-gray-900">Zone</TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-medium text-gray-900">Statut</TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-medium text-gray-900">Nb Colis</TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-medium text-gray-900">Date de création</TableHead>
                  <TableHead className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  Array.from({ length: itemsPerPage }).map((_, index) => (
                    <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <TableCell className="px-4 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap"><div className="h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-20"></div></TableCell>
                    </TableRow>
                  ))
                ) : (
                  bons.map((bon) => (
                    <TableRow key={bon.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-transparent">
                      <TableCell className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{bon.id}</TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{bon.user?.zone || 'N/A'}</TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap">{getStatusBadge(bon.statut)}</TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{bon.nb_colis || 0}</TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatDate(bon.date_creation)}</TableCell>
                      <TableCell className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border" onClick={() => navigate(`/bons/mes-distribution/${bon.id}`)} title="Voir les détails"><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border" onClick={() => handlePrint(bon)} disabled={printing === bon.id} title="Imprimer">{printing === bon.id ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div> : <Printer className="h-4 w-4" />}</Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border" onClick={() => handleDownloadPdf(bon)} disabled={downloadingPdf === bon.id} title="Télécharger PDF">{downloadingPdf === bon.id ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div> : <Download className="h-4 w-4" />}</Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border" onClick={() => handleDownloadExcel(bon)} disabled={downloadingExcel === bon.id} title="Télécharger Excel">{downloadingExcel === bon.id ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div> : <FileSpreadsheet className="h-4 w-4" />}</Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border" onClick={() => handleOpenHistory(bon)} title="Voir l'historique"><History className="h-4 w-4" /></Button>
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
            <p className="text-gray-500 dark:text-gray-400">Aucun bon de distribution trouvé</p>
          </div>
        )}
      </div>

      {!loading && totalCount > 0 && (
        <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} hasNextPage={hasNextPage} hasPrevPage={hasPrevPage} totalItems={totalCount} itemsPerPage={itemsPerPage} />
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
