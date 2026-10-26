import React from 'react';
import { Tag, MapPin, Clock, Navigation, Bookmark, Share2, Store, Sparkles, ChevronRight } from 'lucide-react';
import { CATEGORIES } from '../services/api';
import { getOptimizedImageUrl } from '../utils/imageUtils';

export default function ListingCard({
  listing,
  onSelect,
  isSaved,
  onToggleSave,
  onShare,
  onOpenClientProfile
}) {
  const categoryConfig = CATEGORIES[listing.category] || CATEGORIES.PANDAL;
  const rawImageUrl = listing.primaryImageUrl || (listing.images && listing.images[0]?.url);
  const imageUrl = getOptimizedImageUrl(rawImageUrl, 600, 375);

  const handleClientClick = (e) => {
    e.stopPropagation();
    if (onOpenClientProfile) {
      onOpenClientProfile(listing.clientSlug);
    } else {
      window.history.pushState({}, '', `/c/${listing.clientSlug}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <article
      onClick={() => onSelect(listing)}
      className="cursor-pointer bg-white dark:bg-[#10141c] rounded-[5px] p-3 shadow-soft hover:border-[#ff951f]/50 border border-slate-200 dark:border-[#303139] transition-all duration-160 flex flex-col gap-3 group active:scale-[0.99]"
    >
      {/* Image container with editorial radius */}
      <div className="relative w-full aspect-[16/10] rounded-[4px] overflow-hidden bg-slate-100 dark:bg-[#101522]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={listing.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-160"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-slate-100 dark:bg-[#101522] text-amber-600 dark:text-[#edcd8c]">
            {categoryConfig.icon}
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-2 left-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border border-slate-200 dark:border-[#303139] bg-white/90 dark:bg-[#10141c]/90 text-slate-800 dark:text-[#f4f5f7] backdrop-blur-md">
            <span>{categoryConfig.icon}</span>
            <span>{categoryConfig.label}</span>
          </span>
        </div>

        {/* Distance or Open status pill */}
        <div className="absolute top-2 right-2 flex items-center gap-1">
          {listing.openNow ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-white/90 dark:bg-[#10141c]/90 text-slate-800 dark:text-[#f4f5f7] border border-slate-200 dark:border-[#303139] backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff951f] animate-pulse" />
              Live
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-white/90 dark:bg-[#10141c]/90 text-slate-500 dark:text-[#c9ced8] border border-slate-200 dark:border-[#303139] backdrop-blur-md">
              Closed
            </span>
          )}

          {listing.distanceKm !== undefined && listing.distanceKm !== null && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-white/90 dark:bg-[#10141c]/90 text-amber-700 dark:text-[#edcd8c] border border-slate-200 dark:border-[#303139] backdrop-blur-md tabular-nums">
              {listing.distanceKm} km
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5 px-0.5">
        {/* Client Attribution / Link */}
        {listing.clientSlug && (
          <div
            role="button"
            tabIndex={0}
            onClick={handleClientClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClientClick(e);
              }
            }}
            className="inline-flex items-center gap-1.5 text-[11px] font-mono text-slate-600 dark:text-[#c9ced8] hover:text-[#ff951f] active:scale-95 transition-all duration-160 cursor-pointer w-fit group/client bg-slate-100 dark:bg-[#101522] px-2 py-0.5 rounded-full border border-slate-200 dark:border-[#303139]"
          >
            {listing.clientLogoUrl ? (
              <img
                src={listing.clientLogoUrl}
                alt=""
                className="w-3.5 h-3.5 rounded-full object-cover flex-shrink-0"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <Store className="w-3 h-3 text-[#ff951f] flex-shrink-0" />
            )}
            <span className="truncate max-w-[170px]">
              {listing.clientBusinessName || listing.clientSlug}
            </span>
            {listing.clientVerified && (
              <span
                className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-[#ff951f] text-[#07090e] flex-shrink-0 font-bold text-[8px]"
                title="Verified business"
              >
                ✓
              </span>
            )}
          </div>
        )}

        <h3 className="font-medium text-base text-slate-900 dark:text-[#f4f5f7] line-clamp-1 group-hover:text-[#ff951f] transition-colors duration-160 tracking-tight">
          {listing.title}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-[#c9ced8]">
          <MapPin className="w-3.5 h-3.5 text-[#ff951f] flex-shrink-0" />
          <span className="truncate">{listing.landmark}</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs font-mono text-slate-600 dark:text-[#c9ced8]">
          <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-[#edcd8c] flex-shrink-0" />
          <span>{listing.dailyOpenTime?.slice(0, 5)} - {listing.dailyCloseTime?.slice(0, 5)}</span>
        </div>

        {/* Highlighted offer if present */}
        {listing.offerText && (
          <div className="mt-1 p-2 rounded-[4px] bg-amber-50 dark:bg-[#101522] border border-amber-200/60 dark:border-[#303139] text-[11px] font-mono text-amber-800 dark:text-[#edcd8c] flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 flex-shrink-0 text-[#ff951f]" />
            <span className="truncate">{listing.offerText}</span>
          </div>
        )}

        {/* Checkout other updates from client (always accessible) */}
        {listing.clientSlug && (
          <div
            role="button"
            tabIndex={0}
            onClick={handleClientClick}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                handleClientClick(e);
              }
            }}
            className="mt-1 w-full flex items-center justify-between px-2.5 py-1 rounded-full bg-slate-100 dark:bg-[#101522] border border-slate-200 dark:border-[#303139] text-[11px] font-mono text-slate-600 dark:text-[#c9ced8] hover:text-[#ff951f] hover:border-[#ff951f]/50 transition-all duration-160 cursor-pointer group/updates"
          >
            <span className="flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff951f] animate-pulse flex-shrink-0" />
              <span className="truncate text-slate-900 dark:text-[#f4f5f7]">
                {listing.otherUpdatesCount && listing.otherUpdatesCount > 0
                  ? `${listing.otherUpdatesCount} more update${listing.otherUpdatesCount > 1 ? 's' : ''}`
                  : 'View all posts & profile'}
              </span>
            </span>
            <span className="flex items-center gap-0.5 text-[10px] font-mono font-medium text-[#ff951f] group-hover/updates:translate-x-0.5 transition-transform flex-shrink-0 ml-1">
              <span>Profile</span>
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        )}
      </div>

      {/* Action buttons footer with hairline boundary */}
      <div className="pt-2 border-t border-slate-100 dark:border-[#303139] flex items-center justify-between">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const url = `https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`;
            window.open(url, '_blank', 'noopener,noreferrer');
          }}
          className="text-xs font-medium text-[#ff951f] hover:text-[#e68416] flex items-center gap-1.5 min-h-[40px] px-2 py-1 transition-colors duration-160 cursor-pointer"
        >
          <Navigation className="w-3.5 h-3.5 fill-[#ff951f]" />
          <span>Directions</span>
        </button>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(listing.id);
            }}
            aria-label="Save listing"
            className="min-w-[38px] min-h-[38px] w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-[#101522] text-slate-500 dark:text-[#c9ced8] hover:text-slate-800 dark:hover:text-[#f4f5f7] border border-transparent hover:border-slate-200 dark:hover:border-[#303139] transition-all duration-160 cursor-pointer"
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-600 text-amber-600 dark:fill-[#edcd8c] dark:text-[#edcd8c]' : ''}`} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShare(listing);
            }}
            aria-label="Share listing"
            className="min-w-[38px] min-h-[38px] w-9 h-9 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-[#101522] text-slate-500 dark:text-[#c9ced8] hover:text-slate-800 dark:hover:text-[#f4f5f7] border border-transparent hover:border-slate-200 dark:hover:border-[#303139] transition-all duration-160 cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
