
import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LoginPage } from '@/components/auth/LoginPage';
import { LogiTrackLoader } from '@/components/ui/logitrack-loader';
import { ConnectionError } from '@/components/ConnectionError';

interface ProtectedRouteProps {
  children: React.ReactNode;
  roles?: string[];
}

export function ProtectedRoute({ children, roles }: ProtectedRouteProps) {
  const { state, retryConnection } = useAuth();

  if (state.loading) {
    return <LogiTrackLoader message="Chargement de l'application..." />;
  }

  if (state.hasConnectionError) {
    return <ConnectionError onRetry={retryConnection} />;
  }

  if (!state.isAuthenticated) {
    return <LoginPage />;
  }

  // Check role permissions with case-insensitive matching and trimming
  if (roles && roles.length > 0) {
    const userRole = (state.user?.role || '').toLowerCase().trim();
    const allowedRoles = roles.map(role => role.toLowerCase().trim());

    if (!allowedRoles.includes(userRole)) {
      console.log('Access denied - Required roles:', roles, 'User role:', state.user?.role, 'User:', state.user);
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
            {process.env.NODE_ENV === 'development' && (
              <div className="mt-4 text-sm text-gray-500">
                <p>Required roles: {roles.join(', ')}</p>
                <p>Your role: {state.user?.role || 'undefined'}</p>
              </div>
            )}
          </div>
        </div>
      );
    }
  }

  return <>{children}</>;
}
