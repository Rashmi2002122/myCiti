import React from 'react';
import {
  Tag,
  MapPin,
  Clock,
  Navigation,
  Bookmark,
  Share2,
  Phone,
  Calendar,
  Sparkles,
  ChevronRight,
  Layers
} from 'lucide-react';
import { CATEGORIES } from '../services/api';
import { getOptimizedImageUrl } from '../utils/imageUtils';

function formatDateRange(startDateStr, endDateStr) {
  if (!startDateStr) return null;
  try {
    const s = new Date(startDateStr);
    const sMonth = s.toLocaleDateString('en-US', { month: 'short' });
    const sDay = s.getDate();
    if (!endDateStr || endDateStr === startDateStr) {
      return `${sMonth} ${sDay}`;
    }
    const e = new Date(endDateStr);
    const eMonth = e.toLocaleDateString('en-US', { month: 'short' });
    const eDay = e.getDate();
    if (sMonth === eMonth) {
      return `${sMonth} ${sDay} – ${eDay}`;
    }
    return `${sMonth} ${sDay} – ${eMonth} ${eDay}`;
  } catch {
    return `${startDateStr} - ${endDateStr}`;
  }
}

function formatTimeShort(timeStr) {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    let hour = parseInt(parts[0], 10);
    const minute = parts[1];
    const ampm = hour >= 12 ? 'PM' : 'AM';
    hour = hour % 12 || 12;
    return minute === '00' ? `${hour} ${ampm}` : `${hour}:${minute} ${ampm}`;
  }
  return timeStr;
}

