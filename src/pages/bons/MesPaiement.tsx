import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TablePagination } from '@/components/ui/table-pagination';
import { Plus, Search, FileText, CreditCard, RefreshCw, Eye, Download, FileSpreadsheet, Filter, PanelLeftOpen, X } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { api } from '@/lib/supabase';
import { Bon } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { downloadBonAsExcel } from '@/utils/pdfGenerator';
import { useAuth } from '@/contexts/AuthContext';

export function MesPaiement() {
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
  const [downloadingExcel, setDownloadingExcel] = useState<string | null>(null);
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
        type: 'paiement',
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
      setBons([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [debouncedSearchTerm, selectedStatus, currentPage, itemsPerPage, authState.user?.id]);

  useEffect(() => { fetchBons(); }, [fetchBons]);
  useEffect(() => { if (currentPage !== 1) setCurrentPage(1); }, [debouncedSearchTerm, selectedStatus]);

  const handleRefresh = () => fetchBons(true);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('fr-FR');

  const handleDownloadExcel = async (bon: Bon) => {
    try {
      setDownloadingExcel(bon.id);
      
      // Fetch colis data
      const { data: colisData } = await api.getColisByBonId(bon.id);
      
      await downloadBonAsExcel(bon, colisData || undefined, companySettings || undefined);
      toast({ title: 'Excel téléchargé' });
    } catch (error) {
      console.error('Error downloading Excel:', error);
      toast({ title: 'Erreur', description: 'Impossible de générer le fichier Excel', variant: 'destructive' });
    } finally { setDownloadingExcel(null); }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <CreditCard className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            Mes Bons de Paiement
          </h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 flex-1 sm:flex-none">
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none">
              <Plus className="h-4 w-4 mr-2" />
              <span className="sm:hidden">Nouveau</span>
              <span className="hidden sm:inline">Nouveau bon de paiement</span>
            </Button>
          </div>
        </div>

        {isMobile ? (
          <div className="space-y-3 w-full">
            <div className="flex items-center justify-between w-full gap-2">
              <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                <SheetTrigger asChild>
                  <button className="flex items-center gap-2 cursor-pointer hover:opacity-70 transition-opacity">
                    <svg className="h-4 w-4 text-gray-600 dark:text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
                    </svg>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtres</span>
                    <PanelLeftOpen className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  </button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                  <SheetHeader>
                    <SheetTitle>Filtrer les Bons de Paiement</SheetTitle>
                    <SheetDescription>Personnalisez votre vue avec les filtres ci-dessous</SheetDescription>
                  </SheetHeader>
                  <div className="space-y-4 mt-6">
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Statut</label>
                      <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filtrer par statut" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Tous les statuts</SelectItem>
                          <SelectItem value="En attente">En attente</SelectItem>
                          <SelectItem value="Payé">Payé</SelectItem>
                          <SelectItem value="Annulé">Annulé</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
              <Button variant="outline" onClick={() => { setSelectedStatus('all'); setSearchTerm(''); setCurrentPage(1); }} disabled={!searchTerm && selectedStatus === 'all'} className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 h-9 px-2">
                <X className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">Réinitialiser</span>
              </Button>
            </div>
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input placeholder="Rechercher par numéro" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full h-9" />
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtres</span>
              <div className="flex items-center gap-2">
                <Button variant="outline" onClick={() => { setSelectedStatus('all'); setSearchTerm(''); setCurrentPage(1); }} disabled={!searchTerm && selectedStatus === 'all'} className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 h-8 px-2 text-xs">
                  <X className="h-4 w-4 mr-1" />
                  Réinitialiser
                </Button>
                <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 h-8 px-2 text-xs">
                  <RefreshCw className={`h-4 w-4 mr-1 ${refreshing ? 'animate-spin' : ''}`} />
                  Actualiser
                </Button>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3 w-full">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Rechercher un bon de paiement par numéro" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full" />
              </div>
              <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="En attente">En attente</SelectItem>
                  <SelectItem value="Payé">Payé</SelectItem>
                  <SelectItem value="Annulé">Annulé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Liste des Bons de Paiement</h2>
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
            <table className="w-full bg-transparent">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-600" style={{ backgroundColor: 'hsl(210, 40%, 96.1%)' }}>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Référence</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Montant</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Statut</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Date de création</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {loading ? (
                  Array.from({ length: itemsPerPage }).map((_, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-4 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></td>
                      <td className="px-4 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></td>
                      <td className="px-4 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></td>
                      <td className="px-4 py-4 whitespace-nowrap"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></td>
                      <td className="px-4 py-4 whitespace-nowrap"><div className="h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-20"></div></td>
                    </tr>
                  ))
                ) : (
                  bons.map((bon) => (
                    <tr key={bon.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-transparent">
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{bon.id}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{bon.montant ? `${bon.montant} MAD` : 'N/A'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{bon.statut}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatDate(bon.date_creation)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/bons/mes-paiement/${bon.id}`)} title="Voir les détails"><Eye className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => handleDownloadExcel(bon)} disabled={downloadingExcel === bon.id} title="Télécharger Excel">{downloadingExcel === bon.id ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600"></div> : <FileSpreadsheet className="h-4 w-4" />}</Button>
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
            <p className="text-gray-500 dark:text-gray-400">Aucun bon de paiement trouvé</p>
          </div>
        )}
      </div>

      {!loading && totalCount > 0 && (
        <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} hasNextPage={hasNextPage} hasPrevPage={hasPrevPage} totalItems={totalCount} itemsPerPage={itemsPerPage} />
      )}
    </div>
  );
}
