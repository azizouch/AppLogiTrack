
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
        } else if (data) {
          setColis(data);
        }
      } catch (error) {
        console.error('Error fetching colis:', error);
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
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Liste des Colis</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="mr-2 h-4 w-4" />
          Ajouter un colis
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border">
        <div className="flex items-center space-x-2 mb-4">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="font-medium text-gray-700">Filtres</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Rechercher..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger>
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
            <SelectTrigger>
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
            <SelectTrigger>
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
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Liste des Colis</h2>
            <span className="text-sm text-gray-500">
              Total: {loading ? '...' : filteredColis.length} colis trouvés
            </span>
          </div>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID Colis</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Entreprise</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead>Date de création</TableHead>
              <TableHead>Livreur</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading skeleton
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  <TableCell><div className="h-6 bg-gray-200 rounded animate-pulse w-16"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  <TableCell><div className="h-4 bg-gray-200 rounded animate-pulse"></div></TableCell>
                  <TableCell><div className="h-8 bg-gray-200 rounded animate-pulse w-16"></div></TableCell>
                </TableRow>
              ))
            ) : filteredColis.length > 0 ? (
              filteredColis.map((colis) => (
                <TableRow key={colis.id}>
                  <TableCell className="font-mono text-sm">{colis.id}</TableCell>
                  <TableCell>{colis.client?.nom}</TableCell>
                  <TableCell>{colis.entreprise?.nom}</TableCell>
                  <TableCell>{getStatusBadge(colis.statut)}</TableCell>
                  <TableCell>
                    {new Date(colis.date_creation).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell className="text-sm text-gray-600">
                    {getLivreurInfo(colis)}
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">
                      Voir
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                  Aucun colis trouvé
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
