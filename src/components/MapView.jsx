import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import 'maplibre-gl/dist/maplibre-gl.css';
import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import '@maplibre/maplibre-gl-leaflet';
import { CATEGORIES } from '../services/api';

// Configure Web Worker for MapLibre GL
try {
  setWorkerUrl(workerUrl);
} catch (e) {
  console.warn('Failed to set MapLibre workerUrl:', e);
}

// Create custom colored pin with emoji icon
function createCustomPin(category, isSponsored = false) {
  const cfg = CATEGORIES[category] || CATEGORIES.PANDAL;
  const borderColor = isSponsored ? '#f59e0b' : '#ffffff';
  const shadow = isSponsored
    ? '0 0 14px rgba(245, 158, 11, 0.8), 0 4px 12px rgba(0,0,0,0.35)'
    : '0 4px 12px rgba(0,0,0,0.25)';

  const html = `
    <div style="
      position: relative;
      background-color: ${cfg.color};
      width: ${isSponsored ? '42px' : '38px'};
      height: ${isSponsored ? '42px' : '38px'};
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: ${shadow};
      border: ${isSponsored ? '3px' : '2px'} solid ${borderColor};
      cursor: pointer;
      transition: transform 0.15s ease-in-out;
    ">
      <span style="
        transform: rotate(45deg);
        font-size: ${isSponsored ? '19px' : '17px'};
        display: block;
        user-select: none;
      ">${cfg.icon}</span>
      ${
        isSponsored
          ? `<div style="
              position: absolute;
              top: -6px;
              right: -6px;
              transform: rotate(45deg);
              background: #f59e0b;
              color: #ffffff;
              font-size: 8px;
              font-weight: 900;
              font-family: system-ui, sans-serif;
              border-radius: 999px;
              padding: 1px 4px;
              border: 1.5px solid #ffffff;
              box-shadow: 0 2px 4px rgba(0,0,0,0.25);
              letter-spacing: 0.5px;
            ">AD</div>`
          : ''
      }
    </div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: html,
    iconSize: isSponsored ? [42, 42] : [38, 38],
    iconAnchor: isSponsored ? [21, 42] : [19, 38],
    popupAnchor: [0, isSponsored ? -42 : -38]
  });
}

