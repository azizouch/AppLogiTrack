
export interface User {
  id: string;
  auth_id?: string;
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  role: 'Admin' | 'Gestionnaire' | 'Livreur';
  statut: string;
  derniere_connexion?: string;
  date_creation: string;
  date_modification?: string;
  adresse?: string;
  ville?: string;
  vehicule?: string;
  zone?: string;
  image_url?: string;
}

export interface Client {
  id: string;
  nom: string;
  telephone?: string;
  email?: string;
  adresse?: string;
  entreprise?: string;
  created_at: string;
  description?: string;
  ville?: string;
}

export interface Entreprise {
  id: string;
  nom: string;
  adresse?: string;
  contact?: string;
  created_at: string;
  description?: string;
  email?: string;
  telephone?: string;
  telephone_2?: string;
}

export interface Colis {
  id: string;
  client_id: string;
  entreprise_id?: string;
  livreur_id?: string;
  statut: string;
  date_creation: string;
  date_mise_a_jour?: string;
  notes?: string;
  prix: number;
  frais: number;
  adresse_livraison?: string;
  client?: Client;
  entreprise?: Entreprise;
  livreur?: User;
}

export interface Statut {
  id: string;
  nom: string;
  type: string;
  created_at: string;
  updated_at?: string;
  couleur?: string;
  ordre?: number;
  actif?: boolean;
}

export interface HistoriqueColis {
  id: string;
  colis_id: string;
  date: string;
  statut: string;
  utilisateur?: string;
  user?: {
    nom: string;
    prenom?: string;
  };
}

export interface Notification {
  id: string;
  utilisateur_id: string;
  titre: string;
  message: string;
  lu: boolean;
  date_creation: string;
  type?: string;
}

export interface Bon {
  id: string;
  user_id: string; // Changed from livreur_id - can be any user
  type: 'distribution' | 'paiement' | 'retour';
  date_creation: string;
  statut: string;

  // Distribution fields
  nb_colis?: number; // Optional for non-distribution bons

  // Paiement fields
  client_id?: string; // For paiement and retour
  montant?: number; // For paiement bons
  date_echeance?: string; // Due date for payments

  // Retour fields
  colis_id?: string; // Specific colis being returned
  motif?: string; // Reason for return

  // Common fields
  notes?: string; // Additional notes

  // Relations (populated by joins)
  user?: User; // The user who created/owns the bon
  client?: Client; // For paiement/retour bons
  colis?: Colis; // For retour bons
}
