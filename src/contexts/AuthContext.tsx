
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
    console.log('Retrying connection...');
    dispatch({ type: 'SET_LOADING', payload: true });
    // Trigger a re-check of the session
    window.location.reload();
  };

  // Supabase login function
  const login = async (email: string, password: string) => {
    console.log('Starting login process for:', email);
    dispatch({ type: 'LOGIN_START' });

    try {
      // Authenticate with Supabase
      console.log('Authenticating with Supabase...');
      const { data: authData, error: authError } = await auth.signIn(email, password);

      if (authError) {
        console.log('Supabase auth error:', authError.message);
        throw authError;
      }

      if (authData.user) {
        console.log('Supabase auth successful, fetching user profile...');

        // Get user profile from our users table with retry logic
        let userData = null;
        let userError = null;
        const maxRetries = 3;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            console.log(`Login user data fetch attempt ${attempt}/${maxRetries}`);

            const result = await api.getUserByEmail(email);
            userData = result.data;
            userError = result.error;

            if (!userError && userData) {
              console.log('User profile loaded successfully:', userData.nom, 'with role:', userData.role);
              break;
            }

            if (attempt < maxRetries) {
              console.log(`Login attempt ${attempt} failed, retrying in ${attempt}s...`);
              await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            }
          } catch (fetchError: any) {
            console.log(`Login fetch attempt ${attempt} error:`, fetchError.message);
            userError = fetchError;
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            }
          }
        }

        if (userError || !userData) {
          console.log('Failed to fetch user profile after all retries. User profile may not exist in database.');
          console.log('Login error details:', userError?.message || 'No user data');
          dispatch({ type: 'LOGIN_FAILURE' });
          throw new Error('User profile not found in database. Please contact administrator.');
        }

        console.log('User profile loaded successfully');
        dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
        console.log('Login process completed successfully');
      }
    } catch (error: any) {
      console.log('Login error:', error.message);
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
    }
  };

  const logout = async () => {
    // Prevent multiple simultaneous logout calls
    if (isLoggingOutRef.current) {
      console.log('Logout already in progress, skipping...');
      return;
    }

    console.log('Starting logout process...');
    isLoggingOutRef.current = true;

    // Set a timeout to reset the flag in case something goes wrong
    const timeoutId = setTimeout(() => {
      console.log('Logout timeout reached, resetting flag');
      isLoggingOutRef.current = false;
    }, 3000); // Reduced to 3 seconds

    try {
      // Force cleanup of any modal/dialog styles that might be stuck
      if (typeof window !== 'undefined') {
        document.body.style.removeProperty('pointer-events');
        document.body.style.removeProperty('overflow');
        document.body.removeAttribute('data-scroll-locked');
      }

      // Dispatch logout action immediately to update UI
      dispatch({ type: 'LOGOUT' });
      console.log('Local logout state updated');

      // Sign out from Supabase
      const { error } = await auth.signOut();

      if (error) {
        console.log('Supabase logout error (non-critical):', error.message);
        // Don't throw error since we already logged out locally
      } else {
        console.log('Supabase logout successful');
      }

    } catch (error: any) {
      console.log('Logout error:', error.message);

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
      console.log('Logout process completed');
    }
  };

  useEffect(() => {
    let mounted = true;
    let isInitializing = true;

    // Longer timeout to handle network issues (10 seconds max)
    const timeoutId = setTimeout(() => {
      if (mounted && isInitializing) {
        console.log('Auth initialization timeout - likely network issue');
        isInitializing = false;
        dispatch({ type: 'CONNECTION_ERROR' });
      }
    }, 10000);

    // Simplified session check
    const checkSession = async () => {
      try {
        if (!mounted) return;

        console.log('Checking initial session...');

        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!mounted) return;

        // Handle session errors
        if (sessionError) {
          console.log('Session error:', sessionError.message);
          isInitializing = false;
          clearTimeout(timeoutId);

          // Check if it's a network error
          if (isNetworkError(sessionError)) {
            console.log('Network error detected during session check');
            dispatch({ type: 'CONNECTION_ERROR' });
          } else {
            dispatch({ type: 'LOGIN_FAILURE' });
          }
          return;
        }

        // No session found
        if (!session || !session.user) {
          console.log('No session found');
          isInitializing = false;
          clearTimeout(timeoutId);
          dispatch({ type: 'LOGIN_FAILURE' });
          return;
        }

        console.log('Session found, fetching user data...');

        // Fetch user data from database with retry logic
        try {
          console.log('Fetching user data for:', session.user.email);

          // Retry logic for user data fetch
          let userData = null;
          let userError = null;
          const maxRetries = 3;

          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              console.log(`User data fetch attempt ${attempt}/${maxRetries}`);

              const result = await api.getUserByEmail(session.user.email!);
              userData = result.data;
              userError = result.error;

              if (!userError && userData) {
                console.log('User data loaded successfully:', userData.nom, 'with role:', userData.role);
                break;
              }

              if (attempt < maxRetries) {
                // Check if it's a network error
                const isNetworkError = userError?.message?.includes('Failed to fetch') ||
                                     userError?.message?.includes('ERR_INTERNET_DISCONNECTED') ||
                                     userError?.message?.includes('Network Error');

                if (isNetworkError) {
                  console.log(`Network error detected, retrying in ${attempt * 2}s...`);
                  await new Promise(resolve => setTimeout(resolve, attempt * 2000)); // Longer delay for network issues
                } else {
                  console.log(`Attempt ${attempt} failed, retrying in ${attempt}s...`);
                  await new Promise(resolve => setTimeout(resolve, attempt * 1000));
                }
              }
            } catch (fetchError: any) {
              console.log(`Fetch attempt ${attempt} error:`, fetchError.message);
              userError = fetchError;
              if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
              }
            }
          }

          if (!mounted) return;

          if (userError || !userData) {
            console.log('Failed to fetch user data after all retries.');
            console.log('Error details:', userError?.message || 'No user data');
            isInitializing = false;
            clearTimeout(timeoutId);

            // Check if it's a network error
            if (isNetworkError(userError)) {
              console.log('Network error detected during user data fetch');
              dispatch({ type: 'CONNECTION_ERROR' });
            } else {
              console.log('User profile may not exist in database');
              dispatch({ type: 'LOGIN_FAILURE' });
            }
            return;
          }

          console.log('User data loaded successfully');
          isInitializing = false;
          clearTimeout(timeoutId);
          dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
        } catch (error: any) {
          console.log('Critical error fetching user data:', error.message);
          if (mounted) {
            isInitializing = false;
            clearTimeout(timeoutId);

            // Check if it's a network error
            if (isNetworkError(error)) {
              console.log('Network error detected in critical error handler');
              dispatch({ type: 'CONNECTION_ERROR' });
            } else {
              dispatch({ type: 'LOGIN_FAILURE' });
            }
          }
        }
      } catch (error: any) {
        console.log('Session check error:', error.message);
        if (mounted) {
          isInitializing = false;
          clearTimeout(timeoutId);

          // Check if it's a network error
          if (isNetworkError(error)) {
            console.log('Network error detected in session check');
            dispatch({ type: 'CONNECTION_ERROR' });
          } else {
            dispatch({ type: 'LOGIN_FAILURE' });
          }
        }
      }
    };

    // Start session check
    checkSession();

    // Listen for auth state changes
    const { data: { subscription } } = auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state change:', event);

      // Skip events during initialization to prevent conflicts
      if (isInitializing) {
        console.log('Skipping auth event during initialization');
        return;
      }

      // Ignore events during logout
      if (isLoggingOutRef.current) {
        console.log('Skipping auth event during logout');
        return;
      }

      if (!mounted) return;

      if (event === 'SIGNED_OUT' || !session) {
        console.log('User signed out');
        dispatch({ type: 'LOGOUT' });
      } else if (event === 'SIGNED_IN' && session.user) {
        console.log('User signed in, fetching user data...');

        try {
          // Retry logic for user data fetch after sign in
          let userData = null;
          let userError = null;
          const maxRetries = 3;

          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              console.log(`Sign-in user data fetch attempt ${attempt}/${maxRetries}`);

              const result = await api.getUserByEmail(session.user.email!);
              userData = result.data;
              userError = result.error;

              if (!userError && userData) {
                console.log('User data loaded after sign in:', userData.nom, 'with role:', userData.role);
                break;
              }

              if (attempt < maxRetries) {
                console.log(`Sign-in attempt ${attempt} failed, retrying in ${attempt}s...`);
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
              }
            } catch (fetchError: any) {
              console.log(`Sign-in fetch attempt ${attempt} error:`, fetchError.message);
              userError = fetchError;
              if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
              }
            }
          }

          if (!mounted) return;

          if (userError || !userData) {
            console.log('Failed to fetch user data after sign in. User profile may not exist in database.');
            console.log('Sign-in error details:', userError?.message || 'No user data');
            dispatch({ type: 'LOGOUT' });
            return;
          }

          console.log('User data loaded after sign in');
          dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
        } catch (error: any) {
          console.log('Critical error fetching user data after sign in:', error.message);
          if (mounted) {
            dispatch({ type: 'LOGOUT' });
          }
        }
      }
    });

    return () => {
      console.log('Cleaning up auth context');
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
