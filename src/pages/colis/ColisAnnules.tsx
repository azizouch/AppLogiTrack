import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Ban } from 'lucide-react';

export function ColisAnnules() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Colis Annulés</h1>
        <p className="text-gray-600 dark:text-gray-400">Liste des colis qui ont été annulés</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Ban className="h-5 w-5 text-gray-600" />
            <span>Colis Annulés</span>
          </CardTitle>
          <CardDescription>
            Tous les colis qui ont été annulés avant ou pendant la livraison
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <Ban className="h-12 w-12 mx-auto mb-4 text-gray-300 dark:text-gray-400" />
            <p>Aucun colis annulé pour le moment</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
