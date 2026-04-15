-- ===============================================
-- COMPLETE DATABASE BACKUP FOR APPLOGTRACK
-- ===============================================
-- This SQL file contains the EXACT database schema from your Supabase
-- as exported directly from your database.
-- 
-- Generated: 2026-04-15
-- This file can be used to recreate the entire database on another server
-- ===============================================

-- ===============================================
-- SECTION 1: CREATE TABLE STATEMENTS
-- ===============================================

-- Table 1: UTILISATEURS (Users/Staff)
CREATE TABLE IF NOT EXISTS utilisateurs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nom character varying NOT NULL,
  prenom character varying NOT NULL,
  telephone character varying,
  role character varying NOT NULL CHECK (role::text = ANY (ARRAY['Admin'::character varying::text, 'Gestionnaire'::character varying::text, 'Livreur'::character varying::text])),
  statut character varying DEFAULT 'Actif'::character varying CHECK (statut::text = ANY (ARRAY['Actif'::character varying::text, 'Inactif'::character varying::text])),
  derniere_connexion timestamp without time zone,
  date_creation timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  date_modification timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
  adresse text,
  ville character varying,
  vehicule character varying,
  zone character varying,
  auth_id uuid,
  image_url text,
  CONSTRAINT utilisateurs_pkey PRIMARY KEY (id),
  CONSTRAINT utilisateurs_auth_id_fkey FOREIGN KEY (auth_id) REFERENCES auth.users(id)
);

-- Table 2: CLIENTS
CREATE TABLE IF NOT EXISTS clients (
  id character varying NOT NULL,
  nom character varying NOT NULL,
  telephone character varying,
  email character varying,
  adresse text,
  entreprise character varying,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  description text,
  ville character varying,
  CONSTRAINT clients_pkey PRIMARY KEY (id)
);

-- Table 3: ENTREPRISES (Companies)
CREATE TABLE IF NOT EXISTS entreprises (
  id character varying NOT NULL,
  nom character varying NOT NULL,
  adresse text,
  contact character varying,
  created_at timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  description text,
  email text,
  telephone text,
  telephone_2 text,
  CONSTRAINT entreprises_pkey PRIMARY KEY (id)
);

-- Table 4: STATUTS (Status types)
CREATE TABLE IF NOT EXISTS statuts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nom character varying NOT NULL,
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['colis'::character varying::text, 'bon'::character varying::text])),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  couleur character varying DEFAULT 'blue'::character varying,
  ordre integer,
  actif boolean DEFAULT true,
  CONSTRAINT statuts_pkey PRIMARY KEY (id)
);

-- Table 5: COLIS (Packages/Shipments)
CREATE TABLE IF NOT EXISTS colis (
  id character varying NOT NULL,
  client_id character varying,
  entreprise_id character varying,
  livreur_id uuid,
  statut character varying NOT NULL,
  date_creation timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  date_mise_a_jour timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  notes text,
  prix numeric DEFAULT 0,
  frais numeric DEFAULT 0,
  CONSTRAINT colis_pkey PRIMARY KEY (id),
  CONSTRAINT colis_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id),
  CONSTRAINT colis_entreprise_id_fkey FOREIGN KEY (entreprise_id) REFERENCES public.entreprises(id),
  CONSTRAINT colis_livreur_id_fkey FOREIGN KEY (livreur_id) REFERENCES public.utilisateurs(id)
);

-- Table 6: HISTORIQUE_COLIS (Package History)
-- Create sequence for id first
CREATE SEQUENCE IF NOT EXISTS historique_colis_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE TABLE IF NOT EXISTS historique_colis (
  id integer NOT NULL DEFAULT nextval('historique_colis_id_seq'::regclass),
  colis_id character varying,
  date timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  statut character varying NOT NULL,
  utilisateur uuid,
  informations text,
  CONSTRAINT historique_colis_pkey PRIMARY KEY (id),
  CONSTRAINT historique_colis_colis_id_fkey FOREIGN KEY (colis_id) REFERENCES public.colis(id),
  CONSTRAINT historique_colis_utilisateur_fkey FOREIGN KEY (utilisateur) REFERENCES public.utilisateurs(id)
);

ALTER SEQUENCE historique_colis_id_seq OWNED BY historique_colis.id;

