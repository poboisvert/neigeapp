/*
  # Create landing_pages table

  1. New Tables
    - `landing_pages`
      - `id` (uuid, primary key) - Unique identifier for the landing page
      - `slug` (text, unique) - URL-friendly identifier (e.g., "snow-removal-info")
      - `title` (text) - Main title of the landing page
      - `subtitle` (text, nullable) - Optional subtitle
      - `short_description` (text) - Short description for hero section
      - `hero_image` (text, nullable) - URL to hero background image
      - `summary` (text, nullable) - Summary text (optional if using weather forecast)
      - `summary_order` (integer, nullable) - Order for summary section
      - `cta_button` (jsonb) - CTA button configuration (text, href, variant)
      - `what_you_get` (jsonb, nullable) - What You Get section data
      - `helping_for` (jsonb, nullable) - Who We're Helping section data
      - `rich_content` (text, nullable) - Rich text content (HTML)
      - `rich_content_order` (integer, nullable) - Order for rich content section
      - `pros_and_cons` (jsonb, nullable) - Pros and cons section data
      - `media` (jsonb, nullable) - Media section (YouTube) data
      - `weather_forecast` (jsonb, nullable) - Weather forecast section data
      - `image_carousel` (jsonb, nullable) - Image carousel section data
      - `published` (boolean, default false) - Whether the page is published
      - `created_at` (timestamptz) - When the page was created
      - `updated_at` (timestamptz) - When the page was last updated
      - `created_by` (uuid, nullable) - User who created the page

  2. Security
    - Enable RLS on `landing_pages` table
    - Add policy for public read access to published pages
    - Add policy for authenticated users to read all pages (for admin)
    - Add policy for authenticated users to insert pages
    - Add policy for authenticated users to update pages they created
    - Add policy for authenticated users to delete pages they created

  3. Indexes
    - Index on `slug` for fast lookups
    - Index on `published` for filtering published pages
    - Index on `created_at` for sorting

  4. Notes
    - Uses JSONB for flexible section data storage
    - Slug must be unique for URL routing
    - Published pages are publicly accessible
    - Unpublished pages are only visible to authenticated users
*/

-- Create landing_pages table
CREATE TABLE IF NOT EXISTS landing_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text,
  short_description text NOT NULL,
  hero_image text,
  summary text,
  summary_order integer,
  cta_button jsonb NOT NULL,
  what_you_get jsonb,
  helping_for jsonb,
  rich_content text,
  rich_content_order integer,
  pros_and_cons jsonb,
  media jsonb,
  weather_forecast jsonb,
  image_carousel jsonb,
  published boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Enable Row Level Security
ALTER TABLE landing_pages ENABLE ROW LEVEL SECURITY;

-- Public can read published pages
CREATE POLICY "Public can read published landing pages"
  ON landing_pages
  FOR SELECT
  TO public
  USING (published = true);

-- Authenticated users can read all pages (for admin/editing)
CREATE POLICY "Authenticated users can read all landing pages"
  ON landing_pages
  FOR SELECT
  TO authenticated
  USING (true);

-- Authenticated users can insert pages
CREATE POLICY "Authenticated users can insert landing pages"
  ON landing_pages
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Authenticated users can update pages they created
CREATE POLICY "Authenticated users can update own landing pages"
  ON landing_pages
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = created_by OR created_by IS NULL)
  WITH CHECK (auth.uid() = created_by OR created_by IS NULL);

-- Authenticated users can delete pages they created
CREATE POLICY "Authenticated users can delete own landing pages"
  ON landing_pages
  FOR DELETE
  TO authenticated
  USING (auth.uid() = created_by OR created_by IS NULL);

-- Create indexes
CREATE INDEX IF NOT EXISTS landing_pages_slug_idx 
  ON landing_pages (slug);

CREATE INDEX IF NOT EXISTS landing_pages_published_idx 
  ON landing_pages (published) 
  WHERE published = true;

CREATE INDEX IF NOT EXISTS landing_pages_created_at_idx 
  ON landing_pages (created_at DESC);

CREATE INDEX IF NOT EXISTS landing_pages_created_by_idx 
  ON landing_pages (created_by);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_landing_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_landing_pages_updated_at
  BEFORE UPDATE ON landing_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_landing_pages_updated_at();

