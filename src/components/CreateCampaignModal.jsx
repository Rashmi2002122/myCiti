import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Sparkles, MapPin, Users, Calendar, AlertCircle,
  CheckCircle2, ArrowRight, ShieldCheck, Info
} from 'lucide-react';
import {
  fetchMySubmissions,
  createAdCampaign,
  fetchAudienceEstimate
} from '../services/api';
import { useAuth } from '../context/AuthContext';
import { CITIES } from './TopBar';

export default function CreateCampaignModal({
  isOpen,
  onClose,
  initialListingId,
  onCampaignCreated
}) {
  const { accessToken, isAuthenticated, canPost } = useAuth();
  const [approvedListings, setApprovedListings] = useState([]);
  const [selectedListingId, setSelectedListingId] = useState(initialListingId || '');
  const [isLoadingListings, setIsLoadingListings] = useState(false);

  // Form Fields
  const [headline, setHeadline] = useState('');
  const [description, setDescription] = useState('');
  const [callToAction, setCallToAction] = useState('Visit Listing');
  const [targetType, setTargetType] = useState('RADIUS'); // RADIUS | CITY
  const [radiusKm, setRadiusKm] = useState(3.0);
  const [targetCity, setTargetCity] = useState('Kolkata');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().split('T')[0];
  });

  // Audience Estimate
  const [audienceEstimate, setAudienceEstimate] = useState(null);
  const [isLoadingEstimate, setIsLoadingEstimate] = useState(false);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Load approved listings for current Client
  useEffect(() => {
    if (!isOpen || !accessToken || !canPost) return;
    async function loadListings() {
      try {
        setIsLoadingListings(true);
        const subs = await fetchMySubmissions(accessToken, 'APPROVED');
        // Only consider items that have an approved listingId
        const valid = subs.filter((s) => s.listingId);
        setApprovedListings(valid);
        if (valid.length > 0 && !selectedListingId) {
          setSelectedListingId(valid[0].listingId);
          setHeadline(`Special Offer at ${valid[0].title}`);
          setDescription(valid[0].description || '');
        }
      } catch (err) {
        console.error('Failed to load approved listings:', err);
      } finally {
        setIsLoadingListings(false);
      }
    }
    loadListings();
  }, [isOpen, accessToken, canPost]);

  // When initialListingId changes
  useEffect(() => {
    if (initialListingId) {
      setSelectedListingId(initialListingId);
    }
  }, [initialListingId]);

  // Find currently selected listing object
  const activeListing = approvedListings.find(
    (l) => Number(l.listingId) === Number(selectedListingId)
  );

  // Update audience estimate when targeting params change
  const refreshEstimate = useCallback(async () => {
    if (!activeListing) return;
    try {
      setIsLoadingEstimate(true);
      const params = {
        targetType,
        radiusKm: targetType === 'RADIUS' ? radiusKm : null,
        lat: activeListing.latitude || 22.5726,
        lng: activeListing.longitude || 88.3639,
        areaName: targetType === 'CITY' ? targetCity : null
      };
      const res = await fetchAudienceEstimate(params);
      setAudienceEstimate(res);
    } catch (err) {
      console.warn('Could not fetch audience estimate:', err);
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
    if (!selectedListingId) {
      setError('Please select an approved listing to promote.');
      return;
    }
    if (!headline.trim()) {
      setError('Please enter an ad headline.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError('');

      const payload = {
        listingId: Number(selectedListingId),
        headline: headline.trim(),
        description: description.trim() || null,
        callToAction: callToAction.trim() || 'Visit Listing',
        targetType,
        radiusKm: targetType === 'RADIUS' ? Number(radiusKm) : null,
        targetAreaName: targetType === 'CITY' ? targetCity : null,
        startDate,
        endDate
      };

      await createAdCampaign(accessToken, payload);
      setIsSuccess(true);
      if (onCampaignCreated) onCampaignCreated();
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
      }, 1600);
    } catch (err) {
      console.error('Failed to create campaign:', err);
      setError(err.message || 'Failed to create campaign.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3100] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-lg w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 relative my-6 max-h-[90vh] flex flex-col">
        {/* Header Close */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-500 flex items-center justify-center">
            <Sparkles className="w-6 h-6 fill-amber-500" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Create Geo-Targeted Ad Campaign
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Promote your approved listing to people in your area
            </p>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-12 text-center space-y-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 mx-auto flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Campaign Created!
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Your campaign has been submitted for review. Once approved, it will appear as a sponsored placement in the feed and map.
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

            {/* Select Listing */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Select Your Approved Listing *
              </label>
              {approvedListings.length === 0 ? (
                <div className="p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 text-amber-800 dark:text-amber-200 text-xs">
                  <p className="font-semibold">No approved listings found.</p>
                  <p className="mt-1 text-[11px] opacity-80">
                    You can only promote listings that have been reviewed and approved by our moderation team.
                  </p>
                </div>
              ) : (
                <select
                  value={selectedListingId}
                  onChange={(e) => {
                    const id = e.target.value;
                    setSelectedListingId(id);
                    const l = approvedListings.find((x) => Number(x.listingId) === Number(id));
                    if (l) {
                      setHeadline(`Special Highlight: ${l.title}`);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
                >
                  {approvedListings.map((l) => (
                    <option key={l.listingId} value={l.listingId}>
                      {l.title} ({l.landmark || l.address})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Headline */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Ad Headline * (max 80 chars)
              </label>
              <input
                type="text"
                value={headline}
                onChange={(e) => setHeadline(e.target.value.slice(0, 80))}
                required
                placeholder="e.g. 50% Off Festive Collection at Park Street!"
                className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Description / Promo Details (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                rows={2}
                placeholder="Share key highlights, special offers, or event details..."
                className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            {/* Call To Action */}
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                Call to Action Button Text
              </label>
              <input
                type="text"
                value={callToAction}
                onChange={(e) => setCallToAction(e.target.value.slice(0, 30))}
                placeholder="e.g. Visit Listing, Claim Offer, View Location"
                className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 font-medium focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              />
            </div>

            {/* Targeting Model */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-city-blue" />
                  <span>Target Area</span>
                </span>
                <div className="flex items-center gap-1 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setTargetType('RADIUS')}
                    className={`px-3 py-1 rounded-full transition-colors ${
                      targetType === 'RADIUS'
                        ? 'bg-city-blue text-white'
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Radius (km)
                  </button>
                  <button
                    type="button"
                    onClick={() => setTargetType('CITY')}
                    className={`px-3 py-1 rounded-full transition-colors ${
                      targetType === 'CITY'
                        ? 'bg-city-blue text-white'
                        : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                    }`}
                  >
                    Whole City
                  </button>
                </div>
              </div>

              {targetType === 'RADIUS' ? (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
                    <span>Target Radius around listing:</span>
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
                  <div className="flex justify-between text-[10px] text-slate-400">
                    <span>0.5 km (Hyper-local)</span>
                    <span>10 km</span>
                    <span>25 km (Regional)</span>
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">City / Area Name</label>
                  <select
                    value={targetCity}
                    onChange={(e) => setTargetCity(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-bold"
                  >
                    {CITIES.filter((c) => c.id !== 'ALL').map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Privacy-safe Audience Estimation Box */}
              <div className="p-3 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">
                      Estimated Audience
                    </div>
                    <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                      {isLoadingEstimate ? 'Estimating...' : (audienceEstimate?.rangeLabel || '10 – 50 people')}
                    </div>
                  </div>
                </div>
                <div className="text-[9px] text-slate-400 max-w-[130px] text-right">
                  Privacy-safe aggregate range. User identities never shared.
                </div>
              </div>
            </div>

            {/* Campaign Schedule */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  Start Date *
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                  End Date *
                </label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs"
                />
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
                disabled={isSubmitting || approvedListings.length === 0}
                className="px-6 py-2.5 rounded-2xl text-xs font-extrabold bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white shadow-soft transition-all active:scale-95 disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Campaign'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
