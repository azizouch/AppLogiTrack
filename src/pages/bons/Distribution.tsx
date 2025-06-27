import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, Download, Eye } from 'lucide-react';

export function Distribution() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demonstration
  const bonsDistribution = [
    {
      id: 'BD-2025-0001',
      livreur: 'Jean Lefebvre',
      dateCreation: '15/04/2025',
      nombreColis: 5,
      statut: 'En cours'
    },
    {
      id: 'BD-2025-0002',
      livreur: 'Martin Dupont',
      dateCreation: '14/04/2025',
      nombreColis: 8,
      statut: 'En cours'
    },
    {
      id: 'BD-2025-0003',
      livreur: 'Sophie Laurent',
      dateCreation: '13/04/2025',
      nombreColis: 3,
      statut: 'Complété'
    },
    {
      id: 'BD-2025-0004',
      livreur: 'Jean Lefebvre',
      dateCreation: '12/04/2025',
      nombreColis: 6,
      statut: 'Complété'
    },
    {
      id: 'BD-2025-0005',
      livreur: 'Martin Dupont',
      dateCreation: '11/04/2025',
      nombreColis: 4,
      statut: 'Annulé'
    }
  ];

  const filteredBons = bonsDistribution.filter(bon =>
    bon.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bon.livreur.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bon.statut.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'En cours':
        return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">En cours</Badge>;
      case 'Complété':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Complété</Badge>;
      case 'Annulé':
        return <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">Annulé</Badge>;
      default:
        return <Badge variant="secondary">{statut}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bons de Distribution</h1>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Bon
        </Button>
      </div>

      {/* Search Section */}
      <div className="space-y-2">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recherche</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Rechercher un bon de distribution par numéro, livreur ou statut
        </p>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Rechercher un bon de distribution..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800">
        {/* Table Title */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Liste des Bons de Distribution
          </h2>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Total: {filteredBons.length} bons trouvés
          </span>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Numéro
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Livreur
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date de création
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Nombre de colis
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Statut
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredBons.map((bon) => (
                <tr key={bon.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">
                    📄 {bon.id}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {bon.livreur}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {bon.dateCreation}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {bon.nombreColis}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getStatusBadge(bon.statut)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        Détails
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
