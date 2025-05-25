import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RotateCcw } from 'lucide-react';

export function Retour() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Retour</h1>
        <p className="text-gray-600">Gestion des bons de retour</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RotateCcw className="h-5 w-5 text-orange-600" />
            <span>Bons de Retour</span>
          </CardTitle>
          <CardDescription>
            Gérer les bons de retour pour les colis non livrés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <RotateCcw className="h-12 w-12 mx-auto mb-4 text-orange-300" />
            <p>Aucun bon de retour pour le moment</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
