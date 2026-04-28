CREATE OR REPLACE FUNCTION generate_daily_paiement_bons()
RETURNS TABLE (
  bon_id TEXT,
  livreur_id UUID,
  nb_colis INTEGER,
  montant_total NUMERIC
) AS $$
DECLARE
  v_tz TEXT := 'Africa/Casablanca';
  v_day_start_local TIMESTAMPTZ;
  v_bon_date_local DATE;
BEGIN
  -- Start of the current local day (00:00:00 in Africa/Casablanca).
  -- Only colis delivered BEFORE this boundary are eligible.
  v_day_start_local := ((NOW() AT TIME ZONE v_tz)::date)::timestamp AT TIME ZONE v_tz;
  v_bon_date_local := (NOW() AT TIME ZONE v_tz)::date;

  RETURN QUERY
  WITH delivered AS (
    SELECT 
      c.livreur_id,
      COUNT(*) AS nb_colis,
      COALESCE(SUM(c.prix), 0) AS montant
    FROM colis c
    WHERE c.statut = 'Livré'
      AND c.date_mise_a_jour < v_day_start_local
      AND c.livreur_id IS NOT NULL
      AND c.id NOT IN (
        SELECT bc.colis_id
        FROM bon_colis bc
        JOIN bons b ON b.id = bc.bon_id
        WHERE b.type = 'paiement'
      )
    GROUP BY c.livreur_id
  ),
  inserted AS (
    INSERT INTO bons (
      id,
      user_id,
      type,
      statut,
      date_creation,
      nb_colis,
      montant,
      source_type,
      assigned_to,
      notes
    )
    SELECT
      'PAY-' || TO_CHAR(v_bon_date_local, 'YYYYMMDD') || '-' || LEFT(MD5(d.livreur_id::text), 8),
      d.livreur_id,
      'paiement',
      'En attente',
      NOW(),
      d.nb_colis,
      d.montant,
      'livreur',
      d.livreur_id,
      'Bon de paiement généré automatiquement pour le ' || TO_CHAR(v_bon_date_local, 'DD/MM/YYYY')
    FROM delivered d
    ON CONFLICT (id) DO NOTHING
    RETURNING id, user_id, nb_colis, montant
  )
  INSERT INTO bon_colis (bon_id, colis_id, date_assigned)
  SELECT 
    i.id,
    c.id,
    NOW()
  FROM inserted i
  JOIN colis c ON c.livreur_id = i.user_id
  WHERE c.statut = 'Livré'
    AND c.date_mise_a_jour < v_day_start_local
  ON CONFLICT (bon_id, colis_id) DO NOTHING;

  -- Return results
  RETURN QUERY
  SELECT id, user_id, nb_colis, montant FROM inserted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;