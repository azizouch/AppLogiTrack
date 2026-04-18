
import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Filter, RefreshCw, X, Package, Upload, Trash2, Download, FileText, Printer, PanelLeftOpen } from 'lucide-react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { StatusBadge } from '@/components/ui/status-badge';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Colis, User, Statut, Entreprise } from '@/types';
import { api } from '@/lib/supabase';
import { ImportColisModal } from '@/components/modals/ImportColisModal';

import { useDebounce } from '@/hooks/useDebounce';
import { useIsMobile } from '@/hooks/use-mobile';
import { useNavigate, useLocation } from 'react-router-dom';

export function ColisList() {
  const navigate = useNavigate();
  const location = useLocation();
  const isMobile = useIsMobile();

  // Modal state
  const [importModalOpen, setImportModalOpen] = useState(false);

  // Mobile filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Data state
  const [colis, setColis] = useState<Colis[]>([]);
  const [livreurs, setLivreurs] = useState<User[]>([]);
  const [entreprises, setEntreprises] = useState<Entreprise[]>([]);
  const [statuts, setStatuts] = useState<Statut[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [delivererFilter, setDelivererFilter] = useState('all');
  const [entrepriseFilter, setEntrepriseFilter] = useState('all');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [hasPrevPage, setHasPrevPage] = useState(false);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Bulk operations state
  const [selectedColisIds, setSelectedColisIds] = useState<string[]>([]);
  const [deleteConfirmationOpen, setDeleteConfirmationOpen] = useState(false);

  // Debounced search term for performance
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Fetch colis data with filters and pagination
  const fetchColis = useCallback(async (options = {}) => {
    const { _refresh = false } = options;
    try {
      if (_refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const result = await api.getColis({
        page: currentPage,
        limit: itemsPerPage,
        search: debouncedSearchTerm,
        status: statusFilter,
        livreurId: delivererFilter,
        entrepriseId: entrepriseFilter,
        sortBy: 'recent',
        _refresh
      });

      const { data, error, count, totalPages: pages, hasNextPage: hasNext, hasPrevPage: hasPrev } = result;

      if (error) {
        console.error('Error fetching colis:', error);
        setColis([]);
        setTotalCount(0);
        setTotalPages(0);
        setHasNextPage(false);
        setHasPrevPage(false);
      } else if (data) {
        setColis(data);
        setTotalCount(count || 0);
        setTotalPages(pages);
        setHasNextPage(hasNext);
        setHasPrevPage(hasPrev);
        // Clear selected colis when data changes
        setSelectedColisIds([]);
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
  }, [currentPage, debouncedSearchTerm, statusFilter, delivererFilter, entrepriseFilter, itemsPerPage]);

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

  // Fetch statuts for filter dropdown
  const fetchStatuts = useCallback(async () => {
    try {
      const result = await api.getStatuts('colis');

      if (result?.data) {
        setStatuts(result.data);
      }
    } catch (error) {
      console.error('Error fetching statuts:', error);
    }
  }, []);

  // Fetch entreprises for filter dropdown
  const fetchEntreprises = useCallback(async () => {
    try {
      const result = await api.getEntreprises();

      if (result?.data) {
        setEntreprises(result.data);
      }
    } catch (error) {
      console.error('Error fetching entreprises:', error);
    }
  }, []);

  // Initial data fetch
  useEffect(() => {
    fetchLivreurs();
    fetchStatuts();
    fetchEntreprises();
  }, [fetchLivreurs, fetchStatuts, fetchEntreprises]);

  // Fetch colis when filters or pagination change
  useEffect(() => {
    fetchColis();
  }, [fetchColis]);

  // Reset to first page when filters change
  useEffect(() => {
    if (currentPage !== 1) {
      setCurrentPage(1);
    }
  }, [debouncedSearchTerm, statusFilter, delivererFilter, entrepriseFilter]);

  // Auto-close mobile filter sidebar when filters change
  useEffect(() => {
    if (isMobile && isFilterOpen) {
      setIsFilterOpen(false);
    }
  }, [debouncedSearchTerm, statusFilter, delivererFilter, entrepriseFilter, isMobile]);

  const getLivreurInfo = (colis: Colis) => {
    if (!colis.livreur_id || !colis.livreur) {
      return 'Non assigné';
    }

    return `${colis.livreur.prenom || ''} ${colis.livreur.nom}`.trim();
  };

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchColis({ _refresh: true });
  };

  // Reset filters function
  const resetFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setDelivererFilter('all');
    setEntrepriseFilter('all');
    setCurrentPage(1);
    setSelectedColisIds([]); // Clear selected colis when resetting filters
  };

  // Check if any filters are active
  const hasActiveFilters = searchTerm || statusFilter !== 'all' || delivererFilter !== 'all' || entrepriseFilter !== 'all';

  // Bulk operations functions
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedColisIds(colis.map(c => c.id));
    } else {
      setSelectedColisIds([]);
    }
  };

  const handleSelectColis = (colisId: string, checked: boolean) => {
    if (checked) {
      setSelectedColisIds(prev => [...prev, colisId]);
    } else {
      setSelectedColisIds(prev => prev.filter(id => id !== colisId));
    }
  };

  const isAllSelected = colis.length > 0 && selectedColisIds.length === colis.length;
  const isIndeterminate = selectedColisIds.length > 0 && selectedColisIds.length < colis.length;

  const handleBulkDelete = () => {
    if (selectedColisIds.length === 0) return;
    setDeleteConfirmationOpen(true);
  };

  const confirmDelete = async () => {
    try {
      const deletePromises = selectedColisIds.map(id => api.deleteColis(id));
      await Promise.allSettled(deletePromises);

      setSelectedColisIds([]);
      await fetchColis();
    } catch (error) {
      console.error('Error deleting colis:', error);
    }
  };

  const handleExport = () => {
    handleExportExcel();
  };

  const handleExportExcel = () => {
    const selectedColis = colis.filter(c => selectedColisIds.includes(c.id));

    if (selectedColis.length === 0) return;

    // Prepare data for Excel
    const excelData = selectedColis.map(colisItem => ({
      'ID Colis': colisItem.id,
      'Client': colisItem.client?.nom || '',
      'Téléphone Client': colisItem.client?.telephone || '',
      'Entreprise': colisItem.entreprise?.nom || '',
      'Statut': colisItem.statut,
      'Prix (DH)': colisItem.prix || 0,
      'Frais (DH)': colisItem.frais || 0,
      'Total (DH)': (colisItem.prix || 0) + (colisItem.frais || 0),
      'Date de création': new Date(colisItem.date_creation).toLocaleDateString('fr-FR'),
      'Livreur': colisItem.livreur ? `${colisItem.livreur.prenom || ''} ${colisItem.livreur.nom}`.trim() : 'Non assigné'
    }));

    // Create workbook and worksheet
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet(excelData);

    // Set column widths
    worksheet['!cols'] = [
      { width: 15 }, // ID Colis
      { width: 20 }, // Client
      { width: 15 }, // Téléphone Client
      { width: 20 }, // Entreprise
      { width: 12 }, // Statut
      { width: 12 }, // Prix
      { width: 12 }, // Frais
      { width: 12 }, // Total
      { width: 15 }, // Date de création
      { width: 20 }  // Livreur
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Colis');
    const filename = `colis_export_${new Date().toISOString().split('T')[0]}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  const handleExportCSV = () => {
    const selectedColis = colis.filter(c => selectedColisIds.includes(c.id));

    if (selectedColis.length === 0) return;

    // Prepare CSV data
    const csvData = selectedColis.map(colisItem => ({
      'ID Colis': colisItem.id,
      'Client': colisItem.client?.nom || '',
      'Téléphone Client': colisItem.client?.telephone || '',
      'Entreprise': colisItem.entreprise?.nom || '',
      'Statut': colisItem.statut,
      'Prix (DH)': colisItem.prix || 0,
      'Frais (DH)': colisItem.frais || 0,
      'Total (DH)': (colisItem.prix || 0) + (colisItem.frais || 0),
      'Date de création': new Date(colisItem.date_creation).toLocaleDateString('fr-FR'),
      'Livreur': colisItem.livreur ? `${colisItem.livreur.prenom || ''} ${colisItem.livreur.nom}`.trim() : 'Non assigné'
    }));

    // Create CSV content
    const headers = Object.keys(csvData[0]);
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => `"${row[header as keyof typeof row]}"`).join(','))
    ].join('\n');

    // Download CSV file
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `colis_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const selectedColis = colis.filter(c => selectedColisIds.includes(c.id));

    if (selectedColis.length === 0) return;

    const totalPrix = selectedColis.reduce((sum, c) => sum + (c.prix || 0), 0);
    const totalFrais = selectedColis.reduce((sum, c) => sum + (c.frais || 0), 0);
    const totalGeneral = totalPrix + totalFrais;

    const currentDate = new Date();
    const formattedDate = currentDate.toLocaleDateString('fr-FR');
    const formattedTime = currentDate.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });

    const printContent = `
      <!DOCTYPE html>
      <html lang="fr">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Liste des Colis - ${formattedDate}</title>
        <style>
          body {
            margin: 0;
            padding: 0;
            font-family: Arial, sans-serif;
            font-size: 14px;
            line-height: 1.4;
            background: white;
          }

          @media print {
            body {
              margin: 0;
              padding: 20px;
              font-size: 12px;
              line-height: 1.2;
            }
            .no-print { display: none; }
            * {
              -webkit-print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
          }

          .container {
            max-width: 1060px;
            margin: 0 auto;
            padding: 20px;
          }

          .top-bar {
            display: flex;
            justify-content: space-between;
            margin-bottom: 8px;
            color: #475569;
            font-size: 12px;
          }

          .header {
            text-align: center;
            margin-bottom: 16px;
          }

          .title {
            color: #1d4ed8;
            font-size: 32px;
            font-weight: 800;
            margin: 0;
            letter-spacing: 0.02em;
          }

          .subtitle {
            color: #475569;
            font-size: 15px;
            margin: 6px 0 0;
          }

          .divider {
            height: 4px;
            width: 100%;
            background: #1d4ed8;
            margin: 18px 0 24px;
            border-radius: 2px;
          }

          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 18px;
            margin-bottom: 22px;
          }

          .info-card {
            border: 1px solid #dbeafe;
            background: #eff6ff;
            border-radius: 14px;
            padding: 18px;
          }

          .info-card h3 {
            margin: 0 0 12px;
            font-size: 16px;
            color: #1d4ed8;
          }

          .info-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 8px;
            font-size: 14px;
            color: #0f172a;
          }

          .info-label {
            color: #475569;
          }

          .info-value {
            font-weight: 700;
          }

          .status-pill {
            display: inline-block;
            padding: 4px 10px;
            border-radius: 999px;
            font-size: 11px;
            font-weight: 700;
            text-transform: uppercase;
            background: #2563eb;
            color: white;
            letter-spacing: 0.02em;
          }

          .table-section {
            margin-top: 10px;
          }

          .table-title {
            margin: 0 0 12px;
            font-size: 18px;
            font-weight: 700;
            color: #1d4ed8;
          }

          .table-wrapper {
            width: 100%;
            border: 1px solid #dbeafe;
            border-radius: 12px;
            overflow: hidden;
          }

          .table-header,
          .table-row,
          .table-total-row {
            display: flex;
            align-items: center;
            width: 100%;
          }

          .table-header {
            background: #2563eb;
            color: white;
            font-weight: 700;
            font-size: 12px;
            text-transform: uppercase;
            letter-spacing: 0.02em;
          }

          .table-cell {
            padding: 12px 10px;
            border-right: 1px solid rgba(255,255,255,0.12);
            min-height: 42px;
            font-size: 12px;
            color: #0f172a;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .table-cell:last-child {
            border-right: none;
          }

          .table-row {
            border-bottom: 1px solid #e2e8f0;
            font-size: 12px;
          }

          .table-row:nth-child(even) {
            background: #f8fbff;
          }

          .table-row .table-cell {
            color: #0f172a;
            white-space: nowrap;
          }

          .table-cell.small {
            font-size: 11px;
          }

          .table-cell.price {
            color: #047857;
            font-weight: 700;
          }

          .table-cell.status {
            color: #1d4ed8;
            font-weight: 700;
          }

          .table-total-row {
            background: #eff6ff;
            font-weight: 700;
          }

          .footer-summary {
            margin-top: 20px;
            padding: 18px;
            border: 1px solid #dbeafe;
            border-radius: 12px;
            background: #f8fbff;
          }

          .footer-summary p {
            margin: 6px 0;
            font-size: 14px;
            color: #0f172a;
          }

          .footer-summary .label {
            color: #475569;
          }

          .footer-summary .value {
            color: #047857;
            font-weight: 700;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="top-bar">
            <div>${formattedDate} ${formattedTime}</div>
            <div>Liste des Colis - ${formattedDate}</div>
            <div></div>
          </div>

          <div class="header">
            <h1 class="title">LISTE DES COLIS</h1>
            <p class="subtitle">LogiTrack - Système de gestion logistique</p>
          </div>

          <div class="divider"></div>

          <div class="info-grid">
            <div class="info-card">
              <h3>Informations générales</h3>
              <div class="info-row"><span class="info-label">Date d'impression</span><span class="info-value">${formattedDate}</span></div>
              <div class="info-row"><span class="info-label">Nombre de colis</span><span class="info-value">${selectedColis.length}</span></div>
              <div class="info-row"><span class="info-label">Statut</span><span class="status-pill">SÉLECTIONNÉS</span></div>
            </div>
            <div class="info-card">
              <h3>Totaux</h3>
              <div class="info-row"><span class="info-label">Total Prix</span><span class="info-value">${totalPrix.toFixed(2)} DH</span></div>
              <div class="info-row"><span class="info-label">Total Frais</span><span class="info-value">${totalFrais.toFixed(2)} DH</span></div>
              <div class="info-row"><span class="info-label">Total Général</span><span class="info-value">${totalGeneral.toFixed(2)} DH</span></div>
            </div>
          </div>

          <div class="table-section">
            <h2 class="table-title">Liste des Colis (${selectedColis.length} colis)</h2>
            <div class="table-wrapper">
              <div class="table-header">
                <div class="table-cell" style="flex: 0.9; min-width: 100px;">ID Colis</div>
                <div class="table-cell" style="flex: 1; min-width: 100px;">Client</div>
                <div class="table-cell" style="flex: 0.9; min-width: 90px;">Téléphone</div>
                <div class="table-cell" style="flex: 1; min-width: 100px;">Entreprise</div>
                <div class="table-cell" style="flex: 0.9; min-width: 80px;">Adresse Livraison</div>
                <div class="table-cell" style="flex: 0.8; min-width: 70px;">Statut</div>
                <div class="table-cell" style="flex: 0.7; min-width: 60px;">Prix (DH)</div>
                <div class="table-cell" style="flex: 0.7; min-width: 60px;">Frais (DH)</div>
                <div class="table-cell" style="flex: 0.8; min-width: 70px;">Total (DH)</div>
                <div class="table-cell" style="flex: 0.9; min-width: 85px;">Date Création</div>
                <div class="table-cell" style="flex: 0.9; min-width: 85px;">Date Maj</div>
                <div class="table-cell" style="flex: 1; min-width: 100px;">Livreur</div>
                <div class="table-cell" style="flex: 1.2; min-width: 120px;">Notes</div>
              </div>
              ${selectedColis.map(colisItem => `
                <div class="table-row">
                  <div class="table-cell" style="flex: 0.9; min-width: 100px;"><strong>${colisItem.id}</strong></div>
                  <div class="table-cell" style="flex: 1; min-width: 100px;">${colisItem.client?.nom || ''}</div>
                  <div class="table-cell" style="flex: 0.9; min-width: 90px;">${colisItem.client?.telephone || ''}</div>
                  <div class="table-cell" style="flex: 1; min-width: 100px;">${colisItem.entreprise?.nom || ''}</div>
                  <div class="table-cell" style="flex: 0.9; min-width: 80px;">${colisItem.adresse_livraison || ''}</div>
                  <div class="table-cell status" style="flex: 0.8; min-width: 70px;">${colisItem.statut}</div>
                  <div class="table-cell price" style="flex: 0.7; min-width: 60px;">${(colisItem.prix || 0).toFixed(2)}</div>
                  <div class="table-cell price" style="flex: 0.7; min-width: 60px;">${(colisItem.frais || 0).toFixed(2)}</div>
                  <div class="table-cell price" style="flex: 0.8; min-width: 70px;">${((colisItem.prix || 0) + (colisItem.frais || 0)).toFixed(2)}</div>
                  <div class="table-cell" style="flex: 0.9; min-width: 85px;">${new Date(colisItem.date_creation).toLocaleDateString('fr-FR')}</div>
                  <div class="table-cell" style="flex: 0.9; min-width: 85px;">${colisItem.date_mise_a_jour ? new Date(colisItem.date_mise_a_jour).toLocaleDateString('fr-FR') : ''}</div>
                  <div class="table-cell" style="flex: 1; min-width: 100px;">${colisItem.livreur ? `${colisItem.livreur.prenom || ''} ${colisItem.livreur.nom}`.trim() : 'Non assigné'}</div>
                  <div class="table-cell" style="flex: 1.2; min-width: 120px;">${colisItem.notes || ''}</div>
                </div>
              `).join('')}
              <div class="table-row">
                <div class="table-cell" style="flex: 0.9; min-width: 100px;"><strong>TOTAL</strong></div>
                <div class="table-cell" style="flex: 1;"></div>
                <div class="table-cell" style="flex: 0.9;"></div>
                <div class="table-cell" style="flex: 1;"></div>
                <div class="table-cell" style="flex: 0.9;"></div>
                <div class="table-cell" style="flex: 0.8;"></div>
                <div class="table-cell price" style="flex: 0.7;"><strong>${totalPrix.toFixed(2)}</strong></div>
                <div class="table-cell price" style="flex: 0.7;"><strong>${totalFrais.toFixed(2)}</strong></div>
                <div class="table-cell price" style="flex: 0.8;"><strong>${totalGeneral.toFixed(2)}</strong></div>
                <div class="table-cell" style="flex: 0.9;"></div>
                <div class="table-cell" style="flex: 0.9;"></div>
                <div class="table-cell" style="flex: 1;"></div>
                <div class="table-cell" style="flex: 1.2;"></div>
              </div>
              </div>
            </div>
          </div>

          <div class="footer-summary">
            <p><span class="label">Total Prix:</span> <span class="value">${totalPrix.toFixed(2)} DH</span></p>
            <p><span class="label">Total Frais:</span> <span class="value">${totalFrais.toFixed(2)} DH</span></p>
            <p><span class="label">Total Général:</span> <span class="value">${totalGeneral.toFixed(2)} DH</span></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Package className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
          Liste des Colis
        </h1>
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Button
              className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
              size="sm"
              onClick={() => setImportModalOpen(true)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Importer Excel
            </Button>
            <Button
              className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto"
              size="sm"
              onClick={() => navigate('/colis/ajouter')}
            >
              <Plus className="mr-2 h-4 w-4" />
              Ajouter un colis
            </Button>
          </div>
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
                  <SheetTitle>Filtres des Colis</SheetTitle>
                  <SheetDescription>
                    Filtrez les colis par statut, livreur et tri
                  </SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      {statuts.map((statut) => (
                        <SelectItem key={statut.id} value={statut.nom}>
                          {statut.nom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={delivererFilter} onValueChange={setDelivererFilter}>
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="Tous les livreurs" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les livreurs</SelectItem>
                      <SelectItem value="unassigned">Non assigné</SelectItem>
                      {livreurs.map((livreur) => (
                        <SelectItem key={livreur.id} value={livreur.id}>
                          {`${livreur.prenom || ''} ${livreur.nom}`.trim()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={entrepriseFilter} onValueChange={setEntrepriseFilter}>
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
              name="search"
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
            <div className="flex items-center space-x-2">
              <svg className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.707A1 1 0 013 7V4z" />
              </svg>
              <span className="font-medium text-gray-700 dark:text-gray-300">Filtres</span>
            </div>
            <div className="flex items-center gap-2">
              {/* Reset filters button - shown when filters are active */}
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
              <Input
                name="search"
                placeholder="Rechercher..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {statuts.map((statut) => (
                  <SelectItem key={statut.id} value={statut.nom}>
                    {statut.nom}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={delivererFilter} onValueChange={setDelivererFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les livreurs" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les livreurs</SelectItem>
                <SelectItem value="unassigned">Non assigné</SelectItem>
                {livreurs.map((livreur) => (
                  <SelectItem key={livreur.id} value={livreur.id}>
                    {`${livreur.prenom || ''} ${livreur.nom}`.trim()}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={entrepriseFilter} onValueChange={setEntrepriseFilter}>
              <SelectTrigger>
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
          </div>
        </div>
      )}

      {/* Bulk Operations Bar */}
      {selectedColisIds.length > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {selectedColisIds.length} colis sélectionné{selectedColisIds.length > 1 ? 's' : ''}
          </span>
          <div className="flex items-center justify-start sm:justify-end gap-2 w-full sm:w-auto overflow-x-auto whitespace-nowrap">
            <Button
              variant="outline"
              size="sm"
              onClick={handleBulkDelete}
              className="text-red-600 dark:text-red-400 border-red-300 dark:border-red-700 hover:bg-red-50 dark:hover:bg-red-950"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Supprimer
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="text-green-600 dark:text-green-400 border-green-300 dark:border-green-700 hover:bg-green-50 dark:hover:bg-green-950"
            >
              <Download className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              className="text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950"
            >
              <FileText className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrint}
              className="text-blue-600 dark:text-blue-400 border-blue-300 dark:border-blue-700 hover:bg-blue-50 dark:hover:bg-blue-950"
            >
              <Printer className="mr-2 h-4 w-4" />
              Imprimer
            </Button>
          </div>
        </div>
      )}

      {/* Colis Table */}
      <div className="space-y-4">
        <div className="space-y-3 sm:space-y-0">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Liste des Colis</h2>
            <div className="flex justify-between items-center sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Afficher</span>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => {
                setItemsPerPage(Number(value));
                setCurrentPage(1);
              }}>
                <SelectTrigger className="w-16 h-8 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                  <SelectValue placeholder={itemsPerPage.toString()} />
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
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {loading ? (
                'Chargement...'
              ) : (
                `Total: ${totalCount} colis`
              )}
            </span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table className="bg-transparent min-w-full">
            <TableHeader>
              <TableRow className="border-b border-gray-200 dark:border-gray-600" style={{ backgroundColor: 'hsl(210, 40%, 96.1%)' }}>
                <TableHead className="w-12">
                  <Checkbox
                    className='dark:border-gray-900'
                    checked={isAllSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = isIndeterminate;
                    }}
                    onCheckedChange={handleSelectAll}
                  />
                </TableHead>
                <TableHead className="text-gray-900 font-medium">ID Colis</TableHead>
                <TableHead className="text-gray-900 font-medium">Client</TableHead>
                <TableHead className="text-gray-900 font-medium">Téléphone</TableHead>
                <TableHead className="text-gray-900 font-medium">Entreprise</TableHead>
                <TableHead className="text-gray-900 font-medium">Statut</TableHead>
                <TableHead className="text-gray-900 font-medium">Prix</TableHead>
                <TableHead className="text-gray-900 font-medium">Frais</TableHead>
                <TableHead className="text-gray-900 font-medium text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(loading || refreshing) ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className="border-b border-gray-600 dark:border-gray-600 bg-transparent">
                    <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-6 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-16"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-16"></div></TableCell>
                  </TableRow>
                ))
              ) : colis.length > 0 ? (
                colis.map((colisItem) => (
                  <TableRow key={colisItem.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-transparent">
                    <TableCell>
                      <Checkbox
                        checked={selectedColisIds.includes(colisItem.id)}
                        onCheckedChange={(checked) => handleSelectColis(colisItem.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell className="w-[150px] block">
                      <div className="flex items-center justify-center min-h-[40px]">
                        <span className="truncate">
                          {colisItem.id}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100">{colisItem.client?.nom}</TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100">{colisItem.client?.telephone || '-'}</TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100">{colisItem.entreprise?.nom}</TableCell>
                    <TableCell><StatusBadge statut={colisItem.statut} statuts={statuts} /></TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100">
                      {colisItem.prix ? `${colisItem.prix} DH` : '-'}
                    </TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100">
                      {colisItem.frais ? `${colisItem.frais} DH` : '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(`/colis/${colisItem.id}?returnTo=${encodeURIComponent('/colis')}`)}
                        className="h-8 px-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:text-gray-900 dark:hover:text-white transition-colors"
                      >
                        Voir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-transparent">
                  <TableCell colSpan={12} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Aucun colis trouvé
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

      {/* Import Modal */}
      <ImportColisModal
        open={importModalOpen}
        onOpenChange={setImportModalOpen}
        onImportSuccess={() => {
          setImportModalOpen(false);
          fetchColis({ _refresh: true }); // Refresh the list after successful import
        }}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationDialog
        open={deleteConfirmationOpen}
        onOpenChange={setDeleteConfirmationOpen}
        title="Supprimer les colis"
        description={`Êtes-vous sûr de vouloir supprimer ${selectedColisIds.length} colis ? \n\nCette action supprimera :\n• ${selectedColisIds.length} colis sélectionnés\n• L'historique complet de chaque colis\n\nCette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        onConfirm={confirmDelete}
        variant="destructive"
      />
    </div>
  );
}
