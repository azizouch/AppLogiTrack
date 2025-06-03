import { useState, useEffect } from 'react';
import { Package, Clock, CheckCircle, RotateCcw, User, MapPin, Truck, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { api } from '@/lib/supabase';

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

  useEffect(() => {
    const fetchLivreurStats = async () => {
      if (!state.user?.id) return;

      try {
        setLoading(true);

        // Fetch livreur-specific statistics
        const { data: colisData, error } = await api.getColis({
          livreurId: state.user.id,
          limit: 1000
        });

        if (error) {
          console.error('Error fetching livreur stats:', error);
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
            colis.statut === 'livre' &&
            colis.date_mise_a_jour?.startsWith(todayStr)
          ).length;

          const retournes = colisData.filter(colis =>
            colis.statut === 'retourne'
          ).length;

          setStats({
            aLivrerAujourdhui,
            enCours,
            livresAujourdhui,
            retournes,
            livraisonsATemps: 0, // Will be calculated based on delivery times
            colisEnCours: enCours,
            colisRetournes: retournes,
            progressionJournaliere: 0, // Will be calculated
            livraisonsCeMois: 1
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

  const statsCards = [
    {
      title: 'À livrer aujourd\'hui',
      value: loading ? '...' : stats.aLivrerAujourdhui.toString(),
      description: 'Colis à livrer aujourd\'hui',
      icon: Clock,
      color: 'text-yellow-600 dark:text-yellow-400',
      borderColor: 'border-l-yellow-400',
      bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
    },
    {
      title: 'En cours',
      value: loading ? '...' : stats.enCours.toString(),
      description: 'Colis en cours de livraison',
      icon: Truck,
      color: 'text-blue-600 dark:text-blue-400',
      borderColor: 'border-l-blue-400',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
    },
    {
      title: 'Livrés aujourd\'hui',
      value: loading ? '...' : stats.livresAujourdhui.toString(),
      description: 'Colis livrés aujourd\'hui',
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400',
      borderColor: 'border-l-green-400',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
    },
    {
      title: 'Retournés',
      value: loading ? '...' : stats.retournes.toString(),
      description: 'Colis retournés aujourd\'hui',
      icon: RotateCcw,
      color: 'text-red-600 dark:text-red-400',
      borderColor: 'border-l-red-400',
      bgColor: 'bg-red-50 dark:bg-red-900/20',
    },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header with date */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Tableau de bord Livreur
        </h1>
        <p className="text-sm text-gray-500">
          {getCurrentDate()}
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {statsCards.map((stat) => (
          <Card key={stat.title} className={`${stat.borderColor} border-l-4 ${stat.bgColor}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                {stat.title}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-900 dark:text-white">{stat.value}</div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Three Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {/* Left Column - Mes livraisons du jour */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Mes livraisons du jour</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400">
                Aucune livraison prévue pour aujourd'hui
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Center Column - Mes performances */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base sm:text-lg">Mes performances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Livraisons à temps</span>
              <span className="text-sm font-bold">{stats.livraisonsATemps}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Colis en cours</span>
              <span className="text-sm font-bold">{stats.colisEnCours}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Colis retournés</span>
              <span className="text-sm font-bold">{stats.colisRetournes}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progression journalière</span>
              <span className="text-sm font-bold">{stats.progressionJournaliere}</span>
            </div>
          </CardContent>
        </Card>

        {/* Right Column - Mon profil */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
              <User className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
              Mon profil
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Livreur</p>
                <p className="text-lg font-bold">{state.user?.nom} {state.user?.prenom}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <MapPin className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Zone</p>
                <p className="text-lg font-bold">{state.user?.zone || 'Non définie'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Ce mois</p>
                <p className="text-lg font-bold">{stats.livraisonsCeMois} livraisons</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Truck className="h-5 w-5 text-blue-600" />
              <div className="flex-1">
                <p className="text-sm font-medium">Véhicule</p>
                <p className="text-lg font-bold">{state.user?.vehicule || 'Non défini'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
