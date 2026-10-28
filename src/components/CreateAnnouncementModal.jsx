import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Bell, MapPin, Users, AlertCircle, CheckCircle2,
  Send, Sparkles, Radio
} from 'lucide-react';
import {
  fetchMySubmissions,
  createAnnouncement,
  fetchAudienceEstimate
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CITIES } from '../constants/cities';

export default function CreateAnnouncementModal({
  isOpen,
  onClose,
  initialListingId,
  onAnnouncementCreated
}) {
  const { accessToken, isAdmin, isClient, canPost } = useAuth();
  const [approvedListings, setApprovedListings] = useState([]);
  const [selectedListingId, setSelectedListingId] = useState(initialListingId || '');

  // Form Fields
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [expiryHours, setExpiryHours] = useState(6);
  const [targetType, setTargetType] = useState(isAdmin ? 'BROADCAST' : 'RADIUS');
  const [radiusKm, setRadiusKm] = useState(3.0);
  const [targetCity, setTargetCity] = useState('Bhubaneswar');

  // Audience Estimate
  const [audienceEstimate, setAudienceEstimate] = useState(null);
  const [isLoadingEstimate, setIsLoadingEstimate] = useState(false);

  // Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Load approved listings for current Client
  useEffect(() => {
    if (!isOpen || !accessToken || !canPost) return;
    async function loadListings() {
      try {
        const subs = await fetchMySubmissions(accessToken, 'APPROVED');
        const valid = subs.filter((s) => s.listingId);
        setApprovedListings(valid);
        if (valid.length > 0 && !selectedListingId) {
          setSelectedListingId(valid[0].listingId);
        }
      } catch (err) {
        console.error('Failed to load listings:', err);
      }
    }
    loadListings();
  }, [isOpen, accessToken, canPost]);

  const activeListing = approvedListings.find(
    (l) => Number(l.listingId) === Number(selectedListingId)
  );

  // Refresh audience estimate
  const refreshEstimate = useCallback(async () => {
    try {
      setIsLoadingEstimate(true);
      const lat = activeListing ? activeListing.latitude : 22.5726;
      const lng = activeListing ? activeListing.longitude : 88.3639;

      const params = {
        targetType,
        radiusKm: targetType === 'RADIUS' ? radiusKm : null,
        lat,
        lng,
        areaName: targetType === 'CITY' || targetType === 'BROADCAST' ? targetCity : null
      };
      const res = await fetchAudienceEstimate(params);
      setAudienceEstimate(res);
    } catch (err) {
      console.warn('Estimate failed:', err);
    } finally {
      setIsLoadingEstimate(false);
    }
  }, [activeListing, targetType, radiusKm, targetCity]);

  useEffect(() => {
    refreshEstimate();
  }, [refreshEstimate]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setError('Please provide both title and announcement message.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const lat = activeListing ? activeListing.latitude : 22.5726;
      const lng = activeListing ? activeListing.longitude : 88.3639;

      const payload = {
        listingId: selectedListingId ? Number(selectedListingId) : null,
        title: title.trim(),
        message: message.trim(),
        targetType,
        radiusKm: targetType === 'RADIUS' ? Number(radiusKm) : 5.0,
        targetLat: targetType === 'RADIUS' ? lat : null,
        targetLng: targetType === 'RADIUS' ? lng : null,
        targetCity: targetType === 'CITY' || targetType === 'BROADCAST' ? targetCity : (activeListing?.city || 'Bhubaneswar'),
        targetAreaName: targetType === 'CITY' || targetType === 'BROADCAST' ? targetCity : (activeListing?.city || 'Bhubaneswar'),
        expiresHours: Number(expiryHours)
      };

      await createAnnouncement(accessToken, payload);

      setIsSuccess(true);
      if (onAnnouncementCreated) onAnnouncementCreated();
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1600);
    } catch (err) {
      console.error('Failed to create announcement:', err);
      setError(err.message || 'Failed to dispatch announcement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3100] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#10141c] rounded-[24px] max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-[#303139] animate-in zoom-in-95 duration-160 relative my-6 max-h-[90vh] flex flex-col text-slate-900 dark:text-[#f4f5f7]">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 dark:bg-[#101522] text-slate-700 dark:text-[#f4f5f7] hover:border-[#ff951f]/50 flex items-center justify-center transition-all border border-slate-200 dark:border-[#303139] cursor-pointer active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-city-blue flex items-center justify-center">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-base font-medium tracking-tight text-slate-900 dark:text-[#f4f5f7]">
              Send Community Announcement
            </h2>
            <p className="text-xs font-mono text-slate-500 dark:text-[#c9ced8]">
              Web Push & In-App notifications to people in your area
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Announcement Dispatched!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              {isAdmin
                ? 'Your announcement has been sent to nearby community members.'
                : 'Your announcement has been submitted for review. Once approved, it will be dispatched immediately.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto pr-1 space-y-4">
            {error && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* If Client, or Admin linking a listing */}
            {approvedListings.length > 0 && (
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Associated Listing (Optional for Admin, Required for Client)
                </label>
                <select
                  value={selectedListingId}
                  onChange={(e) => setSelectedListingId(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 font-bold"
                >
                  {isAdmin && <option value="">-- No specific listing (City Broadcast) --</option>}
                  {approvedListings.map((l) => (
                    <option key={l.listingId} value={l.listingId}>
                      {l.title} ({l.landmark})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Announcement Title */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Announcement Title * (e.g. Aarti starts 7 PM)
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                required
                placeholder="e.g. Maha Aarti starts at 7:30 PM tonight!"
                className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-city-blue/30"
              />
            </div>

            {/* Message Body */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Message Body * (max 280 chars)
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value.slice(0, 280))}
                required
                rows={3}
                placeholder="Join us with your family for live dhak recital, special bhog distribution, and evening lamp lighting..."
                className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-city-blue/30"
              />
            </div>

            {/* Duration / Expiry */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Active For
                </label>
                <select
                  value={expiryHours}
                  onChange={(e) => setExpiryHours(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                >
                  <option value={2}>2 Hours (Immediate alert)</option>
                  <option value={6}>6 Hours (Evening event)</option>
                  <option value={12}>12 Hours (Full day)</option>
                  <option value={24}>24 Hours (Next day)</option>
                  <option value={48}>48 Hours (Weekend special)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Target Scope
                </label>
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => setTargetType('BROADCAST')}
                      className={`px-2.5 py-2 rounded-xl flex-1 text-center transition-colors ${
                        targetType === 'BROADCAST'
                          ? 'bg-city-blue text-white'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                      }`}
                    >
                      Broadcast
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setTargetType('RADIUS')}
                    className={`px-2.5 py-2 rounded-xl flex-1 text-center transition-colors ${
                      targetType === 'RADIUS'
                        ? 'bg-city-blue text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Radius
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('CITY')}
                    className={`px-2.5 py-2 rounded-xl flex-1 text-center transition-colors ${
                      targetType === 'CITY'
                        ? 'bg-city-blue text-white'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    City
                  </button>
                </div>
              </div>
            </div>

            {/* Target Area Details */}
            {targetType === 'RADIUS' && (
              <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-1.5">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                  <span>Send to people within:</span>
                  <span className="font-black text-city-blue">{radiusKm} km</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="25.0"
                  step="0.5"
                  value={radiusKm}
                  onChange={(e) => setRadiusKm(parseFloat(e.target.value))}
                  className="w-full accent-city-blue"
                />
              </div>
            )}

            {/* Audience Estimate */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-city-blue flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase text-slate-400">
                    Targeted Audience
                  </div>
                  <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                    {isLoadingEstimate ? 'Estimating...' : (audienceEstimate?.rangeLabel || '10 – 50 people')}
                  </div>
                </div>
              </div>
              <div className="text-[9px] text-slate-400 max-w-[130px] text-right">
                Delivered via Web Push and In-App inbox.
              </div>
            </div>

            {/* Submit */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 rounded-2xl text-xs font-extrabold bg-city-blue hover:bg-blue-600 text-white shadow-soft transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Sending...' : 'Send Announcement'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
