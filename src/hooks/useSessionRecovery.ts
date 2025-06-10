import { useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { sessionUtils } from '@/lib/supabase';

// Global request throttling
let activeRequests = 0;
const MAX_CONCURRENT_REQUESTS = 3;

// Simplified session recovery - removed complex failure tracking

export const useSessionRecovery = () => {
  const { state, logout } = useAuth();
  const recoveryAttemptRef = useRef(0);
  const maxRecoveryAttempts = 2;

  // Reset recovery attempts when user successfully authenticates
  useEffect(() => {
    if (state.isAuthenticated && state.user) {
      recoveryAttemptRef.current = 0;
    }
  }, [state.isAuthenticated, state.user]);

  const handleSessionError = useCallback(async (error: any): Promise<boolean> => {
    // Check if it's actually a session error
    if (!sessionUtils.isSessionError(error)) {
      return false;
    }

    // Check if we've exceeded recovery attempts
    if (recoveryAttemptRef.current >= maxRecoveryAttempts) {
      await logout();
      return false;
    }

    recoveryAttemptRef.current++;

    try {
      const recovered = await sessionUtils.refreshSession();

      if (recovered) {
        return true;
      } else {
        if (recoveryAttemptRef.current >= maxRecoveryAttempts) {
          await logout();
        }
        return false;
      }
    } catch (error) {
      if (recoveryAttemptRef.current >= maxRecoveryAttempts) {
        await logout();
      }
      return false;
    }
  }, [logout]);

  const withRecovery = useCallback(async <T>(
    apiCall: () => Promise<T>,
    onError?: (error: any) => void,
    timeoutMs: number = 60000 // Increased to 60 seconds for better reliability
  ): Promise<T | null> => {
    console.log('withRecovery: Making API call (session recovery disabled)...');

    // Check if we have too many concurrent requests
    if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
      console.log('withRecovery: Too many concurrent requests, throttling...');
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    }

    activeRequests++;
    console.log('withRecovery: Starting API call, Active requests:', activeRequests);

    try {
      // Session recovery is disabled to prevent infinite SIGNED_IN events
      console.log('withRecovery: Making API call without session recovery...');
      const result = await apiCall();
      console.log('withRecovery: API call completed successfully');
      return result;
    } catch (error: any) {
      console.log('withRecovery: API call failed with error:', error.message);

      // Session recovery is disabled - just handle the error
      if (onError) onError(error);
      return null;

      /*
      // DISABLED: Session recovery to prevent infinite loops
      // Handle session errors with recovery
      if (sessionUtils.isSessionError(error)) {
        console.log('withRecovery: Session error detected, attempting session refresh...');

        try {
          // Attempt to refresh the session
          const refreshed = await sessionUtils.refreshSession();

          if (refreshed) {
            console.log('withRecovery: Session refreshed successfully, retrying API call...');

            // Wait a moment for the session to propagate
            await new Promise(resolve => setTimeout(resolve, 500));

            // Retry the API call with timeout for the retry
            const retryPromise = apiCall();
            const retryTimeoutPromise = new Promise<never>((_, reject) => {
              setTimeout(() => reject(new Error('Retry API call timeout')), timeoutMs);
            });

            const retryResult = await Promise.race([retryPromise, retryTimeoutPromise]);
            console.log('withRecovery: Retry completed successfully');
            return retryResult;
          } else {
            console.log('withRecovery: Session refresh failed');
            // Don't logout immediately - let the calling component handle it
            if (onError) onError(error);
            return null;
          }
        } catch (retryError: any) {
          console.log('withRecovery: Retry failed:', retryError.message);

          // If retry also fails with session error, it's a real session issue
          if (sessionUtils.isSessionError(retryError)) {
            console.log('withRecovery: Confirmed session error after retry, this may require logout');
            // Let the calling component decide whether to logout
          }

          if (onError) onError(retryError);
          return null;
        }
      }

      // For timeout errors specifically, let's try one more time without timeout
      if (error.message?.includes('timeout')) {
        console.log('withRecovery: Timeout detected, attempting one retry without timeout...');
        try {
          const retryResult = await apiCall();
          console.log('withRecovery: Timeout retry completed successfully');
          return retryResult;
        } catch (retryError: any) {
          console.log('withRecovery: Timeout retry also failed:', retryError.message);
          if (onError) onError(retryError);
          return null;
        }
      }

      // For other non-session errors (network issues, etc.), just return null
      console.log('withRecovery: Non-session error, returning null');
      if (onError) onError(error);
      return null;
      */
    } finally {
      activeRequests--;
      console.log('withRecovery: Request completed, active requests:', activeRequests);
    }
  }, [logout]);

  return {
    withRecovery,
    handleSessionError,
    isRecovering: recoveryAttemptRef.current > 0
  };
};

// Simplified session monitoring hook - monitoring is now handled centrally in AuthContext
export const useSessionMonitor = () => {
  // Session monitoring is now handled centrally in AuthContext to avoid multiple instances
  // This hook is kept for backward compatibility but doesn't do anything
  console.log('useSessionMonitor: Session monitoring is handled centrally in AuthContext');
};
