
import React, { useState, useEffect } from 'react';
import { Package, Truck, Users, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/supabase';
import { Colis } from '@/types';

export function Dashboard() {
  const { state } = useAuth();
  const [stats, setStats] = useState({
    totalColis: 0,
    colisEnCours: 0,
    colisLivres: 0,
    livreursActifs: 0
  });
  const [recentColis, setRecentColis] = useState<Colis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);

        // Fetch dashboard stats
        const { data: statsData, error: statsError } = await api.getDashboardStats();
        if (statsData && !statsError) {
          setStats(statsData);
        }

        // Fetch recent colis
        const { data: colisData, error: colisError } = await api.getRecentColis(3);
        if (colisData && !colisError) {
          setRecentColis(colisData);
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
      title: 'Total Colis',
      value: loading ? '...' : stats.totalColis.toString(),
      description: 'colis trouvés',
      icon: Package,
      color: 'text-blue-600',
    },
    {
      title: 'En cours',
      value: loading ? '...' : stats.colisEnCours.toString(),
      description: 'colis en cours',
      icon: Calendar,
      color: 'text-orange-600',
    },
    {
      title: 'Livrés',
      value: loading ? '...' : stats.colisLivres.toString(),
      description: 'colis livrés',
      icon: Truck,
      color: 'text-green-600',
    },
    {
      title: 'Livreurs actifs',
      value: loading ? '...' : stats.livreursActifs.toString(),
      description: 'livreurs disponibles',
      icon: Users,
      color: 'text-purple-600',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Bienvenue, {state.user?.prenom} {state.user?.nom}
        </h1>
        <p className="text-gray-600">
          Voici un aperçu de votre activité LogiTrack
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-gray-500">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Colis récents</CardTitle>
            <CardDescription>Les derniers colis ajoutés au système</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded-lg animate-pulse">
                      <div className="space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-32"></div>
                        <div className="h-3 bg-gray-200 rounded w-24"></div>
                      </div>
                      <div className="space-y-2">
                        <div className="h-6 bg-gray-200 rounded w-16"></div>
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : recentColis.length > 0 ? (
                recentColis.map((colis) => (
                  <div key={colis.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{colis.id}</p>
                      <p className="text-sm text-gray-600">
                        {colis.client?.nom} - {colis.entreprise?.nom}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                        {colis.statut}
                      </Badge>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(colis.date_creation).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Aucun colis récent</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activité du jour</CardTitle>
            <CardDescription>Résumé des activités d'aujourd'hui</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Nouveaux colis</span>
                <Badge variant="outline">3</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Colis livrés</span>
                <Badge variant="outline" className="bg-green-100 text-green-800">1</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">En attente d'assignation</span>
                <Badge variant="outline" className="bg-orange-100 text-orange-800">2</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Livreurs actifs</span>
                <Badge variant="outline" className="bg-blue-100 text-blue-800">3</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