export default function MapView({
  listings,
  onSelectListing,
  userLocation,
  targetCity = null,
  darkMode = false,
  sponsoredListingIds = [],
  isVisible = true
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const clusterGroupRef = useRef(null);
  const userMarkerRef = useRef(null);
  const onSelectListingRef = useRef(onSelectListing);
  const prevCityKeyRef = useRef(null);

  // Keep callback ref updated without triggering marker rebuilds
  useEffect(() => {
    onSelectListingRef.current = onSelectListing;
  }, [onSelectListing]);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Kolkata Center: 22.5726, 88.3639
    const map = L.map(mapContainerRef.current, {
      center: [22.5726, 88.3639],
      zoom: 12.5,
      minZoom: 3,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: false,
      preferCanvas: true,
    });

    // Native GPU Vector Map via OpenFreeMap: 100% vector-sharp on mobile retina screens, zero blurriness, no API key required
    let vectorLayer;
    try {
      const styleUrl = darkMode
        ? 'https://tiles.openfreemap.org/styles/positron'
        : 'https://tiles.openfreemap.org/styles/bright';

      vectorLayer = L.maplibreGL({
        style: styleUrl,
        attribution: '&copy; <a href="https://openfreemap.org">OpenFreeMap</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
    } catch (e) {
      console.warn('MapLibre GL initialization error, falling back to raster OSM:', e);
      vectorLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
    }

    tileLayerRef.current = vectorLayer;

    // Invalidate size on initial mount and on window resize/orientationchange to guarantee no blank space on mobile
    const invalidate = () => {
      map.invalidateSize();
    };
    const t1 = setTimeout(invalidate, 100);
    const t2 = setTimeout(invalidate, 400);

    window.addEventListener('resize', invalidate);
    window.addEventListener('orientationchange', invalidate);

    // Marker cluster group with high-performance mobile options
    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
      chunkedLoading: true,
      chunkInterval: 100,
      chunkDelay: 10,
      removeOutsideVisibleBounds: true,
      animate: false,
      animateAddingMarkers: false,
    });

    map.addLayer(clusterGroup);

    mapInstanceRef.current = map;
    clusterGroupRef.current = clusterGroup;

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      window.removeEventListener('resize', invalidate);
      window.removeEventListener('orientationchange', invalidate);
      map.remove();
      mapInstanceRef.current = null;
      tileLayerRef.current = null;
      clusterGroupRef.current = null;
      userMarkerRef.current = null;
    };
  }, []);

  // When map becomes visible after tab switch, re-calculate viewport size instantly
  useEffect(() => {
    if (isVisible && mapInstanceRef.current) {
      setTimeout(() => {
        mapInstanceRef.current?.invalidateSize();
      }, 50);
    }
  }, [isVisible]);

  // Dynamically switch vector style when darkMode prop changes
  useEffect(() => {
    if (!tileLayerRef.current) return;
    try {
      const maplibreMap = tileLayerRef.current.getMaplibreMap?.();
      if (maplibreMap) {
        const styleUrl = darkMode
          ? 'https://tiles.openfreemap.org/styles/positron'
          : 'https://tiles.openfreemap.org/styles/bright';
        maplibreMap.setStyle(styleUrl);
      }
    } catch (e) {
      console.warn('Failed to dynamically switch MapLibre style:', e);
    }
  }, [darkMode]);

  // Update Markers when listings change (batched via addLayers for 60fps smoothness)
  useEffect(() => {
    if (!clusterGroupRef.current) return;

    const clusterGroup = clusterGroupRef.current;
    clusterGroup.clearLayers();

    const markers = [];
    listings.forEach((listing) => {
      if (listing.latitude && listing.longitude) {
        const isSponsored = sponsoredListingIds.includes(listing.id);
        const icon = createCustomPin(listing.category, isSponsored);
        const marker = L.marker([listing.latitude, listing.longitude], { icon });

        marker.on('click', () => {
          if (onSelectListingRef.current) {
            onSelectListingRef.current(listing);
          }
        });

        markers.push(marker);
      }
    });

    if (markers.length > 0) {
      clusterGroup.addLayers(markers);
    }
  }, [listings, sponsoredListingIds]);

  // Update User Location pin & pan
  useEffect(() => {
    if (!mapInstanceRef.current || !userLocation) return;
    const map = mapInstanceRef.current;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    } else {
      const userIcon = L.divIcon({
        className: 'user-loc-marker',
        html: `
          <div style="
            width: 18px;
            height: 18px;
            border-radius: 9999px;
            background: #2f7bff;
            border: 3px solid white;
            box-shadow: 0 0 0 6px rgba(47, 123, 255, 0.35);
          "></div>
        `,
        iconSize: [18, 18],
        iconAnchor: [9, 9],
      });

      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], { icon: userIcon }).addTo(map);
    }

    map.flyTo([userLocation.lat, userLocation.lng], 14, { duration: 1.2 });
  }, [userLocation]);

  // Fly to selected city only when city actually changes
  useEffect(() => {
    if (!mapInstanceRef.current || !targetCity || !targetCity.lat || !targetCity.lng) return;
    const key = `${targetCity.lat},${targetCity.lng},${targetCity.zoom || 12}`;
    if (prevCityKeyRef.current === key) return;

    // Skip the flyTo on initial page load so camera doesn't jerk
    if (prevCityKeyRef.current === null) {
      prevCityKeyRef.current = key;
      return;
    }

    prevCityKeyRef.current = key;
    const map = mapInstanceRef.current;
    map.flyTo([targetCity.lat, targetCity.lng], targetCity.zoom || 12, { duration: 1.2 });
  }, [targetCity]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
}
