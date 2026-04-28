import { useEffect, useMemo, useState } from 'react';
import { Search, Files, RefreshCw, Plus, X, FileText, PanelLeftOpen, Eye, Printer, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { TablePagination } from '@/components/ui/table-pagination';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { jsPDF } from 'jspdf';

type Livreur = { id: string; nom: string; prenom?: string };
type Bon = { id: string; type: string; statut: string; montant?: number; user_id?: string };
type Facture = { id: string; numero: string; date_facture: string; montant: number; statut: string; livreur_id: string };
type FactureBon = { id: string; type: string; statut: string; montant?: number; date_creation?: string };

const SAMPLE_FACTURES: Facture[] = [
  { id: 'sample-1', numero: 'FAC-20260428-1001', date_facture: '2026-04-28', montant: 450, statut: 'Brouillon', livreur_id: '' },
  { id: 'sample-2', numero: 'FAC-20260428-1002', date_facture: '2026-04-28', montant: 780, statut: 'Envoyée', livreur_id: '' },
  { id: 'sample-3', numero: 'FAC-20260427-1003', date_facture: '2026-04-27', montant: 620, statut: 'Payée', livreur_id: '' },
];

export function Factures() {
  const { toast } = useToast();
  const { state } = useAuth();
  const isMobile = useIsMobile();

  const [loading, setLoading] = useState(false);
  const [factures, setFactures] = useState<Facture[]>([]);
  const [livreurs, setLivreurs] = useState<Livreur[]>([]);
  const [bons, setBons] = useState<Bon[]>([]);

  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('all');
  const [livreurFilter, setLivreurFilter] = useState('all');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  const [openCreate, setOpenCreate] = useState(false);
  const [openDetails, setOpenDetails] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedLivreur, setSelectedLivreur] = useState('');
  const [selectedBons, setSelectedBons] = useState<string[]>([]);
  const [selectedFacture, setSelectedFacture] = useState<Facture | null>(null);
  const [selectedFactureBons, setSelectedFactureBons] = useState<FactureBon[]>([]);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [printingId, setPrintingId] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const loadFactures = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('factures')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
      setLoading(false);
      return;
    }
    setFactures((data as Facture[]) || []);
    setLoading(false);
  };

  const loadLivreurs = async () => {
    const { data } = await supabase
      .from('utilisateurs')
      .select('id, nom, prenom')
      .eq('role', 'Livreur')
      .order('nom', { ascending: true });
    setLivreurs((data as Livreur[]) || []);
  };

  useEffect(() => {
    loadFactures();
    loadLivreurs();
  }, []);

  useEffect(() => {
    const run = async () => {
      if (!selectedLivreur) {
        setBons([]);
        setSelectedBons([]);
        return;
      }
      const { data, error } = await supabase
        .from('bons')
        .select('id, type, statut, montant, user_id')
        .eq('type', 'paiement')
        .eq('user_id', selectedLivreur)
        .order('date_creation', { ascending: false });

      if (error) {
        toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
        return;
      }
      setBons((data as Bon[]) || []);
      setSelectedBons([]);
    };
    run();
  }, [selectedLivreur]);

  const filteredFactures = useMemo(() => {
    return factures.filter((f) => {
      const matchSearch = !search || f.numero.toLowerCase().includes(search.toLowerCase());
      const matchStatut = statutFilter === 'all' || f.statut === statutFilter;
      const matchLivreur = livreurFilter === 'all' || f.livreur_id === livreurFilter;
      return matchSearch && matchStatut && matchLivreur;
    });
  }, [factures, search, statutFilter, livreurFilter]);

  const tableFactures = !loading && filteredFactures.length === 0 ? SAMPLE_FACTURES : filteredFactures;
  const totalCount = tableFactures.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / itemsPerPage));
  const paginatedFactures = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return tableFactures.slice(start, start + itemsPerPage);
  }, [tableFactures, currentPage, itemsPerPage]);

  const toggleBon = (id: string) => {
    setSelectedBons((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const selectedAmount = useMemo(
    () => bons.filter((b) => selectedBons.includes(b.id)).reduce((sum, b) => sum + Number(b.montant || 0), 0),
    [bons, selectedBons]
  );

  const createFacture = async () => {
    if (!selectedLivreur || selectedBons.length < 2) {
      toast({ title: 'Erreur', description: 'Sélectionnez un livreur et au moins 2 bons', variant: 'destructive' });
      return;
    }

    const now = new Date();
    const numero = `FAC-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${Math.floor(1000 + Math.random() * 9000)}`;

    const { data: factureData, error: factureError } = await supabase
      .from('factures')
      .insert({
        numero,
        livreur_id: selectedLivreur,
        montant: selectedAmount,
        statut: 'Brouillon',
        created_by: state.user?.id || null,
      })
      .select('id')
      .single();

    if (factureError || !factureData) {
      toast({ title: 'Erreur', description: factureError?.message || 'Création facture impossible', variant: 'destructive' });
      return;
    }

    const links = selectedBons.map((bonId) => ({ facture_id: factureData.id, bon_id: bonId }));
    const { error: linkError } = await supabase.from('facture_bons').insert(links);
    if (linkError) {
      toast({ title: 'Erreur', description: linkError.message, variant: 'destructive' });
      return;
    }

    toast({ title: 'Succès', description: `Facture ${numero} créée` });
    setOpenCreate(false);
    setSelectedLivreur('');
    setSelectedBons([]);
    loadFactures();
  };

  const getLivreurName = (livreurId: string) => {
    const livreur = livreurs.find((l) => l.id === livreurId);
    return livreur ? `${livreur.prenom || ''} ${livreur.nom}`.trim() : '—';
  };

  const loadFactureBons = async (factureId: string) => {
    const { data, error } = await supabase
      .from('facture_bons')
      .select('bon_id, bons(id, type, statut, montant, date_creation)')
      .eq('facture_id', factureId);

    if (error) throw error;

    const rows = (data || []) as Array<{ bons: FactureBon | FactureBon[] | null }>;
    return rows
      .map((row) => (Array.isArray(row.bons) ? row.bons[0] : row.bons))
      .filter((b): b is FactureBon => Boolean(b));
  };

  const handleViewFacture = async (facture: Facture) => {
    try {
      setDetailsLoading(true);
      setSelectedFacture(facture);
      const linkedBons = await loadFactureBons(facture.id);
      setSelectedFactureBons(linkedBons);
      setOpenDetails(true);
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message || 'Impossible de charger la facture', variant: 'destructive' });
    } finally {
      setDetailsLoading(false);
    }
  };

  const buildFacturePrintHtml = (facture: Facture, bonsData: FactureBon[]) => {
    const total = bonsData.reduce((sum, b) => sum + Number(b.montant || 0), 0);
    const livreurName = getLivreurName(facture.livreur_id);
    const rows = bonsData
      .map(
        (b) => `
      <tr>
        <td style="padding:8px;border:1px solid #ddd;">${b.id}</td>
        <td style="padding:8px;border:1px solid #ddd;">${b.type}</td>
        <td style="padding:8px;border:1px solid #ddd;">${b.statut}</td>
        <td style="padding:8px;border:1px solid #ddd;text-align:right;">${Number(b.montant || 0).toFixed(2)} MAD</td>
      </tr>`
      )
      .join('');

    return `
      <html>
        <head><title>${facture.numero}</title></head>
        <body style="font-family:Arial, sans-serif; padding: 24px;">
          <h2>Facture ${facture.numero}</h2>
          <p><b>Date:</b> ${new Date(facture.date_facture).toLocaleDateString('fr-FR')}</p>
          <p><b>Livreur:</b> ${livreurName}</p>
          <p><b>Statut:</b> ${facture.statut}</p>
          <table style="width:100%; border-collapse: collapse; margin-top: 16px;">
            <thead>
              <tr style="background:#f3f4f6;">
                <th style="padding:8px;border:1px solid #ddd; text-align:left;">Bon</th>
                <th style="padding:8px;border:1px solid #ddd; text-align:left;">Type</th>
                <th style="padding:8px;border:1px solid #ddd; text-align:left;">Statut</th>
                <th style="padding:8px;border:1px solid #ddd; text-align:right;">Montant</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
          <p style="margin-top:16px;"><b>Total:</b> ${total.toFixed(2)} MAD</p>
        </body>
      </html>
    `;
  };

  const handlePrintFacture = async (facture: Facture) => {
    try {
      setPrintingId(facture.id);
      const linkedBons = await loadFactureBons(facture.id);
      const printWindow = window.open('', '_blank');
      if (!printWindow) return;
      printWindow.document.write(buildFacturePrintHtml(facture, linkedBons));
      printWindow.document.close();
      printWindow.print();
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message || 'Impossible d’imprimer la facture', variant: 'destructive' });
    } finally {
      setPrintingId(null);
    }
  };

  const handleDownloadFacturePdf = async (facture: Facture) => {
    try {
      setDownloadingId(facture.id);
      const linkedBons = await loadFactureBons(facture.id);
      const doc = new jsPDF();
      doc.setFontSize(16);
      doc.text(`Facture ${facture.numero}`, 14, 16);
      doc.setFontSize(11);
      doc.text(`Date: ${new Date(facture.date_facture).toLocaleDateString('fr-FR')}`, 14, 24);
      doc.text(`Livreur: ${getLivreurName(facture.livreur_id)}`, 14, 30);
      doc.text(`Statut: ${facture.statut}`, 14, 36);

      let y = 48;
      doc.text('Bons liés:', 14, y);
      y += 8;
      linkedBons.forEach((b) => {
        doc.text(`- ${b.id} | ${b.type} | ${b.statut} | ${Number(b.montant || 0).toFixed(2)} MAD`, 14, y);
        y += 7;
      });

      doc.text(`Total: ${linkedBons.reduce((sum, b) => sum + Number(b.montant || 0), 0).toFixed(2)} MAD`, 14, y + 6);
      doc.save(`${facture.numero}.pdf`);
    } catch (error: any) {
      toast({ title: 'Erreur', description: error.message || 'Impossible de télécharger le PDF', variant: 'destructive' });
    } finally {
      setDownloadingId(null);
    }
  };

  const resetFilters = () => {
    setSearch('');
    setStatutFilter('all');
    setLivreurFilter('all');
    setCurrentPage(1);
  };

  const hasActiveFilters = search || statutFilter !== 'all' || livreurFilter !== 'all';

  useEffect(() => {
    setCurrentPage(1);
  }, [search, statutFilter, livreurFilter, itemsPerPage]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [currentPage, totalPages]);

  return (
    <div className="space-y-3 w-full">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
   
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Files className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" />
          Gestion des Factures
        </h1>
      
        <div className="flex gap-2 w-full sm:w-auto">
          <Button onClick={() => setOpenCreate(true)} className="bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 h-9 px-3">
            <Plus className="h-4 w-4 mr-2" />
            Créer une facture
          </Button>
        </div>
      </div>

      {/** Filters block aligned with ColisList behavior */}
      {isMobile ? (
        <div className="space-y-3 w-full">
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
                  <SheetTitle>Filtres des Factures</SheetTitle>
                  <SheetDescription>Filtrez les factures par statut</SheetDescription>
                </SheetHeader>
                <div className="space-y-4 mt-6">
                  <Select value={statutFilter} onValueChange={setStatutFilter}>
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                      <SelectValue placeholder="Tous les statuts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tous les statuts</SelectItem>
                      <SelectItem value="Brouillon">Brouillon</SelectItem>
                      <SelectItem value="Envoyée">Envoyée</SelectItem>
                      <SelectItem value="Payée">Payée</SelectItem>
                      <SelectItem value="Annulée">Annulée</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={livreurFilter} onValueChange={setLivreurFilter}>
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
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

                  {hasActiveFilters && (
                    <Button onClick={resetFilters} variant="outline" size="sm" className="w-full text-sm">
                      <X className="mr-2 h-4 w-4" />Réinitialiser
                    </Button>
                  )}
                </div>
              </SheetContent>
            </Sheet>

            <Button
              variant="outline"
              onClick={loadFactures}
              className="border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700 px-2 py-1 text-xs h-9 inline-flex items-center gap-2"
            >
              <RefreshCw className="h-3 w-3" />
              Actualiser
            </Button>
          </div>

          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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
              {hasActiveFilters && (
                <Button variant="outline" size="sm" onClick={resetFilters} className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  <X className="mr-2 h-4 w-4" />Réinitialiser
                </Button>
              )}
              <Button variant="outline" onClick={loadFactures} className="text-sm">
                <RefreshCw className="h-4 w-4 mr-2" />Actualiser
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
              <Input placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
            </div>

            <Select value={statutFilter} onValueChange={setStatutFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="Brouillon">Brouillon</SelectItem>
                <SelectItem value="Envoyée">Envoyée</SelectItem>
                <SelectItem value="Payée">Payée</SelectItem>
                <SelectItem value="Annulée">Annulée</SelectItem>
              </SelectContent>
            </Select>

            <Select value={livreurFilter} onValueChange={setLivreurFilter}>
              <SelectTrigger>
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
          </div>
        </div>
      )}

      <div className="space-y-3 sm:space-y-0">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center py-1 gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Liste des Factures</h2>
          <div className="flex justify-between items-center sm:gap-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">Afficher</span>
              <Select value={itemsPerPage.toString()} onValueChange={(value) => setItemsPerPage(Number(value))}>
                <SelectTrigger className="w-16 h-8 border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
                  <SelectValue placeholder={itemsPerPage.toString()} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600">
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-500 dark:text-gray-400">entrées</span>
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {loading ? 'Chargement...' : `Total: ${totalCount} factures`}
            </span>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-transparent dark:border-gray-700">

        <div className="overflow-x-auto">
          <Table className="bg-transparent min-w-full">
            <TableHeader>
              <TableRow className="bg-gray-200 dark:bg-gray-800">
                <TableHead>Numéro</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedFactures.map((f) => (
                <TableRow key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <TableCell>{f.numero}</TableCell>
                  <TableCell>{new Date(f.date_facture).toLocaleDateString('fr-FR')}</TableCell>
                  <TableCell>{Number(f.montant).toFixed(2)} MAD</TableCell>
                  <TableCell>{f.statut}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-center gap-1">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border" title="Voir" onClick={() => handleViewFacture(f)}>
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border" title="Imprimer" onClick={() => handlePrintFacture(f)} disabled={printingId === f.id}>
                        <Printer className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 border" title="Télécharger PDF" onClick={() => handleDownloadFacturePdf(f)} disabled={downloadingId === f.id}>
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {!loading && paginatedFactures.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Files className="h-10 w-10 text-gray-300" />
                      <span>Aucune facture trouvée</span>
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {totalPages > 1 && (
        <TablePagination
          currentPage={currentPage}
          totalPages={totalPages}
          hasNextPage={currentPage < totalPages}
          hasPrevPage={currentPage > 1}
          onPageChange={setCurrentPage}
        />
      )}

      <Dialog open={openCreate} onOpenChange={setOpenCreate}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer une facture depuis les bons</DialogTitle>
            <DialogDescription>
              Sélectionnez un livreur et au moins 2 bons de paiement pour créer une facture.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 min-w-full">
            <Select value={selectedLivreur} onValueChange={setSelectedLivreur}>
              <SelectTrigger><SelectValue placeholder="Sélectionner un livreur" /></SelectTrigger>
              <SelectContent>
                {livreurs.map((l) => (
                  <SelectItem key={l.id} value={l.id}>{`${l.prenom || ''} ${l.nom}`.trim()}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="border rounded-lg overflow-x-auto">
              <Table className="min-w-full">
                <TableHeader className="bg-gray-50 dark:bg-gray-900">
                  <TableRow>
                    <TableHead></TableHead>
                    <TableHead>Bon</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bons.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>
                        <Checkbox checked={selectedBons.includes(b.id)} onCheckedChange={() => toggleBon(b.id)} />
                      </TableCell>
                      <TableCell>{b.id}</TableCell>
                      <TableCell>{b.type}</TableCell>
                      <TableCell>{b.statut}</TableCell>
                      <TableCell>{Number(b.montant || 0).toFixed(2)} MAD</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex flex-col sm:flex-row items-center text-sm sm:text-md font-medium">
                <span>Total sélectionné: </span>
                <span>{selectedAmount.toFixed(2)} DH</span>
              </div>
              <Button
                onClick={createFacture}
                disabled={!selectedLivreur || selectedBons.length < 2}
              >
                Créer facture
              </Button>
            </div>
            {selectedBons.length > 0 && selectedBons.length < 2 && (
              <p className="text-sm text-amber-600">Sélectionnez au moins 2 bons pour créer une facture.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={openDetails} onOpenChange={setOpenDetails}>
        <DialogContent className="sm:max-w-[900px] max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Détails facture {selectedFacture?.numero}</DialogTitle>
            <DialogDescription>
              Visualisez les informations de la facture et les bons associés.
            </DialogDescription>
          </DialogHeader>
          {detailsLoading ? (
            <p className="text-sm text-gray-500">Chargement...</p>
          ) : selectedFacture ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <p><span className="font-medium">Numéro:</span> {selectedFacture.numero}</p>
                <p><span className="font-medium">Date:</span> {new Date(selectedFacture.date_facture).toLocaleDateString('fr-FR')}</p>
                <p><span className="font-medium">Livreur:</span> {getLivreurName(selectedFacture.livreur_id)}</p>
                <p><span className="font-medium">Statut:</span> {selectedFacture.statut}</p>
              </div>

              <div className="border rounded-lg overflow-x-auto">
                <Table>
                  <TableHeader className="bg-gray-50 dark:bg-gray-900">
                    <TableRow>
                      <TableHead>Bon</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead>Montant</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedFactureBons.map((b) => (
                      <TableRow key={b.id}>
                        <TableCell>{b.id}</TableCell>
                        <TableCell>{b.type}</TableCell>
                        <TableCell>{b.statut}</TableCell>
                        <TableCell>{Number(b.montant || 0).toFixed(2)} MAD</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
