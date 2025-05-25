import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCheck } from 'lucide-react';

export function Gestion() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
        <p className="text-gray-600">Gérer tous les utilisateurs du système</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserCheck className="h-5 w-5 text-blue-600" />
            <span>Gestion</span>
          </CardTitle>
          <CardDescription>
            Administrer les comptes utilisateurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <UserCheck className="h-12 w-12 mx-auto mb-4 text-blue-300" />
            <p>Interface de gestion des utilisateurs</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
