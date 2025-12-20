/*
  # Create function to get streets within bounding box using PostGIS
  
  This function allows efficient spatial queries to fetch streets that intersect
  with a given bounding box using the geometry linestring column.
*/

-- Create function to get streets within bounding box
CREATE OR REPLACE FUNCTION get_streets_in_bbox(
  min_lng double precision,
  min_lat double precision,
  max_lng double precision,
  max_lat double precision,
  include_snow boolean DEFAULT true
)
RETURNS TABLE (
  cote_rue_id bigint,
  id_trc bigint,
  id_voie bigint,
  nom_voie text,
  nom_ville text,
  debut_adresse int,
  fin_adresse int,
  cote text,
  type_f text,
  sens_cir int,
  geometry geography,
  street_feature jsonb,
  created_at timestamptz,
  updated_at timestamptz,
  deneigement_current jsonb
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.cote_rue_id,
    s.id_trc,
    s.id_voie,
    s.nom_voie,
    s.nom_ville,
    s.debut_adresse,
    s.fin_adresse,
    s.cote,
    s.type_f,
    s.sens_cir,
    s.geometry,
    s.street_feature,
    s.created_at,
    s.updated_at,
    CASE 
      WHEN include_snow THEN
        jsonb_build_object(
          'etat_deneig', dc.etat_deneig,
          'status', dc.status,
          'date_debut_planif', dc.date_debut_planif,
          'date_fin_planif', dc.date_fin_planif,
          'date_debut_replanif', dc.date_debut_replanif,
          'date_fin_replanif', dc.date_fin_replanif,
          'date_maj', dc.date_maj
        )
      ELSE NULL
    END as deneigement_current
  FROM streets s
  LEFT JOIN deneigement_current dc ON s.cote_rue_id = dc.cote_rue_id AND include_snow
  WHERE ST_Intersects(
    s.geometry::geometry,
    ST_MakeEnvelope(min_lng, min_lat, max_lng, max_lat, 4326)
  )
  ORDER BY s.nom_voie ASC;
END;
$$;

-- Grant execute permission to public (since we want this to be accessible via API)
GRANT EXECUTE ON FUNCTION get_streets_in_bbox TO public;