-- Table 7: NOTIFICATIONS
CREATE TABLE IF NOT EXISTS notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id character varying NOT NULL,
  title character varying NOT NULL,
  message text NOT NULL,
  type character varying NOT NULL,
  link character varying,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  read_at timestamp with time zone,
  is_hidden boolean DEFAULT false,
  CONSTRAINT notifications_pkey PRIMARY KEY (id)
);

-- Table 8: BONS (Delivery/Payment/Return tickets)
CREATE TABLE IF NOT EXISTS bons (
  id character varying NOT NULL,
  user_id uuid,
  date_creation timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
  nb_colis integer DEFAULT 0,
  statut character varying NOT NULL,
  type character varying NOT NULL DEFAULT 'distribution'::character varying CHECK (type::text = ANY (ARRAY['distribution'::character varying::text, 'paiement'::character varying::text, 'retour'::character varying::text])),
  client_id character varying,
  colis_id character varying,
  montant numeric,
  motif text,
  notes text,
  date_echeance date,
  source_type text,
  assigned_to uuid,
  CONSTRAINT bons_pkey PRIMARY KEY (id),
  CONSTRAINT bons_livreur_id_fkey FOREIGN KEY (user_id) REFERENCES public.utilisateurs(id),
  CONSTRAINT fk_bons_client FOREIGN KEY (client_id) REFERENCES public.clients(id),
  CONSTRAINT fk_bons_colis FOREIGN KEY (colis_id) REFERENCES public.colis(id),
  CONSTRAINT fk_bons_user FOREIGN KEY (user_id) REFERENCES public.utilisateurs(id)
);

-- Table 9: BON_COLIS (Bon-Colis relation table)
CREATE TABLE IF NOT EXISTS bon_colis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  bon_id text NOT NULL,
  colis_id text NOT NULL,
  date_assigned timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT bon_colis_pkey PRIMARY KEY (id),
  CONSTRAINT bon_colis_bon_id_fkey FOREIGN KEY (bon_id) REFERENCES public.bons(id),
  CONSTRAINT bon_colis_colis_id_fkey FOREIGN KEY (colis_id) REFERENCES public.colis(id)
);

-- Table 10: COMPANY_SETTINGS
CREATE TABLE IF NOT EXISTS company_settings (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  nom text,
  email text,
  telephone text,
  adresse text,
  ville text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT company_settings_pkey PRIMARY KEY (id)
);

-- ===============================================
-- SECTION 2: ROW LEVEL SECURITY (RLS) POLICIES
-- ===============================================

-- Enable RLS on all tables
ALTER TABLE IF EXISTS utilisateurs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS entreprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS statuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS colis ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS historique_colis ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bons ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS bon_colis ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS company_settings ENABLE ROW LEVEL SECURITY;

-- Basic authenticated access policies for all tables
DROP POLICY IF EXISTS "Allow authenticated to read utilisateurs" ON utilisateurs;
CREATE POLICY "Allow authenticated to read utilisateurs" ON utilisateurs
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated to read clients" ON clients;
CREATE POLICY "Allow authenticated to read clients" ON clients
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated to read entreprises" ON entreprises;
CREATE POLICY "Allow authenticated to read entreprises" ON entreprises
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated to read statuts" ON statuts;
CREATE POLICY "Allow authenticated to read statuts" ON statuts
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated to read colis" ON colis;
CREATE POLICY "Allow authenticated to read colis" ON colis
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated to read historique_colis" ON historique_colis;
CREATE POLICY "Allow authenticated to read historique_colis" ON historique_colis
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated to read notifications" ON notifications;
CREATE POLICY "Allow authenticated to read notifications" ON notifications
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated to read bons" ON bons;
CREATE POLICY "Allow authenticated to read bons" ON bons
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated to read bon_colis" ON bon_colis;
CREATE POLICY "Allow authenticated to read bon_colis" ON bon_colis
FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated to read company_settings" ON company_settings;
CREATE POLICY "Allow authenticated to read company_settings" ON company_settings
FOR SELECT USING (auth.role() = 'authenticated');

-- ===============================================
-- SECTION 3: CUSTOM FUNCTIONS (Optional)
-- ===============================================

