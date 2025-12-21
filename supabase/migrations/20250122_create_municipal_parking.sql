/*
  # Create municipal_parking table
  
  1. New Tables
    - `municipal_parking`
      - `id` (uuid, primary key)
      - `station_id` (text, unique) - ID_STA from the dataset
      - `borough` (text) - Borough/Arrondissement name
      - `number_of_spaces` (integer) - NBR_PLA number of parking spaces
      - `latitude` (double precision) - Converted latitude from X,Y coordinates
      - `longitude` (double precision) - Converted longitude from X,Y coordinates
      - `jurisdiction` (text) - JURIDICTION (Municipale, Agence mobilité durable, etc.)
      - `location_fr` (text) - EMPLACEMENT in French
      - `location_en` (text) - LOCATION in English
      - `hours_fr` (text) - HEURES restriction in French
      - `hours_en` (text) - HOURS restriction in English
      - `note_fr` (text) - NOTE_FR in French
      - `note_en` (text) - NOTE_EN in English
      - `payment_type` (text) - TYPE_PAY (0 = free, etc.)
      - `geometry` (geometry(Point, 4326)) - Point geometry in WGS84
      - `created_at` (timestamptz) - When the record was created
      - `updated_at` (timestamptz) - Last update time

  2. Indexes
    - Index on station_id for fast lookups
    - Spatial index on geometry for geographic queries
    - Index on borough for filtering

  3. Notes
    - Public data accessible to all users
    - No RLS needed as this is public municipal data
*/

-- Create municipal_parking table
CREATE TABLE IF NOT EXISTS municipal_parking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  station_id text UNIQUE NOT NULL,
  borough text NOT NULL,
  number_of_spaces integer,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  jurisdiction text,
  location_fr text,
  location_en text,
  hours_fr text,
  hours_en text,
  note_fr text,
  note_en text,
  payment_type text,
  geometry geometry(Point, 4326),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS municipal_parking_station_id_idx 
  ON municipal_parking (station_id);
CREATE INDEX IF NOT EXISTS municipal_parking_borough_idx 
  ON municipal_parking (borough);
CREATE INDEX IF NOT EXISTS municipal_parking_geometry_idx 
  ON municipal_parking USING GIST (geometry);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_municipal_parking_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_municipal_parking_updated_at
  BEFORE UPDATE ON municipal_parking
  FOR EACH ROW
  EXECUTE FUNCTION update_municipal_parking_updated_at();

-- Enable PostGIS extension if not already enabled (required for geometry column)
CREATE EXTENSION IF NOT EXISTS postgis;

