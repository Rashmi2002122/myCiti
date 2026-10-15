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
function createCustomPin(category) {
  const cfg = CATEGORIES[category] || CATEGORIES.PANDAL;
  const html = `
    <div style="
      background-color: ${cfg.color};
      width: 38px;
      height: 38px;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(0,0,0,0.25);
      border: 2px solid #ffffff;
      cursor: pointer;
      transition: transform 0.15s ease-in-out;
    ">
      <span style="
        transform: rotate(45deg);
        font-size: 17px;
        display: block;
        user-select: none;
      ">${cfg.icon}</span>
    </div>
  `;

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: html,
    iconSize: [38, 38],
    iconAnchor: [19, 38],
    popupAnchor: [0, -38]
  });
}

export default function MapView({ listings, onSelectListing, userLocation, targetCity = null, darkMode = false }) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const clusterGroupRef = useRef(null);
  const userMarkerRef = useRef(null);

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

      // Async runtime safety: if WebGL or worker encounters an error, gracefully swap to raster tiles
      if (vectorLayer && vectorLayer.getMaplibreMap) {
        const glMap = vectorLayer.getMaplibreMap();
        if (glMap && typeof glMap.once === 'function') {
          glMap.once('error', (err) => {
            console.warn('MapLibre runtime error, falling back to raster OSM:', err);
            try {
              if (map.hasLayer(vectorLayer)) {
                map.removeLayer(vectorLayer);
              }
              const rasterFallback = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                subdomains: ['a', 'b', 'c'],
                attribution: '&copy; OpenStreetMap contributors',
              }).addTo(map);
              tileLayerRef.current = rasterFallback;
            } catch (fallbackErr) {
              console.error('Failed to attach raster fallback:', fallbackErr);
            }
          });
        }
      }
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

    // Marker cluster group
    const clusterGroup = L.markerClusterGroup({
      showCoverageOnHover: false,
      maxClusterRadius: 45,
      spiderfyOnMaxZoom: true,
      zoomToBoundsOnClick: true,
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



  // Update Markers when listings change
  useEffect(() => {
    if (!clusterGroupRef.current) return;

    const clusterGroup = clusterGroupRef.current;
    clusterGroup.clearLayers();

    listings.forEach((listing) => {
      if (listing.latitude && listing.longitude) {
        const icon = createCustomPin(listing.category);
        const marker = L.marker([listing.latitude, listing.longitude], { icon });

        marker.on('click', () => {
          onSelectListing(listing);
        });

        clusterGroup.addLayer(marker);
      }
    });
  }, [listings, onSelectListing]);

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

  // Fly to selected city
  useEffect(() => {
    if (!mapInstanceRef.current || !targetCity) return;
    const map = mapInstanceRef.current;
    if (targetCity.lat && targetCity.lng) {
      map.flyTo([targetCity.lat, targetCity.lng], targetCity.zoom || 12, { duration: 1.4 });
    }
  }, [targetCity]);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full z-0" />
    </div>
  );
}
