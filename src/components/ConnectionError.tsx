import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Wifi, RefreshCw } from 'lucide-react';

interface ConnectionErrorProps {
  onRetry: () => void;
  isRetrying?: boolean;
}

export const ConnectionError: React.FC<ConnectionErrorProps> = ({ onRetry, isRetrying = false }) => {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="relative">
            <Wifi className="h-16 w-16 text-gray-400 dark:text-gray-500" />
            <AlertTriangle className="h-8 w-8 text-red-500 absolute -top-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-1" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          Problème de connexion
        </h1>
        
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Impossible de se connecter au serveur. Veuillez vérifier votre connexion internet et réessayer.
        </p>
        
        <div className="space-y-4">
          <Button 
            onClick={onRetry}
            disabled={isRetrying}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Reconnexion...
              </>
            ) : (
              <>
                <RefreshCw className="h-4 w-4 mr-2" />
                Réessayer
              </>
            )}
          </Button>
          
          <div className="text-sm text-gray-500 dark:text-gray-400">
            <p>Vérifiez que :</p>
            <ul className="mt-2 space-y-1 text-left">
              <li>• Votre connexion internet fonctionne</li>
              <li>• Vous n'êtes pas derrière un pare-feu restrictif</li>
              <li>• Le serveur n'est pas en maintenance</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Si le problème persiste, contactez l'administrateur système
          </p>
        </div>
      </div>
    </div>
  );
};
