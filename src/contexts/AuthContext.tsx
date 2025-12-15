
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User } from '@/types';
import { auth, api } from '@/lib/supabase';

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
        const result = await api.getUserByEmail(data.user.email!);
        if (result.error || !result.data) {
          dispatch({ type: 'LOGIN_FAILURE' });
          throw new Error('User profile not found');
        }
        // update last login time
        try {
          const now = new Date().toISOString();
          await api.updateUserById(result.data.id, { derniere_connexion: now });
          result.data.derniere_connexion = now;
        } catch (e) {
          // ignore
        }
        dispatch({ type: 'LOGIN_SUCCESS', payload: result.data });
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
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const { user, error } = await auth.getCurrentUser();
        if (!mounted) return;
        if (error) {
          dispatch({ type: 'LOGIN_FAILURE' });
          return;
        }

        if (user) {
          const result = await api.getUserByEmail(user.email!);
          if (!mounted) return;
          if (result.error || !result.data) {
            dispatch({ type: 'LOGIN_FAILURE' });
            return;
          }
          dispatch({ type: 'LOGIN_SUCCESS', payload: result.data });
        } else {
          dispatch({ type: 'LOGOUT' });
        }
      } catch (err) {
        if (!mounted) return;
        dispatch({ type: 'CONNECTION_ERROR' });
      } finally {
        if (mounted) dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    loadCurrentUser();

    const { data: subscription } = auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_OUT' || !session) {
        dispatch({ type: 'LOGOUT' });
        return;
      }

      if (event === 'SIGNED_IN' && session.user) {
        try {
          const result = await api.getUserByEmail(session.user.email!);
          if (result.error || !result.data) {
            dispatch({ type: 'LOGIN_FAILURE' });
            return;
          }
          dispatch({ type: 'LOGIN_SUCCESS', payload: result.data });
        } catch (e) {
          dispatch({ type: 'LOGIN_FAILURE' });
        }
      }
    });

    return () => {
      mounted = false;
      subscription?.unsubscribe();
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