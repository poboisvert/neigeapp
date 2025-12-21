alter table streets
add column geom geography(linestring, 4326)
generated always as (
  ST_SetSRID(
    ST_GeomFromGeoJSON(street_feature->'geometry'),
    4326
  )::geography
) stored;

create index idx_streets_geom on streets using gist (geom);
