
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginPage } from '@/components/auth/LoginPage';
import { LogiTrackLoader } from '@/components/ui/logitrack-loader';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { state } = useAuth();

  if (state.loading) {
    return <LogiTrackLoader message="Chargement de l'application..." />;
  }

  if (!state.isAuthenticated) {
    return <LoginPage />;
  }

  if (roles && !roles.includes(state.user?.role || '')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white dark:bg-gray-900">
        <div className="text-center p-8">
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-blue-600 dark:text-blue-400 mb-4">
              LogiTrack
            </h1>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Accès refusé</h2>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Vous n'avez pas les permissions nécessaires pour accéder à cette page.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
