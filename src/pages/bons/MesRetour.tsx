import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TablePagination } from '@/components/ui/table-pagination';
import { Plus, Search, RefreshCw, Eye, Download, FileSpreadsheet, RotateCcw } from 'lucide-react';
import { api } from '@/lib/supabase';
import { Bon } from '@/types';
import { useDebounce } from '@/hooks/useDebounce';
import { useToast } from '@/hooks/use-toast';
import { downloadBonAsExcel } from '@/utils/pdfGenerator';
import { useAuth } from '@/contexts/AuthContext';

export function MesRetour() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state: authState } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
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

      const userId = authState.user?.id;

      const { data, error, count, totalPages: pages, hasNextPage: hasNext, hasPrevPage: hasPrev } = await api.getBons({
        type: 'retour',
        userId,
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
  }, [debouncedSearchTerm, currentPage, itemsPerPage, authState.user?.id]);

  useEffect(() => { fetchBons(); }, [fetchBons]);
  useEffect(() => { if (currentPage !== 1) setCurrentPage(1); }, [debouncedSearchTerm]);

  const handleRefresh = () => fetchBons(true);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('fr-FR');

  const handleDownloadExcel = async (bon: Bon) => {
    try {
      setDownloadingExcel(bon.id);
      await downloadBonAsExcel(bon);
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
            <RotateCcw className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            Mes Bons de Retour
          </h1>
          <div className="flex gap-2 w-full sm:w-auto">
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing} className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 flex-1 sm:flex-none">
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              Actualiser
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none">
              <Plus className="h-4 w-4 mr-2" />
              <span className="sm:hidden">Nouveau</span>
              <span className="hidden sm:inline">Nouveau bon de retour</span>
            </Button>
          </div>
        </div>

        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input placeholder="Rechercher un bon de retour par numéro ou statut" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-10 w-full" />
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between py-4 gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Liste des Bons de Retour</h2>
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
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Livraison</th>
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
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{bon.user ? `${bon.user.nom} ${bon.user.prenom || ''}`.trim() : 'N/A'}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{bon.statut}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{formatDate(bon.date_creation)}</td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => navigate(`/bons/mes-retour/${bon.id}`)} title="Voir les détails"><Eye className="h-4 w-4" /></Button>
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
            <p className="text-gray-500 dark:text-gray-400">Aucun bon de retour trouvé</p>
          </div>
        )}
      </div>

      {!loading && totalCount > 0 && (
        <TablePagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} hasNextPage={hasNextPage} hasPrevPage={hasPrevPage} totalItems={totalCount} itemsPerPage={itemsPerPage} />
      )}
    </div>
  );
}
