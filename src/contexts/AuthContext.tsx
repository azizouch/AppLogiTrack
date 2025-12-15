
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
  loading: true, // Start with loading true to prevent flash of login page
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
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        hasConnectionError: false,
      };
    case 'CONNECTION_ERROR':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        hasConnectionError: true,
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        isAuthenticated: false,
        loading: false,
        hasConnectionError: false,
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
  retryConnection: () => void;
} | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);
  const isLoggingOutRef = React.useRef(false);

  const currentStateRef = React.useRef(state);
  const isProcessingSignInRef = React.useRef(false);
  const lastProcessedEventRef = React.useRef<{ event: string; timestamp: number; email: string } | null>(null);

  // Keep ref in sync with state
  React.useEffect(() => {
    currentStateRef.current = state;
  }, [state]);

  // Helper function to detect network errors
  const isNetworkError = (error: any): boolean => {
    if (!error) return false;
    const message = error.message || '';
    return message.includes('Failed to fetch') ||
           message.includes('ERR_INTERNET_DISCONNECTED') ||
           message.includes('Network Error') ||
           message.includes('ERR_NETWORK') ||
           message.includes('ERR_CONNECTION_REFUSED') ||
           message.includes('fetch');
  };

  // Retry connection function
  const retryConnection = () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    // Trigger a re-check of the session
    window.location.reload();
  };

  // Supabase login function
  const login = async (email: string, password: string) => {
    dispatch({ type: 'LOGIN_START' });

    try {
      // Authenticate with Supabase
      const { data: authData, error: authError } = await auth.signIn(email, password);

      if (authError) {
        throw authError;
      }

      if (authData.user) {

        // Get user profile from our users table
        const result = await api.getUserByEmail(email);

        if (result.error || !result.data) {
          dispatch({ type: 'LOGIN_FAILURE' });
          throw new Error('User profile not found in database. Please contact administrator.');
        }

        // Update last login time
        const now = new Date().toISOString();
        await api.updateUserById(result.data.id, { 
          derniere_connexion: now 
        });

        // Update the user data with the new last login time
        const updatedUser = { ...result.data, derniere_connexion: now };

        dispatch({ type: 'LOGIN_SUCCESS', payload: updatedUser });
      }
    } catch (error: any) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = async () => {
    // Prevent multiple simultaneous logout calls
    if (isLoggingOutRef.current) {
      return;
    }

    isLoggingOutRef.current = true;

    // Set a timeout to reset the flag in case something goes wrong
    const timeoutId = setTimeout(() => {
      isLoggingOutRef.current = false;
    }, 3000); // Reduced to 3 seconds

    try {
      // Force cleanup of any modal/dialog styles that might be stuck
      if (typeof window !== 'undefined') {
        document.body.style.removeProperty('pointer-events');
        document.body.style.removeProperty('overflow');
        document.body.removeAttribute('data-scroll-locked');
      }

      // Dispatch logout action immediately to update UI and stop loaders
      dispatch({ type: 'LOGOUT' });
      dispatch({ type: 'SET_LOADING', payload: false });

      // (No cross-tab broadcast here to avoid unintended side effects)

      // Sign out from Supabase
      const { error } = await auth.signOut();

      if (error) {
        // Don't throw error since we already logged out locally
      }

    } catch (error: any) {

      // Force cleanup on error too
      if (typeof window !== 'undefined') {
        document.body.style.removeProperty('pointer-events');
        document.body.style.removeProperty('overflow');
        document.body.removeAttribute('data-scroll-locked');
      }

      // Ensure logout state is set even on error
      dispatch({ type: 'LOGOUT' });
    } finally {
      clearTimeout(timeoutId);
      isLoggingOutRef.current = false;
    }
  };

  useEffect(() => {
    // (Reverted cross-tab unauthorized/broadcast handling to avoid causing loader deadlocks.)

    let mounted = true;
    let isInitializing = true;

    // Longer timeout to handle network issues (10 seconds max)
    const timeoutId = setTimeout(() => {
      if (mounted && isInitializing) {
        isInitializing = false;
        dispatch({ type: 'CONNECTION_ERROR' });
      }
    }, 10000);

    // Simplified session check
    const checkSession = async () => {
      // Ensure loading is set while we verify session
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        if (!mounted) return;

        // Get current session (read token once)
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!mounted) return;

        // Handle session errors
        if (sessionError) {
          // Check if it's a network error
          if (isNetworkError(sessionError)) {
            dispatch({ type: 'CONNECTION_ERROR' });
          } else {
            dispatch({ type: 'LOGIN_FAILURE' });
          }
          return;
        }

        // No session found
        if (!session || !session.user) {
          dispatch({ type: 'LOGIN_FAILURE' });
          return;
        }

        // Fetch user data from database
        const result = await api.getUserByEmail(session.user.email!);

        if (!mounted) return;

        if (result.error || !result.data) {
          // Check if it's a network error
          if (isNetworkError(result.error)) {
            dispatch({ type: 'CONNECTION_ERROR' });
          } else {
            dispatch({ type: 'LOGIN_FAILURE' });
          }
          return;
        }

        // Update last login time if not updated recently (within last minute)
        try {
          const lastLogin = result.data.derniere_connexion ? new Date(result.data.derniere_connexion) : null;
          const now = new Date();
          const shouldUpdate = !lastLogin || (now.getTime() - lastLogin.getTime()) > 60000; // Update if older than 1 minute

          if (shouldUpdate) {
            const nowIso = now.toISOString();
            await api.updateUserById(result.data.id, { 
              derniere_connexion: nowIso 
            });
            result.data.derniere_connexion = nowIso;
          }
        } catch (e) {
          // ignore update errors
        }

        dispatch({ type: 'LOGIN_SUCCESS', payload: result.data });
      } catch (error: any) {
        if (mounted) {
          if (isNetworkError(error)) {
            dispatch({ type: 'CONNECTION_ERROR' });
          } else {
            dispatch({ type: 'LOGIN_FAILURE' });
          }
        }
      } finally {
        if (mounted) dispatch({ type: 'SET_LOADING', payload: false });
      }
    };

    // Start session check
    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      // Skip events during initialization to prevent conflicts
      if (isInitializing) return;

      // Ignore events during logout
      if (isLoggingOutRef.current) return;

      if (!mounted) return;

      // Prevent duplicate events within a short time frame
      const now = Date.now();
      const userEmail = session?.user?.email || '';
      const lastEvent = lastProcessedEventRef.current;

      if (lastEvent &&
          lastEvent.event === event &&
          lastEvent.email === userEmail &&
          (now - lastEvent.timestamp) < 2000) {
        return;
      }

      // For SIGNED_IN events, filter out duplicates for already authenticated users
      if (event === 'SIGNED_IN' && session?.user) {
        const currentState = currentStateRef.current;
        if (currentState.isAuthenticated &&
            currentState.user?.email === session.user.email) {
          return;
        }
      }

      // Update last processed event
      lastProcessedEventRef.current = { event, timestamp: now, email: userEmail };

      if (event === 'SIGNED_OUT' || !session) {
        dispatch({ type: 'LOGOUT' });
        dispatch({ type: 'SET_LOADING', payload: false });
      } else if (event === 'SIGNED_IN' && session.user) {
        // Prevent multiple simultaneous sign-in processing
        if (isProcessingSignInRef.current) return;

        const currentState = currentStateRef.current;

        // Check if this is the same user that's already authenticated
        if (currentState.user && currentState.user.email === session.user.email) {
          // If already authenticated, skip processing
          if (currentState.isAuthenticated) return;

          // If we have user data but state is not properly set, fix it
          dispatch({ type: 'LOGIN_SUCCESS', payload: currentState.user });
          return;
        }

        // Set processing flag and loading state
        isProcessingSignInRef.current = true;
        dispatch({ type: 'LOGIN_START' });

        try {
          const result = await api.getUserByEmail(session.user.email!);

          if (!mounted) return;

          if (result.error || !result.data) {
            dispatch({ type: 'LOGIN_FAILURE' });
            return;
          }

          // Update last login time
          const now = new Date().toISOString();
          await api.updateUserById(result.data.id, { 
            derniere_connexion: now 
          });
          result.data.derniere_connexion = now;

          dispatch({ type: 'LOGIN_SUCCESS', payload: result.data });
        } catch (error: any) {
          if (mounted) {
            dispatch({ type: 'LOGIN_FAILURE' });
          }
        } finally {
          isProcessingSignInRef.current = false;
          if (mounted) dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else if (event === 'TOKEN_REFRESHED' && session.user) {
        const currentState = currentStateRef.current;

        // For TOKEN_REFRESHED events, if we already have user data, just keep it
        if (currentState.user && currentState.user.email === session.user.email) {
          // Ensure state is properly authenticated
          if (!currentState.isAuthenticated) {
            dispatch({ type: 'LOGIN_SUCCESS', payload: currentState.user });
          }
          return;
        }

        // If we don't have user data or it's for a different user, fetch it
        dispatch({ type: 'LOGIN_START' });

        try {
          const result = await api.getUserByEmail(session.user.email!);

          if (!mounted) return;

          if (result.error || !result.data) {
            dispatch({ type: 'LOGIN_FAILURE' });
            return;
          }

          // Update last login time
          const now = new Date().toISOString();
          await api.updateUserById(result.data.id, { 
            derniere_connexion: now 
          });
          result.data.derniere_connexion = now;

          dispatch({ type: 'LOGIN_SUCCESS', payload: result.data });
        } catch (error: any) {
          if (mounted) {
            dispatch({ type: 'LOGIN_FAILURE' });
          }
        } finally {
          if (mounted) dispatch({ type: 'SET_LOADING', payload: false });
        }
      }
    });

    return () => {
      mounted = false;
      isInitializing = false;
      clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []); // Keep empty dependency array to avoid re-subscription



  return (
    <AuthContext.Provider value={{ state, login, logout, retryConnection }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    // In development, provide a more helpful error message
    if (process.env.NODE_ENV === 'development') {
      console.error('useAuth must be used within an AuthProvider. This might be a hot reload issue - try refreshing the page.');
    }
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};