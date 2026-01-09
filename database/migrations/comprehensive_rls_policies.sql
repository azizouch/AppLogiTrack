-- Simplified RLS Policies - Basic authenticated access
-- This enables RLS and provides basic access for authenticated users

-- ===========================================
-- ENABLE RLS ON ALL TABLES
-- ===========================================
ALTER TABLE colis ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE entreprises ENABLE ROW LEVEL SECURITY;
ALTER TABLE statuts ENABLE ROW LEVEL SECURITY;
ALTER TABLE historique_colis ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE bons ENABLE ROW LEVEL SECURITY;
-- Note: storage.objects is managed by Supabase storage and already has RLS enabled

-- ===========================================
-- BASIC POLICIES - Allow authenticated users full access
-- ===========================================

-- COLIS POLICIES
CREATE POLICY "Allow authenticated access to colis" ON colis
FOR ALL USING (auth.role() = 'authenticated');

-- CLIENTS POLICIES
CREATE POLICY "Allow authenticated access to clients" ON clients
FOR ALL USING (auth.role() = 'authenticated');

-- ENTREPRISES POLICIES
CREATE POLICY "Allow authenticated access to entreprises" ON entreprises
FOR ALL USING (auth.role() = 'authenticated');

-- STATUTS POLICIES
CREATE POLICY "Allow authenticated access to statuts" ON statuts
FOR ALL USING (auth.role() = 'authenticated');

-- HISTORIQUE_COLIS POLICIES
CREATE POLICY "Allow authenticated access to historique_colis" ON historique_colis
FOR ALL USING (auth.role() = 'authenticated');

-- BONS POLICIES
CREATE POLICY "Allow authenticated access to bons" ON bons
FOR ALL USING (auth.role() = 'authenticated');

-- NOTIFICATIONS POLICIES - Basic access for now
CREATE POLICY "Allow authenticated access to notifications" ON notifications
FOR ALL USING (auth.role() = 'authenticated');

-- STORAGE POLICIES (basic)
CREATE POLICY "Allow authenticated access to storage" ON storage.objects
FOR ALL USING (auth.role() = 'authenticated');

-- ===========================================
-- UTILISATEURS TABLE POLICIES
-- ===========================================
-- Enable RLS on utilisateurs table if not already enabled
ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read their own profile
CREATE POLICY "Users can read their own profile" ON utilisateurs
FOR SELECT USING (auth.uid() = auth_id);

-- Allow authenticated users to read all profiles (simplified for now)
CREATE POLICY "Authenticated users can read all profiles" ON utilisateurs
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON utilisateurs
FOR UPDATE USING (auth.uid() = auth_id);

-- Allow users to insert their own profile (for registration)
CREATE POLICY "Users can insert their own profile" ON utilisateurs
FOR INSERT WITH CHECK (auth.uid() = auth_id);

-- Allow admins to manage all users
CREATE POLICY "Admins can manage all users" ON utilisateurs
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM utilisateurs
    WHERE auth_id = auth.uid() AND role = 'admin'
  )
);
