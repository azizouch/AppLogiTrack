-- Migration: Add source_type/assigned_to to bons and create bon_colis relation

-- Add fields to bons table
ALTER TABLE IF EXISTS bons
  ADD COLUMN IF NOT EXISTS source_type TEXT,
  ADD COLUMN IF NOT EXISTS assigned_to UUID;

-- Ensure index for fast filtering
CREATE INDEX IF NOT EXISTS idx_bons_source_type ON bons(source_type);
CREATE INDEX IF NOT EXISTS idx_bons_assigned_to ON bons(assigned_to);

-- Create bon_colis relation table
CREATE TABLE IF NOT EXISTS bon_colis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bon_id TEXT NOT NULL REFERENCES bons(id) ON DELETE CASCADE,
  colis_id TEXT NOT NULL REFERENCES colis(id) ON DELETE CASCADE,
  date_assigned TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (bon_id, colis_id)
);

-- Add index to bon_colis
CREATE INDEX IF NOT EXISTS idx_bon_colis_bon_id ON bon_colis(bon_id);
CREATE INDEX IF NOT EXISTS idx_bon_colis_colis_id ON bon_colis(colis_id);
