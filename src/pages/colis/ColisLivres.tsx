import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

export function ColisLivres() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Colis Livrés</h1>
        <p className="text-gray-600">Liste des colis qui ont été livrés avec succès</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span>Colis Livrés</span>
          </CardTitle>
          <CardDescription>
            Tous les colis qui ont été livrés à leurs destinataires
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-green-300" />
            <p>Aucun colis livré pour le moment</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
