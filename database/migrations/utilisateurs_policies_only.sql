-- ===========================================
-- UTILISATEURS TABLE POLICIES ONLY
-- ===========================================
-- Enable RLS on utilisateurs table if not already enabled
ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all profiles (simplified - no recursion)
CREATE POLICY "Authenticated users can read all profiles" ON utilisateurs
FOR SELECT USING (auth.role() = 'authenticated');

-- Allow users to update their own profile
CREATE POLICY "Users can update their own profile" ON utilisateurs
FOR UPDATE USING (auth.uid() = auth_id);

-- Allow users to insert their own profile (for registration)
CREATE POLICY "Users can insert their own profile" ON utilisateurs
FOR INSERT WITH CHECK (auth.uid() = auth_id);

-- Allow authenticated users to delete (simplified)
CREATE POLICY "Authenticated users can delete profiles" ON utilisateurs
FOR DELETE USING (auth.role() = 'authenticated');
