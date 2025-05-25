
import React from 'react';
import { Package, Truck, Users, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

export function Dashboard() {
  const { state } = useAuth();

  const stats = [
    {
      title: 'Total Colis',
      value: '8',
      description: 'colis trouvés',
      icon: Package,
      color: 'text-blue-600',
    },
    {
      title: 'En cours',
      value: '6',
      description: 'colis en cours',
      icon: Calendar,
      color: 'text-orange-600',
    },
    {
      title: 'Livrés',
      value: '2',
      description: 'colis livrés',
      icon: Truck,
      color: 'text-green-600',
    },
    {
      title: 'Livreurs actifs',
      value: '3',
      description: 'livreurs disponibles',
      icon: Users,
      color: 'text-purple-600',
    },
  ];

  const recentColis = [
    {
      id: 'COL-2025-632425255',
      client: 'farid',
      entreprise: 'Café Central',
      statut: 'En cours',
      date: '24/05/2025',
    },
    {
      id: 'COL-2025-4869',
      client: 'Rida Boutarge',
      entreprise: 'Électro Plus',
      statut: 'En cours',
      date: '17/05/2025',
    },
    {
      id: 'COL-2025-8317',
      client: 'Thomas Martin',
      entreprise: 'Café Central',
      statut: 'En cours',
      date: '17/05/2025',
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
        {stats.map((stat) => (
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
              {recentColis.map((colis) => (
                <div key={colis.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{colis.id}</p>
                    <p className="text-sm text-gray-600">{colis.client} - {colis.entreprise}</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="bg-orange-100 text-orange-800">
                      {colis.statut}
                    </Badge>
                    <p className="text-xs text-gray-500 mt-1">{colis.date}</p>
                  </div>
                </div>
              ))}
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
