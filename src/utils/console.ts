// Utility to suppress expected Supabase auth errors in console
export const suppressExpectedAuthErrors = () => {
  if (typeof window === 'undefined') return;

  // Store original console.error
  const originalError = console.error;

  // Override console.error to filter out expected auth errors
  console.error = (...args: any[]) => {
    const message = args.join(' ');

    // List of expected error messages to suppress
    const expectedErrors = [
      'Invalid Refresh Token',
      'Refresh Token Not Found',
      'Auth session missing',
      'AuthSessionMissingError',
      'Could not establish connection. Receiving end does not exist',
      'useAuth must be used within an AuthProvider',
      'Multiple GoTrueClient instances detected',
      'Download the React DevTools'
    ];

    // List of debug messages to suppress in production
    const debugMessages = [
      'Starting login process for:',
      'Authenticating with Supabase...',
      'Checking initial session...',
      'Auth state change:',
      'Reset Password Debug:',
      'Checking bons table structure...',
      'Fetched bons data:',
      'Fetched retour bons data:',
      'Admin/Gestionnaire users found:',
      'Access denied - Required roles:',
      'Valid reset password request detected'
    ];

    // Check if this is an expected error
    const isExpectedError = expectedErrors.some(error =>
      message.includes(error)
    );

    // Only log if it's not an expected error
    if (!isExpectedError) {
      originalError.apply(console, args);
    }
  };

  // Override console.log to filter out debug messages in production
  if (import.meta.env.PROD) {
    const originalLog = console.log;
    console.log = (...args: any[]) => {
      const message = args.join(' ');

      // Check if this is a debug message to suppress
      const isDebugMessage = debugMessages.some(debug =>
        message.includes(debug)
      );

      // Only log if it's not a debug message
      if (!isDebugMessage) {
        originalLog.apply(console, args);
      }
    };
  }

  // Return function to restore original console methods
  return () => {
    console.error = originalError;
  };
};
