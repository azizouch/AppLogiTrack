import { createClient, SupabaseClient, PostgrestError } from '@supabase/supabase-js'
import { User, Client, Entreprise, Colis, Statut, HistoriqueColis, Notification, Bon } from '@/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey)

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
          email: email,
          nom: userData.nom,
          prenom: userData.prenom,
          role: userData.role,
          statut: 'actif',
          mot_de_passe: '', // We don't store passwords in our table
        })

      if (profileError) {
        console.error('Error creating user profile:', profileError)
      }
    }

    return { data, error }
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  },

  getCurrentUser: async () => {
    const { data: { user }, error } = await supabase.auth.getUser()
    return { user, error }
  },

  onAuthStateChange: (callback: (event: string, session: any) => void) => {
    return supabase.auth.onAuthStateChange(callback)
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
    const { data, error } = await supabase
      .from('utilisateurs')
      .select('*')
      .eq('email', email)
      .single()
    return { data, error }
  },

  // Colis with pagination and filtering
  getColis: async (options: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    livreurId?: string;
    sortBy?: 'recent' | 'oldest' | 'status';
  } = {}) => {
    const {
      page = 1,
      limit = 20,
      search = '',
      status = '',
      livreurId = '',
      sortBy = 'recent'
    } = options;

    let query = supabase
      .from('colis')
      .select(`
        *,
        client:clients(id, nom, telephone, email),
        entreprise:entreprises(id, nom, telephone, email),
        livreur:utilisateurs(id, nom, prenom, telephone)
      `, { count: 'exact' });

    // Apply search filter
    if (search) {
      query = query.or(`id.ilike.%${search}%,clients.nom.ilike.%${search}%,entreprises.nom.ilike.%${search}%`);
    }

    // Apply status filter
    if (status && status !== 'all') {
      query = query.eq('statut', status);
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
    console.log('Global search for:', searchTerm);

    try {
      // Search clients with OR query
      console.log('Searching clients...');
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('id, nom, email, telephone, adresse')
        .or(`nom.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%,telephone.ilike.%${searchTerm}%`)
        .limit(limit);

      console.log('Clients result:', { clients, clientsError });

      // Search colis - separate queries to avoid complex joins with OR
      console.log('Searching colis...');

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

      console.log('Colis by ID result:', { colisByID, colisIDError });

      // For now, just use colis by ID to avoid complex joins
      const colis = colisByID;

      // Search entreprises with OR query
      console.log('Searching entreprises...');
      const { data: entreprises, error: entreprisesError } = await supabase
        .from('entreprises')
        .select('id, nom, contact, telephone, email, adresse')
        .or(`nom.ilike.%${searchTerm}%,contact.ilike.%${searchTerm}%,telephone.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
        .limit(limit);

      console.log('Entreprises result:', { entreprises, entreprisesError });

      const result = {
        clients: clients || [],
        colis: colis || [],
        entreprises: entreprises || [],
        error: clientsError || colisIDError || entreprisesError
      };

      console.log('Final search result:', result);
      return result;
    } catch (error) {
      console.error('Global search error:', error);
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
