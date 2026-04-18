-- Add entreprise_id to bons table
ALTER TABLE bons ADD COLUMN IF NOT EXISTS entreprise_id character varying;

-- Add foreign key constraint
ALTER TABLE bons 
ADD CONSTRAINT fk_bons_entreprise FOREIGN KEY (entreprise_id) REFERENCES public.entreprises(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_bons_entreprise_id ON bons(entreprise_id);
