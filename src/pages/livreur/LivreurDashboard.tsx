import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, RotateCcw, User, MapPin, Truck, Calendar, Award, LucideIcon, Ban } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ColisQRScanner } from '@/components/colis';
import { useAuth } from '@/contexts/AuthContext';
import { useQRScanner } from '@/contexts/QRScannerContext';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/supabase';
import { isDateTodayLocal, isDateThisMonthLocal } from '@/lib/utils';
import { CircularStats } from '@/components/ui/circular-stats';
import { Colis } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, TooltipProps } from 'recharts';

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
    setIsQRScannerOpen
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
  const [monthlyStats, setMonthlyStats] = useState<{month: string, livres: number, retournes: number, annules: number}[]>([]);

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

          const monthlyData: {[key: string]: {livres: number, retournes: number, annules: number}} = {};
          const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
          
          for (let i = 0; i < 12; i++) {
            monthlyData[months[i]] = { livres: 0, retournes: 0, annules: 0 };
          }

          const today = new Date();
          for (let i = 0; i < 12; i++) {
            const monthIndex = (today.getMonth() - 11 + i + 12) % 12;
            const monthName = months[monthIndex];
            const year = monthIndex > today.getMonth() ? today.getFullYear() - 1 : today.getFullYear();
            
            const monthStart = new Date(year, monthIndex, 1);
            const monthEnd = new Date(year, monthIndex + 1, 0, 23, 59, 59);

            const monthColis = colisData.filter(colis => {
              const colisDate = colis.date_mise_a_jour ? new Date(colis.date_mise_a_jour) : null;
              if (!colisDate) return false;
              return colisDate >= monthStart && colisDate <= monthEnd;
            });

            monthlyData[monthName] = {
              livres: monthColis.filter(c => isDeliveredStatus(c.statut)).length,
              retournes: monthColis.filter(c => isReturnedStatus(c.statut)).length,
              annules: monthColis.filter(c => {
                const s = (c.statut || '').toLowerCase().trim();
                return s === 'annulé' || s === 'annule';
              }).length
            };
          }

          const monthlyStatsArray = months.map(month => ({
            month,
            livres: monthlyData[month].livres,
            retournes: monthlyData[month].retournes,
            annules: monthlyData[month].annules
          }));

          setMonthlyStats(monthlyStatsArray);
        } else {
          setTodayColisItems([]);
          setMonthlyStats([]);
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

  // Handle QR scan - ColisQRScanner handles everything internally
  const handleQRScan = (colisId: string) => {
    // Keep scanner open to display colis details
    // User can close manually with "Fermer" button
    console.log('QR scanned:', colisId);
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

  const CustomTooltip = ({ active, payload, label }: TooltipProps<any, any>) => {
    if (!active || !payload || payload.length === 0) return null;

    return (
      <div className="bg-white border border-gray-200 rounded-md px-2 py-1 text-xs sm:text-sm">
        <p className="font-semibold text-gray-700 mb-1">{label}</p>
        {payload.map((entry, index) => (
          <p key={index} style={{ color: entry.color }}>
            {entry.name} : {entry.value}
          </p>
        ))}
      </div>
    );
  };

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
            className={`${stat.bgColor} border-l border-t-4 border-r border-b ${stat.borderColor} shadow-sm cursor-pointer hover:shadow-xl transition-shadow duration-200`}
            onClick={() => handleCardClick(stat.status)}
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 p-5 pb-2">
              <CardTitle className={`text-sm font-medium ${stat.titleColor}`}>
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.iconColor}`} />
            </CardHeader>
            <CardContent className='p-5 pt-0'>
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

      {/* Monthly Statistics Chart */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Statistiques mensuelles</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          {/* Legend (always visible, centered) */}
          <div className="flex justify-center gap-4 mb-3">
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-green-500"></span>
              <span className="text-sm">Livrés</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-red-500"></span>
              <span className="text-sm">Retournés</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-gray-500"></span>
              <span className="text-sm">Annulés</span>
            </div>
          </div>
          <div className="w-full overflow-x-auto">
            <div className="h-[250px]" style={{ minWidth: '600px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyStats} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#6b7280" />
                  <YAxis tick={{ fontSize: 12 }} stroke="#6b7280" allowDecimals={false} width={25} />
                  <Tooltip content={<CustomTooltip />} />
                  {/* <Legend content={renderLegend} /> */}
                  <Bar dataKey="livres" name="Livrés" fill="#22c55e" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="retournes" name="Retournés" fill="#ef4444" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="annules" name="Annulés" fill="#6b7280" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </CardContent>
      </Card>

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
    </div>
  );
}
