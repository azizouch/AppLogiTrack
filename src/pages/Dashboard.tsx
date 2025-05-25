
import { useState, useEffect } from 'react';
import { Package, Truck, Users, Clock, CheckCircle, RotateCcw, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

import { api } from '@/lib/supabase';

export function Dashboard() {
  const [stats, setStats] = useState({
    enAttente: 0,
    enTraitement: 5,
    livres: 2,
    retournes: 1,
    totalColis: 8,
    clientsEnregistres: 9,
    entreprisesPartenaires: 4,
    livreursDisponibles: 6
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch dashboard stats
        const { data: statsData, error: statsError } = await api.getDashboardStats();
        if (statsData && !statsError) {
          // Map the API response to our new stats structure
          setStats({
            enAttente: statsData.totalColis - statsData.colisEnCours - statsData.colisLivres,
            enTraitement: statsData.colisEnCours,
            livres: statsData.colisLivres,
            retournes: 1, // Default value since not in API
            totalColis: statsData.totalColis,
            clientsEnregistres: 9, // Default values
            entreprisesPartenaires: 4,
            livreursDisponibles: statsData.livreursActifs || 6
          });
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  const statsCards = [
    {
      title: 'En attente',
      value: loading ? '...' : stats.enAttente.toString(),
      description: 'Colis en attente',
      icon: Clock,
      color: 'text-yellow-600',
      borderColor: 'border-l-yellow-400',
      bgColor: 'bg-yellow-50',
    },
    {
      title: 'En traitement',
      value: loading ? '...' : stats.enTraitement.toString(),
      description: 'Pris en charge / En cours',
      icon: Truck,
      color: 'text-blue-600',
      borderColor: 'border-l-blue-400',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Livrés',
      value: loading ? '...' : stats.livres.toString(),
      description: 'Colis livrés',
      icon: CheckCircle,
      color: 'text-green-600',
      borderColor: 'border-l-green-400',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Retournés',
      value: loading ? '...' : stats.retournes.toString(),
      description: 'Colis retournés',
      icon: RotateCcw,
      color: 'text-red-600',
      borderColor: 'border-l-red-400',
      bgColor: 'bg-red-50',
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

  return (
    <div className="space-y-6">
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => (
          <Card key={stat.title} className={`${stat.borderColor} border-l-4 ${stat.bgColor}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
              <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Colis par statut */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-600" />
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
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Colis #COL-2025-632425255 en cours</p>
                  <p className="text-xs text-gray-500">Quartier Azentou Ait Ourir Marrakech, Ait Ourir</p>
                  <p className="text-xs text-gray-400">Il y a 19 heures</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Colis #COL-2025-4869 en cours</p>
                  <p className="text-xs text-gray-500">Quartier Azentou Ait Ourir Marrakech, Ait Ourir</p>
                  <p className="text-xs text-gray-400">Il y a 8 jours</p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                <div className="flex-1">
                  <p className="font-medium text-sm">Colis #COL-2025-8317 en cours</p>
                  <p className="text-xs text-gray-500"></p>
                  <p className="text-xs text-gray-400"></p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Aperçu */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5 text-blue-600" />
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
    </div>
  );
}
