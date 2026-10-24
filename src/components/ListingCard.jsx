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
      className="cursor-pointer bg-white dark:bg-slate-900 rounded-[26px] p-3.5 shadow-soft hover:shadow-float border border-slate-100 dark:border-slate-800 transition-all duration-200 flex flex-col gap-3 group active:scale-[0.98]"
    >
      {/* Image container */}
      <div className="relative w-full aspect-[16/10] rounded-[20px] overflow-hidden bg-slate-100 dark:bg-slate-800">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={listing.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-br from-[#cfe7ff] to-[#eaf4ff] dark:from-slate-800 dark:to-slate-900">
            {categoryConfig.icon}
          </div>
        )}

        {/* Category badge */}
        <div className="absolute top-2.5 left-2.5">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-xs ${categoryConfig.badgeBg}`}
          >
            <span>{categoryConfig.icon}</span>
            <span>{categoryConfig.label}</span>
          </span>
        </div>

        {/* Distance or Open status pill */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1">
          {listing.openNow ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/90 text-white backdrop-blur-md shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Live
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-black/50 text-white backdrop-blur-md">
              Closed
            </span>
          )}

          {listing.distanceKm !== undefined && listing.distanceKm !== null && (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-black/60 text-white backdrop-blur-md">
              {listing.distanceKm} km
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5 px-1">
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
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-city-blue dark:hover:text-sky-400 active:scale-95 transition-all cursor-pointer w-fit group/client bg-slate-100/90 dark:bg-slate-800/90 px-2.5 py-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60 shadow-2xs"
          >
            {listing.clientLogoUrl ? (
              <img
                src={listing.clientLogoUrl}
                alt=""
                className="w-3.5 h-3.5 rounded-full object-cover flex-shrink-0"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <Store className="w-3 h-3 text-city-blue dark:text-sky-400 flex-shrink-0" />
            )}
            <span className="truncate max-w-[170px] group-hover/client:underline">
              {listing.clientBusinessName || listing.clientSlug}
            </span>
            {listing.clientVerified && (
              <span
                className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-[#1d9bf0] text-white flex-shrink-0 shadow-xs"
                title="Verified business"
              >
                <svg
                  className="w-2 h-2 fill-current stroke-current"
                  viewBox="0 0 24 24"
                  strokeWidth="3"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </span>
            )}
          </div>
        )}

        <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100 line-clamp-1 group-hover:text-city-blue transition-colors">
          {listing.title}
        </h3>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <MapPin className="w-3.5 h-3.5 text-city-blue flex-shrink-0" />
          <span className="truncate font-medium">{listing.landmark}</span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Clock className="w-3.5 h-3.5 text-city-blue flex-shrink-0" />
          <span>{listing.dailyOpenTime?.slice(0, 5)} - {listing.dailyCloseTime?.slice(0, 5)}</span>
        </div>

        {/* Highlighted offer if present */}
        {listing.offerText && (
          <div className="mt-1 p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/60 dark:border-emerald-800 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="truncate">{listing.offerText}</span>
          </div>
        )}

        {/* Checkout other updates if post is live & from client */}
        {listing.clientSlug && listing.openNow && (
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
            className="mt-1.5 w-full flex items-center justify-between px-3 py-1.5 rounded-xl bg-gradient-to-r from-sky-50 to-blue-50/80 dark:from-slate-800/90 dark:to-sky-950/40 border border-sky-100/80 dark:border-slate-700/70 text-[11px] font-bold text-city-blue dark:text-sky-400 hover:bg-sky-100/70 dark:hover:bg-slate-700/80 active:scale-[0.99] transition-all cursor-pointer group/updates shadow-2xs"
          >
            <span className="flex items-center gap-1.5 truncate">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
              <span className="truncate text-slate-700 dark:text-slate-200">
                {listing.otherUpdatesCount && listing.otherUpdatesCount > 0
                  ? `Checkout ${listing.otherUpdatesCount} other update${listing.otherUpdatesCount > 1 ? 's' : ''}`
                  : 'Checkout other updates'}
              </span>
            </span>
            <span className="flex items-center gap-0.5 text-[10px] font-black uppercase tracking-wider text-city-blue dark:text-sky-400 group-hover/updates:translate-x-0.5 transition-transform flex-shrink-0 ml-1">
              <span>View Profile</span>
              <span aria-hidden="true">&rarr;</span>
            </span>
          </div>
        )}
      </div>

      {/* Action buttons footer */}
      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            const url = `https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`;
            window.open(url, '_blank', 'noopener,noreferrer');
          }}
          className="text-xs font-bold text-city-blue hover:text-blue-700 flex items-center gap-1 min-h-[44px] px-2.5 py-1"
        >
          <Navigation className="w-4 h-4 fill-city-blue" />
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
            className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-500 text-amber-500' : ''}`} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShare(listing);
            }}
            aria-label="Share listing"
            className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </article>
  );
}
