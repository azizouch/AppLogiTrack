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
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
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
        console.log('Auth error or no user:', authError?.message);
        return { data: null, error: authError };
      }

      const authUserId = authUser.user.id;
      console.log('Looking for user with auth_id:', authUserId);

      // Find user by auth_id (correct relationship)
      const { data: userData, error: userError } = await supabase
        .from('utilisateurs')
        .select('*')
        .eq('auth_id', authUserId)
        .single();

      if (!userError && userData) {
        console.log('User found in database:', userData.nom, 'with role:', userData.role);
        const userWithEmail = {
          ...userData,
          email: email
        };
        return { data: userWithEmail, error: null };
      }

      console.log('User not found in database:', userError?.message);
      return { data: null, error: { message: 'User profile not found in database' } };

    } catch (err) {
      console.log('Error in getUserByEmail:', err);
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
  }
}