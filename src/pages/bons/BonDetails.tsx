import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Printer, Truck, Calendar, User, Package, FileText, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/supabase';
import { Bon } from '@/types';
import { downloadBonAsPDF, downloadMobileBonAsPDF, downloadMobileBonAsPDFNew, downloadMobileBonAsPDFSimple, printBon } from '@/utils/pdfGenerator';

export function BonDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [bon, setBon] = useState<Bon | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [downloadingMobilePdf, setDownloadingMobilePdf] = useState(false);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    if (id) {
      fetchBonDetails();
    }
  }, [id]);

  const fetchBonDetails = async () => {
    try {
      setLoading(true);

      // Try to fetch real data first
      try {
        const { data, error } = await api.getBonById(id!);

        if (!error && data) {
          setBon(data);
          return;
        }
      } catch (apiError) {
        console.log('API call failed, using sample data:', apiError);
      }

      // Fallback to sample data for demonstration
      const sampleBon: Bon = {
        id: id || 'BD-2025-0001',
        type: 'distribution',
        statut: 'en cours',
        date_creation: new Date().toISOString(),
        nb_colis: 4,
        notes: 'Livraison prioritaire - Contacter le client avant livraison',
        user: {
          id: 'user-1',
          nom: 'Alami',
          prenom: 'Mohammed',
          email: 'mohammed.alami@logitrack.ma',
          telephone: '+212 6 12 34 56 78',
          vehicule: 'Renault Kangoo - AB-1234-CD',
          zone: 'Casablanca Centre'
        }
      };

      setBon(sampleBon);

    } catch (error) {
      console.error('Error in fetchBonDetails:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors du chargement',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
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

      await downloadBonAsPDF(bon);

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

      // Use the simple html2pdf.js generator for testing
      await downloadMobileBonAsPDFSimple(bon);

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

      await printBon(bon);

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
      setPrinting(false);
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
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-12">
          <AlertCircle className="h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Bon non trouvé</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Le bon demandé n'existe pas ou a été supprimé.</p>
          <Button onClick={() => navigate('/bons/distribution')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Retour à la liste
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-2">
          {/* Return button and status on same line for small screens */}
          <div className="flex items-center justify-between sm:block">
            <Button
              variant="ghost"
              onClick={() => navigate('/bons/distribution')}
              className="inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-md px-3 text-sm font-medium transition-colors ring-offset-background hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ArrowLeft className="h-4 w-4" />
              Retour à la liste
            </Button>
            <div className="sm:hidden">
              {getStatusBadge(bon.statut)}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Truck className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
              Bon : {bon.id}
            </h1>
            <div className="hidden sm:block">
              {getStatusBadge(bon.statut)}
            </div>
          </div>
        </div>

        <div className="flex gap-2 w-full sm:w-auto sm:gap-3">
          <Button
            onClick={handlePrint}
            disabled={printing}
            variant="outline"
            className="border-blue-600 text-blue-600 hover:bg-blue-50 flex-1 sm:flex-none"
          >
            {printing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                Impression...
              </>
            ) : (
              <>
                <Printer className="mr-2 h-4 w-4" />
                Imprimer
              </>
            )}
          </Button>

          {isMobile() ? (
            <Button
              onClick={handleDownloadMobilePdf}
              disabled={downloadingMobilePdf}
              className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
            >
              {downloadingMobilePdf ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Téléchargement...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  <span className="hidden min-[340px]:inline">Télécharger </span>PDF
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleDownloadPdf}
              disabled={downloadingPdf}
              className="bg-blue-600 hover:bg-blue-700 flex-1 sm:flex-none"
            >
              {downloadingPdf ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Téléchargement...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  <span className="hidden min-[340px]:inline">Télécharger </span>PDF
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informations générales */}
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

            {bon.nb_colis && (
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
                <p className="text-sm text-gray-900 dark:text-white mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
                  {bon.notes}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Informations livreur */}
        {bon.user && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Livreur assigné
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nom complet</label>
                <p className="text-sm text-gray-900 dark:text-white">
                  {`${bon.user.nom} ${bon.user.prenom || ''}`.trim()}
                </p>
              </div>
              
              {bon.user.email && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                  <p className="text-sm text-gray-900 dark:text-white">{bon.user.email}</p>
                </div>
              )}
              
              {bon.user.telephone && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Téléphone</label>
                  <p className="text-sm text-gray-900 dark:text-white">{bon.user.telephone}</p>
                </div>
              )}
              
              {bon.user.vehicule && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Véhicule</label>
                  <p className="text-sm text-gray-900 dark:text-white">{bon.user.vehicule}</p>
                </div>
              )}
              
              {bon.user.zone && (
                <div>
                  <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Zone</label>
                  <p className="text-sm text-gray-900 dark:text-white">{bon.user.zone}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sample Colis Section - for demonstration - Full Width */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Liste des Colis ({bon?.nb_colis || 4} colis)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            <AlertCircle className="h-4 w-4 inline mr-2" />
            Données d'exemple - En attente de l'implémentation de la relation colis
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[800px]">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Référence</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Client</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Entreprise</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Adresse</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Prix</th>
                  <th className="text-right py-2 px-3 font-medium text-gray-500 dark:text-gray-400">Frais</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-3 font-mono text-xs">COL-2024-001</td>
                  <td className="py-3 px-3">Ahmed Benali</td>
                  <td className="py-3 px-3">TechCorp SARL</td>
                  <td className="py-3 px-3 text-xs">123 Rue Mohammed V, Casablanca</td>
                  <td className="py-3 px-3 text-right font-medium text-green-600 whitespace-nowrap w-24">250.00 DH</td>
                  <td className="py-3 px-3 text-right font-medium text-blue-600 whitespace-nowrap w-24">25.00 DH</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-3 font-mono text-xs">COL-2024-002</td>
                  <td className="py-3 px-3">Fatima Zahra</td>
                  <td className="py-3 px-3">Digital Solutions</td>
                  <td className="py-3 px-3 text-xs">456 Avenue Hassan II, Rabat</td>
                  <td className="py-3 px-3 text-right font-medium text-green-600 whitespace-nowrap w-24">180.50 DH</td>
                  <td className="py-3 px-3 text-right font-medium text-blue-600 whitespace-nowrap w-24">20.00 DH</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-3 font-mono text-xs">COL-2024-003</td>
                  <td className="py-3 px-3">Omar Alami</td>
                  <td className="py-3 px-3">Import Export Co</td>
                  <td className="py-3 px-3 text-xs">789 Boulevard Zerktouni, Marrakech</td>
                  <td className="py-3 px-3 text-right font-medium text-green-600 whitespace-nowrap w-24">320.75 DH</td>
                  <td className="py-3 px-3 text-right font-medium text-blue-600 whitespace-nowrap w-24">30.00 DH</td>
                </tr>
                <tr className="border-b border-gray-100 dark:border-gray-800">
                  <td className="py-3 px-3 font-mono text-xs">COL-2024-004</td>
                  <td className="py-3 px-3">Aicha Mansouri</td>
                  <td className="py-3 px-3">Fashion Store</td>
                  <td className="py-3 px-3 text-xs">321 Rue de la Liberté, Fès</td>
                  <td className="py-3 px-3 text-right font-medium text-green-600 whitespace-nowrap w-24">95.25 DH</td>
                  <td className="py-3 px-3 text-right font-medium text-blue-600 whitespace-nowrap w-24">15.00 DH</td>
                </tr>
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800">
                  <td colSpan={3} className="py-3 px-3 font-semibold">TOTAL</td>
                  <td className="py-3 px-3 text-right font-bold text-green-700 whitespace-nowrap" colSpan={2}>846.50 DH</td>
                  <td className="py-3 px-3 text-right font-bold text-blue-700 whitespace-nowrap">90.00 DH</td>
                </tr>
                <tr className="bg-gray-100 dark:bg-gray-700">
                  <td colSpan={4} className="py-3 px-3 font-bold">TOTAL GÉNÉRAL</td>
                  <td className="py-3 px-3 text-right font-bold text-gray-900 dark:text-white whitespace-nowrap" colSpan={2}>936.50 DH</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
