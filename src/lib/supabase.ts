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
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false, // DISABLED: Causing infinite SIGNED_IN events
        persistSession: true,
        detectSessionInUrl: true,
        // Add session recovery options
        flowType: 'pkce',
        storage: typeof window !== 'undefined' ? window.localStorage : undefined,
        storageKey: 'supabase.auth.token',
        debug: false
      },
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
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (data.user && !error) {
      // Create user profile in our utilisateurs table
      const { error: profileError } = await supabase
        .from('utilisateurs')
        .insert({
          id: data.user.id,
          nom: userData.nom,
          prenom: userData.prenom,
          email: email, // Store email in our table too
          role: userData.role,
          statut: 'actif',
          mot_de_passe: '', // We don't store passwords in our table
          date_creation: new Date().toISOString(),
        })

      if (profileError) {
        return { data, error: profileError }
      }
    }

    return { data, error }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut()

      // Clear any stored auth data from localStorage
      if (typeof window !== 'undefined') {
        localStorage.removeItem('supabase.auth.token')
        localStorage.removeItem('sb-' + supabaseUrl.split('//')[1].split('.')[0] + '-auth-token')
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
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    return { data, error }
  },

  updatePassword: async (newPassword: string) => {
    const { data, error } = await supabase.auth.updateUser({
      password: newPassword
    })
    return { data, error }
  }
}

// Data fetching helpers
export const api = {
  // Users
  getUsers: async () => {
    const { data, error } = await supabase
      .from('utilisateurs')
      .select('*')
      .order('date_creation', { ascending: false })
    return { data, error }
  },

  getUserById: async (id: string) => {
    const { data, error } = await supabase
      .from('utilisateurs')
      .select('*')
      .eq('id', id)
      .single()
    return { data, error }
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
      .select('id, nom, prenom, statut, role')
      .ilike('role', '%livreur%') // More flexible matching
      .order('nom', { ascending: true })
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
    const [colisResult, usersResult] = await Promise.all([
      supabase.from('colis').select('statut'),
      supabase.from('utilisateurs').select('role').eq('role', 'livreur').eq('statut', 'actif')
    ])

    const colis = colisResult.data || []
    const livreurs = usersResult.data || []

    const stats = {
      totalColis: colis.length,
      colisEnCours: colis.filter(c => c.statut === 'En cours').length,
      colisLivres: colis.filter(c => c.statut === 'Livré').length,
      livreursActifs: livreurs.length
    }

    return { data: stats, error: colisResult.error || usersResult.error }
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

      return {
        clients: clients || [],
        colis: colis || [],
        entreprises: entreprises || [],
        error: clientsError || colisIDError || entreprisesError
      };
    } catch (error) {
      return {
        clients: [],
        colis: [],
        entreprises: [],
        error: error as PostgrestError
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

  // CRUD operations for Clients
  createClient: async (client: Omit<Client, 'id' | 'created_at'>) => {
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
  createEntreprise: async (entreprise: Omit<Entreprise, 'id' | 'created_at'>) => {
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
      .eq('id', id)
      .select()
      .single()
    return { data, error }
  },

  deleteUser: async (id: string) => {
    const { data, error } = await supabase
      .from('utilisateurs')
      .delete()
      .eq('id', id)
    return { data, error }
  },


  // Notifications
  getNotifications: async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)  // Changed from 'utilisateur_id' to 'user_id'
        .order('created_at', { ascending: false });  // Changed from 'date_creation' to 'created_at'

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
        console.error('Error creating notification:', error);
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
      console.error('Exception creating notification:', error);
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
      console.error('Error marking notification as read:', error);
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
      console.error('Error marking all notifications as read:', error);
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
      console.error('Error deleting notification:', error);
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
        .in('role', ['admin', 'gestionnaire'])
        .eq('statut', 'actif');

      // If no active admin users found, try without the statut filter
      if (!error && (!data || data.length === 0)) {
        const { data: dataNoStatus, error: errorNoStatus } = await supabase
          .from('utilisateurs')
          .select('id, nom, prenom, role, statut')
          .in('role', ['admin', 'gestionnaire']);

        return { data: dataNoStatus, error: errorNoStatus };
      }

      return { data, error };
    } catch (error) {
      console.error('Error fetching admin/gestionnaire users:', error);
      return { data: null, error };
    }
  }
}