import { CITIES, DEFAULT_LOCATION } from '../constants/cities';

/**
 * Calculates distance in kilometers between two coordinates using Haversine formula.
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find closest city from supported CITIES list.
 */
export function findClosestCity(lat, lng) {
  let closest = DEFAULT_LOCATION;
  let minDistance = Infinity;

  // Skip "ALL" (index 0)
  for (let i = 1; i < CITIES.length; i++) {
    const city = CITIES[i];
    const dist = calculateDistanceKm(lat, lng, city.lat, city.lng);
    if (dist < minDistance) {
      minDistance = dist;
      closest = city;
    }
  }

  return { city: closest, distanceKm: minDistance };
}

/**
 * Reverse geocode coordinate to get area/city name using free client reverse geocoding or fallback to closest city.
 */
export async function reverseGeocodeCity(lat, lng) {
  try {
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`, {
      signal: AbortSignal.timeout(3000)
    });
    if (res.ok) {
      const data = await res.json();
      const detectedName = data.city || data.locality || data.principalSubdivision;
      if (detectedName) {
        return detectedName;
      }
    }
  } catch {
    // Fallback to closest known city
  }

  const { city } = findClosestCity(lat, lng);
  return city.name;
}
