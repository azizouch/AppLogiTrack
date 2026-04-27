import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  RefreshCw, Eye, DollarSign, Calendar, Package, 
  CheckCircle, Clock, AlertCircle, Loader2, Plus
} from 'lucide-react';
import { api } from '@/lib/supabase';
import { Bon } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { BonHistoryModal } from '@/components/modals/BonHistoryModal';

export function MesPaiementsJournaliers() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state: authState } = useAuth();
  const [bons, setBons] = useState<Bon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedBon, setSelectedBon] = useState<Bon | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [bonHistory, setBonHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchTodayBons = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      if (!authState.user?.id) {
        setBons([]);
        return;
      }

      const { data, error } = await api.getTodayPaiementBonsByLivreur(authState.user.id);

      if (error) {
        console.error('Error fetching today payment bons:', error);
        setBons([]);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger vos bons de paiement',
          variant: 'destructive',
        });
      } else {
        setBons(data || []);
      }
    } catch (error) {
      console.error('Error fetching today payment bons:', error);
      setBons([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [authState.user?.id, toast]);

  useEffect(() => {
    fetchTodayBons();
  }, [fetchTodayBons]);

  const handleRefresh = () => {
    fetchTodayBons(true);
  };

  const handleGenerateBon = async () => {
    if (!authState.user?.id) {
      toast({
        title: 'Erreur',
        description: 'Utilisateur non connecté',
        variant: 'destructive',
      });
      return;
    }

    try {
      setGenerating(true);

      const { error } = await api.generateDailyPaiementBonForLivreur(authState.user.id);

      if (error) {
        console.error('Error generating daily payment bon:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de générer le bon de paiement',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Succès',
          description: 'Bon de paiement généré pour les livraisons du jour',
        });
        fetchTodayBons(true);
      }
    } catch (error) {
      console.error('Error generating daily payment bon:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleViewHistory = async (bon: Bon) => {
    setSelectedBon(bon);
    setIsHistoryModalOpen(true);
    
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR');
  };

  const formatMontant = (montant?: number) => {
    if (montant === undefined || montant === null) return '0,00';
    return montant.toFixed(2).replace('.', ',');
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'Payé':
        return (
          <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            Payé
          </Badge>
        );
      case 'En attente':
        return (
          <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
            <Clock className="mr-1 h-3 w-3" />
            En attente
          </Badge>
        );
      default:
        return <Badge variant="secondary">{statut}</Badge>;
    }
  };

  // Calculate totals
  const totalMontant = bons.reduce((sum, bon) => sum + (bon.montant || 0), 0);
  const totalColis = bons.reduce((sum, bon) => sum + (bon.nb_colis || 0), 0);
  const paidBons = bons.filter(b => b.statut === 'Payé');
  const pendingBons = bons.filter(b => b.statut === 'En attente');

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Mes Paiements du Jour</h1>
            <p className="text-muted-foreground">
              Bons de paiement pour les livraisons effectuées aujourd'hui
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={handleGenerateBon} disabled={generating}>
              {generating ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Générer mon bon
            </Button>
            <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
              {refreshing ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Actualiser
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total colis aujourd'hui
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <Package className="h-5 w-5" />
                {totalColis}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Montant total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {formatMontant(totalMontant)} €
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                En attente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600 flex items-center gap-2">
                <Clock className="h-5 w-5" />
                {pendingBons.length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Payés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {paidBons.length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bons Table */}
        <Card>
          <CardHeader>
            <CardTitle>Historique des paiements</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : bons.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p>Aucun bon de paiement pour aujourd'hui</p>
                <p className="text-sm">Les bons sont générés automatiquement après vos livraisons</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Colis</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bons.map((bon) => (
                    <TableRow key={bon.id}>
                      <TableCell className="font-mono text-sm">{bon.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          {formatDate(bon.date_creation)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          {bon.nb_colis || 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 font-semibold">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          {formatMontant(bon.montant)} €
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(bon.statut || '')}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleViewHistory(bon)}
                            title="Historique"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/bons/mes-paiement/${bon.id}`)}
                            title="Voir détails"
                          >
                            <Package className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* History Modal */}
      {selectedBon && (
        <BonHistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => {
            setIsHistoryModalOpen(false);
            setSelectedBon(null);
          }}
          bonId={selectedBon.id}
          bonHistory={bonHistory}
          loadingHistory={loadingHistory}
        />
      )}
    </div>
  );
}