import React from 'react';
import { RotateCcw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ColisRelance() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Colis Relancé</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Liste des colis qui nécessitent une relance
        </p>
      </div>

      {/* Empty State Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <RotateCcw className="h-5 w-5 text-gray-600" />
            <span>Colis Relancé</span>
          </CardTitle>
          <CardDescription>
            Aucun colis en attente de relance pour le moment
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <RotateCcw className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun colis relancé
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Il n'y a actuellement aucun colis nécessitant une relance. 
              Les colis apparaîtront ici lorsqu'ils auront besoin d'un suivi supplémentaire.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
