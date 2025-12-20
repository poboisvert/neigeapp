"use client";

import { useEffect, useMemo, useState, useCallback, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  GeoJSON,
  CircleMarker,
  Marker,
  Popup,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PlanificationResponse } from "@/lib/api";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const createCustomIcon = () => {
  return L.divIcon({
    className: "",
    html: `
      <div class="custom-search-marker-wrapper">
        <div class="custom-search-marker-pin">
          <div class="custom-search-marker-dot"></div>
        </div>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
  });
};

const createParkingIcon = () => {
  return L.divIcon({
    className: "parking-marker",
    html: `
      <div style="
        background-color: #3b82f6;
        width: 32px;
        height: 32px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid white;
        box-shadow: 0 2px 4px rgba(0,0,0,0.3);
        display: flex;
        align-items: center;
        justify-content: center;
      ">
        <span style="
          transform: rotate(45deg);
          color: white;
          font-weight: bold;
          font-size: 18px;
        ">P</span>
      </div>
    `,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

interface ParkingLocation {
  id: string;
  latitude: number;
  longitude: number;
  name?: string | null;
  notes?: string | null;
  created_at: string;
}

interface SnowMapProps {
  planifications: PlanificationResponse[];
  selectedPlanification?: PlanificationResponse | null;
  darkMode?: boolean;
  searchLocation?: { lat: number; lng: number; zoom?: number } | null;
  initialCenter?: { lat: number; lng: number; zoom?: number } | null;
  zoomTrigger?: number;
  onPlanificationClick?: (planification: PlanificationResponse) => void;
  onBoundsChange?: (bounds: {
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
  }) => void;
  enableDynamicFetching?: boolean;
  onMapClick?: (lat: number, lng: number) => void;
  parkingLocations?: ParkingLocation[];
  onParkingLocationDelete?: (id: string) => void;
  selectedParkingLocationId?: string | null;
}

function FitBounds({
  features,
  skip = false,
}: {
  features: any[];
  skip?: boolean;
}) {
  const map = useMap();

  useEffect(() => {
    if (skip || features.length === 0) return;

    const bounds = L.latLngBounds([]);
    features.forEach((feature) => {
      if (feature.geometry?.coordinates) {
        feature.geometry.coordinates.forEach((coord: [number, number]) => {
          bounds.extend([coord[1], coord[0]]);
        });
      }
    });

    if (!bounds.isValid()) return;

    map.fitBounds(bounds, {
      padding: [50, 50],
      maxZoom: 16,
    });
  }, [map, features, skip]);

  return null;
}

function ZoomToSelected({
  selected,
  trigger,
}: {
  selected: PlanificationResponse | null | undefined;
  trigger?: number;
}) {
  const map = useMap();

  useEffect(() => {
    if (!selected?.streetFeature?.geometry?.coordinates) return;

    const coords = selected.streetFeature.geometry.coordinates;

    // Calculate midpoint of the line
    const midpoint = calculateMidpointOnLine(coords);
    if (!midpoint) return;

    // Get current zoom level to preserve it
    const currentZoom = map.getZoom();

    // Center on the feature but keep the current zoom level
    map.setView(midpoint, currentZoom, {
      animate: true,
      duration: 0.5,
    });
  }, [map, selected, trigger]);

  return null;
}

function ZoomToSearch({
  location,
}: {
  location: { lat: number; lng: number; zoom?: number } | null | undefined;
}) {
  const map = useMap();

  useEffect(() => {
    if (!location) return;

    map.setView([location.lat, location.lng], location.zoom || 14, {
      animate: true,
      duration: 1,
    });
  }, [map, location]);

  return null;
}

function ZoomToInitialCenter({
  location,
}: {
  location: { lat: number; lng: number; zoom?: number } | null | undefined;
}) {
  const map = useMap();

  useEffect(() => {
    if (!location) return;

    map.setView([location.lat, location.lng], location.zoom || 14, {
      animate: true,
      duration: 1,
    });
  }, [map, location]);

  return null;
}

function MapBoundsTracker({
  onBoundsChange,
  enableDynamicFetching,
}: {
  onBoundsChange?: (bounds: {
    minLat: number;
    minLng: number;
    maxLat: number;
    maxLng: number;
  }) => void;
  enableDynamicFetching?: boolean;
}) {
  const map = useMap();
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastBoundsRef = useRef<string>("");

  const updateBounds = useCallback(() => {
    if (!enableDynamicFetching || !onBoundsChange) return;

    const bounds = map.getBounds();
    const minLat = bounds.getSouth();
    const minLng = bounds.getWest();
    const maxLat = bounds.getNorth();
    const maxLng = bounds.getEast();

    // Create a unique key for these bounds to avoid duplicate requests
    const boundsKey = `${minLat.toFixed(4)},${minLng.toFixed(
      4
    )},${maxLat.toFixed(4)},${maxLng.toFixed(4)}`;

    // Only trigger if bounds have changed significantly
    if (boundsKey === lastBoundsRef.current) return;
    lastBoundsRef.current = boundsKey;

    // Debounce the bounds change to avoid too many requests
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      onBoundsChange({ minLat, minLng, maxLat, maxLng });
    }, 300); // 300ms debounce
  }, [map, onBoundsChange, enableDynamicFetching]);

  useMapEvents({
    moveend: updateBounds,
    zoomend: updateBounds,
  });

  // Also trigger on initial load
  useEffect(() => {
    // Small delay to ensure map is fully initialized
    const timer = setTimeout(updateBounds, 500);
    return () => {
      clearTimeout(timer);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [updateBounds]);

  return null;
}

function MapClickHandler({
  onMapClick,
}: {
  onMapClick?: (lat: number, lng: number) => void;
}) {
  const map = useMap();

  useMapEvents({
    click: (e) => {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });

  return null;
}

function ParkingMarker({
  parking,
  isSelected,
  onDelete,
}: {
  parking: ParkingLocation;
  isSelected: boolean;
  onDelete?: (id: string) => void;
}) {
  const markerRef = useRef<L.Marker | null>(null);

  useEffect(() => {
    if (isSelected && markerRef.current) {
      // Small delay to ensure map has updated position
      setTimeout(() => {
        markerRef.current?.openPopup();
      }, 300);
    }
  }, [isSelected]);

  return (
    <Marker
      ref={markerRef}
      position={[parking.latitude, parking.longitude]}
      icon={createParkingIcon()}
      zIndexOffset={500}
    >
      <Popup>
        <div style={{ minWidth: "200px" }}>
          <strong
            style={{
              fontSize: "14px",
              display: "block",
              marginBottom: "8px",
            }}
          >
            {parking.name || "Parking Location"}
          </strong>
          {parking.notes && (
            <p style={{ margin: "4px 0", fontSize: "12px", color: "#666" }}>
              {parking.notes}
            </p>
          )}
          <p style={{ margin: "4px 0", fontSize: "12px", color: "#666" }}>
            {parking.latitude.toFixed(5)}, {parking.longitude.toFixed(5)}
          </p>
          <p style={{ margin: "4px 0", fontSize: "11px", color: "#999" }}>
            {new Date(parking.created_at).toLocaleString()}
          </p>
          {onDelete && (
            <button
              onClick={() => onDelete(parking.id)}
              style={{
                marginTop: "8px",
                padding: "4px 8px",
                backgroundColor: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Delete
            </button>
          )}
        </div>
      </Popup>
    </Marker>
  );
}

function getStatusColor(etatDeneig: number): string {
  const colorMap: Record<number, string> = {
    0: "#ff9671",
    1: "#22c55e",
    2: "#3b82f6",
    3: "#8b5cf6",
    4: "#f9f871",
    5: "#ef4444",
    10: "#6b7280",
  };
  return colorMap[etatDeneig] || "#6b7280";
}

function calculateMidpointOnLine(
  coordinates: [number, number][]
): [number, number] | null {
  if (!coordinates || coordinates.length === 0) return null;

  // If only one point, return it
  if (coordinates.length === 1) {
    return [coordinates[0][1], coordinates[0][0]]; // [lat, lng]
  }

  // Calculate cumulative distances along the line
  const distances: number[] = [0];
  let totalDistance = 0;

  for (let i = 1; i < coordinates.length; i++) {
    const prev = L.latLng(coordinates[i - 1][1], coordinates[i - 1][0]);
    const curr = L.latLng(coordinates[i][1], coordinates[i][0]);
    const segmentDistance = prev.distanceTo(curr);
    totalDistance += segmentDistance;
    distances.push(totalDistance);
  }

  // If total distance is 0 (all points are the same), return the first point
  if (totalDistance === 0) {
    return [coordinates[0][1], coordinates[0][0]];
  }

  // Find the midpoint distance
  const midpointDistance = totalDistance / 2;

  // Find the segment containing the midpoint
  let segmentIndex = 0;
  for (let i = 0; i < distances.length - 1; i++) {
    if (
      midpointDistance >= distances[i] &&
      midpointDistance <= distances[i + 1]
    ) {
      segmentIndex = i;
      break;
    }
  }

  // If midpoint is exactly at a vertex, return it
  if (midpointDistance === distances[segmentIndex]) {
    return [coordinates[segmentIndex][1], coordinates[segmentIndex][0]];
  }

  // Interpolate along the segment
  const segmentStart = segmentIndex;
  const segmentEnd = segmentIndex + 1;
  const segmentStartDistance = distances[segmentStart];
  const segmentEndDistance = distances[segmentEnd];
  const segmentLength = segmentEndDistance - segmentStartDistance;
  const t = (midpointDistance - segmentStartDistance) / segmentLength;

  const startPoint = L.latLng(
    coordinates[segmentStart][1],
    coordinates[segmentStart][0]
  );
  const endPoint = L.latLng(
    coordinates[segmentEnd][1],
    coordinates[segmentEnd][0]
  );

  // Interpolate between start and end points
  const lat = startPoint.lat + (endPoint.lat - startPoint.lat) * t;
  const lng = startPoint.lng + (endPoint.lng - startPoint.lng) * t;

  return [lat, lng];
}

export default function SnowMap({
  planifications,
  selectedPlanification,
  darkMode = false,
  searchLocation,
  initialCenter,
  zoomTrigger,
  onPlanificationClick,
  onBoundsChange,
  enableDynamicFetching = false,
  onMapClick,
  parkingLocations = [],
  onParkingLocationDelete,
  selectedParkingLocationId = null,
}: SnowMapProps) {
  const geoJsonFeatures = useMemo(() => {
    return planifications
      .filter((p) => p.streetFeature)
      .map((p) => {
        const feature = p.streetFeature!;
        return {
          ...feature,
          properties: {
            ...feature.properties,
            status: p.status,
            etatDeneig: p.etatDeneig,
            dateMaj: p.dateMaj,
            coteRueId: p.coteRueId,
          },
        };
      });
  }, [planifications]);

  const dataHash = useMemo(() => {
    return planifications
      .map((p) => `${p.coteRueId}-${p.etatDeneig}`)
      .join("|");
  }, [planifications]);

  const centerMarkers = useMemo(() => {
    return planifications
      .filter((p) => p.streetFeature?.geometry?.coordinates)
      .map((p) => {
        const geometry = p.streetFeature!.geometry as any;
        let coordinates: [number, number][] = [];

        // Handle LineString (single array of coordinates)
        if (geometry.type === "LineString") {
          const coords = geometry.coordinates;
          if (
            Array.isArray(coords) &&
            coords.length > 0 &&
            Array.isArray(coords[0]) &&
            typeof coords[0][0] === "number"
          ) {
            coordinates = coords as [number, number][];
          }
        }
        // Handle MultiLineString (array of coordinate arrays)
        else if (geometry.type === "MultiLineString") {
          const coords = geometry.coordinates;
          if (Array.isArray(coords) && coords.length > 0) {
            // Use the first line string, or find the longest one
            const lineStrings = coords as [number, number][][];
            if (lineStrings.length > 0) {
              // Find the longest line string
              const longestLine = lineStrings.reduce((longest, current) => {
                return current.length > longest.length ? current : longest;
              }, lineStrings[0]);
              coordinates = longestLine;
            }
          }
        }

        const midpoint = calculateMidpointOnLine(coordinates);
        if (!midpoint) return null;

        return {
          position: midpoint,
          color: getStatusColor(p.etatDeneig),
          planification: p,
          isSelected: selectedPlanification?.coteRueId === p.coteRueId,
        };
      })
      .filter((m): m is NonNullable<typeof m> => m !== null);
  }, [planifications, selectedPlanification]);

  const defaultCenter: [number, number] = [45.5017, -73.5673];

  const styleFeature = (feature: any) => {
    const etatDeneig = feature?.properties?.etatDeneig || 0;
    const isSelected =
      selectedPlanification?.coteRueId === feature?.properties?.COTE_RUE_ID;

    return {
      color: getStatusColor(etatDeneig),
      weight: isSelected ? 6 : 4,
      opacity: isSelected ? 1 : 0.8,
    };
  };

  const onEachFeature = (feature: any, layer: L.Layer) => {
    const props = feature.properties;
    const popupContent = `
      <div style="min-width: 200px;">
        <h3 style="margin: 0 0 8px 0; font-weight: bold;">
          ${props.NOM_VOIE} ${props.TYPE_F}
        </h3>
        <p style="margin: 4px 0;"><strong>Status:</strong> ${props.status}</p>
        <p style="margin: 4px 0;"><strong>Côté:</strong> ${props.COTE}</p>
        <p style="margin: 4px 0;"><strong>Adresse:</strong> ${
          props.DEBUT_ADRESSE
        }${
      props.FIN_ADRESSE !== props.DEBUT_ADRESSE ? ` - ${props.FIN_ADRESSE}` : ""
    }</p>
        ${
          props.dateMaj
            ? `<p style="margin: 4px 0;"><strong>Dernière mise à jour:</strong><br/>${new Date(
                props.dateMaj
              ).toLocaleString("fr-CA")}</p>`
            : ""
        }
        <p style="margin: 4px 0; font-size: 0.85em; color: #666;">
          ID: ${props.COTE_RUE_ID}
        </p>
      </div>
    `;
    layer.bindPopup(popupContent);

    if (onPlanificationClick) {
      layer.on("click", () => {
        const planif = planifications.find(
          (p) => p.coteRueId === props.coteRueId
        );
        if (planif) {
          onPlanificationClick(planif);
        }
      });
    }
  };

  if (geoJsonFeatures.length === 0) {
    return (
      <div
        className={`flex h-full w-full items-center justify-center ${
          darkMode ? "bg-gray-900" : "bg-gray-100"
        }`}
      >
        <p className={darkMode ? "text-gray-400" : "text-gray-600"}>
          Aucune donnée géographique disponible
        </p>
      </div>
    );
  }

  return (
    <MapContainer
      center={defaultCenter}
      zoom={16}
      style={{ height: "100%", width: "100%" }}
      className='z-0'
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={
          darkMode
            ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        }
      />
      <FitBounds features={geoJsonFeatures} skip={!!initialCenter} />
      <ZoomToSelected selected={selectedPlanification} trigger={zoomTrigger} />
      <ZoomToSearch location={searchLocation} />
      <ZoomToInitialCenter location={initialCenter} />
      <MapBoundsTracker
        onBoundsChange={onBoundsChange}
        enableDynamicFetching={enableDynamicFetching}
      />
      <MapClickHandler onMapClick={onMapClick} />
      <GeoJSON
        key={`${selectedPlanification?.coteRueId || "all"}-${dataHash}`}
        data={geoJsonFeatures as any}
        style={styleFeature}
        onEachFeature={onEachFeature}
      />
      {centerMarkers.map((marker, index) => (
        <CircleMarker
          key={`marker-${marker.planification.coteRueId}-${index}`}
          center={marker.position}
          radius={marker.isSelected ? 8 : 6}
          pathOptions={{
            fillColor: marker.color,
            fillOpacity: 1,
            color: "white",
            weight: marker.isSelected ? 3 : 2,
            opacity: 1,
          }}
          pane='markerPane'
          eventHandlers={{
            click: () => {
              if (onPlanificationClick) {
                onPlanificationClick(marker.planification);
              }
            },
            mouseover: (e) => {
              const layer = e.target;
              layer.setStyle({
                fillOpacity: 1,
                weight: marker.isSelected ? 4 : 3,
              });
            },
            mouseout: (e) => {
              const layer = e.target;
              layer.setStyle({
                fillOpacity: 1,
                weight: marker.isSelected ? 3 : 2,
              });
            },
          }}
        />
      ))}
      {searchLocation && (
        <Marker
          position={[searchLocation.lat, searchLocation.lng]}
          icon={createCustomIcon()}
          zIndexOffset={1000}
        >
          <Popup>
            <div style={{ minWidth: "150px" }}>
              <strong
                style={{
                  fontSize: "14px",
                  display: "block",
                  marginBottom: "8px",
                }}
              >
                Searched Location
              </strong>
              <p style={{ margin: "4px 0", fontSize: "12px", color: "#666" }}>
                {searchLocation.lat.toFixed(5)}, {searchLocation.lng.toFixed(5)}
              </p>
            </div>
          </Popup>
        </Marker>
      )}
      {parkingLocations.map((parking) => (
        <ParkingMarker
          key={parking.id}
          parking={parking}
          isSelected={selectedParkingLocationId === parking.id}
          onDelete={onParkingLocationDelete}
        />
      ))}
    </MapContainer>
  );
}
