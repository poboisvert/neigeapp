"use client";

import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, GeoJSON, CircleMarker, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { PlanificationResponse } from "@/lib/api";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const createCustomIcon = () => {
  return L.divIcon({
    className: '',
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

interface SnowMapProps {
  planifications: PlanificationResponse[];
  selectedPlanification?: PlanificationResponse | null;
  darkMode?: boolean;
  searchLocation?: { lat: number; lng: number; zoom?: number } | null;
  zoomTrigger?: number;
  onPlanificationClick?: (planification: PlanificationResponse) => void;
}

function FitBounds({ features }: { features: any[] }) {
  const map = useMap();

  useEffect(() => {
    if (features.length === 0) return;

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
      maxZoom: 15,
    });
  }, [map, features]);

  return null;
}

function ZoomToSelected({ selected, trigger }: { selected: PlanificationResponse | null | undefined; trigger?: number }) {
  const map = useMap();

  useEffect(() => {
    if (!selected?.streetFeature?.geometry?.coordinates) return;

    const coords = selected.streetFeature.geometry.coordinates;
    const bounds = L.latLngBounds([]);

    coords.forEach((coord: [number, number]) => {
      bounds.extend([coord[1], coord[0]]);
    });

    if (!bounds.isValid()) return;

    map.fitBounds(bounds, {
      padding: [100, 100],
      maxZoom: 17,
    });
  }, [map, selected, trigger]);

  return null;
}

function ZoomToSearch({ location }: { location: { lat: number; lng: number; zoom?: number } | null | undefined }) {
  const map = useMap();

  useEffect(() => {
    if (!location) return;

    map.setView([location.lat, location.lng], location.zoom || 16, {
      animate: true,
      duration: 1,
    });
  }, [map, location]);

  return null;
}

function getStatusColor(etatDeneig: number): string {
  const colorMap: Record<number, string> = {
    1: "#22c55e",
    2: "#3b82f6",
    3: "#f59e0b",
    4: "#8b5cf6",
    5: "#ef4444",
    10: "#06b6d4",
  };
  return colorMap[etatDeneig] || "#6b7280";
}

function calculateCenterPoint(coordinates: [number, number][]): [number, number] | null {
  if (!coordinates || coordinates.length === 0) return null;

  const bounds = L.latLngBounds(coordinates.map(coord => [coord[1], coord[0]]));
  const center = bounds.getCenter();
  return [center.lat, center.lng];
}

export default function SnowMap({ planifications, selectedPlanification, darkMode = false, searchLocation, zoomTrigger, onPlanificationClick }: SnowMapProps) {
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
      .map(p => `${p.coteRueId}-${p.etatDeneig}`)
      .join('|');
  }, [planifications]);

  const centerMarkers = useMemo(() => {
    return planifications
      .filter((p) => p.streetFeature?.geometry?.coordinates)
      .map((p) => {
        const center = calculateCenterPoint(p.streetFeature!.geometry.coordinates);
        if (!center) return null;
        return {
          position: center,
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
    const isSelected = selectedPlanification?.coteRueId === feature?.properties?.COTE_RUE_ID;

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
        <p style="margin: 4px 0;"><strong>Adresse:</strong> ${props.DEBUT_ADRESSE}${props.FIN_ADRESSE !== props.DEBUT_ADRESSE ? ` - ${props.FIN_ADRESSE}` : ""}</p>
        ${props.dateMaj ? `<p style="margin: 4px 0;"><strong>Dernière mise à jour:</strong><br/>${new Date(props.dateMaj).toLocaleString('fr-CA')}</p>` : ""}
        <p style="margin: 4px 0; font-size: 0.85em; color: #666;">
          ID: ${props.COTE_RUE_ID}
        </p>
      </div>
    `;
    layer.bindPopup(popupContent);

    if (onPlanificationClick) {
      layer.on('click', () => {
        const planif = planifications.find(p => p.coteRueId === props.coteRueId);
        if (planif) {
          onPlanificationClick(planif);
        }
      });
    }
  };

  if (geoJsonFeatures.length === 0) {
    return (
      <div className={`flex h-full w-full items-center justify-center ${darkMode ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <p className={darkMode ? 'text-gray-400' : 'text-gray-600'}>Aucune donnée géographique disponible</p>
      </div>
    );
  }

  return (
    <MapContainer
      center={defaultCenter}
      zoom={12}
      style={{ height: "100%", width: "100%" }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
        url={darkMode
          ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        }
      />
      <FitBounds features={geoJsonFeatures} />
      <ZoomToSelected selected={selectedPlanification} trigger={zoomTrigger} />
      <ZoomToSearch location={searchLocation} />
      <GeoJSON
        key={`${selectedPlanification?.coteRueId || 'all'}-${dataHash}`}
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
            color: 'white',
            weight: marker.isSelected ? 3 : 2,
            opacity: 1,
          }}
          pane="markerPane"
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
            <div style={{ minWidth: '150px' }}>
              <strong style={{ fontSize: '14px', display: 'block', marginBottom: '8px' }}>Searched Location</strong>
              <p style={{ margin: '4px 0', fontSize: '12px', color: '#666' }}>
                {searchLocation.lat.toFixed(5)}, {searchLocation.lng.toFixed(5)}
              </p>
            </div>
          </Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
