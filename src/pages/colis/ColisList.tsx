
import React, { useState } from 'react';
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

// Mock data based on the screenshot
const mockColis: Colis[] = [
  {
    id: 'COL-2025-632425255',
    client_id: '1',
    entreprise_id: '1',
    livreur_id: null,
    statut: 'En cours',
    date_creation: '24/05/2025',
    client: { id: '1', nom: 'farid', created_at: '' },
    entreprise: { id: '1', nom: 'Café Central', created_at: '' },
  },
  {
    id: 'COL-2025-4869',
    client_id: '2',
    entreprise_id: '2',
    livreur_id: '1',
    statut: 'En cours',
    date_creation: '17/05/2025',
    client: { id: '2', nom: 'Rida Boutarge', created_at: '' },
    entreprise: { id: '2', nom: 'Électro Plus', created_at: '' },
  },
  {
    id: 'COL-2025-8317',
    client_id: '3',
    entreprise_id: '1',
    livreur_id: '2',
    statut: 'En cours',
    date_creation: '17/05/2025',
    client: { id: '3', nom: 'Thomas Martin', created_at: '' },
    entreprise: { id: '1', nom: 'Café Central', created_at: '' },
  },
  {
    id: 'COL-2025-8681',
    client_id: '4',
    entreprise_id: '3',
    livreur_id: '3',
    statut: 'Livré',
    date_creation: '09/05/2025',
    client: { id: '4', nom: 'Rida', created_at: '' },
    entreprise: { id: '3', nom: 'Boutique', created_at: '' },
  },
];

export function ColisList() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [delivererFilter, setDelivererFilter] = useState('all');

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
    if (!colis.livreur_id) {
      return 'Non assigné';
    }
    
    // Mock livreur data
    const livreurs: Record<string, string> = {
      '1': 'Martin Dupont (LIV-200)',
      '2': 'fr eg (LIV-916)',
      '3': 'Sophie Laurente',
    };
    
    return livreurs[colis.livreur_id] || 'Inconnu';
  };

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
            <span className="text-sm text-gray-500">Total: {mockColis.length} colis trouvés</span>
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
            {mockColis.map((colis) => (
              <TableRow key={colis.id}>
                <TableCell className="font-mono text-sm">{colis.id}</TableCell>
                <TableCell>{colis.client?.nom}</TableCell>
                <TableCell>{colis.entreprise?.nom}</TableCell>
                <TableCell>{getStatusBadge(colis.statut)}</TableCell>
                <TableCell>{colis.date_creation}</TableCell>
                <TableCell className="text-sm text-gray-600">
                  {getLivreurInfo(colis)}
                </TableCell>
                <TableCell>
                  <Button variant="outline" size="sm">
                    Voir
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
