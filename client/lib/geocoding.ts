export interface GeocodingResult {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    house_number?: string;
    suburb?: string;
    city?: string;
    municipality?: string;
    county?: string;
    state?: string;
    postcode?: string;
    country?: string;
  };
  boundingbox: [string, string, string, string];
}

export async function searchAddress(query: string): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
        new URLSearchParams({
          q: `${query}, Montreal, Quebec, Canada`,
          format: 'json',
          addressdetails: '1',
          limit: '5',
          countrycodes: 'ca',
        }),
      {
        headers: {
          'User-Agent': 'MontrealSnowPlanningApp/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Geocoding request failed');
    }

    const data: GeocodingResult[] = await response.json();
    return data;
  } catch (error) {
    console.error('Geocoding error:', error);
    return [];
  }
}

export async function reverseGeocode(lat: number, lon: number): Promise<GeocodingResult | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?` +
        new URLSearchParams({
          lat: lat.toString(),
          lon: lon.toString(),
          format: 'json',
          addressdetails: '1',
        }),
      {
        headers: {
          'User-Agent': 'MontrealSnowPlanningApp/1.0',
        },
      }
    );

    if (!response.ok) {
      throw new Error('Reverse geocoding request failed');
    }

    const data: GeocodingResult = await response.json();
    return data;
  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return null;
  }
}
