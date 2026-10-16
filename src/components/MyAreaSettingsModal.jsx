import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchMyLocation,
  updateMyLocation,
  deleteMyLocation,
  fetchVapidKey,
  subscribePush,
  unsubscribePush
} from '../services/api';
import {
  X, MapPin, Navigation, Trash2, Shield, Bell, CheckCircle2,
  AlertTriangle, Info, RefreshCw
} from 'lucide-react';

const COMMON_AREAS = [
  { name: 'Park Street', lat: 22.55, lng: 88.35 },
  { name: 'Salt Lake', lat: 22.58, lng: 88.42 },
  { name: 'New Town', lat: 22.59, lng: 88.47 },
  { name: 'Gariahat', lat: 22.52, lng: 88.36 },
  { name: 'Ballygunge', lat: 22.53, lng: 88.36 },
  { name: 'Shyambazar', lat: 22.60, lng: 88.37 },
  { name: 'Behala', lat: 22.49, lng: 88.31 },
  { name: 'Howrah', lat: 22.59, lng: 88.31 },
  { name: 'Dum Dum', lat: 22.64, lng: 88.41 },
];

export default function MyAreaSettingsModal({
  isOpen,
  onClose,
  onOpenPrivacyNotice
}) {
  const { accessToken, user } = useAuth();
  const [currentLocation, setCurrentLocation] = useState(null);
  const [areaName, setAreaName] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  useEffect(() => {
    if (isOpen && accessToken) {
      loadLocation();
    }
  }, [isOpen, accessToken]);

  const loadLocation = async () => {
    try {
      const data = await fetchMyLocation(accessToken);
      if (data) {
        setCurrentLocation(data);
        if (data.areaName) setAreaName(data.areaName);
      }
    } catch (e) {
      console.warn('Could not load location:', e);
    }
  };

  if (!isOpen) return null;

  // Method 1: Use Current Device Location (rounded to ~1 km coarse)
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      setErrorMessage('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setErrorMessage(null);
    setStatusMessage(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        // Enforce coarse ~1 km resolution: round to 2 decimal places
        const coarseLat = Math.round(pos.coords.latitude * 100.0) / 100.0;
        const coarseLng = Math.round(pos.coords.longitude * 100.0) / 100.0;

        try {
          const updated = await updateMyLocation(accessToken, {
            latitude: coarseLat,
            longitude: coarseLng,
            areaName: areaName.trim() || 'My Local Area'
          });
          setCurrentLocation(updated);
          setStatusMessage('Approximate area updated (~1 km resolution).');
        } catch (err) {
          setErrorMessage(err.message || 'Failed to save location.');
        } finally {
          setIsLocating(false);
        }
      },
      (err) => {
        setIsLocating(false);
        setErrorMessage('Location permission was denied or unavailable.');
      },
      { timeout: 10000, enableHighAccuracy: false }
    );
  };

  // Method 2: Select a Named Area or custom name
  const handleSelectArea = async (area) => {
    setIsSaving(true);
    setErrorMessage(null);
    setStatusMessage(null);
    setAreaName(area.name);

    try {
      const updated = await updateMyLocation(accessToken, {
        latitude: area.lat,
        longitude: area.lng,
        areaName: area.name
      });
      setCurrentLocation(updated);
      setStatusMessage(`Area set to ${area.name}.`);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to save area.');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Location Data & Unsubscribe
  const handleDeleteLocationData = async () => {
    if (!window.confirm('Are you sure you want to delete your stored location and remove push notification subscriptions?')) {
      return;
    }

    setIsDeleting(true);
    setErrorMessage(null);
    setStatusMessage(null);

    try {
      await deleteMyLocation(accessToken);
      setCurrentLocation(null);
      setAreaName('');

      // Also unsubscribe from browser push if registered
      if ('serviceWorker' in navigator && 'PushManager' in window) {
        try {
          const reg = await navigator.serviceWorker.ready;
          const sub = await reg.pushManager.getSubscription();
          if (sub) {
            await sub.unsubscribe();
            await unsubscribePush(accessToken, sub.endpoint);
          }
        } catch (e) {
          console.warn('Browser unsubscription cleanup:', e);
        }
      }

      setStatusMessage('Your location data and subscriptions have been completely deleted.');
    } catch (err) {
      setErrorMessage(err.message || 'Failed to delete location data.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3200] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-gradient-to-b from-[#cfe7ff] to-[#eaf4ff] dark:from-slate-900 dark:to-slate-950 p-6 rounded-[30px] max-w-md w-full shadow-2xl border border-white/60 dark:border-slate-800 animate-in zoom-in-95 duration-200 relative">
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center transition-colors shadow-soft"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-[26px] p-6 shadow-soft border border-white/60 dark:border-slate-800 space-y-5">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="w-12 h-12 bg-sky-base dark:bg-slate-800 text-city-blue rounded-full flex items-center justify-center mx-auto text-xl shadow-sm mb-1">
              <MapPin className="w-6 h-6 text-city-blue" />
            </div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
              My Area & Privacy
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Set your approximate neighborhood to receive relevant local announcements and nearby deals.
            </p>
          </div>

          {/* Messages */}
          {statusMessage && (
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-emerald-800 dark:text-emerald-200 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{statusMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-800 dark:text-rose-200 text-xs font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Current Saved Area Display */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-3.5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-1.5 text-xs">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Current Saved Area
            </div>
            {currentLocation?.coarseLat != null ? (
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-extrabold text-slate-900 dark:text-slate-100 text-sm">
                    📍 {currentLocation.areaName || 'Custom Approximate Area'}
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Coarse Grid: {currentLocation.coarseLat}° N, {currentLocation.coarseLng}° E (~1 km precision)
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                  Active
                </span>
              </div>
            ) : (
              <div className="text-slate-500 dark:text-slate-400 italic">
                No area set. You will only receive city-wide broadcasts.
              </div>
            )}
          </div>

          {/* Option A: Use Current Location */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-2xl bg-city-blue hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-2 transition-transform active:scale-[0.98] shadow-md disabled:opacity-50"
            >
              {isLocating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Obtaining Coarse Location...</span>
                </>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  <span>Use My Current Location Once (~1 km)</span>
                </>
              )}
            </button>
            <p className="text-[10px] text-center text-slate-400">
              Takes your position once and rounds it to ~1 km. Never continuous tracking.
            </p>
          </div>

          {/* Option B: Choose Popular Area */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
              Or pick your neighborhood:
            </label>
            <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {COMMON_AREAS.map((a) => (
                <button
                  type="button"
                  key={a.name}
                  onClick={() => handleSelectArea(a)}
                  disabled={isSaving}
                  className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold border text-center truncate transition-colors ${
                    currentLocation?.areaName === a.name
                      ? 'bg-city-blue text-white border-city-blue'
                      : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {a.name}
                </button>
              ))}
            </div>
          </div>

          {/* Privacy Actions */}
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2">
            {currentLocation?.coarseLat != null && (
              <button
                type="button"
                onClick={handleDeleteLocationData}
                disabled={isDeleting}
                className="w-full min-h-[40px] px-4 py-2 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-rose-200/60 dark:border-rose-900"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete My Location Data & Subscriptions</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenPrivacyNotice) onOpenPrivacyNotice();
              }}
              className="w-full py-2 text-center text-xs text-city-blue dark:text-blue-400 hover:underline font-semibold flex items-center justify-center gap-1"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Read Full Privacy Notice</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
