import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2 } from 'lucide-react';

export function Entreprises() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Entreprises</h1>
        <p className="text-gray-600">Gestion des entreprises partenaires</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Building2 className="h-5 w-5 text-purple-600" />
            <span>Liste des Entreprises</span>
          </CardTitle>
          <CardDescription>
            Gérer toutes les entreprises partenaires
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-purple-300" />
            <p>Aucune entreprise enregistrée pour le moment</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
