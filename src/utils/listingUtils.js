/**
 * Utility functions for listing management in myCiti.
 */

/**
 * Filter listings for Map and Explore views:
 * If a client has posted multiple listings (e.g. 2 posts), display only the most recent post
 * and exclude older posts so that map and explore stay clean and uncluttered.
 * Standalone listings (such as community pandals without client profiles) are preserved.
 *
 * @param {Array} listings - List of listing response objects
 * @returns {Array} Clean deduplicated listings
 */
export function filterUniqueClientListings(listings) {
  if (!Array.isArray(listings) || listings.length === 0) return [];

  const clientMap = new Map();
  const standalone = [];

  for (const item of listings) {
    const clientKey = item.clientProfileId || item.clientSlug;
    if (!clientKey) {
      standalone.push(item);
    } else {
      if (!clientMap.has(clientKey)) {
        clientMap.set(clientKey, []);
      }
      clientMap.get(clientKey).push(item);
    }
  }

  const result = [];
  for (const clientListings of clientMap.values()) {
    if (clientListings.length === 1) {
      result.push(clientListings[0]);
    } else {
      // Sort by createdAt descending, fallback to id descending to find the recent post
      clientListings.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          const diff = new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          if (diff !== 0) return diff;
        }
        return (b.id || 0) - (a.id || 0);
      });

      const mostRecent = {
        ...clientListings[0],
        hasOtherUpdates: true,
        otherUpdatesCount: clientListings.length - 1
      };
      result.push(mostRecent);
    }
  }

  const combined = [...standalone, ...result];

  // Preserve distance sorting when distanceKm is present
  const hasDistance = combined.some((item) => item.distanceKm !== undefined && item.distanceKm !== null);
  if (hasDistance) {
    combined.sort((a, b) => {
      const distA = a.distanceKm !== undefined && a.distanceKm !== null ? a.distanceKm : Infinity;
      const distB = b.distanceKm !== undefined && b.distanceKm !== null ? b.distanceKm : Infinity;
      return distA - distB;
    });
  }

  return combined;
}
