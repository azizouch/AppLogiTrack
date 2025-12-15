/*
  SQL Functions to create in Supabase Database:

  1. Get user email by auth ID:
  CREATE OR REPLACE FUNCTION get_user_email_by_auth_id(auth_user_id uuid)
  RETURNS text
  LANGUAGE sql
  SECURITY DEFINER
  AS $$
    SELECT email FROM auth.users WHERE id = auth_user_id;
  $$;

  2. Create auth user (bypasses client-side validation):
  CREATE OR REPLACE FUNCTION create_auth_user_admin(
    user_email text,
    user_password text,
    user_metadata jsonb DEFAULT '{}'::jsonb
  )
  RETURNS json
  LANGUAGE plpgsql
  SECURITY DEFINER
  AS $$
  DECLARE
    new_user_id uuid;
    result json;
  BEGIN
    -- Generate a new UUID for the user
    new_user_id := gen_random_uuid();

    -- Insert directly into auth.users table
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      created_at,
      updated_at,
      raw_user_meta_data,
      is_super_admin,
      role
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000'::uuid,
      user_email,
      crypt(user_password, gen_salt('bf')),
      now(),
      now(),
      now(),
      user_metadata,
      false,
      'authenticated'
    );

    -- Return the created user info
    result := json_build_object(
      'id', new_user_id,
      'email', user_email,
      'created_at', now()
    );

    RETURN result;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN json_build_object(
        'error', SQLERRM,
        'code', SQLSTATE
      );
  END;
  $$;

  This function allows us to create auth users server-side, bypassing client validation.
*/

import { createClient, SupabaseClient, PostgrestError } from '@supabase/supabase-js'
import { User, Client, Entreprise, Colis, Statut, HistoriqueColis, Notification, Bon } from '@/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

// Singleton pattern to prevent multiple instances
let supabaseInstance: SupabaseClient | null = null

const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseInstance) {
    // Create a fetch wrapper to detect unauthorized responses (401/403)
    let customFetch: typeof fetch | undefined = undefined;
    if (typeof window !== 'undefined' && typeof window.fetch === 'function') {
      const originalFetch = window.fetch.bind(window) as typeof fetch;
      customFetch = async (input: RequestInfo, init?: RequestInit) => {
        try {
          const response = await originalFetch(input, init);
          if (response && (response.status === 401 || response.status === 403)) {
            try {
              window.dispatchEvent(new CustomEvent('supabase:unauthorized', { detail: { status: response.status } }));
            } catch (e) {
              // ignore
            }
          }
          return response;
        } catch (err) {
          // rethrow to keep normal error handling
          throw err;
        }
      };
    }

    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false, // Keep disabled to avoid duplicate SIGNED_IN events
        persistSession: true,
        detectSessionInUrl: true,
        // Disable multi-tab sync when using sessionStorage to keep per-tab sessions isolated
        multiTab: false,
        // Add session recovery options
        flowType: 'pkce',
        storage: typeof window !== 'undefined' ? window.sessionStorage : undefined,
        storageKey: 'supabase.auth.token',
        debug: false
      },
      // Use custom fetch wrapper when available to detect auth failures
      fetch: customFetch,
      // Add global error handling
      global: {
        headers: {
          'X-Client-Info': 'logitrack-web'
        }
      }
    })

    // DISABLED: Session monitoring to prevent duplicate auth state change listeners
    // The AuthContext already handles all auth state changes
    /*
    if (typeof window !== 'undefined') {
      supabaseInstance.auth.onAuthStateChange((event, session) => {
        if (event === 'TOKEN_REFRESHED' && session) {
          // Token refreshed successfully
          console.log('Supabase: Token refreshed successfully');
        } else if (event === 'SIGNED_OUT') {
          // Clear any application-level caches here if needed
          console.log('Supabase: User signed out');
        }
      });
    }
    */
  }
  return supabaseInstance
}

export const supabase: SupabaseClient = getSupabaseClient()

export interface ApiResponse<T> {
  data: T | null;
  error: PostgrestError | null;
}



// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      utilisateurs: {
        Row: User
        Insert: Omit<User, 'id' | 'date_creation'>
        Update: Partial<Omit<User, 'id'>>
      }
      clients: {
        Row: Client
        Insert: Omit<Client, 'id' | 'created_at'>
        Update: Partial<Omit<Client, 'id'>>
      }
      entreprises: {
        Row: Entreprise
        Insert: Omit<Entreprise, 'id' | 'created_at'>
        Update: Partial<Omit<Entreprise, 'id'>>
      }
      colis: {
        Row: Colis
        Insert: Omit<Colis, 'id' | 'date_creation'>
        Update: Partial<Omit<Colis, 'id'>>
      }
      statuts: {
        Row: Statut
        Insert: Omit<Statut, 'id' | 'created_at'>
        Update: Partial<Omit<Statut, 'id'>>
      }
      historique_colis: {
        Row: HistoriqueColis
        Insert: Omit<HistoriqueColis, 'id'>
        Update: Partial<Omit<HistoriqueColis, 'id'>>
      }
      notifications: {
        Row: Notification
        Insert: Omit<Notification, 'id' | 'date_creation'>
        Update: Partial<Omit<Notification, 'id'>>
      }
      bons: {
        Row: Bon
        Insert: Omit<Bon, 'id' | 'date_creation'>
        Update: Partial<Omit<Bon, 'id'>>
      }
    }
  }
}

