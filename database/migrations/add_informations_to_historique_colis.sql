-- Migration: Add informations column to historique_colis table

ALTER TABLE historique_colis
ADD COLUMN IF NOT EXISTS informations TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_historique_colis_informations ON historique_colis(informations);
