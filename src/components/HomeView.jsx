import React, { useState, useEffect } from 'react';
import { Sparkles, Compass, MapPin } from 'lucide-react';
import ListingCard from './ListingCard';
import SponsoredAdCard from './SponsoredAdCard';
import { fetchActiveAds } from '../services/api';

export default function HomeView({
  listings,
  onSelectListing,
  savedIds,
  onToggleSave,
  onShare,
  userLocation,
  onNearMeClick,
  isLocating,
  selectedCity = 'Kolkata'
}) {
  const [activeAds, setActiveAds] = useState([]);

  useEffect(() => {
    let isMounted = true;
    async function loadAds() {
      try {
        const ads = await fetchActiveAds({
          lat: userLocation ? userLocation.lat : null,
          lng: userLocation ? userLocation.lng : null,
          city: selectedCity
        });
        if (isMounted) setActiveAds(ads);
      } catch (e) {
        console.warn('Failed to load active ads for HomeView:', e);
      }
    }
    loadAds();
    return () => { isMounted = false; };
  }, [userLocation, selectedCity]);

  const handleReportAd = (adId) => {
    setActiveAds((prev) => prev.filter((a) => a.id !== adId));
  };
  const pandals = listings.filter(l => l.category === 'PANDAL');
  const offersAndEvents = listings.filter(l => l.category !== 'PANDAL');

  return (
    <div className="w-full h-full overflow-y-auto px-4 pt-28 pb-28 max-w-2xl mx-auto space-y-6">
      {/* Hero Highlight Banner */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-city-blue text-white p-5 rounded-[28px] shadow-soft relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center gap-1.5 text-blue-200 text-xs font-bold uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Durga Puja 2026 Special</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black leading-tight">
            Explore Kolkata's Grand Celebrations
          </h2>
          <p className="text-xs sm:text-sm text-blue-100 mt-1.5 leading-relaxed">
            Find the most stunning pandals, artisanal melas, and exclusive festive shopping offers across the City of Joy.
          </p>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={onNearMeClick}
              disabled={isLocating}
              className="px-4 py-2 bg-white text-slate-900 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-city-blue' : 'text-city-blue'}`} />
              <span>{userLocation ? 'Update Near Me' : 'Sort by Distance'}</span>
            </button>
            {userLocation && (
              <span className="text-[11px] font-semibold text-blue-100 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> Sorted by your location
              </span>
            )}
          </div>
        </div>

        {/* Decorative circle glow */}
        <div className="absolute -right-10 -bottom-10 w-44 h-44 bg-white/10 rounded-full blur-xl pointer-events-none" />
      </div>

      {/* Geo-Targeted Sponsored Ad Placement */}
      {activeAds.length > 0 && (
        <div className="space-y-1.5">
          <SponsoredAdCard
            ad={activeAds[0]}
            onSelectListing={onSelectListing}
            onReportAd={handleReportAd}
          />
        </div>
      )}

      {/* Near You / Highlights List */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <span>{userLocation ? '📍 Closest to You' : '🌟 Today\'s Highlights'}</span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-sky-base dark:bg-slate-800 text-blue-800 dark:text-blue-300 font-bold">
              {listings.length}
            </span>
          </h3>
        </div>

        {listings.length === 0 ? (
          <div className="bg-white dark:bg-slate-900 rounded-[26px] p-8 text-center border border-slate-100 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              No listings found matching your current filter.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onSelect={onSelectListing}
                isSaved={savedIds.includes(listing.id)}
                onToggleSave={onToggleSave}
                onShare={onShare}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
