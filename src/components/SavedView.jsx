import React from 'react';
import { Bookmark, Sparkles } from 'lucide-react';
import ListingCard from './ListingCard';

export default function SavedView({
  listings,
  savedIds,
  onSelectListing,
  onToggleSave,
  onShare,
  onExploreClick,
  onOpenClientProfile
}) {
  const savedListings = listings.filter((l) => savedIds.includes(l.id));

  return (
    <div className="w-full h-full overflow-y-auto px-4 pt-28 pb-28 max-w-2xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <div>
          <h1 className="text-xl font-medium tracking-tight text-slate-900 dark:text-[#f4f5f7] flex items-center gap-2">
            <Bookmark className="w-5 h-5 fill-amber-600 text-amber-600 dark:fill-[#edcd8c] dark:text-[#edcd8c]" />
            <span>Saved Listings</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#c9ced8] mt-0.5">
            Stored locally on your device for quick offline access
          </p>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-white dark:bg-[#10141c] text-amber-700 dark:text-[#edcd8c] font-mono font-medium border border-slate-200 dark:border-[#303139] tabular-nums">
          {savedListings.length} saved
        </span>
      </div>

      {savedListings.length === 0 ? (
        <div className="bg-white dark:bg-[#10141c] rounded-[5px] p-8 text-center border border-slate-200 dark:border-[#303139] space-y-3">
          <div className="w-12 h-12 bg-slate-100 dark:bg-[#101522] border border-slate-200 dark:border-[#303139] rounded-full flex items-center justify-center mx-auto text-xl">
            🔖
          </div>
          <h2 className="font-medium text-base text-slate-900 dark:text-[#f4f5f7]">
            No saved listings yet
          </h2>
          <p className="text-xs text-slate-500 dark:text-[#c9ced8] max-w-sm mx-auto leading-relaxed">
            Tap the bookmark icon on any pandal, mela, or store offer to save it for your itinerary.
          </p>
          <button
            onClick={onExploreClick}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#ff951f] hover:bg-[#e68416] text-[#07090e] font-medium text-xs shadow-md active:scale-95 transition-all duration-160 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Explore Map</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {savedListings.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onSelect={onSelectListing}
              isSaved={true}
              onToggleSave={onToggleSave}
              onShare={onShare}
              onOpenClientProfile={onOpenClientProfile}
            />
          ))}
        </div>
      )}
    </div>
  );
}
