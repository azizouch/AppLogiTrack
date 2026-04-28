-- Create factures table for admin/gestionnaire invoices to livreurs

CREATE TABLE IF NOT EXISTS factures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  numero TEXT NOT NULL UNIQUE,
  livreur_id UUID NOT NULL REFERENCES utilisateurs(id) ON DELETE RESTRICT,
  date_facture DATE NOT NULL DEFAULT CURRENT_DATE,
  montant NUMERIC(12,2) NOT NULL CHECK (montant >= 0),
  statut TEXT NOT NULL DEFAULT 'Brouillon',
  notes TEXT,
  created_by UUID REFERENCES utilisateurs(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_factures_livreur_id ON factures(livreur_id);
CREATE INDEX IF NOT EXISTS idx_factures_date_facture ON factures(date_facture DESC);
CREATE INDEX IF NOT EXISTS idx_factures_statut ON factures(statut);

ALTER TABLE factures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read factures" ON factures;
CREATE POLICY "Allow authenticated read factures"
ON factures FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated insert factures" ON factures;
CREATE POLICY "Allow authenticated insert factures"
ON factures FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated update factures" ON factures;
CREATE POLICY "Allow authenticated update factures"
ON factures FOR UPDATE
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');

-- Link table between factures and bons
CREATE TABLE IF NOT EXISTS facture_bons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  facture_id UUID NOT NULL REFERENCES factures(id) ON DELETE CASCADE,
  bon_id TEXT NOT NULL REFERENCES bons(id) ON DELETE RESTRICT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (facture_id, bon_id)
);

CREATE INDEX IF NOT EXISTS idx_facture_bons_facture_id ON facture_bons(facture_id);
CREATE INDEX IF NOT EXISTS idx_facture_bons_bon_id ON facture_bons(bon_id);

ALTER TABLE facture_bons ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated read facture_bons" ON facture_bons;
CREATE POLICY "Allow authenticated read facture_bons"
ON facture_bons FOR SELECT
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated insert facture_bons" ON facture_bons;
CREATE POLICY "Allow authenticated insert facture_bons"
ON facture_bons FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
