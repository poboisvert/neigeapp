/*
  # Create streets table with geography support

  1. New Tables
    - `streets`
      - `cote_rue_id` (bigint, primary key)
      - Core identifiers (id_trc, id_voie, nom_voie, nom_ville, etc.)
      - `geometry` (geography linestring, SRID 4326)
      - `street_feature` (jsonb, not null)
      - Timestamps (created_at, updated_at)

  2. Indexes
    - Indexes on nom_voie, nom_ville
    - GIN index on street_feature
    - Spatial GIST index on geometry

  3. Security
    - RLS enabled
    - Public read access
    - Authenticated write access
*/

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create streets table
CREATE TABLE IF NOT EXISTS streets (
  cote_rue_id bigint PRIMARY KEY,
  id_trc bigint,
  id_voie bigint,
  nom_voie text,
  nom_ville text,
  debut_adresse int,
  fin_adresse int,
  cote text,
  type_f text,
  sens_cir int,
  geometry geography(linestring, 4326) NOT NULL,
  street_feature jsonb NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_streets_nom_voie ON streets(nom_voie);
CREATE INDEX IF NOT EXISTS idx_streets_nom_ville ON streets(nom_ville);
CREATE INDEX IF NOT EXISTS idx_streets_feature ON streets USING GIN (street_feature);
CREATE INDEX IF NOT EXISTS idx_streets_geometry ON streets USING GIST (geometry);

-- Enable RLS
ALTER TABLE streets ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Anyone can view streets" ON streets;
CREATE POLICY "Anyone can view streets"
  ON streets FOR SELECT
  TO public
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert streets" ON streets;
CREATE POLICY "Authenticated users can insert streets"
  ON streets FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update streets" ON streets;
CREATE POLICY "Authenticated users can update streets"
  ON streets FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can delete streets" ON streets;
CREATE POLICY "Authenticated users can delete streets"
  ON streets FOR DELETE
  TO authenticated
  USING (true);
