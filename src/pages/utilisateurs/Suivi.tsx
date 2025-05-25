import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { UserPlus } from 'lucide-react';

export function Suivi() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Suivi des Utilisateurs</h1>
        <p className="text-gray-600">Suivre l'activité des utilisateurs</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <UserPlus className="h-5 w-5 text-green-600" />
            <span>Suivi</span>
          </CardTitle>
          <CardDescription>
            Suivre l'activité et les connexions des utilisateurs
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <UserPlus className="h-12 w-12 mx-auto mb-4 text-green-300" />
            <p>Interface de suivi des utilisateurs</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
