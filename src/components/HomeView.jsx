import React, { useState, useEffect } from 'react';
import { Compass, MapPin } from 'lucide-react';
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
  selectedCity = 'Kolkata',
  onOpenClientProfile,
  onExploreMapClick
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

  return (
    <div className="w-full h-full overflow-y-auto px-4 pt-28 pb-32 max-w-2xl mx-auto space-y-6">
      {/* Hero Section: Broad promise on left + Framed Value object with thin offset outlines on right */}
      <section className="bg-slate-100 dark:bg-[#101522] border border-slate-200 dark:border-[#303139] rounded-[6px] p-5 sm:p-6 relative overflow-hidden shadow-2xl">
        <div className="relative z-10 grid grid-cols-1 sm:grid-cols-12 gap-5 items-center">
          {/* Left: Broad promise */}
          <div className="sm:col-span-8 space-y-2">
            <div className="flex items-center gap-2 text-amber-700 dark:text-[#edcd8c] text-[11px] font-mono uppercase tracking-wider font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff951f]" />
              <span>Festive Guide • {selectedCity}</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-medium tracking-tight text-slate-900 dark:text-[#f4f5f7] leading-snug">
              Explore {selectedCity}&apos;s Grand Celebrations &amp; Real-Time Events
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-[#c9ced8] leading-relaxed">
              Find stunning pandals, artisanal melas, verified venues, and festive shopping offers with verified operating hours.
            </p>

            <div className="pt-2 flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={onNearMeClick}
                disabled={isLocating}
                className="px-4 py-2 bg-[#ff951f] hover:bg-[#e68416] text-[#07090e] rounded-full font-medium text-xs flex items-center gap-1.5 active:scale-[0.98] transition-all duration-160 cursor-pointer shadow-md"
              >
                <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                <span>{userLocation ? 'Update Near Me' : 'Sort by Distance'}</span>
              </button>
              {userLocation && (
                <span className="text-[11px] font-mono text-amber-700 dark:text-[#edcd8c] flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#ff951f]" /> Sorted by coordinates
                </span>
              )}
            </div>
          </div>

          {/* Right: Framed value object with several thin offset outlines */}
          <div className="sm:col-span-4 flex justify-center sm:justify-end">
            <div className="relative w-full max-w-[190px]">
              {/* Outer thin offset outline 1 */}
              <div className="absolute -inset-1.5 border border-slate-300/60 dark:border-[#303139]/60 rounded-[6px] -rotate-1 pointer-events-none" />
              {/* Middle thin offset outline 2 */}
              <div className="absolute -inset-0.5 border border-slate-300 dark:border-[#303139] rounded-[5px] rotate-1 pointer-events-none" />
              
              {/* Main Panel */}
              <div className="relative bg-white dark:bg-[#10141c] border border-slate-200 dark:border-[#303139] rounded-[5px] p-4 text-center shadow-xl">
                <div className="text-[10px] font-mono uppercase tracking-widest text-slate-500 dark:text-[#c9ced8]">
                  Verified Active
                </div>
                <div className="font-mono text-3xl sm:text-4xl font-bold tracking-tight text-amber-600 dark:text-[#edcd8c] my-1 tabular-nums">
                  {listings.length}
                </div>
                <div className="text-[11px] font-mono text-slate-500 dark:text-[#c9ced8]/90">
                  Open in {selectedCity}
                </div>
                <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-[#303139] flex items-center justify-center gap-1.5 text-[10px] font-mono text-[#ff951f]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff951f] animate-pulse" />
                  <span>Real-time status</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Warm light concentrated near bottom action */}
        <div className="absolute -bottom-8 left-12 w-48 h-20 bg-[#ff951f]/15 rounded-full blur-2xl pointer-events-none" />
      </section>

      {/* Ruled strip of supporting facts */}
      <section className="border-y border-slate-200 dark:border-[#303139] py-3 grid grid-cols-3 divide-x divide-slate-200 dark:divide-[#303139] text-center">
        <div className="px-2">
          <div className="font-mono text-xs sm:text-sm font-medium text-amber-700 dark:text-[#edcd8c]">100% Verified</div>
          <div className="text-[11px] text-slate-500 dark:text-[#c9ced8] mt-0.5">Direct Organizers</div>
        </div>
        <div className="px-2">
          <div className="font-mono text-xs sm:text-sm font-medium text-amber-700 dark:text-[#edcd8c]">GPS Accurate</div>
          <div className="text-[11px] text-slate-500 dark:text-[#c9ced8] mt-0.5">Live Directions</div>
        </div>
        <div className="px-2">
          <div className="font-mono text-xs sm:text-sm font-medium text-amber-700 dark:text-[#edcd8c]">Real-Time</div>
          <div className="text-[11px] text-slate-500 dark:text-[#c9ced8] mt-0.5">Operating Hours</div>
        </div>
      </section>

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

      {/* Near You / Live Highlights List */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="font-medium text-base text-slate-900 dark:text-[#f4f5f7] flex items-center gap-2">
            <span>{userLocation ? '📍 Closest Verified Venues' : '🌟 Live Now in Market'}</span>
          </h2>
          <span className="text-xs px-2.5 py-0.5 rounded-full bg-white dark:bg-[#10141c] text-amber-700 dark:text-[#edcd8c] font-mono font-medium flex items-center gap-1.5 border border-slate-200 dark:border-[#303139]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#ff951f] animate-pulse" />
            <span className="tabular-nums">{listings.length}</span> live
          </span>
        </div>

        {listings.length === 0 ? (
          <div className="bg-white dark:bg-[#10141c] rounded-[5px] p-8 text-center border border-slate-200 dark:border-[#303139] space-y-3">
            <div className="w-11 h-11 rounded-full bg-slate-100 dark:bg-[#101522] border border-slate-200 dark:border-[#303139] text-amber-700 dark:text-[#edcd8c] mx-auto flex items-center justify-center text-lg">
              ✨
            </div>
            <h3 className="font-medium text-base text-slate-900 dark:text-[#f4f5f7]">
              No live events currently open
            </h3>
            <p className="text-xs text-slate-600 dark:text-[#c9ced8] max-w-sm mx-auto leading-relaxed">
              Venues are currently outside daily operating hours or completed. Check back during scheduled hours or view venues across the map.
            </p>
            {onExploreMapClick && (
              <button
                type="button"
                onClick={onExploreMapClick}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#ff951f] hover:bg-[#e68416] text-[#07090e] font-medium text-xs rounded-full shadow-md active:scale-95 transition-all duration-160 mt-1 cursor-pointer"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Explore Map</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {listings.map((listing) => (
              <ListingCard
                key={listing.id}
                listing={listing}
                onSelect={onSelectListing}
                isSaved={savedIds.includes(listing.id)}
                onToggleSave={onToggleSave}
                onShare={onShare}
                onOpenClientProfile={onOpenClientProfile}
              />
            ))}
          </div>
        )}
      </div>

      {/* Closing Field with Warm Light Beneath Actions */}
      <section className="bg-slate-100 dark:bg-[#10141c] border border-slate-200 dark:border-[#303139] rounded-[5px] p-6 text-center relative overflow-hidden space-y-3 mt-8">
        <div className="relative z-10 space-y-2">
          <h3 className="text-base font-medium text-slate-900 dark:text-[#f4f5f7]">
            Looking for all locations across India?
          </h3>
          <p className="text-xs text-slate-600 dark:text-[#c9ced8] max-w-md mx-auto">
            Switch between map view and search to filter across all verified Durga Puja Pandals, Melas, and special festive sales.
          </p>
          <div className="pt-1 flex items-center justify-center gap-2">
            {onExploreMapClick && (
              <button
                type="button"
                onClick={onExploreMapClick}
                className="px-5 py-2.5 rounded-full bg-[#ff951f] hover:bg-[#e68416] text-[#07090e] font-medium text-xs transition-all duration-160 active:scale-95 cursor-pointer shadow-lg"
              >
                Open Interactive Map
              </button>
            )}
          </div>
        </div>

        {/* Concentrated warm light */}
        <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-48 h-20 bg-[#ff951f]/20 rounded-full blur-2xl pointer-events-none" />
      </section>
    </div>
  );
}
