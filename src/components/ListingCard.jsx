import React from 'react';
import { Tag, MapPin, Clock, Navigation, Bookmark, Share2 } from 'lucide-react';
import { CATEGORIES } from '../services/api';

export default function ListingCard({
  listing,
  onSelect,
  isSaved,
  onToggleSave,
  onShare
}) {
  const categoryConfig = CATEGORIES[listing.category] || CATEGORIES.PANDAL;
  const imageUrl = listing.primaryImageUrl || (listing.images && listing.images[0]?.url);

  return (
    <article
      onClick={() => onSelect(listing)}
      className="cursor-pointer bg-white dark:bg-slate-900 rounded-[26px] p-3.5 shadow-soft hover:shadow-float border border-slate-100 dark:border-slate-800 transition-all duration-200 flex flex-col gap-3 group"
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
          <div className="w-full h-full flex items-center justify-center text-3xl">
            {categoryConfig.icon}
          </div>
        )}

        {/* Category Pill */}
        <div className="absolute top-2.5 left-2.5">
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold backdrop-blur-md shadow-sm ${categoryConfig.badgeBg}`}
          >
            <span>{categoryConfig.icon}</span>
            <span>{categoryConfig.label}</span>
          </span>
        </div>

        {/* Status Badge */}
        <div className="absolute top-2.5 right-2.5">
          {listing.openNow ? (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/90 text-white backdrop-blur-md shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Open
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/90 text-white backdrop-blur-md shadow-sm">
              Closed
            </span>
          )}
        </div>

        {/* Distance Badge if available */}
        {listing.distanceKm !== null && listing.distanceKm !== undefined && (
          <div className="absolute bottom-2.5 left-2.5 bg-black/60 backdrop-blur-md text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <Navigation className="w-2.5 h-2.5 fill-white" />
            <span>{listing.distanceKm} km away</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col gap-1.5 px-1">
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
