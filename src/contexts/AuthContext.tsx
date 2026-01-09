
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User } from '@/types';
import { auth, api, supabase } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
  hasConnectionError: boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'CONNECTION_ERROR' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: true,
  hasConnectionError: false,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, hasConnectionError: false };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
        hasConnectionError: false,
      };
    case 'LOGIN_FAILURE':
      return { ...state, user: null, isAuthenticated: false, loading: false };
    case 'CONNECTION_ERROR':
      return { ...state, user: null, isAuthenticated: false, loading: false, hasConnectionError: true };
    case 'LOGOUT':
      return { ...state, user: null, isAuthenticated: false, loading: false };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
};

const AuthContext = createContext<{
  state: AuthState;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  retryConnection: () => void;
} | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const retryConnection = () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    window.location.reload();
  };

  const login = async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });
    try {
      const { data, error } = await auth.signIn(email, password);
      if (error) {
        dispatch({ type: 'LOGIN_FAILURE' });
        throw error;
      }

      if (data?.user) {
        // Get full user data from DB with extended timeout
        try {
          const { data: userData, error: userError } = await supabase
            .from('utilisateurs')
            .select('*')
            .eq('auth_id', data.user.id)
            .single();

          if (userData && !userError) {
            // Got full user data
            const userWithEmail = { ...userData, email: data.user.email };
            dispatch({ type: 'LOGIN_SUCCESS', payload: userWithEmail });
          } else {
            throw new Error('User profile not found');
          }
        } catch (dbError) {
          // Database error or timeout - use basic info as fallback without assuming role
          dispatch({ type: 'LOGIN_SUCCESS', payload: {
            id: data.user.id,
            email: data.user.email,
            nom: data.user.email?.split('@')[0] || 'User',
            prenom: '',
            role: null, // Don't assume role, let dashboard handle it
            statut: 'actif',
            date_creation: new Date().toISOString(),
            auth_id: data.user.id
          } as any });
        }
      }
    } catch (err) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw err;
    }
  };

  const logout = async () => {
    dispatch({ type: 'LOGOUT' });
    try {
      await auth.signOut();
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadCurrentUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!mounted) return;

        if (!session?.user?.id) {
          dispatch({ type: 'LOGOUT' });
          return;
        }

        // Wait for user data with timeout
        const { data: userData, error: userError } = await supabase
          .from('utilisateurs')
          .select('*')
          .eq('auth_id', session.user.id)
          .single();

        if (!mounted) return;

        if (userData && !userError) {
          const userWithEmail = { ...userData, email: session.user.email };
          dispatch({ type: 'LOGIN_SUCCESS', payload: userWithEmail });
        } else {
          // DB error but we have session - use basic info with default role
          dispatch({ type: 'LOGIN_SUCCESS', payload: {
            id: session.user.id,
            email: session.user.email,
            nom: session.user.email?.split('@')[0] || 'User',
            prenom: '',
            role: 'Gestionnaire', // Default to Gestionnaire when DB fails
            statut: 'actif',
            date_creation: new Date().toISOString(),
            auth_id: session.user.id
          } as any });
        }
      } catch (err) {
        if (!mounted) return;
        dispatch({ type: 'LOGOUT' });
      } finally {
        if (mounted) {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    };

    loadCurrentUser();

    const { data: subscription } = auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      // Only handle sign out, not sign in (login function handles that)
      if (event === 'SIGNED_OUT' || !session) {
        dispatch({ type: 'LOGOUT' });
      }
    });

    return () => {
      mounted = false;
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    };
  }, []);

  return (
    <AuthContext.Provider value={{ state, login, logout, retryConnection }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};