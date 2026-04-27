-- Admin user update function that bypasses RLS
-- Run this in your Supabase SQL Editor

CREATE OR REPLACE FUNCTION update_user_admin(
  p_user_id UUID,
  p_updates JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  caller_role TEXT;
  result JSONB;
BEGIN
  -- Verify the caller is an Admin or Gestionnaire
  SELECT role INTO caller_role
  FROM utilisateurs
  WHERE auth_id = auth.uid();

  IF caller_role IS NULL OR caller_role NOT IN ('Admin', 'Gestionnaire') THEN
    RAISE EXCEPTION 'Permission denied: Admin or Gestionnaire role required';
  END IF;

  -- Update the target user
  UPDATE utilisateurs
  SET
    nom = COALESCE(p_updates->>'nom', nom),
    prenom = COALESCE(p_updates->>'prenom', prenom),
    telephone = CASE WHEN p_updates ? 'telephone' THEN p_updates->>'telephone' ELSE telephone END,
    adresse = CASE WHEN p_updates ? 'adresse' THEN p_updates->>'adresse' ELSE adresse END,
    ville = CASE WHEN p_updates ? 'ville' THEN p_updates->>'ville' ELSE ville END,
    vehicule = CASE WHEN p_updates ? 'vehicule' THEN p_updates->>'vehicule' ELSE vehicule END,
    zone = CASE WHEN p_updates ? 'zone' THEN p_updates->>'zone' ELSE zone END,
    statut = COALESCE(p_updates->>'statut', statut),
    date_modification = NOW()
  WHERE id = p_user_id
  RETURNING to_jsonb(utilisateurs.*) INTO result;

  IF result IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  RETURN result;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION update_user_admin(UUID, JSONB) TO authenticated;

