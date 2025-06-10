
import React, { createContext, useContext, useReducer, useEffect } from 'react';
import { User } from '@/types';
import { auth, api, supabase, sessionUtils } from '@/lib/supabase';

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
  const sessionMonitorRef = React.useRef<NodeJS.Timeout | null>(null);
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

        // Get user profile from our users table with retry logic
        let userData = null;
        let userError = null;
        const maxRetries = 3;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
          try {
            const result = await api.getUserByEmail(email);
            userData = result.data;
            userError = result.error;

            if (!userError && userData) {
              break;
            }

            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            }
          } catch (fetchError: any) {
            userError = fetchError;
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, attempt * 1000));
            }
          }
        }

        if (userError || !userData) {
          dispatch({ type: 'LOGIN_FAILURE' });
          throw new Error('User profile not found in database. Please contact administrator.');
        }

        dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
      }
    } catch (error: any) {
      dispatch({ type: 'LOGIN_FAILURE' });
      throw error;
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

      // Dispatch logout action immediately to update UI
      dispatch({ type: 'LOGOUT' });

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
      try {
        if (!mounted) return;

        // Get current session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (!mounted) return;

        // Handle session errors
        if (sessionError) {
          isInitializing = false;
          clearTimeout(timeoutId);

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
          isInitializing = false;
          clearTimeout(timeoutId);
          dispatch({ type: 'LOGIN_FAILURE' });
          return;
        }

        // Fetch user data from database with retry logic
        try {

          // Retry logic for user data fetch
          let userData = null;
          let userError = null;
          const maxRetries = 3;

          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              const result = await api.getUserByEmail(session.user.email!);
              userData = result.data;
              userError = result.error;

              if (!userError && userData) {
                break;
              }

              if (attempt < maxRetries) {
                // Check if it's a network error
                const isNetworkError = userError?.message?.includes('Failed to fetch') ||
                                     userError?.message?.includes('ERR_INTERNET_DISCONNECTED') ||
                                     userError?.message?.includes('Network Error');

                if (isNetworkError) {
                  await new Promise(resolve => setTimeout(resolve, attempt * 2000)); // Longer delay for network issues
                } else {
                  await new Promise(resolve => setTimeout(resolve, attempt * 1000));
                }
              }
            } catch (fetchError: any) {
              userError = fetchError;
              if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
              }
            }
          }

          if (!mounted) return;

          if (userError || !userData) {
            isInitializing = false;
            clearTimeout(timeoutId);

            // Check if it's a network error
            if (isNetworkError(userError)) {
              dispatch({ type: 'CONNECTION_ERROR' });
            } else {
              dispatch({ type: 'LOGIN_FAILURE' });
            }
            return;
          }

          isInitializing = false;
          clearTimeout(timeoutId);
          dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
        } catch (error: any) {
          if (mounted) {
            isInitializing = false;
            clearTimeout(timeoutId);

            // Check if it's a network error
            if (isNetworkError(error)) {
              dispatch({ type: 'CONNECTION_ERROR' });
            } else {
              dispatch({ type: 'LOGIN_FAILURE' });
            }
          }
        }
      } catch (error: any) {
        if (mounted) {
          isInitializing = false;
          clearTimeout(timeoutId);

          // Check if it's a network error
          if (isNetworkError(error)) {
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
      console.log('AuthContext: Auth state change event:', event, 'Session exists:', !!session);

      // Skip events during initialization to prevent conflicts
      if (isInitializing) {
        console.log('AuthContext: Skipping event during initialization');
        return;
      }

      // Ignore events during logout
      if (isLoggingOutRef.current) {
        console.log('AuthContext: Skipping event during logout');
        return;
      }

      if (!mounted) return;

      // Prevent duplicate events within a short time frame
      const now = Date.now();
      const userEmail = session?.user?.email || '';
      const lastEvent = lastProcessedEventRef.current;

      if (lastEvent &&
          lastEvent.event === event &&
          lastEvent.email === userEmail &&
          (now - lastEvent.timestamp) < 2000) { // Increased to 2 seconds debounce
        console.log('AuthContext: Skipping duplicate event within 2 seconds');
        return;
      }

      // For SIGNED_IN events, aggressively filter out duplicates
      if (event === 'SIGNED_IN' && session?.user) {
        const currentState = currentStateRef.current;
        if (currentState.isAuthenticated &&
            currentState.user?.email === session.user.email) {
          console.log('AuthContext: Already authenticated with same user, completely skipping SIGNED_IN event');
          return;
        }
      }

      // Update last processed event
      lastProcessedEventRef.current = { event, timestamp: now, email: userEmail };

      if (event === 'SIGNED_OUT' || !session) {
        console.log('AuthContext: User signed out or no session');
        dispatch({ type: 'LOGOUT' });
      } else if (event === 'SIGNED_IN' && session.user) {
        console.log('AuthContext: Processing sign in for user:', session.user.email);

        // Prevent multiple simultaneous sign-in processing
        if (isProcessingSignInRef.current) {
          console.log('AuthContext: Already processing sign in, skipping');
          return;
        }

        // Use current state ref to get the latest state
        const currentState = currentStateRef.current;
        console.log('AuthContext: Current state:', {
          hasUser: !!currentState.user,
          isAuthenticated: currentState.isAuthenticated,
          loading: currentState.loading,
          currentEmail: currentState.user?.email
        });

        // Check if this is the same user that's already authenticated
        if (currentState.user && currentState.user.email === session.user.email) {
          console.log('AuthContext: Same user detected, ensuring proper state');

          // If already authenticated, always skip - no need to re-process
          if (currentState.isAuthenticated) {
            console.log('AuthContext: Same user already authenticated, completely skipping');
            return;
          }

          // If we have user data but state is not properly set, fix it
          console.log('AuthContext: Same user but state needs fixing');
          dispatch({ type: 'LOGIN_SUCCESS', payload: currentState.user });
          return;
        }

        console.log('AuthContext: New user or not authenticated, fetching user data');

        // Set processing flag
        isProcessingSignInRef.current = true;

        // Set loading state immediately for user switching
        dispatch({ type: 'LOGIN_START' });

        // Add timeout to prevent infinite loading
        const loadingTimeout = setTimeout(() => {
          console.log('AuthContext: Loading timeout reached, resetting state');
          if (mounted) {
            dispatch({ type: 'LOGIN_FAILURE' });
            isProcessingSignInRef.current = false;
          }
        }, 5000); // 5 second timeout

        try {
          // Retry logic for user data fetch after sign in
          let userData = null;
          let userError = null;
          const maxRetries = 3;

          for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
              const result = await api.getUserByEmail(session.user.email!);
              userData = result.data;
              userError = result.error;

              if (!userError && userData) {
                break;
              }

              if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
              }
            } catch (fetchError: any) {
              userError = fetchError;
              if (attempt < maxRetries) {
                await new Promise(resolve => setTimeout(resolve, attempt * 1000));
              }
            }
          }

          if (!mounted) return;

          if (userError || !userData) {
            console.log('AuthContext: Failed to fetch user data after sign in');
            clearTimeout(loadingTimeout);
            dispatch({ type: 'LOGIN_FAILURE' });
            isProcessingSignInRef.current = false;
            return;
          }

          console.log('AuthContext: Successfully updated user data after sign in');
          clearTimeout(loadingTimeout);
          dispatch({ type: 'LOGIN_SUCCESS', payload: userData });
        } catch (error: any) {
          console.log('AuthContext: Error handling sign in:', error);
          if (mounted) {
            clearTimeout(loadingTimeout);
            dispatch({ type: 'LOGIN_FAILURE' });
          }
        } finally {
          // Always clear the processing flag
          isProcessingSignInRef.current = false;
        }
      } else if (event === 'TOKEN_REFRESHED' && session.user) {
        console.log('AuthContext: Token refreshed for user:', session.user.email);

        // Use current state ref to get the latest state
        const currentState = currentStateRef.current;

        // For TOKEN_REFRESHED events, if we already have user data, just keep it
        if (currentState.user && currentState.user.email === session.user.email) {
          console.log('AuthContext: Token refreshed, keeping existing user data');
          // Ensure state is properly authenticated
          if (!currentState.isAuthenticated) {
            dispatch({ type: 'LOGIN_SUCCESS', payload: currentState.user });
          }
          return;
        }

        // If we don't have user data or it's for a different user, fetch it
        console.log('AuthContext: Token refreshed but need to fetch user data');
        dispatch({ type: 'LOGIN_START' });

        try {
          const result = await api.getUserByEmail(session.user.email!);

          if (!mounted) return;

          if (result.error || !result.data) {
            console.log('AuthContext: Failed to fetch user data after token refresh');
            dispatch({ type: 'LOGIN_FAILURE' });
            return;
          }

          dispatch({ type: 'LOGIN_SUCCESS', payload: result.data });
        } catch (error: any) {
          console.log('AuthContext: Error handling token refresh:', error);
          if (mounted) {
            dispatch({ type: 'LOGIN_FAILURE' });
          }
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

  // DISABLED: Session monitoring completely to prevent infinite loops
  // The onAuthStateChange handler should be sufficient for session management
  /*
  useEffect(() => {
    if (!state.isAuthenticated || !state.user) {
      if (sessionMonitorRef.current) {
        console.log('AuthContext: Stopping session monitor - user not authenticated');
        clearInterval(sessionMonitorRef.current);
        sessionMonitorRef.current = null;
      }
      return;
    }

    if (sessionMonitorRef.current) {
      return;
    }

    console.log('AuthContext: Starting session monitor for user', state.user.email);
  }, [state.isAuthenticated, state.user?.email]);
  */

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
// Reusable delay function;

