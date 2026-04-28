
import { useState, useEffect } from 'react';
import { Package, Truck, Users, Clock, CheckCircle, RotateCcw, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LivreurDashboard } from './livreur/LivreurDashboard';
import { CircularStats } from '@/components/ui/circular-stats';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TooltipProps } from 'recharts';

import { api } from '@/lib/supabase';

export function Dashboard() {
  const { state } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    enAttente: 0,
    enTraitement: 0,
    livres: 0,
    retournes: 0,
    totalColis: 0,
    clientsEnregistres: 0,
    entreprisesPartenaires: 0,
    livreursDisponibles: 0
  });
  const [bonStats, setBonStats] = useState({
    distribution: { total: 0, enCours: 0, complete: 0, annule: 0 },
    paiement: { total: 0, enCours: 0, complete: 0, annule: 0 },
    retour: { total: 0, enCours: 0, complete: 0, annule: 0 }
  });
  const [loading, setLoading] = useState(false);
  const [bonStatsLoading, setBonStatsLoading] = useState(false);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [monthlyStats, setMonthlyStats] = useState<{month: string, livres: number, retournes: number, annules: number}[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setBonStatsLoading(true);

        const [statsResult, activityResult, bonStatsResult, allColisResult] = await Promise.all([
          api.getDashboardStats(),
          api.getRecentActivity(3),
          api.getBonStats(),
          api.getColis({ limit: 1000 })
        ]);

        if (statsResult.data && !statsResult.error) {
          setStats({
            enAttente: statsResult.data.enAttente,
            enTraitement: statsResult.data.enTraitement,
            livres: statsResult.data.livres,
            retournes: statsResult.data.retournes,
            totalColis: statsResult.data.totalColis,
            clientsEnregistres: statsResult.data.clientsEnregistres,
            entreprisesPartenaires: statsResult.data.entreprisesPartenaires,
            livreursDisponibles: statsResult.data.livreursActifs
          });
        }

        if (activityResult.data && !activityResult.error) {
          setRecentActivity(activityResult.data);
        }

        if (bonStatsResult.data && !bonStatsResult.error) {
          setBonStats(bonStatsResult.data);
        }

        if (allColisResult.data && !allColisResult.error) {
          const { data: colisData } = allColisResult;
          
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

            const monthColis = colisData.filter((colis: any) => {
              const colisDate = colis.date_mise_a_jour ? new Date(colis.date_mise_a_jour) : null;
              if (!colisDate) return false;
              return colisDate >= monthStart && colisDate <= monthEnd;
            });

            const isDelivered = (s: string) => (s || '').toLowerCase().trim() === 'livré' || s === 'livre';
            const isReturned = (s: string) => (s || '').toLowerCase().trim() === 'retourné' || (s || '').toLowerCase().trim() === 'retourne';
            const isCancelled = (s: string) => (s || '').toLowerCase().trim() === 'annulé' || (s || '').toLowerCase().trim() === 'annule';

            monthlyData[monthName] = {
              livres: monthColis.filter((c: any) => isDelivered(c.statut)).length,
              retournes: monthColis.filter((c: any) => isReturned(c.statut)).length,
              annules: monthColis.filter((c: any) => isCancelled(c.statut)).length
            };
          }

          const monthlyStatsArray = months.map(month => ({
            month,
            livres: monthlyData[month].livres,
            retournes: monthlyData[month].retournes,
            annules: monthlyData[month].annules
          }));

          setMonthlyStats(monthlyStatsArray);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
        setBonStatsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Handle card click navigation
  const handleCardClick = (status: string) => {
    navigate(`/colis/filtered?status=${status}`);
  };

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

  const statsCards = [
    {
      title: 'En attente',
      value: loading ? '...' : stats.enAttente.toString(),
      description: 'Nouveaux Colis',
      icon: Clock,
      iconColor: 'text-orange-500',
      titleColor: 'text-gray-900 dark:text-white',
      valueColor: 'text-gray-900 dark:text-white',
      descColor: 'text-gray-600 dark:text-gray-400',
      borderColor: 'border-orange-500',
      bgColor: 'bg-transparent',
      status: 'en_attente',
    },
    {
      title: 'En traitement',
      value: loading ? '...' : stats.enTraitement.toString(),
      description: 'Pris en charge / En cours',
      icon: Truck,
      iconColor: 'text-blue-500',
      titleColor: 'text-gray-900 dark:text-white',
      valueColor: 'text-gray-900 dark:text-white',
      descColor: 'text-gray-600 dark:text-gray-400',
      borderColor: 'border-blue-500',
      bgColor: 'bg-transparent',
      status: 'en_traitement',
    },
    {
      title: 'Livrés',
      value: loading ? '...' : stats.livres.toString(),
      description: 'Colis livrés',
      icon: Package,
      iconColor: 'text-green-500',
      titleColor: 'text-gray-900 dark:text-white',
      valueColor: 'text-gray-900 dark:text-white',
      descColor: 'text-gray-600 dark:text-gray-400',
      borderColor: 'border-green-500',
      bgColor: 'bg-transparent',
      status: 'livres',
    },
    {
      title: 'Retournés',
      value: loading ? '...' : stats.retournes.toString(),
      description: 'Colis retournés',
      icon: RotateCcw,
      iconColor: 'text-red-500',
      titleColor: 'text-gray-900 dark:text-white',
      valueColor: 'text-gray-900 dark:text-white',
      descColor: 'text-gray-600 dark:text-gray-400',
      borderColor: 'border-red-500',
      bgColor: 'bg-transparent',
      status: 'retournes',
    },
  ];

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

  // Render livreur dashboard if user is a livreur (case-insensitive)
  if (state.user?.role?.toLowerCase() === 'livreur') {
    return <LivreurDashboard />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with date */}
      <div className="flex justify-between items-center">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
          Tableau de bord
        </h1>
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
            <CardContent className="p-5 pt-0">
              <div className={`text-3xl font-bold ${stat.valueColor}`}>{stat.value}</div>
              <p className={`text-xs ${stat.descColor} mt-1`}>{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Colis par statut */}
        <Card className="md:col-span-2 lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              Colis par statut
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">En attente</span>
                  <span className="text-sm font-bold">{stats.enAttente}</span>
                </div>
                <Progress value={(stats.enAttente / stats.totalColis) * 100} className="h-2" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Pris en charge / En cours</span>
                  <span className="text-sm font-bold">{stats.enTraitement}</span>
                </div>
                <Progress value={(stats.enTraitement / stats.totalColis) * 100} className="h-2 [&>div]:bg-blue-500" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Livrés</span>
                  <span className="text-sm font-bold">{stats.livres}</span>
                </div>
                <Progress value={(stats.livres / stats.totalColis) * 100} className="h-2 [&>div]:bg-green-500" />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Retournés</span>
                  <span className="text-sm font-bold">{stats.retournes}</span>
                </div>
                <Progress value={(stats.retournes / stats.totalColis) * 100} className="h-2 [&>div]:bg-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Center Column - Activité récente */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-2 h-2 bg-gray-300 rounded-full mt-2 animate-pulse"></div>
                      <div className="flex-1 space-y-1">
                        <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                        <div className="h-3 bg-gray-100 rounded animate-pulse w-3/4"></div>
                        <div className="h-3 bg-gray-100 rounded animate-pulse w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentActivity.length > 0 ? (
                recentActivity.map((activity, index) => {
                  const getStatusColor = (statut: string) => {
                    switch (statut?.toLowerCase()) {
                      case 'livré': return 'bg-green-500';
                      case 'en_cours': case 'en cours': return 'bg-blue-500';
                      case 'pris_en_charge': return 'bg-yellow-500';
                      case 'retourné': return 'bg-red-500';
                      default: return 'bg-orange-500';
                    }
                  };

                  const getStatusText = (statut: string) => {
                    switch (statut?.toLowerCase()) {
                      case 'livré': return 'livré';
                      case 'en_cours': case 'en cours': return 'en cours';
                      case 'pris_en_charge': return 'pris en charge';
                      case 'retourné': return 'retourné';
                      case 'en_attente': return 'en attente';
                      default: return statut || 'statut inconnu';
                    }
                  };

                  const formatDate = (dateString: string) => {
                    if (!dateString) return 'Date inconnue';
                    const date = new Date(dateString);
                    const now = new Date();
                    const diffMs = now.getTime() - date.getTime();
                    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
                    const diffDays = Math.floor(diffHours / 24);

                    if (diffDays > 0) {
                      return `Il y a ${diffDays} jour${diffDays > 1 ? 's' : ''}`;
                    } else if (diffHours > 0) {
                      return `Il y a ${diffHours} heure${diffHours > 1 ? 's' : ''}`;
                    } else {
                      return 'Il y a moins d\'une heure';
                    }
                  };

                  return (
                    <div key={activity.id} className="flex items-start gap-3">
                      <div className={`w-2 h-2 ${getStatusColor(activity.statut)} rounded-full mt-2`}></div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          Colis #{activity.numero_suivi} {getStatusText(activity.statut)}
                        </p>
                        <p className="text-xs text-gray-500">
                          {activity.statut?.toLowerCase() === 'livré' ? `Client: ${activity.client_nom}` :
                           activity.livreur_nom !== 'Non assigné' ? `Assigné à ${activity.livreur_nom}` :
                           `Client: ${activity.client_nom}`}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatDate(activity.date_mise_a_jour)}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-4">
                  <p className="text-sm text-gray-500">Aucune activité récente</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Aperçu */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <RefreshCw className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              Aperçu
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Total colis</p>
                <p className="text-lg font-bold">{stats.totalColis}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Users className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Clients enregistrés</p>
                <p className="text-lg font-bold">{stats.clientsEnregistres}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Package className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Entreprises partenaires</p>
                <p className="text-lg font-bold">{stats.entreprisesPartenaires}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Livreurs disponibles</p>
                <p className="text-lg font-bold">{stats.livreursDisponibles}</p>
              </div>
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

    </div>
  );
}
