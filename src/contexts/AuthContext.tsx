
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User } from '@/types';
import { auth, api } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  loading: boolean;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: User }
  | { type: 'LOGIN_FAILURE' }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean };

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  loading: true,
};

const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload,
        isAuthenticated: true,
        loading: false,
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
      };
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
} | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Supabase login function
  const login = async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      console.log('Attempting login with:', email);

      // Authenticate with Supabase
      const { data: authData, error: authError } = await auth.signIn(email, password);

      console.log('Auth response:', { authData, authError });

      if (authError) {
        console.error('Authentication error:', authError);
        throw authError;
      }

      if (authData.user) {
        console.log('User authenticated, fetching profile...');

        // Get user profile from our users table
        const { data: userData, error: userError } = await api.getUserByEmail(email);

        console.log('User profile response:', { userData, userError });

        if (userError) {
          console.error('User profile error:', userError);
          // If user profile doesn't exist, create a basic one for now
          const basicUser = {
            id: authData.user.id,
            nom: 'Test',
            prenom: 'User',
            email: email,
            role: 'gestionnaire' as const,
            mot_de_passe: '',
            statut: 'actif',
            date_creation: new Date().toISOString(),
          };
          dispatch({ type: 'LOGIN_SUCCESS', payload: basicUser });
          return;
        }

        if (userData) {
          dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
        } else {
          // Create a basic user profile if none exists
          const basicUser = {
            id: authData.user.id,
            nom: 'Test',
            prenom: 'User',
            email: email,
            role: 'gestionnaire' as const,
            mot_de_passe: '',
            statut: 'actif',
            date_creation: new Date().toISOString(),
          };
          dispatch({ type: 'LOGIN_SUCCESS', payload: basicUser });
        }
      }
    } catch (error) {
      console.error('Login error:', error);
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };

  const logout = async () => {
    await auth.signOut();
    dispatch({ type: 'LOGOUT' });
  };

  useEffect(() => {
    // Check for existing Supabase session
    const checkSession = async () => {
      try {
        const { user: authUser, error } = await auth.getCurrentUser();

        if (error) {
          dispatch({ type: 'SET_LOADING', payload: false });
          return;
        }

        if (authUser) {
          // Get user profile from our users table
          const { data: userData, error: userError } = await api.getUserByEmail(authUser.email!);

          if (userError || !userData) {
            dispatch({ type: 'LOGIN_FAILURE' });
          } else {
            dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
          }
        } else {
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } catch (error) {
        dispatch({ type: 'LOGIN_FAILURE' });
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        dispatch({ type: 'LOGOUT' });
      } else if (event === 'SIGNED_IN' && session.user) {
        const { data: userData, error } = await api.getUserByEmail(session.user.email!);
        if (userData && !error) {
          dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ state, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
