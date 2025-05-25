import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Truck } from 'lucide-react';

export function Livreurs() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Livreurs</h1>
        <p className="text-gray-600">Gestion des livreurs</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Truck className="h-5 w-5 text-green-600" />
            <span>Liste des Livreurs</span>
          </CardTitle>
          <CardDescription>
            Gérer tous les livreurs de l'application
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Truck className="h-12 w-12 mx-auto mb-4 text-green-300" />
            <p>Aucun livreur enregistré pour le moment</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
