
import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Colis } from '@/types';
import { api } from '@/lib/supabase';

export function ColisList() {
  const [colis, setColis] = useState<Colis[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [delivererFilter, setDelivererFilter] = useState('all');

  useEffect(() => {
    const fetchColis = async () => {
      try {
        setLoading(true);
        const { data, error } = await api.getColis();

        if (error) {
          console.error('Error fetching colis:', error);
          // Add mock data for testing responsive design
          const mockData = [
            {
              id: 'COL-2025-7538',
              client: { nom: 'Sophie Laurent' },
              entreprise: { nom: 'Boutique Mode' },
              statut: 'En cours',
              date_creation: '2025-05-25',
              livreur_id: '1',
              livreur: { nom: 'Dupont', prenom: 'Martin' }
            },
            {
              id: 'COL-2025-9299',
              client: { nom: 'gwrkgr' },
              entreprise: { nom: 'Tech Solutions' },
              statut: 'En cours',
              date_creation: '2025-05-25',
              livreur_id: null,
              livreur: null
            },
            {
              id: 'COL-2025-1234',
              client: { nom: 'Marie Dubois' },
              entreprise: { nom: 'Fashion Store' },
              statut: 'Livré',
              date_creation: '2025-05-24',
              livreur_id: '2',
              livreur: { nom: 'Martin', prenom: 'Jean' }
            },
            {
              id: 'COL-2025-5678',
              client: { nom: 'Pierre Moreau' },
              entreprise: { nom: 'Electronics Plus' },
              statut: 'Retourné',
              date_creation: '2025-05-23',
              livreur_id: '3',
              livreur: { nom: 'Laurente', prenom: 'Sophie' }
            },
            {
              id: 'COL-2025-9876',
              client: { nom: 'Anna Lefebvre' },
              entreprise: { nom: 'Beauty Corner' },
              statut: 'En cours',
              date_creation: '2025-05-22',
              livreur_id: '1',
              livreur: { nom: 'Dupont', prenom: 'Martin' }
            },
            {
              id: 'COL-2025-4321',
              client: { nom: 'Thomas Bernard' },
              entreprise: { nom: 'Sports World' },
              statut: 'Livré',
              date_creation: '2025-05-21',
              livreur_id: '2',
              livreur: { nom: 'Martin', prenom: 'Jean' }
            },
            {
              id: 'COL-2025-8765',
              client: { nom: 'Julie Rousseau' },
              entreprise: { nom: 'Home & Garden' },
              statut: 'En cours',
              date_creation: '2025-05-20',
              livreur_id: null,
              livreur: null
            },
            {
              id: 'COL-2025-2468',
              client: { nom: 'David Leroy' },
              entreprise: { nom: 'Auto Parts Pro' },
              statut: 'Retourné',
              date_creation: '2025-05-19',
              livreur_id: '3',
              livreur: { nom: 'Laurente', prenom: 'Sophie' }
            }
          ];
          setColis(mockData);
        } else if (data) {
          setColis(data);
        }
      } catch (error) {
        console.error('Error fetching colis:', error);
        // Add mock data for testing responsive design
        const mockData = [
          {
            id: 'COL-2025-7538',
            client: { nom: 'Sophie Laurent' },
            entreprise: { nom: 'Boutique Mode' },
            statut: 'En cours',
            date_creation: '2025-05-25',
            livreur_id: '1',
            livreur: { nom: 'Dupont', prenom: 'Martin' }
          },
          {
            id: 'COL-2025-9299',
            client: { nom: 'gwrkgr' },
            entreprise: { nom: 'Tech Solutions' },
            statut: 'En cours',
            date_creation: '2025-05-25',
            livreur_id: null,
            livreur: null
          },
          {
            id: 'COL-2025-1234',
            client: { nom: 'Marie Dubois' },
            entreprise: { nom: 'Fashion Store' },
            statut: 'Livré',
            date_creation: '2025-05-24',
            livreur_id: '2',
            livreur: { nom: 'Martin', prenom: 'Jean' }
          },
          {
            id: 'COL-2025-5678',
            client: { nom: 'Pierre Moreau' },
            entreprise: { nom: 'Electronics Plus' },
            statut: 'Retourné',
            date_creation: '2025-05-23',
            livreur_id: '3',
            livreur: { nom: 'Laurente', prenom: 'Sophie' }
          },
          {
            id: 'COL-2025-9876',
            client: { nom: 'Anna Lefebvre' },
            entreprise: { nom: 'Beauty Corner' },
            statut: 'En cours',
            date_creation: '2025-05-22',
            livreur_id: '1',
            livreur: { nom: 'Dupont', prenom: 'Martin' }
          },
          {
            id: 'COL-2025-4321',
            client: { nom: 'Thomas Bernard' },
            entreprise: { nom: 'Sports World' },
            statut: 'Livré',
            date_creation: '2025-05-21',
            livreur_id: '2',
            livreur: { nom: 'Martin', prenom: 'Jean' }
          },
          {
            id: 'COL-2025-8765',
            client: { nom: 'Julie Rousseau' },
            entreprise: { nom: 'Home & Garden' },
            statut: 'En cours',
            date_creation: '2025-05-20',
            livreur_id: null,
            livreur: null
          },
          {
            id: 'COL-2025-2468',
            client: { nom: 'David Leroy' },
            entreprise: { nom: 'Auto Parts Pro' },
            statut: 'Retourné',
            date_creation: '2025-05-19',
            livreur_id: '3',
            livreur: { nom: 'Laurente', prenom: 'Sophie' }
          }
        ];
        setColis(mockData);
      } finally {
        setLoading(false);
      }
    };

    fetchColis();
  }, []);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'En cours':
        return <Badge variant="secondary" className="bg-orange-100 text-orange-800 border-orange-300">En cours</Badge>;
      case 'Livré':
        return <Badge variant="secondary" className="bg-green-100 text-green-800 border-green-300">Livré</Badge>;
      case 'Retourné':
        return <Badge variant="secondary" className="bg-red-100 text-red-800 border-red-300">Retourné</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getLivreurInfo = (colis: Colis) => {
    if (!colis.livreur_id || !colis.livreur) {
      return 'Non assigné';
    }

    return `${colis.livreur.prenom || ''} ${colis.livreur.nom}`.trim();
  };

  // Filter colis based on search and filters
  const filteredColis = colis.filter((item) => {
    const matchesSearch = searchTerm === '' ||
      item.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.client?.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.entreprise?.nom.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || item.statut === statusFilter;
    const matchesDeliverer = delivererFilter === 'all' || item.livreur_id === delivererFilter;

    return matchesSearch && matchesStatus && matchesDeliverer;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Liste des Colis</h1>
        <Button className="bg-blue-600 hover:bg-blue-700 w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un colis
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-4 w-4 text-gray-500 dark:text-gray-400" />
          <span className="font-medium text-gray-700 dark:text-gray-300">Filtres</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-4 w-4" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-transparent border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="bg-transparent border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white">
              <SelectValue placeholder="Tous les statuts" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="En cours">En cours</SelectItem>
              <SelectItem value="Livré">Livré</SelectItem>
              <SelectItem value="Retourné">Retourné</SelectItem>
            </SelectContent>
          </Select>

          <Select value={delivererFilter} onValueChange={setDelivererFilter}>
            <SelectTrigger className="bg-transparent border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white">
              <SelectValue placeholder="Tous les livreurs" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les livreurs</SelectItem>
              <SelectItem value="1">Martin Dupont</SelectItem>
              <SelectItem value="2">fr eg</SelectItem>
              <SelectItem value="3">Sophie Laurente</SelectItem>
            </SelectContent>
          </Select>

          <Select>
            <SelectTrigger className="bg-transparent border-gray-600 dark:border-gray-600 text-gray-900 dark:text-white">
              <SelectValue placeholder="Plus récent" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Plus récent</SelectItem>
              <SelectItem value="oldest">Plus ancien</SelectItem>
              <SelectItem value="status">Par statut</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Colis Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Liste des Colis</h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Total: {loading ? '...' : filteredColis.length} colis trouvés
          </span>
        </div>

        <div className="overflow-x-auto">
          <Table className="bg-transparent min-w-full">
            <TableHeader>
              <TableRow className="border-b border-gray-600 dark:border-gray-600" style={{ backgroundColor: 'hsl(217.2, 32.6%, 17.5%)' }}>
                <TableHead className="text-gray-600 dark:text-gray-300 font-medium">ID Colis</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-300 font-medium">Client</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-300 font-medium hidden sm:table-cell">Entreprise</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-300 font-medium">Statut</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-300 font-medium hidden md:table-cell">Date de création</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-300 font-medium hidden lg:table-cell">Livreur</TableHead>
                <TableHead className="text-gray-600 dark:text-gray-300 font-medium">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <TableRow key={index} className="border-b border-gray-600 dark:border-gray-600 bg-transparent">
                    <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                    <TableCell className="hidden sm:table-cell"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-6 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-16"></div></TableCell>
                    <TableCell className="hidden md:table-cell"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                    <TableCell className="hidden lg:table-cell"><div className="h-4 bg-gray-200 dark:bg-gray-600 rounded animate-pulse"></div></TableCell>
                    <TableCell><div className="h-8 bg-gray-200 dark:bg-gray-600 rounded animate-pulse w-16"></div></TableCell>
                  </TableRow>
                ))
              ) : filteredColis.length > 0 ? (
                filteredColis.map((colis) => (
                  <TableRow key={colis.id} className="border-b border-gray-600 dark:border-gray-600 bg-transparent hover:bg-gray-700/10 dark:hover:bg-gray-700/20">
                    <TableCell className="font-mono text-sm text-gray-900 dark:text-gray-100">{colis.id}</TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100">{colis.client?.nom}</TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100 hidden sm:table-cell">{colis.entreprise?.nom}</TableCell>
                    <TableCell>{getStatusBadge(colis.statut)}</TableCell>
                    <TableCell className="text-gray-900 dark:text-gray-100 hidden md:table-cell">
                      {new Date(colis.date_creation).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 dark:text-gray-400 hidden lg:table-cell">
                      {getLivreurInfo(colis)}
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" className="bg-transparent border-gray-600 dark:border-gray-600 text-gray-900 dark:text-gray-100 hover:bg-gray-700/10 dark:hover:bg-gray-700/20">
                        Voir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow className="border-b border-gray-600 dark:border-gray-600 bg-transparent">
                  <TableCell colSpan={7} className="text-center py-8 text-gray-500 dark:text-gray-400">
                    Aucun colis trouvé
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
