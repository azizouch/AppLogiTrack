import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { XCircle } from 'lucide-react';

export function ColisRefuses() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Colis Refusés</h1>
        <p className="text-gray-600">Liste des colis qui ont été refusés par les destinataires</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <XCircle className="h-5 w-5 text-red-600" />
            <span>Colis Refusés</span>
          </CardTitle>
          <CardDescription>
            Tous les colis qui ont été refusés lors de la livraison
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <XCircle className="h-12 w-12 mx-auto mb-4 text-red-300" />
            <p>Aucun colis refusé pour le moment</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
