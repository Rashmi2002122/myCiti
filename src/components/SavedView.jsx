import React from 'react';
import { Bookmark, Sparkles } from 'lucide-react';
import ListingCard from './ListingCard';

export default function SavedView({
  listings,
  savedIds,
  onSelectListing,
  onToggleSave,
  onShare,
  onExploreClick
}) {
  const savedListings = listings.filter((l) => savedIds.includes(l.id));

  return (
    <div className="w-full h-full overflow-y-auto px-4 pt-28 pb-28 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <Bookmark className="w-5 h-5 fill-amber-500 text-amber-500" />
            <span>Saved Listings</span>
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Stored locally on your device for quick offline access
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300 font-bold border border-amber-200/50">
          {savedListings.length} saved
        </span>
      </div>

      {savedListings.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-[28px] p-8 text-center border border-slate-100 dark:border-slate-800 shadow-soft space-y-3">
          <div className="w-14 h-14 bg-amber-50 dark:bg-amber-950/30 rounded-full flex items-center justify-center mx-auto text-2xl">
            🔖
          </div>
          <h3 className="font-extrabold text-base text-slate-800 dark:text-slate-200">
            No saved listings yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
            Tap the bookmark icon on any pandal, mela, or store offer to save it for your itinerary.
          </p>
          <button
            onClick={onExploreClick}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-city-blue text-white font-bold text-xs shadow-md active:scale-95 transition-transform"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Explore Map</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {savedListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onSelect={onSelectListing}
              isSaved={true}
              onToggleSave={onToggleSave}
              onShare={onShare}
            />
          ))}
        </div>
      )}
    </div>
  );
}
