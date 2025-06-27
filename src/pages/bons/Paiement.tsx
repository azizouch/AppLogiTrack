import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, Search, FileText, Edit, Trash2 } from 'lucide-react';

export function Paiement() {
  const [searchTerm, setSearchTerm] = useState('');

  // Mock data for demonstration
  const bonsPaiement = [
    {
      id: 'BP-2025-001',
      date: '15/04/2025',
      client: 'Tech Solutions',
      montant: 1250.00,
      statut: 'Payé'
    },
    {
      id: 'BP-2025-002',
      date: '16/04/2025',
      client: 'Entreprise ABC',
      montant: 980.50,
      statut: 'En attente'
    },
    {
      id: 'BP-2025-003',
      date: '17/04/2025',
      client: 'Société XYZ',
      montant: 1750.75,
      statut: 'Payé'
    },
    {
      id: 'BP-2025-004',
      date: '18/04/2025',
      client: 'Compagnie 123',
      montant: 2300.00,
      statut: 'En attente'
    },
    {
      id: 'BP-2025-005',
      date: '19/04/2025',
      client: 'Entreprise DEF',
      montant: 1100.25,
      statut: 'Payé'
    }
  ];

  const filteredBons = bonsPaiement.filter(bon =>
    bon.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bon.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
    bon.statut.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'Payé':
        return <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">Payé</Badge>;
      case 'En attente':
        return <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">En attente</Badge>;
      default:
        return <Badge variant="secondary">{statut}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Bons de paiement</h1>
          <p className="text-gray-600 dark:text-gray-400">Gérez tous les bons de paiement de vos clients</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-2" />
          Nouveau bon de paiement
        </Button>
      </div>

      {/* Search Section */}
      <div className="space-y-2">
        <h2 className="text-lg font-medium text-gray-900 dark:text-white">Recherche</h2>
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Recherchez des bons de paiement par ID, client ou statut"
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
            Liste des bons de paiement
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
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Client
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  Montant (€)
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
                    {bon.id}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {bon.date}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {bon.client}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                    {bon.montant.toFixed(2)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap">
                    {getStatusBadge(bon.statut)}
                  </td>
                  <td className="px-4 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <FileText className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
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
