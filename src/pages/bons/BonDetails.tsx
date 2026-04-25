import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Truck, Calendar, User, Package, FileText, AlertCircle, FileSpreadsheet, History, RotateCcw, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/supabase';
import { Bon, Colis } from '@/types';
import { downloadBonAsPDF, downloadMobileBonAsPDF, printBon, downloadBonAsExcel } from '@/utils/pdfGenerator';
import { BonHistoryModal } from '@/components/modals/BonHistoryModal';

interface CompanySettings {
  id?: string;
  nom?: string;
  adresse?: string;
  ville?: string;
  telephone?: string;
  email?: string;
}

export function BonDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bon, setBon] = useState<Bon | null>(null);
  const [colis, setColis] = useState<Colis[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingMobilePdf, setDownloadingMobilePdf] = useState(false);
  const [downloadingExcel, setDownloadingExcel] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [bonHistory, setBonHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [assignedLivreur, setAssignedLivreur] = useState<any | null>(null);
  // Fetch bon history directly for display
  useEffect(() => {
    if (bon && bon.id) {
      fetchBonHistory();
    }
    // eslint-disable-next-line
  }, [bon]);

  const fetchBonHistory = async () => {
    try {
      setLoadingHistory(true);
      const { data, error } = await api.getBonHistory(bon.id);
      if (!error && data) {
        setBonHistory(Array.isArray(data) ? data : []);
      } else {
        setBonHistory([]);
      }
    } catch (error) {
      setBonHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchBonDetails();
      fetchCompanySettings();
    }
  }, [id]);

  const fetchBonDetails = async () => {
    try {
      setLoading(true);

      // Fetch bon data from API
      const { data, error } = await api.getBonById(id!);

      if (error || !data) {
        console.error('Error fetching bon:', error);
        setBon(null);
        setColis([]);
        return;
      }

      setBon(data);

      // Load assigned livreur details when bon source is livreur
      if (data.source_type === 'livreur' && data.assigned_to) {
        try {
          const { data: livreurData } = await api.getUserById(data.assigned_to);
          setAssignedLivreur(livreurData || null);
        } catch (err) {
          console.warn('Could not load assigned livreur:', err);
          setAssignedLivreur(null);
        }
      } else {
        setAssignedLivreur(null);
      }

      // Fetch related colis based on bon type
      await fetchRelatedColis(data);

    } catch (error) {
      console.error('Error in fetchBonDetails:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du chargement',
        variant: 'destructive',
      });
      setBon(null);
      setColis([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedColis = async (bon: Bon) => {
    try {

      // Fetch colis from bon_colis junction table
      const { data, error } = await api.getColisByBonId(bon.id);

      if (error) {
        console.error('[BonDetails] Error from getColisByBonId:', error);
        toast({
          title: 'Erreur chargement colis',
          description: error.message || 'Impossible de charger les colis associés',
          variant: 'destructive',
        });
        setColis([]);
        return;
      }

      if (data) {
        console.log('[BonDetails] Loaded colis:', data.length, data);
        setColis(data);
      } else {
        console.log('[BonDetails] No colis data returned');
        setColis([]);
      }
    } catch (error: any) {
      console.error('[BonDetails] Exception fetching related colis:', error);
      toast({
        title: 'Erreur',
        description: error?.message || 'Une erreur est survenue lors du chargement des colis',
        variant: 'destructive',
      });
      setColis([]);
    }
  };

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
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Check if user is on mobile device
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  const handleDownloadPdf = async () => {
    if (!bon) return;

    try {
      setDownloadingPdf(true);

      await downloadBonAsPDF(bon, colis, companySettings || undefined);

      toast({
        title: 'PDF téléchargé',
        description: 'Le fichier PDF a été téléchargé dans votre dossier Téléchargements',
      });

    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le PDF',
        variant: 'destructive',
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const handleDownloadMobilePdf = async () => {
    if (!bon) return;

    try {
      setDownloadingMobilePdf(true);

      await downloadMobileBonAsPDF(bon, colis, companySettings || undefined);

      toast({
        title: 'PDF Mobile téléchargé',
        description: 'Le fichier PDF optimisé mobile a été téléchargé dans votre dossier Téléchargements',
      });

    } catch (error) {
      console.error('Error downloading mobile PDF:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de générer le PDF mobile',
        variant: 'destructive',
      });
    } finally {
      setDownloadingMobilePdf(false);
    }
  };

  const handlePrint = async () => {
    if (!bon) return;

    try {
      setPrinting(true);

      await printBon(bon, colis, companySettings || undefined);

      toast({
        title: 'Impression',
        description: 'Le bon a été ouvert pour impression',
      });

    } catch (error) {
      console.error('Error printing bon:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible d\'ouvrir l\'impression',
        variant: 'destructive',
      });
    } finally {
      setPrinting(false);
    }
  };

  const handleDownloadExcel = async () => {
    if (!bon) return;

    try {
      setDownloadingExcel(true);

      await downloadBonAsExcel(bon, colis, companySettings || undefined);

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
      setDownloadingExcel(false);
    }
  };

  // Dynamic navigation based on bon type and source
  const getBackPath = () => {
    if (!bon) return '/bons';
    const type = bon.type;
    const source = bon.source_type;
    if (source === 'admin') {
      return `/admin/bons/admin/${type}`;
    }
    return `/admin/bons/livreurs/${type}`;
  };

  // Dynamic icon and color based on bon type
  const getBonTypeConfig = () => {
    switch (bon?.type) {
      case 'retour':
        return { icon: RotateCcw, color: 'text-purple-600 dark:text-purple-400', borderColor: 'border-purple-600', bgHover: 'hover:bg-purple-50 dark:hover:bg-purple-900/20', label: 'Bon de Retour' };
      case 'paiement':
        return { icon: CreditCard, color: 'text-green-600 dark:text-green-400', borderColor: 'border-green-600', bgHover: 'hover:bg-green-50 dark:hover:bg-green-900/20', label: 'Bon de Paiement' };
      case 'distribution':
      default:
        return { icon: Truck, color: 'text-blue-600 dark:text-blue-400', borderColor: 'border-blue-600', bgHover: 'hover:bg-blue-50 dark:hover:bg-blue-900/20', label: 'Bon de Distribution' };
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!bon) {
    return (
      <div className="space-y-3">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Bon non trouvé</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Le bon demandé n'existe pas ou a été supprimé.</p>
          <Button onClick={() => navigate(-1)} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  const typeConfig = getBonTypeConfig();
  const TypeIcon = typeConfig.icon;
  const isAdminSource = bon.source_type === 'admin';
  const livreurInfo = assignedLivreur || bon.user;

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="space-y-3 md:space-y-2">
          {/* Return button */}
          <div className="flex items-center justify-start">
            <Button
              variant="ghost"
              onClick={() => navigate(getBackPath())}
              className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors ring-offset-background hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la liste
            </Button>
          </div>

          {/* Title and status */}
          <div className="flex items-center justify-between gap-2 md:gap-3">
            <TypeIcon className={`h-6 w-6 ${typeConfig.color}`} />
            <h1 className="text-lg md:text-xl sm:text-xl font-bold text-gray-900 dark:text-white truncate w-[200px] sm:w-[250px] block">
              {typeConfig.label} : {bon.id}
            </h1>
            <div className="">
              {getStatusBadge(bon.statut)}
            </div>
          </div>
        </div>

        <div className="flex gap-2 w-full lg:w-auto lg:gap-3">
          <Button
            onClick={handlePrint}
            disabled={printing}
            variant="outline"
            className={`${typeConfig.borderColor} ${typeConfig.color} ${typeConfig.bgHover} flex-1 lg:flex-none`}
          >
            {printing ? (
              <>
                <div className={`animate-spin rounded-full h-4 w-4 border-b-2 mr-2 ${typeConfig.color.replace('text-', 'border-').replace('dark:', '')}`}></div>
                <span className="hidden sm:inline">Impression...</span>
              </>
            ) : (
              <>
                <Printer className="mr-1 h-4 w-4" />
                <span className="hidden sm:inline">Imprimer</span>
              </>
            )}
          </Button>

          {isMobile() ? (
            <Button
              onClick={handleDownloadMobilePdf}
              disabled={downloadingMobilePdf}
              className={`bg-${bon.type === 'retour' ? 'purple' : bon.type === 'paiement' ? 'green' : 'blue'}-600 hover:bg-${bon.type === 'retour' ? 'purple' : bon.type === 'paiement' ? 'green' : 'blue'}-700 flex-1 lg:flex-none`}
            >
              {downloadingMobilePdf ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span className="hidden sm:inline">Téléchargement...</span>
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">Télécharger </span>PDF
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className={`bg-${bon.type === 'retour' ? 'purple' : bon.type === 'paiement' ? 'green' : 'blue'}-600 hover:bg-${bon.type === 'retour' ? 'purple' : bon.type === 'paiement' ? 'green' : 'blue'}-700 flex-1 lg:flex-none`}
            >
              {downloadingPdf ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  <span className="hidden sm:inline">Téléchargement...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline"></span>PDF
                </>
              )}
            </Button>
          )}

          <Button
            onClick={handleDownloadExcel}
            disabled={downloadingExcel}
            variant="outline"
            className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 dark:hover:text-green-400 flex-1 lg:flex-none"
          >
            {downloadingExcel ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600 mr-2"></div>
                <span className="hidden sm:inline">Téléchargement...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-4 w-4" />
                <span className="hidden sm:inline"></span>Excel
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Card 1: Informations générales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Informations générales
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">ID Bon</label>
                <p className="text-sm font-mono text-gray-900 dark:text-white">{bon.id}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Type</label>
                <p className="text-sm text-gray-900 dark:text-white capitalize">{bon.type}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Statut</label>
                <div className="mt-1">{getStatusBadge(bon.statut)}</div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Date de création</label>
                <p className="text-sm text-gray-900 dark:text-white">{formatDate(bon.date_creation)}</p>
              </div>
            </div>

            {bon.nb_colis !== undefined && bon.nb_colis !== null && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nombre de colis</label>
                <div className="flex items-center gap-2 mt-1">
                  <Package className="h-4 w-4 text-gray-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{bon.nb_colis} colis</span>
                </div>
              </div>
            )}

            {bon.notes && (
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Notes</label>
                <p className="text-xs text-gray-900 dark:text-white mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  {bon.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card 2: Entreprise / Livreur assigné */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              {isAdminSource ? 'Informations Entreprise' : 'Livreur Assigné'}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isAdminSource ? (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Entreprise</label>
                  <p className="text-sm text-gray-900 dark:text-white">{companySettings?.nom || '—'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Adresse</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {[companySettings?.adresse, companySettings?.ville].filter(Boolean).join(', ') || '—'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Téléphone</label>
                    <p className="text-sm text-gray-900 dark:text-white">{companySettings?.telephone || '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                    <p className="text-sm text-gray-900 dark:text-white break-all">{companySettings?.email || '—'}</p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nom</label>
                  <p className="text-sm text-gray-900 dark:text-white">
                    {[livreurInfo?.nom, livreurInfo?.prenom].filter(Boolean).join(' ').trim() || '—'}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Téléphone</label>
                    <p className="text-sm text-gray-900 dark:text-white">{livreurInfo?.telephone || '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Ville</label>
                    <p className="text-sm text-gray-900 dark:text-white">{livreurInfo?.ville || '—'}</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Véhicule</label>
                    <p className="text-sm text-gray-900 dark:text-white">{livreurInfo?.vehicule || '—'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Zone</label>
                    <p className="text-sm text-gray-900 dark:text-white">{livreurInfo?.zone || '—'}</p>
                  </div>
                </div>
                <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                <p className="text-xs sm:text-sm text-gray-900 dark:text-white mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  {livreurInfo?.email ? `Email: ${livreurInfo.email}` : ''}
                </p>
              </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Colis Section - Real Data */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Liste des Colis ({colis.length} colis)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {colis.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Aucun colis associé à ce bon</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Référence</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Client</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Entreprise</th>
                    <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Adresse</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Frais</th>
                    <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Prix</th>
                    <th className="text-center py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {colis.map((col) => (
                    <tr key={col.id} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="py-3 px-3 font-mono text-xs text-gray-900 dark:text-white">{col.id}</td>
                      <td className="py-3 px-3 text-gray-900 dark:text-white">{col.client?.nom || 'N/A'}</td>
                      <td className="py-3 px-3 text-gray-900 dark:text-white">{col.entreprise?.nom || 'N/A'}</td>
                      <td className="py-3 px-3 text-xs text-gray-600 dark:text-gray-400">{col.client?.adresse || 'N/A'}</td>
                      <td className="py-3 px-3 text-right font-medium text-blue-600 dark:text-blue-400 whitespace-nowrap">
                        {col.frais ? `${col.frais.toFixed(2)} DH` : '-'}
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-green-600 dark:text-green-400 whitespace-nowrap">
                        {col.prix ? `${col.prix.toFixed(2)} DH` : '-'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <button
                          className="inline-flex items-center px-2 py-1 text-xs font-medium text-purple-700 bg-purple-100 rounded hover:bg-purple-200"
                          onClick={() => setIsHistoryModalOpen(true)}
                        >
                          Historique
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {colis.length > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                      <td colSpan={4} className="py-3 px-3 font-semibold text-gray-900 dark:text-white">TOTAL</td>
                      <td className="py-3 px-3 text-right font-bold text-blue-700 dark:text-blue-400 whitespace-nowrap">
                        {colis.reduce((sum, col) => sum + (col.frais || 0), 0).toFixed(2)} DH
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-green-700 dark:text-green-400 whitespace-nowrap">
                        {colis.reduce((sum, col) => sum + (col.prix || 0), 0).toFixed(2)} DH
                      </td>
                      <td></td>
                    </tr>
                    <tr className="bg-gray-100 dark:bg-gray-700">
                      <td colSpan={4} className="py-3 px-3 font-bold text-gray-900 dark:text-white">TOTAL GÉNÉRAL</td>
                      <td colSpan={2} className="py-3 px-3 text-right font-bold text-gray-900 dark:text-white whitespace-nowrap">
                        {(colis.reduce((sum, col) => sum + (col.prix || 0) + (col.frais || 0), 0)).toFixed(2)} DH
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bon History Section - Always Visible */}
      <div className="mt-6">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xl font-semibold">Historique du Bon</span>
          </div>
          {loadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
          ) : bonHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <p className="text-gray-500 dark:text-gray-400 text-sm">Aucun historique disponible</p>
            </div>
          ) : (
            <div className="space-y-2">
              {bonHistory.map((item, index) => (
                <div key={item.id} className="rounded-lg bg-gray-100 dark:bg-gray-700/40 px-3 py-2">
                  <div className="flex items-start gap-3">
                    <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5">
                      <History className="h-4 w-4" />
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2 py-0.5 rounded-full border border-blue-300/80 dark:border-blue-700 text-blue-700 dark:text-blue-300 text-xs font-medium leading-none">
                          {item.type}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {new Date(item.date).toLocaleDateString('fr-FR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className="text-[11px] text-gray-400 dark:text-gray-500">#{index + 1}</span>
                      </div>

                      <div className="text-sm text-gray-700 dark:text-gray-200 leading-tight">
                        Par {item.user ? `${item.user.nom} ${item.user.prenom || ''}`.trim() : 'Utilisateur inconnu'}
                        {item.user?.role && (
                          <span className="ml-2 text-[11px] text-gray-500 dark:text-gray-400">({item.user.role})</span>
                        )}
                      </div>

                      {item.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-tight break-words whitespace-pre-wrap">
                          {item.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Bon History Modal for table action */}
      {bon && (
        <BonHistoryModal
          open={isHistoryModalOpen}
          onOpenChange={setIsHistoryModalOpen}
          bonId={bon.id}
          bonReference={bon.id}
        />
      )}

    </div>
  );
}




