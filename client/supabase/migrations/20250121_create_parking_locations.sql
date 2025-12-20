/*
  # Create parking_locations table
  
  1. New Tables
    - `parking_locations`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users) - User who saved the parking location
      - `latitude` (double precision) - Parking location latitude
      - `longitude` (double precision) - Parking location longitude
      - `name` (text, optional) - Custom name for the parking location
      - `notes` (text, optional) - Additional notes about the parking location
      - `created_at` (timestamptz) - When the parking location was saved
      - `updated_at` (timestamptz) - Last update time

  2. Security
    - Enable RLS on `parking_locations` table
    - Add policy for users to read their own parking locations
    - Add policy for users to insert their own parking locations
    - Add policy for users to update their own parking locations
    - Add policy for users to delete their own parking locations

  3. Notes
    - Allows authenticated users to save parking locations by clicking on the map
    - Users can only manage their own parking locations
*/

-- Create parking_locations table
CREATE TABLE IF NOT EXISTS parking_locations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  latitude double precision NOT NULL,
  longitude double precision NOT NULL,
  name text,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE parking_locations ENABLE ROW LEVEL SECURITY;

-- Users can read their own parking locations
CREATE POLICY "Users can read own parking locations"
  ON parking_locations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own parking locations
CREATE POLICY "Users can insert own parking locations"
  ON parking_locations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own parking locations
CREATE POLICY "Users can update own parking locations"
  ON parking_locations
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own parking locations
CREATE POLICY "Users can delete own parking locations"
  ON parking_locations
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS parking_locations_user_id_idx 
  ON parking_locations (user_id);
CREATE INDEX IF NOT EXISTS parking_locations_created_at_idx 
  ON parking_locations (created_at DESC);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_parking_locations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_parking_locations_updated_at
  BEFORE UPDATE ON parking_locations
  FOR EACH ROW
  EXECUTE FUNCTION update_parking_locations_updated_at();

