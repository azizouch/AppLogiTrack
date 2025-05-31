
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
  loading: false,
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
          // Instead of throwing error, let's try to continue with basic auth data
          console.log('Falling back to auth user data');
          const basicUser = {
            id: authData.user.id,
            nom: authData.user.user_metadata?.nom || 'Utilisateur',
            prenom: authData.user.user_metadata?.prenom || '',
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
          console.log('Successfully fetched user data:', userData);
          console.log('User role:', userData.role);
          dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
        } else {
          console.log('No user data returned, creating fallback user');
          const basicUser = {
            id: authData.user.id,
            nom: authData.user.user_metadata?.nom || 'Utilisateur',
            prenom: authData.user.user_metadata?.prenom || '',
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
    let mounted = true;

    // Add timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (mounted) {
        console.log('Session check timeout - forcing login failure');
        dispatch({ type: 'LOGIN_FAILURE' });
      }
    }, 5000); // Reduced to 5 second timeout

    // Simplified session check - just check if user is authenticated
    const checkSession = async () => {
      try {
        console.log('Checking session...');
        dispatch({ type: 'SET_LOADING', payload: true });
        const { user: authUser, error } = await auth.getCurrentUser();

        if (!mounted) return;

        clearTimeout(timeoutId);

        if (error) {
          console.log('Auth error:', error);
          dispatch({ type: 'LOGIN_FAILURE' });
          return;
        }

        if (authUser) {
          console.log('Auth user found:', authUser.email);
          // Fetch real user data from database
          try {
            const { data: userData, error: userError } = await api.getUserByEmail(authUser.email!);

            if (userError || !userData) {
              console.log('No user data found during session check, creating fallback');
              const basicUser = {
                id: authUser.id,
                nom: authUser.user_metadata?.nom || 'Utilisateur',
                prenom: authUser.user_metadata?.prenom || '',
                email: authUser.email!,
                role: 'gestionnaire' as const,
                mot_de_passe: '',
                statut: 'actif',
                date_creation: new Date().toISOString(),
              };
              dispatch({ type: 'LOGIN_SUCCESS', payload: basicUser });
              return;
            }

            console.log('Using real user profile for session:', userData);
            console.log('Session user role:', userData.role);
            dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
          } catch (error) {
            console.error('Error fetching user data:', error);
            dispatch({ type: 'LOGIN_FAILURE' });
          }
        } else {
          console.log('No auth user found');
          dispatch({ type: 'LOGIN_FAILURE' });
        }
      } catch (error) {
        console.error('Session check error:', error);
        if (mounted) {
          clearTimeout(timeoutId);
          dispatch({ type: 'LOGIN_FAILURE' });
        }
      }
    };

    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event, session?.user?.email);

      if (event === 'SIGNED_OUT' || !session) {
        console.log('User signed out, dispatching LOGOUT');
        dispatch({ type: 'LOGOUT' });
      } else if (event === 'SIGNED_IN' && session.user) {
        // Only handle SIGNED_IN if we don't already have a user
        if (!state.user) {
          console.log('User signed in, fetching real profile for:', session.user.email);

          // Fetch real user data from database
          try {
            const { data: userData, error: userError } = await api.getUserByEmail(session.user.email!);

            if (userError || !userData) {
              console.log('No user data found during sign in, creating fallback');
              const basicUser = {
                id: session.user.id,
                nom: session.user.user_metadata?.nom || 'Utilisateur',
                prenom: session.user.user_metadata?.prenom || '',
                email: session.user.email!,
                role: 'gestionnaire' as const,
                mot_de_passe: '',
                statut: 'actif',
                date_creation: new Date().toISOString(),
              };
              dispatch({ type: 'LOGIN_SUCCESS', payload: basicUser });
              return;
            }

            console.log('Dispatching LOGIN_SUCCESS with real user data:', userData);
            dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
          } catch (error) {
            console.error('Error fetching user data during sign in:', error);
            dispatch({ type: 'LOGIN_FAILURE' });
          }
        } else {
          console.log('User already logged in, skipping SIGNED_IN event');
        }
      } else if (event === 'INITIAL_SESSION') {
        // Handle initial session - this is fired when the page loads
        console.log('Initial session detected, handled by checkSession');
      } else {
        console.log('Unknown auth state, event:', event);
      }
    });

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
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
