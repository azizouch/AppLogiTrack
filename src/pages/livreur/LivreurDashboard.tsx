import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, RotateCcw, User, MapPin, Truck, Calendar, Award, LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ColisQRScanner } from '@/components/colis';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useQRScanner } from '@/contexts/QRScannerContext';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/supabase';
import { isDateTodayLocal, isDateThisMonthLocal } from '@/lib/utils';
import { CircularStats } from '@/components/ui/circular-stats';
import { Colis } from '@/types';
import { useToast } from '@/hooks/use-toast';

// StatItem component for profile card
interface StatItemProps {
  icon: LucideIcon;
  label: string;
  value: string;
}

function StatItem({ icon: Icon, label, value }: StatItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-9 h-9 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
        <p className="text-md font-medium text-gray-900 dark:text-white">{value}</p>
      </div>
    </div>
  );
}

// ActivityItem component for deliveries
interface ActivityItemProps {
  title: string;
  description: string;
  time: string;
}

function ActivityItem({ title, description, time }: ActivityItemProps) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full mt-2 flex-shrink-0"></div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
        <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{description}</p>
        <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">{time}</p>
      </div>
    </div>
  );
}

// StatusBar component for performances
interface StatusBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

function StatusBar({ label, value, max, color }: StatusBarProps) {
  const percentage = max > 0 ? (value / max) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        <span className="text-sm font-bold text-gray-900 dark:text-white">{value}</span>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-300 ${color}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
    </div>
  );
}

interface LivreurStats {
  aLivrerAujourdhui: number;
  enCours: number;
  livresAujourdhui: number;
  retournes: number;
  livraisonsATemps: number;
  colisEnCours: number;
  colisRetournes: number;
  progressionJournaliere: number;
  livraisonsCeMois: number;
}

const isDeliveredStatus = (statut?: string) => {
  const normalized = (statut || '').toLowerCase().trim();
  return normalized === 'livré' || normalized === 'livre';
};

const isReturnedStatus = (statut?: string) => {
  const normalized = (statut || '').toLowerCase().trim();
  return normalized === 'retourné' || normalized === 'retourne' || normalized === 'retour';
};

