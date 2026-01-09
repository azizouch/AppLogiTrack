-- Enable RLS on utilisateurs table if not already enabled
ALTER TABLE utilisateurs ENABLE ROW LEVEL SECURITY;

-- Policy to allow authenticated users to read all users (needed for livreur information in colis)
CREATE POLICY "Users can read all utilisateurs" ON utilisateurs
FOR SELECT USING (auth.role() = 'authenticated');

-- Policy to allow users to read their own profile
CREATE POLICY "Users can read own profile" ON utilisateurs
FOR SELECT USING (auth.uid() = auth_id);

-- Policy to allow users to update their own profile
CREATE POLICY "Users can update own profile" ON utilisateurs
FOR UPDATE USING (auth.uid() = auth_id);

-- Policy to allow admins to manage all users
CREATE POLICY "Admins can manage all users" ON utilisateurs
FOR ALL USING (
  EXISTS (
    SELECT 1 FROM utilisateurs
    WHERE auth_id = auth.uid()
    AND role = 'Admin'
  )
);

-- Policy to allow gestionnaires to read all users
CREATE POLICY "Gestionnaires can read all users" ON utilisateurs
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM utilisateurs
    WHERE auth_id = auth.uid()
    AND role IN ('Admin', 'Gestionnaire')
  )
);