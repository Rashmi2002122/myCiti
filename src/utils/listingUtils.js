/**
 * Utility functions for listing management in myCiti.
 */

/**
 * Returns current date and time in Asia/Kolkata timezone.
 *
 * @returns {{ dateStr: string, timeStr: string }} date as 'YYYY-MM-DD', time as 'HH:mm'
 */
export function getKolkataDateTime() {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const parts = formatter.formatToParts(now);
  const map = {};
  for (const p of parts) {
    map[p.type] = p.value;
  }
  const dateStr = `${map.year}-${map.month}-${map.day}`;
  const timeStr = `${map.hour}:${map.minute}`;
  return { dateStr, timeStr };
}


/**
 * Checks if an event is completely over (finished in the past).
 *
 * @param {Object} listing - Listing object with endDate, status, and dailyCloseTime
 * @returns {boolean} true if event has already ended
 */
export function isEventOver(listing) {
  if (!listing) return true;
  if (listing.status && listing.status !== 'PUBLISHED') return true;

  const { dateStr: todayStr, timeStr: currentTimeStr } = getKolkataDateTime();

  // 1. Past scheduled end date
  if (listing.endDate && listing.endDate < todayStr) {
    return true;
  }

  // 2. Final day and operating close time has passed (standard daytime hours)
  if (listing.endDate === todayStr && listing.dailyCloseTime && listing.dailyOpenTime) {
    const open = listing.dailyOpenTime.slice(0, 5);
    const close = listing.dailyCloseTime.slice(0, 5);
    if (open < close && currentTimeStr > close) {
      return true;
    }
  }

  return false;
}


/**
 * Filter listings for Map and General views:
 * Removes completely over/expired events, and deduplicates multiple posts from the same client
 * so the map stays clean and uncluttered.
 *
 * @param {Array} listings - List of listing response objects
 * @returns {Array} Clean deduplicated listings
 */
export function filterUniqueClientListings(listings) {
  if (!Array.isArray(listings) || listings.length === 0) return [];

  // Exclude events that are already over
  const activeListings = listings.filter((item) => !isEventOver(item));

  const clientMap = new Map();
  const standalone = [];

  for (const item of activeListings) {
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
      // Sort by createdAt descending, fallback to id descending
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

/**
 * Filter listings specifically for Explore (HomeView / Highlights):
 * Excludes any event that is closed or over, so only currently LIVE and open events
 * appear in Explore. Deduplicates client posts to prioritize the latest live post.
 *
 * @param {Array} listings - List of listing response objects
 * @returns {Array} Clean live listings for Explore
 */
export function filterExploreListings(listings) {
  if (!Array.isArray(listings) || listings.length === 0) return [];

  // Deduplicate client listings: filterUniqueClientListings excludes over events and shows most recent post per client
  return filterUniqueClientListings(listings);
}
