/*
  # Add indexes to streets table

  1. Spatial Indexes
    - `streets_geom_idx` - GIST index on geometry column for efficient spatial queries

  2. Search/Filter Indexes
    - `streets_nom_voie_idx` - B-tree index on nom_voie for fast street name lookups
    - `streets_nom_ville_idx` - B-tree index on nom_ville for filtering by municipality

  3. JSONB Indexes
    - `streets_feature_gin` - GIN index on street_feature for querying inside JSONB data

  4. Notes
    - GIST indexes are optimal for geographic/spatial queries
    - GIN indexes are optimal for JSONB containment and key existence queries
    - These indexes will improve query performance for street searches and spatial operations
*/

-- Spatial index for geometry queries
CREATE INDEX IF NOT EXISTS streets_geom_idx ON streets USING GIST (geometry);

-- Search / filter indexes
CREATE INDEX IF NOT EXISTS streets_nom_voie_idx ON streets (nom_voie);
CREATE INDEX IF NOT EXISTS streets_nom_ville_idx ON streets (nom_ville);

-- JSONB index (optional, only if you query inside it)
CREATE INDEX IF NOT EXISTS streets_feature_gin ON streets USING GIN (street_feature);
