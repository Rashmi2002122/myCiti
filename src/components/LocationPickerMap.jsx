import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'maplibre-gl/dist/maplibre-gl.css';
import { setWorkerUrl } from 'maplibre-gl';
import workerUrl from 'maplibre-gl/dist/maplibre-gl-worker.mjs?worker&url';
import '@maplibre/maplibre-gl-leaflet';

try {
  setWorkerUrl(workerUrl);
} catch (e) {
  console.warn('Failed to set MapLibre workerUrl:', e);
}

export default function LocationPickerMap({ lat, lng, onSelectLocation }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const initialLat = lat || 20.2961;
    const initialLng = lng || 85.8245;

    const map = L.map(containerRef.current, {
      center: [initialLat, initialLng],
      zoom: 13,
      minZoom: 3,
      maxZoom: 19,
      zoomControl: false,
      attributionControl: false,
    });

    try {
      const vectorLayer = L.maplibreGL({
        style: 'https://tiles.openfreemap.org/styles/bright',
        attribution: '&copy; OpenFreeMap &copy; OpenStreetMap contributors',
      }).addTo(map);

      if (vectorLayer && vectorLayer.getMaplibreMap) {
        const glMap = vectorLayer.getMaplibreMap();
        if (glMap && typeof glMap.once === 'function') {
          glMap.once('error', (err) => {
            console.warn('MapLibre runtime error in picker, falling back to raster OSM:', err);
            try {
              if (map.hasLayer(vectorLayer)) {
                map.removeLayer(vectorLayer);
              }
              L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                subdomains: ['a', 'b', 'c'],
                attribution: '&copy; OpenStreetMap contributors',
              }).addTo(map);
            } catch (fallbackErr) {
              console.error('Failed to attach raster fallback in picker:', fallbackErr);
            }
          });
        }
      }
    } catch {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        subdomains: ['a', 'b', 'c'],
        attribution: '&copy; OpenStreetMap contributors',
      }).addTo(map);
    }

    const pinIcon = L.divIcon({
      className: 'admin-picker-pin',
      html: `
        <div style="
          width: 32px;
          height: 32px;
          border-radius: 50% 50% 50% 0;
          background: #2f7bff;
          transform: rotate(-45deg);
          border: 3px solid white;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
        ">
          <span style="transform: rotate(45deg); font-size: 14px;">📍</span>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32],
    });

    if (lat && lng) {
      markerRef.current = L.marker([lat, lng], { icon: pinIcon, draggable: true }).addTo(map);
      markerRef.current.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        onSelectLocation(pos.lat, pos.lng);
      });
    }

    map.on('click', (e) => {
      const { lat: clickLat, lng: clickLng } = e.latlng;
      if (markerRef.current) {
        markerRef.current.setLatLng([clickLat, clickLng]);
      } else {
        markerRef.current = L.marker([clickLat, clickLng], { icon: pinIcon, draggable: true }).addTo(map);
        markerRef.current.on('dragend', (evt) => {
          const pos = evt.target.getLatLng();
          onSelectLocation(pos.lat, pos.lng);
        });
      }
      onSelectLocation(clickLat, clickLng);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update marker position when lat/lng change externally
  useEffect(() => {
    if (mapRef.current && lat && lng) {
      if (markerRef.current) {
        markerRef.current.setLatLng([lat, lng]);
      }
      mapRef.current.panTo([lat, lng]);
    }
  }, [lat, lng]);

  return (
    <div className="relative w-full h-64 rounded-2xl overflow-hidden border border-slate-300 dark:border-slate-700 shadow-inner">
      <div ref={containerRef} className="w-full h-full" />
      <div className="absolute top-2 right-2 z-[500] bg-white/90 dark:bg-slate-900/90 backdrop-blur-xs px-2.5 py-1 rounded-full text-[11px] font-bold text-slate-700 dark:text-slate-300 shadow">
        Click map or drag pin
      </div>
    </div>
  );
}
