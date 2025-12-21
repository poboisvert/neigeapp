/*
  # Create deneigement_current table

  1. New Tables
    - `deneigement_current`
      - `cote_rue_id` (bigint, primary key, references streets)
      - `etat_deneig` (smallint) - Snow removal state/status code
      - `status` (text) - Human-readable status description
      - `date_debut_planif` (timestamptz) - Planned start date
      - `date_fin_planif` (timestamptz) - Planned end date
      - `date_debut_replanif` (timestamptz) - Rescheduled start date
      - `date_fin_replanif` (timestamptz) - Rescheduled end date
      - `date_maj` (timestamptz) - Last update date
      - `last_seen_at` (timestamptz) - Last time record was seen/verified

  2. Security
    - Enable RLS on `deneigement_current` table
    - Add policy for public read access (snow removal info is public data)
    - Add policy for authenticated users to insert/update (for system updates)

  3. Notes
    - This table tracks current snow removal status for street sides
    - Foreign key to streets table ensures referential integrity
    - Timestamps track both planned and rescheduled dates for snow removal operations
*/

-- Create deneigement_current table
CREATE TABLE IF NOT EXISTS deneigement_current (
  cote_rue_id bigint PRIMARY KEY REFERENCES streets(cote_rue_id),

  etat_deneig smallint NOT NULL,
  status text NOT NULL,

  date_debut_planif timestamptz,
  date_fin_planif timestamptz,
  date_debut_replanif timestamptz,
  date_fin_replanif timestamptz,

  date_maj timestamptz NOT NULL,
  last_seen_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE deneigement_current ENABLE ROW LEVEL SECURITY;

-- Public can read snow removal data (this is public information)
CREATE POLICY "Anyone can read snow removal status"
  ON deneigement_current
  FOR SELECT
  TO public
  USING (true);

-- Authenticated users can insert new records (for system/admin updates)
CREATE POLICY "Authenticated users can insert snow removal data"
  ON deneigement_current
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update records (for system/admin updates)
CREATE POLICY "Authenticated users can update snow removal data"
  ON deneigement_current
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS deneigement_current_etat_idx ON deneigement_current (etat_deneig);
CREATE INDEX IF NOT EXISTS deneigement_current_status_idx ON deneigement_current (status);
CREATE INDEX IF NOT EXISTS deneigement_current_date_maj_idx ON deneigement_current (date_maj DESC);
