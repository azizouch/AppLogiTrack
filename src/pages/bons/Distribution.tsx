import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';

export function Distribution() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Distribution</h1>
        <p className="text-gray-600">Gestion des bons de distribution</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-blue-600" />
            <span>Bons de Distribution</span>
          </CardTitle>
          <CardDescription>
            Gérer les bons de distribution pour les livraisons
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-blue-300" />
            <p>Aucun bon de distribution pour le moment</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
