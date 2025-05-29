import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard } from 'lucide-react';

export function Paiement() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Paiement</h1>
        <p className="text-gray-600 dark:text-gray-400">Gestion des bons de paiement</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CreditCard className="h-5 w-5 text-green-600" />
            <span>Bons de Paiement</span>
          </CardTitle>
          <CardDescription>
            Gérer les bons de paiement pour les livraisons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <CreditCard className="h-12 w-12 mx-auto mb-4 text-green-300 dark:text-green-400" />
            <p>Aucun bon de paiement pour le moment</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
