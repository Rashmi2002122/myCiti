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

function formatTwitterTime(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const now = new Date();
    const diffSec = Math.floor((now - d) / 1000);
    if (diffSec < 60) return 'now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h`;
    const diffDays = Math.floor(diffHr / 24);
    if (diffDays < 7) return `${diffDays}d`;
    if (d.getFullYear() === now.getFullYear()) {
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return '';
  }
}

export function AppVerifiedBadge({ className = 'w-4 h-4' }) {
  return (
    <span
      className={`inline-flex items-center justify-center rounded-full bg-[#ff951f] text-[#07090e] flex-shrink-0 shadow-xs ${className}`}
      title="Verified business on myCite"
    >
      <svg
        className="w-2.5 h-2.5 fill-current stroke-current"
        viewBox="0 0 24 24"
        strokeWidth="3.2"
        stroke="currentColor"
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
      </svg>
    </span>
  );
}

export default function ClientPostCard({
  listing,
  clientProfile = null,
  onSelect,
  isSaved,
  onToggleSave,
  onShare,
  isUpcoming = false
}) {
  const categoryConfig = CATEGORIES[listing.category] || CATEGORIES.PANDAL;
  const rawImageUrl = listing.primaryImageUrl || (listing.images && listing.images[0]?.url);
  const imageUrl = getOptimizedImageUrl(rawImageUrl, 700, 420);
  const imageCount = listing.images ? listing.images.length : (listing.primaryImageUrl ? 1 : 0);
  const dateRangeStr = formatDateRange(listing.startDate, listing.endDate);

  const todayStr = new Date().toISOString().split('T')[0];
  const isExpired = listing.isExpired === true || (listing.endDate && listing.endDate < todayStr);
  const isActuallyUpcoming = !isExpired && (isUpcoming || (listing.startDate && listing.startDate > todayStr));

  const authorName = clientProfile?.businessName || listing.businessName || 'Business';
  const authorSlug = clientProfile?.slug || listing.clientSlug || 'mycite';
  const authorLogo = clientProfile?.logoUrl || listing.businessLogoUrl;
  const isVerified = clientProfile?.verified ?? listing.verified;

  const timeDisplay = formatTwitterTime(listing.createdAt || listing.startDate);

  const handleDirections = (e) => {
    e.stopPropagation();
    const lat = listing.latitude || clientProfile?.latitude;
    const lng = listing.longitude || clientProfile?.longitude;
    const url = lat && lng
      ? `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`
      : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(listing.title + ' ' + (listing.landmark || ''))}`;
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
      className="px-4 py-3.5 border-b border-slate-100 dark:border-[#303139] hover:bg-slate-50/75 dark:hover:bg-[#101522]/50 transition-colors cursor-pointer flex gap-3 text-slate-900 dark:text-[#f4f5f7]"
    >
      {/* --- Left Column: Avatar --- */}
      <div className="flex-shrink-0 pt-0.5">
        <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-100 dark:bg-[#101522] border border-slate-200 dark:border-[#303139] flex items-center justify-center">
          {authorLogo ? (
            <img src={authorLogo} alt={authorName} className="w-full h-full object-cover" />
          ) : (
            <span className="font-mono font-bold text-sm text-[#ff951f]">
              {(authorName || 'C').charAt(0).toUpperCase()}
            </span>
          )}
        </div>
      </div>

      {/* --- Right Column: Tweet Content --- */}
      <div className="flex-1 min-w-0">
        {/* Header Line */}
        <div className="flex items-center justify-between gap-1 leading-snug">
          <div className="flex items-center gap-1.5 min-w-0 flex-wrap">
            <span className="font-semibold text-sm sm:text-[15px] text-slate-900 dark:text-[#f4f5f7] truncate hover:underline">
              {authorName}
            </span>
            {isVerified && <AppVerifiedBadge className="w-4 h-4" />}
            <span className="text-xs sm:text-[13px] font-mono text-slate-500 dark:text-[#c9ced8] truncate">
              @{authorSlug}
            </span>
            {timeDisplay && (
              <>
                <span className="text-slate-400 dark:text-[#c9ced8]/50">·</span>
                <span className="text-xs font-mono text-slate-500 dark:text-[#c9ced8] flex-shrink-0">
                  {timeDisplay}
                </span>
              </>
            )}
          </div>

          {/* Right Status Pill */}
          {(isExpired || isActuallyUpcoming) && (
            <div className="flex items-center gap-1.5 flex-shrink-0">
              {isExpired ? (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  Expired
                </span>
              ) : (
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-medium bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20">
                  Upcoming
                </span>
              )}
            </div>
          )}
        </div>

        {/* Post Text & Description */}
        <div className="mt-1">
          <h3 className="font-semibold text-sm sm:text-[15px] text-slate-900 dark:text-[#f4f5f7] leading-snug">
            {listing.title}
          </h3>
          {listing.description && (
            <p className="mt-1 text-xs sm:text-sm text-slate-600 dark:text-[#c9ced8] leading-relaxed whitespace-pre-line">
              {listing.description}
            </p>
          )}
        </div>

        {/* Special Offer Voucher Chip */}
        {listing.offerText && (
          <div className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#ff951f]/10 text-amber-800 dark:text-[#edcd8c] border border-amber-300/60 dark:border-[#303139] text-xs font-mono font-medium">
            <Tag className="w-3.5 h-3.5 text-[#ff951f]" />
            <span>{listing.offerText}</span>
          </div>
        )}

        {/* Media Container (Image / Gallery) */}
        {imageUrl && (
          <div className="mt-3 rounded-[8px] overflow-hidden border border-slate-200 dark:border-[#303139] bg-slate-100 dark:bg-[#101522] relative group/media aspect-[16/10] sm:aspect-[16/9] max-h-[380px]">
            <img
              src={imageUrl}
              alt={listing.title}
              loading="lazy"
              className={`w-full h-full object-cover group-hover/media:scale-[1.01] transition-transform duration-300 ${
                isExpired ? 'grayscale-[20%] opacity-90' : ''
              }`}
            />

            {/* Category Badge overlay on image */}
            <div className="absolute top-2.5 left-2.5">
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium border backdrop-blur-md shadow-xs ${categoryConfig.badgeBg}`}>
                <span>{categoryConfig.icon}</span>
                <span>{categoryConfig.label}</span>
              </span>
            </div>

            {/* Date range chip overlay */}
            {dateRangeStr && (
              <div className="absolute bottom-2.5 left-2.5 px-2.5 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[11px] font-mono font-medium text-white flex items-center gap-1.5">
                <Calendar className="w-3 h-3 text-[#ff951f]" />
                <span>{dateRangeStr}</span>
              </div>
            )}

            {/* Photo count */}
            {imageCount > 1 && (
              <div className="absolute bottom-2.5 right-2.5 px-2 py-0.5 rounded-full bg-black/70 backdrop-blur-md text-[10px] font-mono font-bold text-white flex items-center gap-1">
                <Layers className="w-3 h-3 text-[#ff951f]" />
                <span>{imageCount} photos</span>
              </div>
            )}
          </div>
        )}

        {/* Location & Landmark sub-bar if available */}
        {(listing.landmark || listing.dailyOpenTime) && (
          <div className="mt-2.5 flex flex-wrap items-center gap-x-3.5 gap-y-1 text-xs text-slate-500 dark:text-[#c9ced8]">
            {listing.landmark && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-[#ff951f] flex-shrink-0" />
                <span className="truncate">{listing.landmark}</span>
              </div>
            )}
            {(listing.dailyOpenTime || listing.dailyCloseTime) && (
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-[#ff951f] flex-shrink-0" />
                <span className="font-mono">
                  {formatTimeShort(listing.dailyOpenTime)} – {formatTimeShort(listing.dailyCloseTime)}
                </span>
              </div>
            )}
          </div>
        )}

        {/* --- Interaction Bar (Directions, Contact, Share, Bookmark) --- */}
        <div className="mt-3.5 flex items-center justify-between text-slate-500 dark:text-[#c9ced8] text-xs max-w-sm pt-0.5">
          {/* Directions */}
          <button
            type="button"
            onClick={handleDirections}
            className="flex items-center gap-1.5 hover:text-[#ff951f] transition-colors group/btn py-1 cursor-pointer"
            title="Get Directions"
          >
            <div className="p-1.5 rounded-full group-hover/btn:bg-[#ff951f]/10 transition-colors">
              <Navigation className="w-4 h-4 text-[#ff951f]" />
            </div>
            <span className="text-xs font-medium">Directions</span>
          </button>

          {/* Call / Contact */}
          {listing.contactPhone && (
            <a
              href={`tel:${listing.contactPhone}`}
              onClick={(e) => e.stopPropagation()}
              className="flex items-center gap-1.5 hover:text-emerald-500 transition-colors group/btn py-1 cursor-pointer"
              title={`Call ${listing.contactPhone}`}
            >
              <div className="p-1.5 rounded-full group-hover/btn:bg-emerald-500/10 transition-colors">
                <Phone className="w-4 h-4 text-emerald-500" />
              </div>
              <span className="text-xs font-medium">Call</span>
            </a>
          )}

          {/* Share */}
          <button
            type="button"
            onClick={handleShareClick}
            className="flex items-center gap-1.5 hover:text-[#ff951f] transition-colors group/btn py-1 cursor-pointer"
            title="Share post"
          >
            <div className="p-1.5 rounded-full group-hover/btn:bg-[#ff951f]/10 transition-colors">
              <Share2 className="w-4 h-4" />
            </div>
            <span className="text-xs font-medium">Share</span>
          </button>

          {/* Bookmark / Save */}
          <button
            type="button"
            onClick={handleSaveClick}
            className="flex items-center gap-1.5 hover:text-[#ff951f] transition-colors group/btn py-1 cursor-pointer"
            title={isSaved ? "Saved" : "Save"}
          >
            <div className="p-1.5 rounded-full group-hover/btn:bg-[#ff951f]/10 transition-colors">
              <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-[#ff951f] text-[#ff951f]' : ''}`} />
            </div>
          </button>
        </div>
      </div>
    </article>
  );
}
