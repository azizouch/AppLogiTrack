-- Migration: Create bons_historique table for bon lifecycle history

-- Create sequence for auto-incrementing IDs
CREATE SEQUENCE IF NOT EXISTS bons_historique_id_seq
  START WITH 1
  INCREMENT BY 1
  NO MINVALUE
  NO MAXVALUE
  CACHE 1;

CREATE TABLE IF NOT EXISTS bons_historique (
  id integer NOT NULL DEFAULT nextval('bons_historique_id_seq'::regclass),
  bon_id text NOT NULL,
  date timestamp with time zone NOT NULL DEFAULT CURRENT_TIMESTAMP,
  type text NOT NULL CHECK (type::text = ANY (ARRAY['distribution'::text, 'paiement'::text, 'retour'::text])),
  utilisateur uuid,
  statut text NOT NULL,
  notes text,
  CONSTRAINT bons_historique_pkey PRIMARY KEY (id),
  CONSTRAINT bons_historique_bon_id_fkey FOREIGN KEY (bon_id) REFERENCES bons(id) ON DELETE CASCADE,
  CONSTRAINT bons_historique_utilisateur_fkey FOREIGN KEY (utilisateur) REFERENCES utilisateurs(id)
);

CREATE INDEX IF NOT EXISTS idx_bons_historique_bon_id ON bons_historique(bon_id);
CREATE INDEX IF NOT EXISTS idx_bons_historique_utilisateur ON bons_historique(utilisateur);
CREATE INDEX IF NOT EXISTS idx_bons_historique_type ON bons_historique(type);

ALTER TABLE IF EXISTS bons_historique ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow authenticated to read bons_historique" ON bons_historique;
CREATE POLICY "Allow authenticated to read bons_historique" ON bons_historique
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Allow authenticated to insert bons_historique" ON bons_historique;
CREATE POLICY "Allow authenticated to insert bons_historique" ON bons_historique
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');
