/*
  # Create deneigement_events table

  1. New Tables
    - `deneigement_events`
      - `id` (bigserial, primary key) - Unique event identifier
      - `cote_rue_id` (bigint, references streets) - Street side reference
      - `old_etat` (smallint) - Previous snow removal state code
      - `new_etat` (smallint) - New snow removal state code
      - `old_status` (text) - Previous status description
      - `new_status` (text) - New status description
      - `event_date` (timestamptz) - When the change occurred (from API dateMaj)
      - `created_at` (timestamptz) - When the event was recorded in our system

  2. Security
    - Enable RLS on `deneigement_events` table
    - Add policy for public read access (event history is public data)
    - Add policy for authenticated users to insert events (for system updates)
    - No update/delete policies (audit trail should be immutable)

  3. Notes
    - This table serves as an audit trail for snow removal status changes
    - Captures both state code and human-readable status changes
    - Foreign key to streets table ensures referential integrity
    - Index optimized for querying events by street side in reverse chronological order
*/

-- Create deneigement_events table
CREATE TABLE IF NOT EXISTS deneigement_events (
  id bigserial PRIMARY KEY,
  cote_rue_id bigint REFERENCES streets(cote_rue_id),

  old_etat smallint,
  new_etat smallint,

  old_status text,
  new_status text,

  event_date timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE deneigement_events ENABLE ROW LEVEL SECURITY;

-- Public can read event history (this is public information)
CREATE POLICY "Anyone can read snow removal events"
  ON deneigement_events
  FOR SELECT
  TO public
  USING (true);

-- Authenticated users can insert new events (for system/admin updates)
CREATE POLICY "Authenticated users can insert events"
  ON deneigement_events
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create index for querying events by street side in reverse chronological order
CREATE INDEX IF NOT EXISTS deneigement_events_cote_rue_event_date_idx 
  ON deneigement_events (cote_rue_id, event_date DESC);

-- Create additional index for querying recent events
CREATE INDEX IF NOT EXISTS deneigement_events_created_at_idx 
  ON deneigement_events (created_at DESC);