// Auth helpers
export const auth = {
  signIn: async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  },

  signUp: async (email: string, password: string, userData: { nom: string; prenom: string; role: string }) => {
    try {
      // Validate email format before sending to Supabase
      const normalizedEmail = email.toLowerCase().trim();
      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

      if (!emailRegex.test(normalizedEmail)) {
        throw new Error(`Format d'email invalide: ${normalizedEmail}`);
      }

      // Validate password strength
      if (password.length < 6) {
        throw new Error('Le mot de passe doit contenir au moins 6 caractères');
      }

      // First, try to create the auth user
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          // Don't set emailRedirectTo to undefined, just omit it
          data: {
            nom: userData.nom,
            prenom: userData.prenom,
            role: userData.role
          }
        }
      })

      // If there's an auth error, try to handle it gracefully
      if (error) {
        console.error('Auth signup error:', error);

        // Handle specific error types - but don't throw, return the error instead
        // This allows the calling code to handle fallback gracefully
        if (error.message.includes('invalid') || error.message.includes('Invalid')) {
          return { data: null, error: new Error(`Email invalide: ${error.message}`) };
        }

        if (error.message.includes('already registered') || error.message.includes('already exists')) {
          return { data: null, error: new Error(`Un compte avec cet email existe déjà: ${normalizedEmail}`) };
        }

        if (error.message.includes('Password')) {
          return { data: null, error: new Error(`Erreur de mot de passe: ${error.message}`) };
        }

        // For any other auth error, return it instead of throwing
        return { data: null, error: new Error(`Erreur d'authentification: ${error.message}`) };
      }

      if (data.user) {
        // Create user profile in our utilisateurs table
        const { error: profileError } = await supabase
          .from('utilisateurs')
          .insert({
            auth_id: data.user.id,
            nom: userData.nom,
            prenom: userData.prenom,
            // Note: email is stored in auth.users table, not in utilisateurs table
            role: userData.role,
            statut: 'Actif',
            date_creation: new Date().toISOString(),
          })

        if (profileError) {
          console.error('Profile creation error:', profileError);
          return { data, error: profileError }
        }
      }

      return { data, error }
    } catch (err: any) {
      console.error('SignUp function error:', err);
      // Return the error instead of throwing it to allow fallback handling
      return { data: null, error: err }
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()

      // Clear any stored auth data from localStorage
      if (typeof window !== 'undefined') {
        try {
          // Remove from sessionStorage (per-tab) and localStorage as fallback
          if (window.sessionStorage) {
            window.sessionStorage.removeItem('supabase.auth.token')
            window.sessionStorage.removeItem('sb-' + supabaseUrl.split('//')[1].split('.')[0] + '-auth-token')
          }
        } catch (e) {
          // ignore
        }
        try {
          if (window.localStorage) {
            window.localStorage.removeItem('supabase.auth.token')
            window.localStorage.removeItem('sb-' + supabaseUrl.split('//')[1].split('.')[0] + '-auth-token')
          }
        } catch (e) {
          // ignore
        }
      }

      return { error }
    } catch (error: any) {
      return { error }
    }
  },

  getCurrentUser: async () => {
    try {
      const { data: { user }, error } = await supabase.auth.getUser()

      // Handle specific auth errors gracefully
      if (error) {
        // These errors are expected when no session exists
        if (error.message.includes('Auth session missing') ||
            error.message.includes('Invalid Refresh Token') ||
            error.message.includes('Refresh Token Not Found')) {
          return { user: null, error: null } // Treat as no user logged in
        }
        return { user, error }
      }

      return { user, error }
    } catch (error: any) {
      return { user: null, error: null }
    }
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
  },

  // Password reset functionality
  resetPassword: async (email: string) => {
    // Use environment variable for production, fallback to current origin
    const baseUrl = import.meta.env.VITE_APP_URL || window.location.origin;
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${baseUrl}/reset-password`,
    })
    return { data, error }
  },

  updatePassword: async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    return { data, error }
  },



  // Upload profile image
  uploadProfileImage: async (file: File, userId: string) => {
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}-${Date.now()}.${fileExt}`;
      const filePath = `profiles/${fileName}`;

      const { error } = await supabase.storage
        .from('profile-images')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        if (error.message.includes('Bucket not found')) {
          throw new Error('Le bucket de stockage n\'existe pas. Veuillez contacter l\'administrateur.');
        }
        if (error.message.includes('The resource already exists')) {
          throw new Error('Un fichier avec ce nom existe déjà. Veuillez réessayer.');
        }
        throw new Error(`Erreur lors de l'upload: ${error.message}`);
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('profile-images')
        .getPublicUrl(filePath);

      return { data: { path: filePath, url: publicUrl }, error: null };
    } catch (error: any) {
      return {
        data: null,
        error: error instanceof Error ? error : new Error('Erreur inconnue lors de l\'upload')
      };
    }
  },

  // Delete profile image
  deleteProfileImage: async (filePath: string) => {
    try {
      const { error } = await supabase.storage
        .from('profile-images')
        .remove([filePath]);

      return { error };
    } catch (error) {
      return { error };
    }
  },


  // Check if auth user exists using database function
  checkAuthUserExists: async (authId: string) => {
    try {
      const { data, error } = await supabase.rpc('check_auth_user_exists', {
        user_id: authId
      });

      if (error) {
        console.error('Error checking auth user:', error);
        return { exists: false, error };
      }

      return { exists: data === true, error: null };
    } catch (error) {
      console.error('Failed to check auth user existence:', error);
      return { exists: false, error: error as any };
    }
  },

  // Delete auth user using database function
  deleteAuthUser: async (authId: string) => {
    try {
      // First check if the auth user exists
      const { exists, error: checkError } = await auth.checkAuthUserExists(authId);

      if (checkError) {
        return { data: null, error: checkError };
      }

      if (!exists) {
        // Auth user doesn't exist, consider it already deleted
        return { data: { success: true, message: 'Auth user already deleted' }, error: null };
      }

      // Use the database function to delete auth user
      const { data, error } = await supabase.rpc('delete_auth_user', {
        user_id: authId
      });

      if (error) {
        console.error('Database function error:', error);
        return { data: null, error: {
          message: `Failed to delete auth user: ${error.message}`,
          code: 'DB_FUNCTION_ERROR'
        }};
      }

      // Check the result from the database function
      if (data === 'success' || data?.includes('success')) {
        return { data: { success: true, message: data }, error: null };
      } else {
        return { data: null, error: {
          message: `Auth user deletion failed: ${data}`,
          code: 'AUTH_DELETE_FAILED'
        }};
      }
    } catch (error) {
      console.error('Failed to call delete_auth_user function:', error);
      return { data: null, error: {
        message: 'Failed to call auth deletion function',
        code: 'FUNCTION_CALL_FAILED'
      }};
    }
  },

  // 1. CREATE: User + Auth
  createUserWithAuth: async (userData: {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    role: string;
    telephone?: string;
    adresse?: string;
    ville?: string;
    vehicule?: string;
    zone?: string;
    statut: string;
  }) => {
    try {
      const normalizedEmail = userData.email.toLowerCase().trim();

      // Create auth user directly - let Supabase handle duplicate detection

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: userData.password
      });

      if (authError || !authData.user) {
        if (authError?.message.includes('already registered')) {
          return {
            data: null,
            error: new Error(`Un utilisateur avec l'email "${normalizedEmail}" existe déjà.`),
            authCreated: false
          };
        }
        throw authError;
      }

      // Create profile
      const { data, error } = await supabase
        .from('utilisateurs')
        .insert({
          auth_id: authData.user.id,
          nom: userData.nom,
          prenom: userData.prenom,
          role: userData.role,
          statut: userData.statut,
          telephone: userData.telephone || null,
          adresse: userData.adresse || null,
          ville: userData.ville || null,
          vehicule: userData.vehicule || null,
          zone: userData.zone || null,
          date_creation: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      return { data, error: null, authCreated: true };

    } catch (err: any) {
      return { data: null, error: err, authCreated: false };
    }
  },

  // 2. UPDATE: User + Auth
  updateUserWithAuth: async (userId: string, updates: {
    nom?: string;
    prenom?: string;
    email?: string;
    password?: string;
    telephone?: string;
    adresse?: string;
    ville?: string;
    vehicule?: string;
    zone?: string;
    statut?: string;
  }) => {
    try {
      // Get user to find auth_id
      const { data: user } = await api.getUserById(userId);
      if (!user) throw new Error('Utilisateur non trouvé');

      // Update profile
      const profileUpdates = { ...updates };
      delete profileUpdates.email;
      delete profileUpdates.password;

      const { data, error } = await api.updateUserById(userId, profileUpdates);
      if (error) throw error;

      // Update email if provided
      if (updates.email && user.auth_id) {
        await api.updateUserEmail(user.auth_id, updates.email);
      }

      // Update password if provided
      if (updates.password && user.auth_id) {
        await api.updateUserPassword(user.auth_id, updates.password);
      }

      return { data, error: null };
    } catch (err: any) {
      return { data: null, error: err };
    }
  },

  // 3. DELETE: User + Auth
  deleteUserWithAuth: async (userId: string) => {
    try {
      // Get user to find auth_id
      const { data: user } = await api.getUserById(userId);
      if (!user) throw new Error('Utilisateur non trouvé');

      // Delete auth user if exists
      if (user.auth_id) {
        try {
          // Try multiple approaches to delete auth user

          // Method 1: Try RPC function
          const { error: rpcError } = await supabase.rpc('delete_auth_user', {
            user_id: user.auth_id
          });

          if (rpcError) {
            console.warn('RPC delete_auth_user failed:', rpcError);

            // Method 2: Try simple RPC function
            const { error: simpleRpcError } = await supabase.rpc('delete_auth_user_simple', {
              auth_user_id: user.auth_id
            });

            if (simpleRpcError) {
              console.warn('Simple RPC delete failed:', simpleRpcError);

              // Method 3: Try admin delete (might not work due to permissions)
              try {
                const { error: adminError } = await supabase.auth.admin.deleteUser(user.auth_id);
                if (adminError) {
                  console.warn('Admin delete failed:', adminError);
                }
              } catch (adminErr) {
                console.warn('Admin delete not available:', adminErr);
              }
            }
          }
        } catch (deleteError) {
          console.warn('Auth user deletion failed:', deleteError);
          // Continue with profile deletion even if auth deletion fails
        }
      }

      // Delete profile
      const { error } = await supabase
        .from('utilisateurs')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      return { error: null };
    } catch (err: any) {
      return { error: err };
    }
  },

  // ADMIN VERSION: Create user without affecting current session
  createUserWithAuthAdmin: async (userData: {
    nom: string;
    prenom: string;
    email: string;
    password: string;
    role: string;
    telephone?: string;
    adresse?: string;
    ville?: string;
    vehicule?: string;
    zone?: string;
    statut: string;
  }) => {
    try {
      const normalizedEmail = userData.email.toLowerCase().trim();

      // Try to create auth user via RPC function first (cleanest approach)
      try {
        const { data: rpcResult, error: rpcError } = await supabase.rpc('create_auth_user_admin', {
          user_email: normalizedEmail,
          user_password: userData.password,
          user_metadata: {
            nom: userData.nom,
            prenom: userData.prenom,
            role: userData.role
          }
        });

        if (!rpcError && rpcResult?.id) {
          // RPC success - create profile
          const { data, error } = await supabase
            .from('utilisateurs')
            .insert({
              auth_id: rpcResult.id,
              nom: userData.nom,
              prenom: userData.prenom,
              role: userData.role,
              statut: userData.statut,
              telephone: userData.telephone || null,
              adresse: userData.adresse || null,
              ville: userData.ville || null,
              vehicule: userData.vehicule || null,
              zone: userData.zone || null,
              date_creation: new Date().toISOString(),
            })
            .select()
            .single();

          if (error) throw error;
          return { data, error: null, authCreated: true };
        }
      } catch (rpcError) {
        console.warn('RPC function failed, using fallback method');
      }

      // Fallback: Use separate client (current working method)
      const { createClient } = await import('@supabase/supabase-js');
      const adminClient = createClient(
        import.meta.env.VITE_SUPABASE_URL,
        import.meta.env.VITE_SUPABASE_ANON_KEY
      );

      const { data: authData, error: authError } = await adminClient.auth.signUp({
        email: normalizedEmail,
        password: userData.password
      });

      if (authError) {
        if (authError.message.includes('already registered')) {
          return {
            data: null,
            error: new Error(`Un utilisateur avec l'email "${normalizedEmail}" existe déjà.`),
            authCreated: false
          };
        }
        throw authError;
      }

      await adminClient.auth.signOut();

      const { data, error } = await supabase
        .from('utilisateurs')
        .insert({
          auth_id: authData.user?.id,
          nom: userData.nom,
          prenom: userData.prenom,
          role: userData.role,
          statut: userData.statut,
          telephone: userData.telephone || null,
          adresse: userData.adresse || null,
          ville: userData.ville || null,
          vehicule: userData.vehicule || null,
          zone: userData.zone || null,
          date_creation: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;
      return { data, error: null, authCreated: true };

    } catch (err: any) {
      return { data: null, error: err, authCreated: false };
    }
  }
}

// Data fetching helpers
export const api = {
  // Users
  getUsers: async () => {
    try {
      // Try to get users with emails using RPC function
      const { data: usersWithEmails, error: rpcError } = await supabase.rpc('get_all_users_with_email');

      if (!rpcError && usersWithEmails) {
        return { data: usersWithEmails, error: null };
      }

      // Fallback: Get users without emails and try to add emails individually
      console.warn('RPC function failed, using fallback method');
      const { data: users, error: usersError } = await supabase
        .from('utilisateurs')
        .select('*')
        .order('date_creation', { ascending: false });

      if (usersError) {
        return { data: null, error: usersError };
      }

      // Try to add emails for users that have auth_id
      const usersWithEmailsAdded = await Promise.all(
        users.map(async (user) => {
          if (user.auth_id) {
            try {
              const { data: userWithEmail } = await supabase.rpc('get_user_with_email', {
                user_id: user.id
              });
              if (userWithEmail?.email) {
                return { ...user, email: userWithEmail.email };
              }
            } catch (e) {
              // Ignore individual errors
            }
          }
          return { ...user, email: '' }; // No email available
        })
      );

      return { data: usersWithEmailsAdded, error: null };
    } catch (error) {
      // Final fallback: basic query without emails
      const { data, error: basicError } = await supabase
        .from('utilisateurs')
        .select('*')
        .order('date_creation', { ascending: false });

      return { data, error: basicError };
    }
  },

  getUserById: async (id: string) => {
    try {
      // Use the RPC function that joins with auth.users
      const { data: userWithEmail, error: rpcError } = await supabase.rpc('get_user_with_email', {
        user_id: id
      });

      if (!rpcError && userWithEmail) {
        return {
          data: userWithEmail,
          error: null
        };
      }

      // Fallback: basic query without email
      const { data: userData, error: userError } = await supabase
        .from('utilisateurs')
        .select('*')
        .eq('id', id)
        .single();

      return { data: userData, error: userError };

    } catch (error) {
      console.warn('Error in getUserById:', error);
      // Final fallback to basic query
      const { data, error: basicError } = await supabase
        .from('utilisateurs')
        .select('*')
        .eq('id', id)
        .single()
      return { data, error: basicError }
    }
  },

  getUserByAuthId: async (authId: string) => {
    try {
      // Find user by auth_id (correct relationship)
      const { data: userData, error: userError } = await supabase
        .from('utilisateurs')
        .select('*')
        .eq('auth_id', authId)
        .single();

      if (userError) {
        return { data: null, error: userError };
      }

      return { data: userData, error: null };

    } catch (err) {
      return { data: null, error: err as any }
    }
  },

  getUserByEmail: async (email: string) => {
    try {
      // Get the current authenticated user
      const { data: authUser, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser.user) {
        return { data: null, error: authError };
      }

      const authUserId = authUser.user.id;

      // Find user by auth_id (correct relationship)
      const { data: userData, error: userError } = await supabase
        .from('utilisateurs')
        .select('*')
        .eq('auth_id', authUserId)
        .single();

      if (!userError && userData) {
        const userWithEmail = {
          ...userData,
          email: email
        };
        return { data: userWithEmail, error: null };
      }

      return { data: null, error: { message: 'User profile not found in database' } };

    } catch (err) {
      return { data: null, error: err as any }
    }
  },

  // Colis with pagination and filtering
  getColis: async (options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    livreurId?: string;
    sortBy?: 'recent' | 'oldest' | 'status';
    dateFilter?: string;
  } = {}) => {

    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      livreurId = '',
      sortBy = 'recent',
      dateFilter = ''
    } = options;

    let query = supabase
      .from('colis')
      .select(`
        *,
        client:clients(id, nom, telephone, email),
        entreprise:entreprises(id, nom, telephone, email),
        livreur:utilisateurs(id, nom, prenom, telephone)
      `, { count: 'exact' });

        // Apply search filter - comprehensive search across multiple fields
      if (search) {
        // First, get client IDs that match the search term
        const { data: matchingClients } = await supabase
          .from('clients')
          .select('id')
          .ilike('nom', `%${search}%`);

        // Get entreprise IDs that match the search term
        const { data: matchingEntreprises } = await supabase
          .from('entreprises')
          .select('id')
          .ilike('nom', `%${search}%`);

        const clientIds = matchingClients?.map(c => c.id) || [];
        const entrepriseIds = matchingEntreprises?.map(e => e.id) || [];

        // Build OR conditions for search
        const searchConditions = [`id.ilike.%${search}%`];

        if (clientIds.length > 0) {
          searchConditions.push(`client_id.in.(${clientIds.join(',')})`);
        }

        if (entrepriseIds.length > 0) {
          searchConditions.push(`entreprise_id.in.(${entrepriseIds.join(',')})`);
        }

        query = query.or(searchConditions.join(','));
      }

      // Apply status filter
      if (status && status !== 'all') {
        query = query.eq('statut', status);
      }

      // Apply date filter
      if (dateFilter && dateFilter !== 'toutes') {
        const now = new Date();
        let startDate: Date;
        let endDate: Date = now;

        switch (dateFilter) {
          case 'aujourd_hui':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case 'hier':
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
          case '7_derniers_jours':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30_derniers_jours':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case 'ce_mois':
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
            break;
          case 'le_mois_dernier':
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0);
            break;
          default:
            startDate = new Date(0); // No filter
        }

        if (startDate) {
          query = query.gte('date_creation', startDate.toISOString());
          if (endDate && dateFilter !== 'aujourd_hui' && dateFilter !== '7_derniers_jours' && dateFilter !== '30_derniers_jours' && dateFilter !== 'ce_mois') {
            query = query.lte('date_creation', endDate.toISOString());
          }
        }
      }

      // Apply livreur filter
      if (livreurId && livreurId !== 'all') {
        if (livreurId === 'unassigned') {
          query = query.is('livreur_id', null);
        } else {
          query = query.eq('livreur_id', livreurId);
        }
      }

      // Apply sorting
      switch (sortBy) {
        case 'oldest':
          query = query.order('date_creation', { ascending: true });
          break;
        case 'status':
          query = query.order('statut', { ascending: true }).order('date_creation', { ascending: false });
          break;
        case 'recent':
        default:
          query = query.order('date_creation', { ascending: false });
          break;
      }

      // Apply pagination
      const from = (page - 1) * limit;
      const to = from + limit - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      return {
        data,
        error,
        count,
        totalPages: count ? Math.ceil(count / limit) : 0,
        currentPage: page,
        hasNextPage: count ? (page * limit) < count : false,
        hasPrevPage: page > 1
      };
  },

  // Original getColis for backward compatibility
  getAllColis: async () => {
    const { data, error } = await supabase
      .from('colis')
      .select(`
        *,
        client:clients(*),
        entreprise:entreprises(*),
        livreur:utilisateurs(*)
      `)
      .order('date_creation', { ascending: false })
    return { data, error }
  },

  getColisById: async (id: string) => {
    const { data, error } = await supabase
      .from('colis')
      .select(`
        *,
        client:clients(*),
        entreprise:entreprises(*),
        livreur:utilisateurs(*)
      `)
      .eq('id', id)
      .single()
    return { data, error }
  },

  getColisByStatus: async (status: string) => {
    const { data, error } = await supabase
      .from('colis')
      .select(`
        *,
        client:clients(*),
        entreprise:entreprises(*),
        livreur:utilisateurs(*)
      `)
      .eq('statut', status)
      .order('date_creation', { ascending: false })
    return { data, error }
  },

  getColisByClientId: async (clientId: string) => {
    const { data, error } = await supabase
      .from('colis')
      .select(`
        *,
        client:clients(*),
        entreprise:entreprises(*),
        livreur:utilisateurs(*)
      `)
      .eq('client_id', clientId)
      .order('date_creation', { ascending: false })
    return { data, error }
  },

  getColisByEntrepriseId: async (entrepriseId: string) => {
    const { data, error } = await supabase
      .from('colis')
      .select(`
        *,
        client:clients(*),
        entreprise:entreprises(*),
        livreur:utilisateurs(*)
      `)
      .eq('entreprise_id', entrepriseId)
      .order('date_creation', { ascending: false })
    return { data, error }
  },

  // Clients
  getClients: async () => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Entreprises
  getEntreprises: async () => {
    const { data, error } = await supabase
      .from('entreprises')
      .select('*')
      .order('created_at', { ascending: false })
    return { data, error }
  },

  // Livreurs for filters
  getLivreurs: async () => {
    const { data, error } = await supabase
      .from('utilisateurs')
      .select('id, nom, prenom, statut, role, auth_id')
      .eq('role', 'Livreur') // Use exact match with correct capitalization
      .order('nom', { ascending: true })

    // For now, return without emails until RPC function is created
    // TODO: Uncomment when RPC function is created
    /*
    if (data && !error) {
      const livreursWithEmails = await Promise.all(
        data.map(async (livreur) => {
          if (livreur.auth_id) {
            try {
              const { data: emailData } = await supabase
                .rpc('get_user_email_by_auth_id', { auth_user_id: livreur.auth_id })

              if (emailData) {
                return { ...livreur, email: emailData }
              }
            } catch (rpcError) {
              // RPC not available, continue without email
            }
          }
          return livreur
        })
      )
      return { data: livreursWithEmails as Pick<User, 'id' | 'nom' | 'prenom' | 'statut' | 'email'>[], error }
    }
    */

    return { data: data as Pick<User, 'id' | 'nom' | 'prenom' | 'statut'>[], error }
  },

  // Statuts for filters
  getStatuts: async (type?: string) => {
    let query = supabase
      .from('statuts')
      .select('id, nom, type, couleur, ordre, actif')
      .eq('actif', true)
      .order('ordre', { ascending: true })

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query
    return { data, error }
  },

  // Get all statuts (including inactive ones) for management
  getAllStatuts: async (type?: string) => {
    let query = supabase
      .from('statuts')
      .select('*')
      .order('ordre', { ascending: true })

    if (type) {
      query = query.eq('type', type)
    }

    const { data, error } = await query
    return { data, error }
  },

  // CRUD operations for Statuts
  createStatut: async (statut: Omit<Statut, 'id' | 'created_at'>) => {
    const { data, error } = await supabase
      .from('statuts')
      .insert(statut)
      .select()
      .single()
    return { data, error }
  },

  updateStatut: async (id: string, updates: Partial<Omit<Statut, 'id'>>) => {
    const { data, error } = await supabase
      .from('statuts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  deleteStatut: async (id: string) => {
    const { data, error } = await supabase
      .from('statuts')
      .delete()
      .eq('id', id)
    return { data, error }
  },

  getStatutById: async (id: string) => {
    const { data, error } = await supabase
      .from('statuts')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },

  // Get colis counts by status for a specific livreur
  getColisCountsByStatus: async (livreurId: string, statuses: string[]) => {
    const { data, error } = await supabase
      .from('colis')
      .select('statut')
      .eq('livreur_id', livreurId)
      .in('statut', statuses);

    if (error) return { data: null, error };

    const counts: Record<string, number> = {};
    statuses.forEach(status => {
      counts[status] = data?.filter(c => c.statut === status).length || 0;
    });

    return { data: counts, error: null };
  },

  // Dashboard stats
  getDashboardStats: async () => {
    try {
      const [colisResult, livreursResult, clientsResult, entreprisesResult] = await Promise.all([
        supabase.from('colis').select('statut'),
        supabase.from('utilisateurs').select('role, statut').eq('role', 'Livreur'),
        supabase.from('clients').select('id'),
        supabase.from('entreprises').select('id')
      ]);

      const colis = colisResult.data || [];
      const livreurs = livreursResult.data || [];
      const clients = clientsResult.data || [];
      const entreprises = entreprisesResult.data || [];

      // Count colis by status
      const enAttente = colis.filter(c =>
        c.statut === 'en_attente' ||
        c.statut === 'En attente' ||
        c.statut === 'nouveau'
      ).length;

      const livres = colis.filter(c =>
        c.statut === 'Livré' ||
        c.statut === 'livré'
      ).length;

      const retournes = colis.filter(c =>
        c.statut === 'Retourné' ||
        c.statut === 'retourné' ||
        c.statut === 'retour'
      ).length;

      // En traitement = all colis EXCEPT En attente, Livrés, and Retournés
      const enTraitement = colis.filter(c => {
        const statut = c.statut?.toLowerCase() || '';
        return !(
          statut === 'en_attente' ||
          statut === 'en attente' ||
          statut === 'nouveau' ||
          statut === 'livré' ||
          statut === 'retourné' ||
          statut === 'retour'
        );
      }).length;

      const livreursActifs = livreurs.filter(l =>
        l.statut === 'Actif' ||
        l.statut === 'actif'
      ).length;

      const stats = {
        totalColis: colis.length,
        enAttente,
        enTraitement,
        livres,
        retournes,
        clientsEnregistres: clients.length,
        entreprisesPartenaires: entreprises.length,
        livreursActifs
      };

      return { data: stats, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Recent colis for dashboard
  getRecentColis: async (limit: number = 5) => {
    const { data, error } = await supabase
      .from('colis')
      .select(`
        *,
        client:clients(nom),
        entreprise:entreprises(nom)
      `)
      .order('date_creation', { ascending: false })
      .limit(limit)
    return { data, error }
  },

  // Global search functionality
  globalSearch: async (query: string, limit: number = 10) => {
    if (!query || query.trim().length < 2) {
      return {
        clients: [],
        colis: [],
        entreprises: [],
        livreurs: [],
        error: null
      };
    }

    const searchTerm = query.trim();

    try {
      // Search clients with OR query
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, nom, email, telephone, adresse')
        .or(`nom.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,telephone.ilike.%${searchTerm}%`)
        .limit(limit);

      // Search colis by ID
      const { data: colisByID, error: colisIDError } = await supabase
        .from('colis')
        .select(`
          id,
          statut,
          prix,
          client:clients(nom),
          entreprise:entreprises(nom)
        `)
        .ilike('id', `%${searchTerm}%`)
        .limit(limit);

      const colis = colisByID;

      // Search entreprises with OR query
      const { data: entreprises, error: entreprisesError } = await supabase
        .from('entreprises')
        .select('id, nom, contact, telephone, email, adresse')
        .or(`nom.ilike.%${searchTerm}%,contact.ilike.%${searchTerm}%,telephone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(limit);

      // Search livreurs (delivery drivers) with OR query
      const { data: livreurs, error: livreursError } = await supabase
        .from('utilisateurs')
        .select('id, nom, prenom, telephone, role, statut, date_creation')
        .eq('role', 'Livreur')
        .or(`nom.ilike.%${searchTerm}%,prenom.ilike.%${searchTerm}%,telephone.ilike.%${searchTerm}%`)
        .limit(limit);

      return {
        clients: clients || [],
        colis: colis || [],
        entreprises: entreprises || [],
        livreurs: livreurs || [],
        error: clientsError || colisIDError || entreprisesError || livreursError
      };
    } catch (error) {
      return {
        clients: [],
        colis: [],
        entreprises: [],
        livreurs: [],
        error: error as PostgrestError
      };
    }
  },

  // Livreur-specific global search - only shows data related to the livreur
  livreurGlobalSearch: async (query: string, livreurId: string, limit: number = 10) => {
    if (!query || query.trim().length < 2 || !livreurId) {
      return {
        clients: [],
        colis: [],
        entreprises: [],
        livreurs: [],
        error: null
      };
    }

    const searchTerm = query.trim();

    try {
      // First, get all colis assigned to this livreur
      const { data: livreurColis, error: livreurColisError } = await supabase
        .from('colis')
        .select(`
          id,
          statut,
          prix,
          client_id,
          entreprise_id,
          client:clients(id, nom, email, telephone, adresse),
          entreprise:entreprises(id, nom, contact, telephone, email, adresse)
        `)
        .eq('livreur_id', livreurId);

      if (livreurColisError) {
        throw livreurColisError;
      }

      // Extract unique client and entreprise IDs from livreur's colis
      const clientIds = [...new Set(livreurColis?.map(c => c.client_id).filter(Boolean) || [])];
      const entrepriseIds = [...new Set(livreurColis?.map(c => c.entreprise_id).filter(Boolean) || [])];

      // Search colis by ID (only livreur's colis)
      const colisByID = livreurColis?.filter(colis =>
        colis.id.toLowerCase().includes(searchTerm.toLowerCase())
      ).slice(0, limit) || [];

      // Search clients (only clients related to livreur's colis)
      let clients = [];
      if (clientIds.length > 0) {
        const { data: clientsData, error: clientsError } = await supabase
          .from('clients')
          .select('id, nom, email, telephone, adresse')
          .in('id', clientIds)
          .or(`nom.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,telephone.ilike.%${searchTerm}%`)
          .limit(limit);

        if (!clientsError) {
          clients = clientsData || [];
        }
      }

      // Search entreprises (only entreprises related to livreur's colis)
      let entreprises = [];
      if (entrepriseIds.length > 0) {
        const { data: entreprisesData, error: entreprisesError } = await supabase
          .from('entreprises')
          .select('id, nom, contact, telephone, email, adresse')
          .in('id', entrepriseIds)
          .or(`nom.ilike.%${searchTerm}%,contact.ilike.%${searchTerm}%,telephone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
          .limit(limit);

        if (!entreprisesError) {
          entreprises = entreprisesData || [];
        }
      }

      return {
        clients: clients,
        colis: colisByID,
        entreprises: entreprises,
        livreurs: [], // Livreurs don't need to search for other livreurs
        error: null
      };
    } catch (error) {
      console.error('Livreur global search error:', error);
      return {
        clients: [],
        colis: [],
        entreprises: [],
        livreurs: [],
        error: error
      };
    }
  },

  // CRUD operations for Colis
  createColis: async (colis: Omit<Colis, 'id' | 'date_creation'>) => {
    const { data, error } = await supabase
      .from('colis')
      .insert(colis)
      .select()
      .single()
    return { data, error }
  },

  updateColis: async (id: string, updates: Partial<Omit<Colis, 'id'>>) => {
    const { data, error } = await supabase
      .from('colis')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  deleteColis: async (id: string) => {
    const { data, error } = await supabase
      .from('colis')
      .delete()
      .eq('id', id)
    return { data, error }
  },

  // Get recent activity for dashboard
  getRecentActivity: async (limit: number = 5) => {
    try {
      // Use the same pattern as other working queries
      const { data, error } = await supabase
        .from('colis')
        .select(`
          *,
          client:clients(nom),
          livreur:utilisateurs(nom, prenom)
        `)
        .order('date_mise_a_jour', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('getRecentActivity error:', error);
        return { data: null, error };
      }

      const activities = data?.map(colis => {
        const client = Array.isArray(colis.client) ? colis.client[0] : colis.client;
        const livreur = Array.isArray(colis.livreur) ? colis.livreur[0] : colis.livreur;

        return {
          id: colis.id,
          numero_suivi: colis.id, // Use ID as tracking number
          statut: colis.statut,
          date_mise_a_jour: colis.date_mise_a_jour,
          client_nom: client ? client.nom || 'Client inconnu' : 'Client inconnu',
          livreur_nom: livreur ? `${livreur.prenom || ''} ${livreur.nom || ''}`.trim() : 'Non assigné'
        };
      }) || [];

      return { data: activities, error: null };
    } catch (error) {
      return { data: null, error };
    }
  },

  // CRUD operations for Clients
  createClient: async (client: Omit<Client, 'created_at'>) => {
    const { data, error } = await supabase
      .from('clients')
      .insert(client)
      .select()
      .single()
    return { data, error }
  },

  updateClient: async (id: string, updates: Partial<Omit<Client, 'id'>>) => {
    const { data, error } = await supabase
      .from('clients')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  deleteClient: async (id: string) => {
    const { data, error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id)
    return { data, error }
  },

  getClientById: async (id: string) => {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },

  // CRUD operations for Entreprises
  createEntreprise: async (entreprise: Omit<Entreprise, 'created_at'>) => {
    const { data, error } = await supabase
      .from('entreprises')
      .insert(entreprise)
      .select()
      .single()
    return { data, error }
  },

  updateEntreprise: async (id: string, updates: Partial<Omit<Entreprise, 'id'>>) => {
    const { data, error } = await supabase
      .from('entreprises')
      .update(updates)
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  deleteEntreprise: async (id: string) => {
    const { data, error } = await supabase
      .from('entreprises')
      .delete()
      .eq('id', id)
    return { data, error }
  },

  getEntrepriseById: async (id: string) => {
    const { data, error } = await supabase
      .from('entreprises')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
  },

  // CRUD operations for Users/Livreurs
  createUser: async (user: Omit<User, 'id' | 'date_creation'>) => {
    const { data, error } = await supabase
      .from('utilisateurs')
      .insert(user)
      .select()
      .single()
    return { data, error }
  },

  updateUser: async (id: string, updates: Partial<Omit<User, 'id'>>) => {
    const { data, error } = await supabase
      .from('utilisateurs')
      .update(updates)
      .eq('auth_id', id)
      .select()
      .single()
    return { data, error }
  },

  updateUserById: async (id: string, updates: Partial<Omit<User, 'id'>>) => {
    const { data, error } = await supabase
      .from('utilisateurs')
      .update(updates)
      .eq('id', id)  // Use utilisateurs.id instead of auth_id
      .select()
      .single()
    return { data, error }
  },

  // Update user profile with image
  updateUserProfile: async (userId: string, profileData: Partial<User>) => {
    const { data, error } = await supabase
      .from('utilisateurs')
      .update({
        ...profileData,
        date_modification: new Date().toISOString()
      })
      .eq('id', userId)
      .select()
      .single();

    return { data, error };
  },

  updateUserEmail: async (authId: string, newEmail: string) => {
    try {
      // Use the database function to update email in auth.users
      const { data, error } = await supabase.rpc('update_user_email_admin', {
        user_auth_id: authId,
        new_email: newEmail
      });

      if (error) {
        console.warn('Email update failed:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.warn('Failed to call update_user_email_admin:', error);
      return { data: null, error: error as any };
    }
  },

  updateUserPassword: async (authId: string, newPassword: string) => {
    try {
      // Use the database function to update password in auth.users
      const { data, error } = await supabase.rpc('update_user_password_admin', {
        user_auth_id: authId,
        new_password: newPassword
      });

      if (error) {
        console.warn('Password update failed:', error);
        return { data: null, error };
      }

      return { data, error: null };
    } catch (error) {
      console.warn('Failed to call update_user_password_admin:', error);
      return { data: null, error: error as any };
    }
  },

  deleteUser: async (id: string) => {
    try {
      // First, get the user to find their auth_id
      const { data: user, error: getUserError } = await supabase
        .from('utilisateurs')
        .select('auth_id, nom, prenom')
        .eq('id', id)
        .single();

      if (getUserError) {
        return { data: null, error: getUserError };
      }

      // Delete from utilisateurs table first
      const { error: deleteProfileError } = await supabase
        .from('utilisateurs')
        .delete()
        .eq('id', id);

      if (deleteProfileError) {
        return { data: null, error: deleteProfileError };
      }

      let authDeletionStatus = 'no_auth'; // User had no auth account

      // If user has auth_id, attempt to delete from auth.users as well
      if (user?.auth_id) {
        const { data: authData, error: deleteAuthError } = await auth.deleteAuthUser(user.auth_id);

        if (deleteAuthError) {
          console.warn('Failed to delete auth user:', deleteAuthError);
          authDeletionStatus = 'auth_failed'; // Auth deletion failed
        } else if (authData?.success) {
          authDeletionStatus = 'auth_success'; // Auth deletion succeeded
        } else {
          authDeletionStatus = 'auth_failed'; // Auth deletion failed
        }
      }

      return {
        data: {
          authDeletionStatus,
          deletedUser: user
        },
        error: null
      };
    } catch (error) {
      return { data: null, error: error as any };
    }
  },

  // Notifications
  getNotifications: async (userId: string) => {
    try {
      let query = supabase
        .from('notifications')
        .select('*');

      // All users (including admin/gestionnaire) should only see their own notifications
      query = query.eq('user_id', userId);

      const { data, error } = await query.order('created_at', { ascending: false });

      // Transform the data to match our interface
      const transformedData = data?.map(notification => ({
        id: notification.id,
        utilisateur_id: notification.user_id,
        titre: notification.title,
        message: notification.message,
        lu: notification.is_read,
        date_creation: notification.created_at,
        type: notification.type
      }));

      return { data: transformedData, error };
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return { data: null, error };
    }
  },

  createNotification: async (notification: Omit<Notification, 'id' | 'date_creation'>) => {
    try {
      // Transform the notification to match database schema
      const dbNotification = {
        user_id: notification.utilisateur_id,  // Transform to database column name
        title: notification.titre,             // Transform to database column name
        message: notification.message,         // Same
        is_read: notification.lu,              // Transform to database column name
        type: notification.type,               // Same
        created_at: new Date().toISOString()   // Transform to database column name
      };

      const { data, error } = await supabase
        .from('notifications')
        .insert([dbNotification])
        .select()
        .single();

      if (error) {
        return { data: null, error };
      }

      // Transform the returned data back to our interface
      const transformedData = data ? {
        id: data.id,
        utilisateur_id: data.user_id,
        titre: data.title,
        message: data.message,
        lu: data.is_read,
        date_creation: data.created_at,
        type: data.type
      } : null;

      return { data: transformedData, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  markNotificationAsRead: async (notificationId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })  // Changed from 'lu' to 'is_read'
        .eq('id', notificationId)
        .select()
        .single();

      // Transform the returned data back to our interface
      const transformedData = data ? {
        id: data.id,
        utilisateur_id: data.user_id,
        titre: data.title,
        message: data.message,
        lu: data.is_read,
        date_creation: data.created_at,
        type: data.type
      } : null;

      return { data: transformedData, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  markAllNotificationsAsRead: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .update({ is_read: true })  // Changed from 'lu' to 'is_read'
        .eq('user_id', userId)      // Changed from 'utilisateur_id' to 'user_id'
        .eq('is_read', false);      // Changed from 'lu' to 'is_read'

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  deleteNotification: async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      return { error };
    } catch (error) {
      return { error };
    }
  },

  // Get all users
  getAllUsers: async () => {
    try {
      const { data, error } = await supabase
        .from('utilisateurs')
        .select('id, nom, prenom, role, statut, email')
        .limit(10);

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get admin and gestionnaire users for notifications
  getAdminAndGestionnaireUsers: async () => {
    try {
      const { data, error } = await supabase
        .from('utilisateurs')
        .select('id, nom, prenom, role, statut')
        .in('role', ['Admin', 'Gestionnaire'])
        .eq('statut', 'Actif');

      // If no active admin users found, try without the statut filter
      if (!error && (!data || data.length === 0)) {
        const { data: dataNoStatus, error: errorNoStatus } = await supabase
          .from('utilisateurs')
          .select('id, nom, prenom, role, statut')
          .in('role', ['Admin', 'Gestionnaire']);

        // Remove duplicates based on user ID
        const uniqueUsers = dataNoStatus ? dataNoStatus.filter((user, index, self) =>
          index === self.findIndex(u => u.id === user.id)
        ) : [];

        return { data: uniqueUsers, error: errorNoStatus };
      }

      // Remove duplicates based on user ID
      const uniqueUsers = data ? data.filter((user, index, self) =>
        index === self.findIndex(u => u.id === user.id)
      ) : [];

      return { data: uniqueUsers, error };
    } catch (error) {
      console.error('Error fetching admin/gestionnaire users:', error);
      return { data: null, error };
    }
  },

  // Check bons table structure
  checkBonsTable: async () => {
    const { data, error } = await supabase
      .from('bons')
      .select('*')
      .limit(1);

    return { data, error };
  },

  // Bons API
  getBons: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    type?: 'distribution' | 'paiement' | 'retour';
    userId?: string;
    statut?: string;
    sortBy?: 'recent' | 'oldest';
  }) => {
    const {
      page = 1,
      limit = 10,
      search = '',
      type,
      userId,
      statut,
      sortBy = 'recent'
    } = params || {};

    // Query with basic fields first, then try to join if possible
    let query = supabase
      .from('bons')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(`id.ilike.%${search}%,notes.ilike.%${search}%,motif.ilike.%${search}%`);
    }

    // Only filter by type if the column exists (after migration)
    if (type) {
      try {
        query = query.eq('type', type);
      } catch (error) {
        console.log('Type column might not exist yet, skipping type filter');
      }
    }

    if (userId) {
      try {
        // Try user_id first (after migration), fallback to livreur_id (before migration)
        query = query.eq('user_id', userId);
      } catch (error) {
        try {
          query = query.eq('livreur_id', userId);
        } catch (error2) {
          console.log('Neither user_id nor livreur_id column found');
        }
      }
    }

    if (statut) {
      query = query.eq('statut', statut);
    }

    // Apply sorting
    const sortOrder = sortBy === 'recent' ? { ascending: false } : { ascending: true };
    query = query.order('date_creation', sortOrder);

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    const totalPages = count ? Math.ceil(count / limit) : 0;
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return {
      data,
      error,
      count,
      totalPages,
      hasNextPage,
      hasPrevPage
    };
  },

  getBonById: async (id: string) => {
    const { data, error } = await supabase
      .from('bons')
      .select(`
        *,
        user:utilisateurs(id, nom, prenom, email),
        client:clients(id, nom, email, telephone),
        colis:colis(id, client:clients(nom))
      `)
      .eq('id', id)
      .single();

    return { data, error };
  },

  createBon: async (bonData: {
    user_id: string;
    type: 'distribution' | 'paiement' | 'retour';
    statut: string;
    nb_colis?: number;
    client_id?: string;
    montant?: number;
    date_echeance?: string;
    colis_id?: string;
    motif?: string;
    notes?: string;
  }) => {
    const { data, error } = await supabase
      .from('bons')
      .insert([bonData])
      .select(`
        *,
        user:utilisateurs(id, nom, prenom, email),
        client:clients(id, nom, email, telephone),
        colis:colis(id, client:clients(nom))
      `)
      .single();

    return { data, error };
  },

  updateBon: async (id: string, updates: {
    statut?: string;
    nb_colis?: number;
    montant?: number;
    date_echeance?: string;
    motif?: string;
    notes?: string;
  }) => {
    const { data, error } = await supabase
      .from('bons')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        user:utilisateurs(id, nom, prenom, email),
        client:clients(id, nom, email, telephone),
        colis:colis(id, client:clients(nom))
      `)
      .single();

    return { data, error };
  },

  deleteBon: async (id: string) => {
    const { data, error } = await supabase
      .from('bons')
      .delete()
      .eq('id', id)
      .select()
      .single();

    return { data, error };
  },

  // Get bon statistics for admin (all bons)
  getBonStats: async () => {
    try {
      const { data: bons, error } = await supabase
        .from('bons')
        .select('type, statut');

      if (error) {
        return { data: null, error };
      }

      // Count bons by type and status
      const distributionStats = {
        total: 0,
        enCours: 0,
        complete: 0,
        annule: 0
      };

      const paiementStats = {
        total: 0,
        enCours: 0,
        complete: 0,
        annule: 0
      };

      const retourStats = {
        total: 0,
        enCours: 0,
        complete: 0,
        annule: 0
      };

      bons?.forEach(bon => {
        const statut = bon.statut.toLowerCase();

        if (bon.type === 'distribution') {
          distributionStats.total++;
          if (statut === 'en cours') distributionStats.enCours++;
          else if (statut === 'complété' || statut === 'complete') distributionStats.complete++;
          else if (statut === 'annulé' || statut === 'annule') distributionStats.annule++;
        } else if (bon.type === 'paiement') {
          paiementStats.total++;
          if (statut === 'en cours') paiementStats.enCours++;
          else if (statut === 'complété' || statut === 'complete') paiementStats.complete++;
          else if (statut === 'annulé' || statut === 'annule') paiementStats.annule++;
        } else if (bon.type === 'retour') {
          retourStats.total++;
          if (statut === 'en cours') retourStats.enCours++;
          else if (statut === 'complété' || statut === 'complete') retourStats.complete++;
          else if (statut === 'annulé' || statut === 'annule') retourStats.annule++;
        }
      });

      return {
        data: {
          distribution: distributionStats,
          paiement: paiementStats,
          retour: retourStats
        },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  },

  // Get bon statistics for a specific user (livreur)
  getBonStatsByUser: async (userId: string) => {
    try {
      const { data: bons, error } = await supabase
        .from('bons')
        .select('type, statut')
        .eq('user_id', userId);

      if (error) {
        return { data: null, error };
      }

      // Count bons by type and status
      const distributionStats = {
        total: 0,
        enCours: 0,
        complete: 0,
        annule: 0
      };

      const paiementStats = {
        total: 0,
        enCours: 0,
        complete: 0,
        annule: 0
      };

      const retourStats = {
        total: 0,
        enCours: 0,
        complete: 0,
        annule: 0
      };

      bons?.forEach(bon => {
        const statut = bon.statut.toLowerCase();

        if (bon.type === 'distribution') {
          distributionStats.total++;
          if (statut === 'en cours') distributionStats.enCours++;
          else if (statut === 'complété' || statut === 'complete') distributionStats.complete++;
          else if (statut === 'annulé' || statut === 'annule') distributionStats.annule++;
        } else if (bon.type === 'paiement') {
          paiementStats.total++;
          if (statut === 'en cours') paiementStats.enCours++;
          else if (statut === 'complété' || statut === 'complete') paiementStats.complete++;
          else if (statut === 'annulé' || statut === 'annule') paiementStats.annule++;
        } else if (bon.type === 'retour') {
          retourStats.total++;
          if (statut === 'en cours') retourStats.enCours++;
          else if (statut === 'complété' || statut === 'complete') retourStats.complete++;
          else if (statut === 'annulé' || statut === 'annule') retourStats.annule++;
        }
      });

      return {
        data: {
          distribution: distributionStats,
          paiement: paiementStats,
          retour: retourStats
        },
        error: null
      };
    } catch (error) {
      return { data: null, error };
    }
  }
}