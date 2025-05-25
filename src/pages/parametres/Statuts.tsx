import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Package } from 'lucide-react';

export function Statuts() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Statuts</h1>
        <p className="text-gray-600">Configuration des statuts des colis</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Package className="h-5 w-5 text-blue-600" />
            <span>Statuts</span>
          </CardTitle>
          <CardDescription>
            Gérer les différents statuts des colis
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Package className="h-12 w-12 mx-auto mb-4 text-blue-300" />
            <p>Interface de gestion des statuts</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
