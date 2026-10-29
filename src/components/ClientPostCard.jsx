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

  const todayStr = new Date().toISOString().split('T')[0];
  const isExpired = listing.isExpired === true || (listing.endDate && listing.endDate < todayStr);
  const isActuallyUpcoming = !isExpired && (isUpcoming || (listing.startDate && listing.startDate > todayStr));

  const handleDirections = (e) => {
    e.stopPropagation();
    const url = `https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleShareClick = (e) => {
    e.stopPropagation();
    if (onShare) onShare(listing);
  };

  const handleSaveClick = (e) => {
    e.stopPropagation();
    if (onToggleSave) onToggleSave(listing.id);
  };

  return (
    <article
      onClick={() => onSelect && onSelect(listing)}
      className="cursor-pointer bg-white dark:bg-[#10141c] rounded-[5px] p-3 shadow-soft hover:border-[#ff951f]/50 border border-slate-200 dark:border-[#303139] transition-all duration-160 flex flex-col gap-3 group active:scale-[0.99]"
    >
      {/* Visual Image Hero */}
      <div className="relative w-full aspect-[16/10] rounded-[4px] overflow-hidden bg-slate-100 dark:bg-[#101522]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={listing.title}
            loading="lazy"
            className={`w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-160 ${
              isExpired ? 'grayscale-[25%] opacity-90' : ''
            }`}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl bg-slate-100 dark:bg-[#101522] text-amber-600 dark:text-[#edcd8c]">
            {categoryConfig.icon}
          </div>
        )}

        {/* Ambient bottom gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent pointer-events-none" />

        {/* Category badge - Top Left */}
        <div className="absolute top-2 left-2 z-10">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium border border-slate-200 dark:border-[#303139] bg-white/90 dark:bg-[#10141c]/90 text-slate-800 dark:text-[#f4f5f7] backdrop-blur-md shadow-xs">
            <span>{categoryConfig.icon}</span>
            <span>{categoryConfig.label}</span>
          </span>
        </div>

        {/* Status indicator - Top Right */}
        <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
          {isExpired ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 backdrop-blur-md">
              Expired
            </span>
          ) : isActuallyUpcoming ? (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/50 backdrop-blur-md">
              Upcoming
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-white/90 dark:bg-[#10141c]/90 text-slate-800 dark:text-[#f4f5f7] border border-slate-200 dark:border-[#303139] backdrop-blur-md">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff951f] animate-pulse" />
              Live
            </span>
          )}
        </div>

        {/* Date range chip - Bottom Left */}
        {dateRangeStr && (
          <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full bg-black/65 backdrop-blur-md text-[11px] font-mono font-medium text-white flex items-center gap-1.5 z-10">
            <Calendar className="w-3 h-3 text-[#ff951f]" />
            <span>{dateRangeStr}</span>
          </div>
        )}

        {/* Multi-photo pill - Bottom Right */}
        {imageCount > 1 && (
          <div className="absolute bottom-2 right-2 px-2 py-0.5 rounded-full bg-black/65 backdrop-blur-md text-[10px] font-mono font-medium text-white flex items-center gap-1 z-10">
            <Layers className="w-3 h-3 text-[#edcd8c]" />
            <span>{imageCount} photos</span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="flex flex-col gap-1.5 px-0.5 flex-1">
        {/* Promotional Offer Chip */}
        {listing.offerText && (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-[4px] bg-amber-500/10 dark:bg-[#101522] border border-amber-300/60 dark:border-amber-800/60 text-xs font-mono font-semibold text-amber-800 dark:text-[#edcd8c] w-fit">
            <Tag className="w-3.5 h-3.5 text-[#ff951f]" />
            <span>{listing.offerText}</span>
          </div>
        )}

        {/* Title */}
        <h3 className="font-medium text-base text-slate-900 dark:text-[#f4f5f7] line-clamp-1 group-hover:text-[#ff951f] transition-colors duration-160 tracking-tight">
          {listing.title}
        </h3>

        {/* Description snippet */}
        {listing.description && (
          <p className="text-xs text-slate-600 dark:text-[#c9ced8] line-clamp-2 leading-relaxed font-normal">
            {listing.description}
          </p>
        )}

        {/* Location & Operating Hours */}
        <div className="mt-auto pt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-500 dark:text-[#c9ced8] font-mono border-t border-slate-100 dark:border-[#303139]">
          {listing.landmark && (
            <div className="flex items-center gap-1 font-medium truncate max-w-[200px]">
              <MapPin className="w-3.5 h-3.5 text-[#ff951f] flex-shrink-0" />
              <span className="truncate">{listing.landmark}</span>
            </div>
          )}

          {(listing.dailyOpenTime || listing.dailyCloseTime) && (
            <div className="flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-[#ff951f] flex-shrink-0" />
              <span>
                {formatTimeShort(listing.dailyOpenTime)} – {formatTimeShort(listing.dailyCloseTime)}
              </span>
            </div>
          )}
        </div>

        {/* Interactive Action Bar */}
        <div className="pt-2 border-t border-slate-100 dark:border-[#303139] flex items-center justify-between">
          <button
            type="button"
            onClick={handleDirections}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#101522] dark:hover:bg-[#1a2030] text-xs font-mono font-semibold text-slate-800 dark:text-[#f4f5f7] transition-all active:scale-95 cursor-pointer border border-slate-200 dark:border-[#303139]"
          >
            <Navigation className="w-3.5 h-3.5 text-[#ff951f]" />
            <span>Directions</span>
          </button>

          <div className="flex items-center gap-1.5">
            {listing.contactPhone && (
              <a
                href={`tel:${listing.contactPhone}`}
                onClick={(e) => e.stopPropagation()}
                title={`Call ${listing.contactPhone}`}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#101522] dark:hover:bg-[#1a2030] text-slate-700 dark:text-[#f4f5f7] flex items-center justify-center transition-all active:scale-95 cursor-pointer border border-slate-200 dark:border-[#303139]"
              >
                <Phone className="w-3.5 h-3.5 text-[#ff951f]" />
              </a>
            )}

            <button
              type="button"
              onClick={handleShareClick}
              aria-label="Share post"
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#101522] dark:hover:bg-[#1a2030] text-slate-700 dark:text-[#c9ced8] flex items-center justify-center transition-all active:scale-95 cursor-pointer border border-slate-200 dark:border-[#303139]"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={handleSaveClick}
              aria-label={isSaved ? "Saved post" : "Save post"}
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-[#101522] dark:hover:bg-[#1a2030] text-slate-700 dark:text-[#c9ced8] flex items-center justify-center transition-all active:scale-95 cursor-pointer border border-slate-200 dark:border-[#303139]"
            >
              <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-[#ff951f] text-[#ff951f]' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
