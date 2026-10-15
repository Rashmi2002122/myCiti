import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet.markercluster';
import { CATEGORIES } from '../services/api';

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
      zoomControl: false,
    });

    // High-resolution Retina tiles (CartoDB Voyager) with automatic 2x/3x scaling on mobile screens
    const tileUrl = darkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const tileLayer = L.tileLayer(tileUrl, {
      maxZoom: 20,
      subdomains: 'abcd',
      detectRetina: true,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }).addTo(map);

    tileLayerRef.current = tileLayer;

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

  // Sync theme changes with map tiles seamlessly
  useEffect(() => {
    if (!tileLayerRef.current) return;
    const tileUrl = darkMode
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    tileLayerRef.current.setUrl(tileUrl);
  }, [darkMode]);

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
