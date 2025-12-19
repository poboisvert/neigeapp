/*
  # Create user_favorites table

  1. New Tables
    - `user_favorites`
      - `user_id` (uuid, references auth.users) - User who favorited the street
      - `cote_rue_id` (bigint, references streets) - Street side being favorited
      - `created_at` (timestamptz) - When the favorite was added
      - Primary key: (user_id, cote_rue_id) - Prevents duplicate favorites

  2. Security
    - Enable RLS on `user_favorites` table
    - Add policy for users to read their own favorites
    - Add policy for users to insert their own favorites
    - Add policy for users to delete their own favorites
    - No update policy needed (no columns to update)

  3. Notes
    - Allows authenticated users to bookmark specific street sides
    - Composite primary key ensures each user can only favorite a street once
    - Foreign keys ensure referential integrity with both auth.users and streets
    - Users can only manage their own favorites for privacy
*/

-- Create user_favorites table
CREATE TABLE IF NOT EXISTS user_favorites (
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  cote_rue_id bigint REFERENCES streets(cote_rue_id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  PRIMARY KEY (user_id, cote_rue_id)
);

-- Enable Row Level Security
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

-- Users can read their own favorites
CREATE POLICY "Users can read own favorites"
  ON user_favorites
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Users can insert their own favorites
CREATE POLICY "Users can insert own favorites"
  ON user_favorites
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own favorites
CREATE POLICY "Users can delete own favorites"
  ON user_favorites
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create index for querying favorites by user
CREATE INDEX IF NOT EXISTS user_favorites_user_id_idx 
  ON user_favorites (user_id);

-- Create index for querying favorites by street (useful for analytics)
CREATE INDEX IF NOT EXISTS user_favorites_cote_rue_id_idx 
  ON user_favorites (cote_rue_id);
