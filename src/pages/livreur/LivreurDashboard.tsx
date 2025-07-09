import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, RotateCcw, User, MapPin, Truck, Calendar, Award, LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/supabase';

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

export function LivreurDashboard() {
  const { state } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

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
  const [loading, setLoading] = useState(false);
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

        // Simple, direct API call
        const { data: colisData, error } = await api.getColis({
          livreurId: state.user.id,
          limit: 1000
        });

        if (error) {
          console.error('API error:', error);
          return;
        }

        if (colisData) {
          const today = new Date();
          const todayStr = today.toISOString().split('T')[0];

          // Calculate statistics
          const aLivrerAujourdhui = colisData.filter(colis =>
            colis.statut === 'en_attente' || colis.statut === 'pris_en_charge'
          ).length;

          const enCours = colisData.filter(colis =>
            colis.statut === 'en_cours'
          ).length;

          const livresAujourdhui = colisData.filter(colis =>
            colis.statut === 'Livré' &&
            colis.date_mise_a_jour?.startsWith(todayStr)
          ).length;

          const retournes = colisData.filter(colis =>
            colis.statut === 'Retourné'
          ).length;

          // Get today's colis items for the activity list
          const todayItems = colisData.filter(colis =>
            colis.statut === 'en_attente' ||
            colis.statut === 'pris_en_charge' ||
            colis.statut === 'en_cours' ||
            (colis.statut === 'Livré' && colis.date_mise_a_jour?.startsWith(todayStr))
          );

          setTodayColisItems(todayItems);

          setStats({
            aLivrerAujourdhui,
            enCours,
            livresAujourdhui,
            retournes,
            livraisonsATemps: livresAujourdhui, // Use delivered today as on-time deliveries
            colisEnCours: enCours,
            colisRetournes: retournes,
            progressionJournaliere: livresAujourdhui + enCours, // Progress = delivered + in progress
            livraisonsCeMois: colisData.filter(colis => colis.statut === 'Livré').length
          });
        }
      } catch (error) {
        console.error('Error fetching livreur dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLivreurStats();
  }, [state.user?.id]);

  // Get current date in French format
  const getCurrentDate = () => {
    const now = new Date();
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return now.toLocaleDateString('fr-FR', options);
  };

  // Handle card click navigation
  const handleCardClick = (status: string) => {
    navigate(`/colis/filtered?status=${status}`);
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
    <div className="space-y-4 sm:space-y-6">
      {/* Header with date */}
      <div className="flex justify-between items-center">
        <button
          className="text-2xl font-bold text-gray-900 dark:text-gray-100 cursor-pointer hover:text-blue-600 dark:hover:text-blue-400 focus:outline-none focus:text-gray-900 dark:focus:text-gray-100 transition-colors select-none bg-transparent border-none p-0 m-0 text-left"
          onClick={() => navigate('/')}
          onMouseLeave={(e) => e.currentTarget.blur()}
        >
          Tableau de bord Livreur
        </button>
        <p className="text-sm text-gray-500">
          {getCurrentDate()}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statsCards.map((stat) => (
          <Card
            key={stat.title}
            className={`${stat.bgColor} border-l-4 border-t border-r border-b ${stat.borderColor} shadow-lg cursor-pointer hover:shadow-xl transition-shadow duration-200`}
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
    </div>
  );
}