export function LivreurDashboard() {
  const { state } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { 
    isQRScannerOpen, 
    setIsQRScannerOpen,
    scannedColis, 
    setScannedColis,
    isScannedColisModalOpen, 
    setIsScannedColisModalOpen,
    scannedColisLoading,
    setScannedColisLoading
  } = useQRScanner();

  const [stats, setStats] = useState<LivreurStats>({
    aLivrerAujourdhui: 0,
    enCours: 0,
    livresAujourdhui: 0,
    retournes: 0,
    livraisonsATemps: 0,
    colisEnCours: 0,
    colisRetournes: 0,
    progressionJournaliere: 0,
    livraisonsCeMois: 1
  });
  const [bonStats, setBonStats] = useState({
    distribution: { total: 0, enCours: 0, complete: 0, annule: 0 },
    paiement: { total: 0, enCours: 0, complete: 0, annule: 0 },
    retour: { total: 0, enCours: 0, complete: 0, annule: 0 }
  });
  const [loading, setLoading] = useState(false);
  const [bonStatsLoading, setBonStatsLoading] = useState(false);
  const [todayColisItems, setTodayColisItems] = useState<any[]>([]);

  // Performance metrics
  const completedDeliveries = stats.livresAujourdhui;
  const inProgressDeliveries = stats.enCours;
  const returnedDeliveries = stats.retournes;
  const todayDeliveries = stats.aLivrerAujourdhui + stats.enCours + stats.livresAujourdhui;

  useEffect(() => {
    const fetchLivreurStats = async () => {
      if (!state.user?.id) return;

      try {
        setLoading(true);
        setBonStatsLoading(true);

        // Fetch both colis data and bon statistics
        const [colisResult, bonStatsResult] = await Promise.all([
          api.getColis({
            livreurId: state.user.id,
            limit: 1000
          }),
          api.getBonStatsByUser(state.user.id)
        ]);

        const { data: colisData, error } = colisResult;

        if (error) {
          console.error('API error:', error);
          return;
        }

        if (colisData) {
          // Calculate statistics
          const aLivrerAujourdhui = colisData.filter(colis =>
            colis.statut === 'en_attente' || colis.statut === 'pris_en_charge'
          ).length;

          const enCours = colisData.filter(colis =>
            colis.statut === 'en_cours'
          ).length;

          const livresAujourdhui = colisData.filter(colis =>
            isDeliveredStatus(colis.statut) &&
            isDateTodayLocal(colis.date_mise_a_jour)
          ).length;

          const retournes = colisData.filter(colis =>
            isReturnedStatus(colis.statut)
          ).length;

          const todayItems = colisData.filter(colis =>
            colis.statut === 'en_attente' ||
            colis.statut === 'pris_en_charge' ||
            colis.statut === 'en_cours' ||
            (isDeliveredStatus(colis.statut) && isDateTodayLocal(colis.date_mise_a_jour))
          );

          setTodayColisItems(todayItems);

          setStats({
            aLivrerAujourdhui,
            enCours,
            livresAujourdhui,
            retournes,
            livraisonsATemps: livresAujourdhui,
            colisEnCours: enCours,
            colisRetournes: retournes,
            progressionJournaliere: livresAujourdhui + enCours,
            livraisonsCeMois: colisData.filter(colis =>
              isDeliveredStatus(colis.statut) && isDateThisMonthLocal(colis.date_mise_a_jour)
            ).length
          });
        } else {
          setTodayColisItems([]);
          setStats({
            aLivrerAujourdhui: 0,
            enCours: 0,
            livresAujourdhui: 0,
            retournes: 0,
            livraisonsATemps: 0,
            colisEnCours: 0,
            colisRetournes: 0,
            progressionJournaliere: 0,
            livraisonsCeMois: 0
          });
        }

        // Handle bon statistics
        if (bonStatsResult.data && !bonStatsResult.error) {
          setBonStats(bonStatsResult.data);
        }
      } catch (error) {
        console.error('Error fetching livreur dashboard data:', error);
      } finally {
        setLoading(false);
        setBonStatsLoading(false);
      }
    };

    fetchLivreurStats();
  }, [state.user?.id]);

  // Get current date in French format
   const capitalize = (word: string) =>
    word.charAt(0).toUpperCase() + word.slice(1);

  const getCurrentDate = () => {
    const now = new Date();

    const parts = now.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).split(' ');

    return parts
      .map((part, index) => {
        // capitalize weekday (index 0) and month (index 2)
        if (index === 0 || index === 2) return capitalize(part);
        return part;
      })
      .join(' ');
  };

  // Handle card click navigation
  const handleCardClick = (status: string) => {
    navigate(`/colis/mes-filtered?status=${status}`);
  };

  // Handle QR scan
  const handleQRScan = async (colisId: string) => {
    try {
      setScannedColisLoading(true);
      setIsQRScannerOpen(false);

      // Fetch the scanned colis details
      const result = await api.getColisById(colisId);
      const { data: colisData, error } = result;

      if (error || !colisData) {
        toast({
          title: 'Erreur',
          description: `Colis ${colisId} non trouvé`,
          variant: 'destructive',
        });
        return;
      }

      setScannedColis(colisData);
      setIsScannedColisModalOpen(true);
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de récupérer les données du colis',
        variant: 'destructive',
      });
    } finally {
      setScannedColisLoading(false);
    }
  };

  // Handle associating colis with livreur
  const handleAssociateColis = async () => {
    if (!scannedColis || !state.user?.id) return;

    try {
      setScannedColisLoading(true);

      // Update colis with livreur association
      const { error } = await api.updateColis(scannedColis.id, {
        livreur_id: state.user.id,
        statut: scannedColis.statut === 'en_attente' ? 'pris_en_charge' : scannedColis.statut
      });

      if (error) {
        throw new Error(error.message);
      }

      toast({
        title: 'Succès',
        description: `Colis ${scannedColis.id} associé avec succès`,
      });

      setIsScannedColisModalOpen(false);
      setScannedColis(null);

      // Refresh dashboard
      window.location.reload();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'associer le colis',
        variant: 'destructive',
      });
    } finally {
      setScannedColisLoading(false);
    }
  };

  const statsCards = [
    {
      title: 'À livrer aujourd\'hui',
      value: loading ? '...' : stats.aLivrerAujourdhui.toString(),
      description: 'Colis à livrer aujourd\'hui',
      icon: Clock,
      iconColor: 'text-orange-500',
      titleColor: 'text-gray-900 dark:text-white',
      valueColor: 'text-gray-900 dark:text-white',
      descColor: 'text-gray-600 dark:text-gray-400',
      borderColor: 'border-orange-500',
      bgColor: 'bg-transparent',
      status: 'a_livrer_aujourdhui',
    },
    {
      title: 'En cours',
      value: loading ? '...' : stats.enCours.toString(),
      description: 'Colis en cours de livraison',
      icon: Truck,
      iconColor: 'text-blue-500',
      titleColor: 'text-gray-900 dark:text-white',
      valueColor: 'text-gray-900 dark:text-white',
      descColor: 'text-gray-600 dark:text-gray-400',
      borderColor: 'border-blue-500',
      bgColor: 'bg-transparent',
      status: 'en_cours',
    },
    {
      title: 'Livrés aujourd\'hui',
      value: loading ? '...' : stats.livresAujourdhui.toString(),
      description: 'Colis livrés aujourd\'hui',
      icon: CheckCircle,
      iconColor: 'text-green-500',
      titleColor: 'text-gray-900 dark:text-white',
      valueColor: 'text-gray-900 dark:text-white',
      descColor: 'text-gray-600 dark:text-gray-400',
      borderColor: 'border-green-500',
      bgColor: 'bg-transparent',
      status: 'livres_aujourdhui',
    },
    {
      title: 'Retournés',
      value: loading ? '...' : stats.retournes.toString(),
      description: 'Colis retournés aujourd\'hui',
      icon: RotateCcw,
      iconColor: 'text-red-500',
      titleColor: 'text-gray-900 dark:text-white',
      valueColor: 'text-gray-900 dark:text-white',
      descColor: 'text-gray-600 dark:text-gray-400',
      borderColor: 'border-red-500',
      bgColor: 'bg-transparent',
      status: 'retournes_livreur',
    },
  ];

  return (
    <div className="space-y-3 sm:space-y-5">
      {/* Header with date */}
      <div className="flex justify-between items-center">
        <button
          className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:text-gray-900 dark:focus:text-gray-100 transition-colors select-none bg-transparent border-none p-0 m-0 text-left"
          onClick={() => navigate('/')}
          onMouseLeave={(e) => e.currentTarget.blur()}
        >
          Tableau de bord Livreur
        </button>
        <p className="text-xs sm:text-sm text-gray-500">
          {getCurrentDate()}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statsCards.map((stat) => (
          <Card
            key={stat.title}
            className={`${stat.bgColor} border-l border-t-4 border-r border-b ${stat.borderColor} shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-200`}
            onClick={() => handleCardClick(stat.status)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${stat.titleColor}`}>
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-3xl font-bold ${stat.valueColor}`}>{stat.value}</div>
              <p className={`text-xs ${stat.descColor} mt-1`}>{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick links to livreur bons pages */}
      <div className="mt-4">
          <CardHeader className="p-0 pb-2">
            <CardTitle className="text-lg">Mes bons</CardTitle>
          </CardHeader>

          <CardContent className='p-0'>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {/* BLUE */}
              <button
                className="flex justify-between items-center w-full sm:w-auto
                          text-black px-3 py-2 pt-4 pb-4 rounded-lg border border-l-4 border-blue-700 dark:text-white"
                onClick={() => navigate('/bons/mes-distribution')}
              >
                <span>Bons Distribution</span>
                <Badge className="ml-2 bg-white border-blue-700 text-black dark:bg-black dark:text-white">
                  {bonStats.distribution?.total ?? 0}
                </Badge>
              </button>
              {/* GREEN */}
              <button
                className="flex justify-between items-center w-full sm:w-auto
                          text-black px-3 py-2 pt-4 pb-4 rounded-lg border border-l-4 border-green-700 dark:text-white"
                onClick={() => navigate('/bons/mes-paiement')}
              >
                <span>Bons Paiement</span>
                <Badge className="ml-2 bg-white border-green-700 text-black dark:bg-black dark:text-white">
                  {bonStats.paiement?.total ?? 0}
                </Badge>
              </button>
              {/* RED */}
              <button
                className="flex justify-between items-center w-full sm:w-auto
                          text-black px-3 py-2 pt-4 pb-4 rounded-lg border border-l-4 border-red-700 dark:text-white"
                onClick={() => navigate('/bons/mes-retour')}
              >
                <span>Bons Retour</span>
                <Badge className="ml-2 bg-white border-red-700 text-black dark:bg-black dark:text-white">
                  {bonStats.retour?.total ?? 0}
                </Badge>
              </button>
            </div>
          </CardContent>
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Mes livraisons du jour */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Mes livraisons du jour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {todayColisItems && todayColisItems.length > 0 ? (
                todayColisItems.slice(0, 4).map((colis, index) => {
                  if (!colis) {
                    return (
                      <ActivityItem
                        key={`unknown-${index}`}
                        title="Colis"
                        description="Information non disponible"
                        time="Statut inconnu"
                      />
                    );
                  }

                  return (
                    <ActivityItem
                      key={colis.id || `colis-${index}`}
                      title={`Colis #${colis.id || 'N/A'}`}
                      description={colis.client && colis.client.adresse ?
                        `${colis.client.adresse}${colis.client.ville ? `, ${colis.client.ville}` : ''}` :
                        "Adresse non spécifiée"}
                      time={colis.statut || "Statut inconnu"}
                    />
                  );
                })
              ) : (
                <p className="text-muted-foreground text-sm">Aucune livraison prévue pour aujourd'hui</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Center Column - Mes performances */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Mes performances</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <StatusBar
                label="Livraisons à temps"
                value={completedDeliveries}
                max={Math.max(completedDeliveries + inProgressDeliveries, 1)}
                color="bg-green-500"
              />
              <StatusBar
                label="Colis en cours"
                value={inProgressDeliveries}
                max={Math.max(todayDeliveries, 1)}
                color="bg-blue-500"
              />
              <StatusBar
                label="Colis retournés"
                value={returnedDeliveries}
                max={Math.max(todayDeliveries, 1)}
                color="bg-red-500"
              />
              <StatusBar
                label="Progression journalière"
                value={completedDeliveries + inProgressDeliveries}
                max={Math.max(todayDeliveries, 1)}
                color="bg-yellow-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Mon profil */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Mon profil</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <StatItem
                icon={Award}
                label="Livreur"
                value={`${state.user?.prenom || ''} ${state.user?.nom || ''}`.trim() || "Non spécifié"}
              />
              <StatItem
                icon={MapPin}
                label="Zone"
                value={state.user?.zone || 'Non définie'}
              />
              <StatItem
                icon={Calendar}
                label="Ce mois"
                value={`${stats.livraisonsCeMois} livraisons`}
              />
              <StatItem
                icon={Truck}
                label="Véhicule"
                value={state.user?.vehicule || 'Non défini'}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bon Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        <CircularStats
          title="Bons de distribution Statistiques"
          type="distribution"
          data={bonStats.distribution}
          loading={bonStatsLoading}
        />
        <CircularStats
          title="Bons de paiement pour livreur Statistiques"
          type="paiement"
          data={bonStats.paiement}
          loading={bonStatsLoading}
        />
      </div>

      {/* QR Scanner Modal */}
      <ColisQRScanner
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onScan={handleQRScan}
        title="Scanner un colis"
        description="Scannez le code QR du colis pour afficher ses détails"
      />

      {/* Scanned Colis Details Modal */}
      <Dialog open={isScannedColisModalOpen} onOpenChange={setIsScannedColisModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Détails du colis scanné</DialogTitle>
            <DialogDescription>
              {scannedColis?.id}
            </DialogDescription>
          </DialogHeader>

          {scannedColisLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
            </div>
          ) : scannedColis ? (
            <div className="space-y-4">
              {/* Colis Info */}
              <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">ID du colis</p>
                  <p className="font-mono font-bold text-gray-900 dark:text-white">{scannedColis.id}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Client</p>
                  <p className="font-semibold text-gray-900 dark:text-white">{scannedColis.client?.nom || 'Non défini'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Adresse</p>
                  <p className="text-sm text-gray-900 dark:text-white">{scannedColis.client?.adresse || 'Non défini'}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">Statut</p>
                  <Badge className="bg-blue-100 dark:bg-blue-900 text-blue-900 dark:text-blue-100">
                    {scannedColis.statut}
                  </Badge>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => setIsScannedColisModalOpen(false)}
                  variant="outline"
                  className="flex-1"
                >
                  Fermer
                </Button>
                <Button
                  onClick={() => navigate(`/colis/${scannedColis.id}`)}
                  variant="outline"
                  className="flex-1"
                >
                  Voir les détails
                </Button>
                <Button
                  onClick={handleAssociateColis}
                  disabled={scannedColisLoading || scannedColis.livreur_id === state.user?.id}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800"
                >
                  {scannedColis.livreur_id === state.user?.id
                    ? 'Déjà associé'
                    : scannedColisLoading
                    ? 'Association...'
                    : 'Associer à moi'}
                </Button>
              </div>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
