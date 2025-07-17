
import { useState, useEffect } from 'react';
import { Package, Truck, Users, Clock, CheckCircle, RotateCcw, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LivreurDashboard } from './livreur/LivreurDashboard';
import { CircularStats } from '@/components/ui/circular-stats';

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

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setBonStatsLoading(true);

        // Fetch dashboard stats, recent activity, and bon statistics
        const [statsResult, activityResult, bonStatsResult] = await Promise.all([
          api.getDashboardStats(),
          api.getRecentActivity(3),
          api.getBonStats()
        ]);

        if (statsResult.data && !statsResult.error) {
          // Use all real data from the API
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

  const statsCards = [
    {
      title: 'En attente',
      value: loading ? '...' : stats.enAttente.toString(),
      description: 'Colis en attente',
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

  // Render livreur dashboard if user is a livreur (case-insensitive)
  if (state.user?.role?.toLowerCase() === 'livreur') {
    return <LivreurDashboard />;
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with date */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Tableau de bord
        </h1>
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