export default function ClientPostCard({
  listing,
  onSelect,
  isSaved,
  onToggleSave,
  onShare,
  isUpcoming = false
}) {
  const categoryConfig = CATEGORIES[listing.category] || CATEGORIES.PANDAL;
  const rawImageUrl = listing.primaryImageUrl || (listing.images && listing.images[0]?.url);
  const imageUrl = getOptimizedImageUrl(rawImageUrl, 600, 375);
  const imageCount = listing.images ? listing.images.length : (listing.primaryImageUrl ? 1 : 0);
  const dateRangeStr = formatDateRange(listing.startDate, listing.endDate);

  const handleDirections = (e) => {
    e.stopPropagation();
    const url = `https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    if (onShare) {
      onShare(listing);
    }
  };

  const handleSaveClick = (e) => {
    e.stopPropagation();
    if (onToggleSave) {
      onToggleSave(listing.id);
    }
  };

  return (
    <article
      onClick={() => onSelect && onSelect(listing)}
      className="group relative cursor-pointer flex flex-col rounded-[26px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/90 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.06)] hover:shadow-[0_16px_32px_-8px_rgba(0,0,0,0.12)] hover:-translate-y-1 active:translate-y-0 transition-all duration-200 overflow-hidden"
    >
      {/* --- Visual Hero Container --- */}
      <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100 dark:bg-slate-800">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={listing.title}
            loading="lazy"
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-sky-50 via-blue-50 to-indigo-100 dark:from-slate-800 dark:to-slate-900 text-slate-400">
            <span className="text-4xl">{categoryConfig.icon}</span>
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 mt-1">
              {categoryConfig.label}
            </span>
          </div>
        )}

        {/* Ambient Bottom Gradient for High Readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

        {/* Category Badge - Top Left */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 z-10">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border backdrop-blur-md shadow-xs ${categoryConfig.badgeBg}`}
          >
            <span>{categoryConfig.icon}</span>
            <span>{categoryConfig.label}</span>
          </span>
        </div>

        {/* Live / Upcoming Status & Save Button - Top Right */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 z-10">
          {isUpcoming ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-indigo-600/90 text-white backdrop-blur-md shadow-xs">
              <Calendar className="w-3 h-3" />
              <span>Upcoming</span>
            </span>
          ) : listing.openNow ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-500/95 text-white backdrop-blur-md shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>Live</span>
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-black/60 text-slate-200 backdrop-blur-md">
              Closed
            </span>
          )}

          <button
            type="button"
            onClick={handleSaveClick}
            aria-label="Save post"
            className="w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md text-white flex items-center justify-center transition-all active:scale-90"
          >
            <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>
        </div>

        {/* Multi-Photo Count Pill - Bottom Right */}
        {imageCount > 1 && (
          <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white flex items-center gap-1 z-10">
            <Layers className="w-3 h-3" />
            <span>{imageCount} photos</span>
          </div>
        )}

        {/* Date Range Chip - Bottom Left */}
        {dateRangeStr && (
          <div className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-md text-[11px] font-semibold text-white/95 flex items-center gap-1.5 z-10">
            <Calendar className="w-3 h-3 text-sky-300" />
            <span>{dateRangeStr}</span>
          </div>
        )}
      </div>

      {/* --- Body Content --- */}
      <div className="p-4 flex flex-col flex-1 gap-2.5">
        {/* Promotional Offer Voucher Banner */}
        {listing.offerText && (
          <div className="flex items-center gap-2 p-2.5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-rose-500/10 to-amber-500/5 dark:from-amber-950/30 dark:via-rose-950/20 dark:to-slate-800 border border-amber-300/60 dark:border-amber-800/60 shadow-2xs">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-amber-500 to-rose-500 text-white flex items-center justify-center flex-shrink-0 shadow-xs">
              <Tag className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] uppercase font-black tracking-wider text-amber-700 dark:text-amber-400 leading-none">
                Special Offer
              </p>
              <p className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate mt-0.5">
                {listing.offerText}
              </p>
            </div>
          </div>
        )}

        {/* Title */}
        <h3 className="font-black text-base text-slate-900 dark:text-white line-clamp-1 group-hover:text-city-blue dark:group-hover:text-sky-400 transition-colors tracking-tight">
          {listing.title}
        </h3>

        {/* Description snippet */}
        {listing.description && (
          <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 leading-relaxed">
            {listing.description}
          </p>
        )}

        {/* Location & Operating Hours */}
        <div className="mt-auto pt-2 flex flex-wrap items-center gap-y-1.5 gap-x-3 text-xs text-slate-500 dark:text-slate-400 border-t border-slate-100 dark:border-slate-800/80">
          {listing.landmark && (
            <div className="flex items-center gap-1 font-medium truncate max-w-[200px]">
              <MapPin className="w-3.5 h-3.5 text-city-blue dark:text-sky-400 flex-shrink-0" />
              <span className="truncate">{listing.landmark}</span>
            </div>
          )}

          {(listing.dailyOpenTime || listing.dailyCloseTime) && (
            <div className="flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-city-blue dark:text-sky-400 flex-shrink-0" />
              <span>
                {formatTimeShort(listing.dailyOpenTime)} – {formatTimeShort(listing.dailyCloseTime)}
              </span>
            </div>
          )}
        </div>

        {/* --- Interactive Action Bar --- */}
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
          <button
            type="button"
            onClick={handleDirections}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-xs font-bold text-slate-800 dark:text-slate-200 transition-all active:scale-95 cursor-pointer"
          >
            <Navigation className="w-3.5 h-3.5 text-city-blue dark:text-sky-400 fill-current" />
            <span>Directions</span>
          </button>

          <div className="flex items-center gap-1.5">
            {listing.contactPhone && (
              <a
                href={`tel:${listing.contactPhone}`}
                onClick={(e) => e.stopPropagation()}
                title={`Call ${listing.contactPhone}`}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
              >
                <Phone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              </a>
            )}

            <button
              type="button"
              onClick={handleShareClick}
              aria-label="Share post"
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            <div
              className="w-8 h-8 rounded-full bg-sky-50 dark:bg-sky-950/60 text-city-blue dark:text-sky-400 flex items-center justify-center group-hover:bg-city-blue group-hover:text-white transition-all ml-0.5 shadow-2xs"
              title="View full post details"
            >
              <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}
