CREATE OR REPLACE FUNCTION generate_daily_paiement_bon_for_livreur(p_livreur_id UUID)
RETURNS TABLE (
  bon_id TEXT,
  livreur_id UUID,
  nb_colis INTEGER,
  montant_total NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  WITH delivered AS (
    SELECT 
      c.livreur_id,
      COUNT(*) AS nb_colis,
      COALESCE(SUM(c.prix), 0) AS montant
    FROM colis c
    WHERE c.statut = 'Livré'
      AND c.date_mise_a_jour::date < CURRENT_DATE
      AND c.livreur_id = p_livreur_id
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
      'PAY-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || LEFT(MD5(d.livreur_id::text), 8),
      d.livreur_id,
      'paiement',
      'En attente',
      NOW(),
      d.nb_colis,
      d.montant,
      'livreur',
      d.livreur_id,
      'Bon de paiement généré automatiquement pour le ' || TO_CHAR(CURRENT_DATE, 'DD/MM/YYYY')
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
    AND c.date_mise_a_jour::date < CURRENT_DATE
  ON CONFLICT (bon_id, colis_id) DO NOTHING;

  -- Return results
  RETURN QUERY
  SELECT id, user_id, nb_colis, montant FROM inserted;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

