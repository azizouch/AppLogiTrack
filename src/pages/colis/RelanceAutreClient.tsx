import React from 'react';
import { UserX } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function RelanceAutreClient() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <UserX className="h-7 w-7 text-purple-600 dark:text-purple-400" />
          Relancé Autre Client
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Liste des colis à relancer avec un autre client
        </p>
      </div>

      {/* Empty State Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserX className="h-5 w-5 text-gray-600" />
            <span>Relancé Autre Client</span>
          </CardTitle>
          <CardDescription>
            Aucun colis en attente de relance avec un autre client
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <UserX className="h-16 w-16 mx-auto mb-4 text-gray-300 dark:text-gray-400" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun colis à relancer
            </h3>
            <p className="text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Il n'y a actuellement aucun colis nécessitant une relance avec un autre client. 
              Les colis apparaîtront ici lorsqu'ils devront être réassignés à un nouveau destinataire.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
