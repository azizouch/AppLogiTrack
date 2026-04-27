import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { 
  Search, RefreshCw, Eye, CheckCircle, XCircle, 
  DollarSign, Calendar, User, Package, Filter, 
  Check, AlertCircle, Loader2
} from 'lucide-react';
import { api } from '@/lib/supabase';
import { Bon } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { BonHistoryModal } from '@/components/modals/BonHistoryModal';

export function DailyPaiementValidation() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { state: authState } = useAuth();
  const [bons, setBons] = useState<Bon[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [validatingBon, setValidatingBon] = useState<string | null>(null);
  const [selectedBon, setSelectedBon] = useState<Bon | null>(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [bonHistory, setBonHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const fetchUnpaidBons = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const { data, error } = await api.getUnpaidPaiementBons();

      if (error) {
        console.error('Error fetching unpaid payment bons:', error);
        setBons([]);
        toast({
          title: 'Erreur',
          description: 'Impossible de charger les bons de paiement',
          variant: 'destructive',
        });
      } else {
        // Filter by search term if provided
        let filteredData = data || [];
        if (searchTerm) {
          const search = searchTerm.toLowerCase();
          filteredData = filteredData.filter((bon: Bon) => 
            bon.id?.toLowerCase().includes(search) ||
            bon.assigned_user?.nom?.toLowerCase().includes(search) ||
            bon.assigned_user?.prenom?.toLowerCase().includes(search) ||
            bon.notes?.toLowerCase().includes(search)
          );
        }
        setBons(filteredData);
      }
    } catch (error) {
      console.error('Error fetching unpaid payment bons:', error);
      setBons([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [searchTerm, toast]);

  useEffect(() => {
    fetchUnpaidBons();
  }, [fetchUnpaidBons]);

  const handleRefresh = () => {
    fetchUnpaidBons(true);
  };

  const handleValidateBon = async (bon: Bon) => {
    if (!authState.user?.id) {
      toast({
        title: 'Erreur',
        description: 'Utilisateur non connecté',
        variant: 'destructive',
      });
      return;
    }

    try {
      setValidatingBon(bon.id);

      const { error } = await api.validatePaiementBon(bon.id, authState.user.id, 'Validé par l\'administrateur');

      if (error) {
        console.error('Error validating bon:', error);
        toast({
          title: 'Erreur',
          description: 'Impossible de valider le bon de paiement',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Succès',
          description: `Bon de paiement ${bon.id} marqué comme payé`,
        });
        // Remove from list
        setBons(prev => prev.filter(b => b.id !== bon.id));
      }
    } catch (error) {
      console.error('Error validating bon:', error);
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue lors de la validation',
        variant: 'destructive',
      });
    } finally {
      setValidatingBon(null);
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

  // Calculate totals
  const totalMontant = bons.reduce((sum, bon) => sum + (bon.montant || 0), 0);
  const totalColis = bons.reduce((sum, bon) => sum + (bon.nb_colis || 0), 0);

  return (
    <div className="container mx-auto py-6">
      <div className="flex flex-col gap-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">Validation des Paiements</h1>
            <p className="text-muted-foreground">
              Valider les bons de paiement quotidiens des livreurs
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing}>
            {refreshing ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-4 w-4" />
            )}
            Actualiser
          </Button>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Bons en attente
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{bons.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total colis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalColis}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Montant total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatMontant(totalMontant)} €</div>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par ID, livreur..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        {/* Bons Table */}
        <Card>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : bons.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mb-2" />
                <p>Aucun bon de paiement en attente</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Livreur</TableHead>
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
                      <TableCell>{formatDate(bon.date_creation)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span>
                            {bon.assigned_user?.prenom} {bon.assigned_user?.nom}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Package className="h-4 w-4 text-muted-foreground" />
                          {bon.nb_colis || 0}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <DollarSign className="h-4 w-4 text-muted-foreground" />
                          {formatMontant(bon.montant)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
                          {bon.statut}
                        </Badge>
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
                            onClick={() => navigate(`/bons/paiement/${bon.id}`)}
                            title="Voir détails"
                          >
                            <Package className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleValidateBon(bon)}
                            disabled={validatingBon === bon.id}
                            className="bg-green-600 hover:bg-green-700"
                            title="Marquer comme payé"
                          >
                            {validatingBon === bon.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Check className="h-4 w-4" />
                            )}
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