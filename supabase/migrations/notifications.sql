/*
  # Create notifications table

  1. New Tables
    - `notifications`
      - `id` (bigserial, primary key) - Unique notification identifier
      - `user_id` (uuid) - Reference to the user receiving the notification
      - `cote_rue_id` (bigint) - Reference to the street/cote_rue being monitored
      - `old_etat` (smallint) - Previous snow removal state
      - `new_etat` (smallint) - New snow removal state
      - `sent` (boolean) - Whether the notification has been sent (default: false)
      - `created_at` (timestamptz) - Timestamp when notification was created

  2. Security
    - Enable RLS on `notifications` table
    - Add policy for users to read only their own notifications
    - Add policy for users to update only their own notifications
    - Add policy for authenticated users to insert their own notifications

  3. Indexes
    - Index on `user_id` for efficient querying of user notifications
    - Index on `sent` to quickly find unsent notifications
    - Index on `created_at` for sorting by date

  4. Notes
    - Foreign key constraint on `user_id` references auth.users
    - Foreign key constraint on `cote_rue_id` references streets table
    - Unsent notifications can be queried for batch processing
*/

CREATE TABLE IF NOT EXISTS notifications (
  id bigserial PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  cote_rue_id bigint,
  old_etat smallint,
  new_etat smallint,
  sent boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_sent ON notifications(sent);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Policy: Users can read their own notifications
CREATE POLICY "Users can read own notifications"
  ON notifications
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own notifications
CREATE POLICY "Users can create own notifications"
  ON notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own notifications
CREATE POLICY "Users can update own notifications"
  ON notifications
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
