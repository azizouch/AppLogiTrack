import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LogiTrackLoader } from '@/components/ui/logitrack-loader';

interface BonRedirectorProps {
  bonType: 'distribution' | 'paiement' | 'retour';
}

/**
 * Smart redirector component that routes users to the correct bon page based on their role
 * - Admin/Gestionnaire → /admin/bons/admin/{bonType}
 * - Livreur → /bons/mes-{bonType}
 */
export function BonRedirector({ bonType }: BonRedirectorProps) {
  const navigate = useNavigate();
  const { state } = useAuth();

  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      const userRole = (state.user.role || '').toLowerCase().trim();

      if (['admin', 'gestionnaire'].includes(userRole)) {
        navigate(`/admin/bons/admin/${bonType}`, { replace: true });
      } else if (userRole === 'livreur') {
        navigate(`/bons/mes-${bonType}`, { replace: true });
      } else {
        navigate('/', { replace: true });
      }
    }
  }, [state.isAuthenticated, state.user, bonType, navigate]);

  return <LogiTrackLoader message="Redirection..." />;
}