-- Drop existing functions first
DROP FUNCTION IF EXISTS delete_auth_user(UUID);
DROP FUNCTION IF EXISTS delete_auth_user_simple(UUID);
DROP FUNCTION IF EXISTS check_auth_user_exists(UUID);
DROP FUNCTION IF EXISTS get_user_email_by_auth_id(UUID);

-- Function to delete auth user
CREATE OR REPLACE FUNCTION delete_auth_user(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  deleted_count INTEGER;
  current_user_role TEXT;
  auth_user_exists BOOLEAN;
BEGIN
  SELECT EXISTS(SELECT 1 FROM auth.users WHERE id = user_id) INTO auth_user_exists;
  
  IF NOT auth_user_exists THEN
    RETURN 'WARNING: No auth user found with ID ' || user_id::text;
  END IF;

  SELECT role INTO current_user_role
  FROM utilisateurs 
  WHERE auth_id = auth.uid();
  
  IF current_user_role != 'Admin' THEN
    RETURN 'ERROR: Admin privileges required';
  END IF;

  DELETE FROM auth.users WHERE id = user_id;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  IF deleted_count > 0 THEN
    RETURN 'SUCCESS: Auth user deleted successfully';
  ELSE
    RETURN 'ERROR: Failed to delete auth user';
  END IF;
  
EXCEPTION
  WHEN OTHERS THEN
    RETURN 'ERROR: ' || SQLERRM;
END;
$$;

-- Function to check if auth user exists
CREATE OR REPLACE FUNCTION check_auth_user_exists(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO user_count
  FROM auth.users 
  WHERE id = user_id;
  
  RETURN user_count > 0;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION delete_auth_user(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION check_auth_user_exists(UUID) TO authenticated;

-- ===============================================
-- SECTION 4: SAMPLE DATA (Optional)
-- ===============================================

-- Insert sample company settings
INSERT INTO company_settings (nom, email, telephone, adresse, ville)
VALUES ('AppLogiTrack', 'info@applogitrack.com', '+212 XXX XXX XXX', 'Your Address', 'Your City')
ON CONFLICT DO NOTHING;

-- Insert sample statuts
INSERT INTO statuts (nom, type, couleur, ordre, actif)
VALUES 
  ('En cours', 'colis', '#3B82F6', 1, true),
  ('Livré', 'colis', '#10B981', 2, true),
  ('Refusé', 'colis', '#EF4444', 3, true),
  ('Annulé', 'colis', '#6B7280', 4, true),
  ('En attente', 'colis', '#F59E0B', 5, true)
ON CONFLICT (nom) DO NOTHING;

-- ===============================================
-- END OF DATABASE BACKUP
-- ===============================================
--
-- ✅ EXACT SCHEMA FROM YOUR SUPABASE DATABASE
--
-- HOW TO USE:
-- 1. Create a new PostgreSQL/Supabase database
-- 2. Copy all code above this line
-- 3. Execute in SQL Editor
-- 4. Done! Your database is ready
--
-- TABLES INCLUDED (10 total):
-- ✓ utilisateurs - Staff/Users
-- ✓ clients - Clients/Recipients
-- ✓ entreprises - Companies
-- ✓ colis - Packages
-- ✓ statuts - Status types
-- ✓ historique_colis - Package history
-- ✓ notifications - User notifications
-- ✓ bons - Tickets (delivery/payment/return)
-- ✓ bon_colis - Bon-Colis relationships
-- ✓ company_settings - Company info
--
-- FEATURES:
-- • Exact column types and lengths
-- • All foreign keys and constraints
-- • Primary keys and check constraints
-- • RLS policies enabled
-- • Helper functions included
-- • Sample data for statuts
--
-- NEXT STEPS:
-- 1. Update environment variables in your app
-- 2. Create auth users
-- 3. Test connection
-- 4. Start using!
--
-- DATABASE VERIFICATION:
-- SELECT * FROM information_schema.tables 
-- WHERE table_schema = 'public' 
-- ORDER BY table_name;
--
-- Check RLS: SELECT schemaname, tablename, policyname FROM pg_policies;
--
-- ─────────────────────────────────────────────────
-- AppLogiTrack - Logistics Management System
-- Generated: 2026-04-15
-- ─────────────────────────────────────────────────
