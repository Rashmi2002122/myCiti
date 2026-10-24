import React from 'react';
import { Navigation, Bookmark, Share2, Store, Check } from 'lucide-react';
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
  const imageUrl = getOptimizedImageUrl(rawImageUrl, 700, 500);

  const handleClientClick = (e) => {
    e.stopPropagation();
    if (onOpenClientProfile) {
      onOpenClientProfile(listing.clientSlug);
    } else {
      window.history.pushState({}, '', `/c/${listing.clientSlug}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  const handleDirections = (e) => {
    e.stopPropagation();
    if (listing.latitude && listing.longitude) {
      const url = `https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Primary action button label: 'Reserve now' matching mockup, with contextual adaptability for pandals
  const ctaLabel = listing.category === 'PANDAL' ? 'Explore now' : 'Reserve now';

  // Description fallback to ensure rich text presentation like the mockup
  const descriptionText = listing.description?.trim()
    ? listing.description
    : `${categoryConfig.description || 'Popular city destination'}. Located at ${listing.landmark || listing.address || listing.city || 'Kolkata'}.`;

  return (
    <article
      onClick={() => onSelect(listing)}
      className="group relative cursor-pointer overflow-hidden rounded-[30px] sm:rounded-[34px] bg-[#1c2218] text-white shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between border border-white/10 select-none"
    >
      {/* Top Media Section with smooth gradient fade into card body */}
      <div className="relative w-full aspect-[4/3] sm:aspect-[16/11] overflow-hidden bg-[#242b1f]">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={listing.title}
            loading="lazy"
            className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#2a3424] via-[#1f271a] to-[#161a12] text-5xl">
            <span>{categoryConfig.icon}</span>
          </div>
        )}

        {/* Top-to-bottom subtle shadow for floating badges */}
        <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/50 via-black/20 to-transparent pointer-events-none" />

        {/* Seamless bottom gradient fade into card background */}
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#1c2218] via-[#1c2218]/80 to-transparent pointer-events-none" />

        {/* Floating Top Left Badge: Live Now or Category */}
        <div className="absolute top-3.5 left-3.5 flex items-center gap-1.5 z-10">
          {listing.openNow ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/90 text-white backdrop-blur-md border border-emerald-400/30 shadow-md">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              Live Now
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-black/45 text-white/95 backdrop-blur-md border border-white/15 shadow-md">
              <span>{categoryConfig.icon}</span>
              <span>{categoryConfig.label}</span>
            </span>
          )}
        </div>

        {/* Floating Top Right Action Buttons: Directions, Save, Share */}
        <div className="absolute top-3.5 right-3.5 flex items-center gap-1.5 z-10">
          {listing.latitude && listing.longitude && (
            <button
              type="button"
              onClick={handleDirections}
              aria-label="Directions"
              title="Get directions"
              className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/65 active:scale-90 backdrop-blur-md border border-white/15 text-white flex items-center justify-center transition-all shadow-md cursor-pointer"
            >
              <Navigation className="w-4 h-4 fill-white/80" />
            </button>
          )}

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleSave(listing.id);
            }}
            aria-label="Save listing"
            title="Save listing"
            className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/65 active:scale-90 backdrop-blur-md border border-white/15 text-white flex items-center justify-center transition-all shadow-md cursor-pointer"
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400 text-amber-400' : ''}`} />
          </button>

          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onShare(listing);
            }}
            aria-label="Share listing"
            title="Share listing"
            className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/65 active:scale-90 backdrop-blur-md border border-white/15 text-white flex items-center justify-center transition-all shadow-md cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Card Content Section */}
      <div className="px-5 pb-5 pt-1 flex flex-col gap-3.5 relative z-10 -mt-6">
        {/* Client Attribution (if client profile post) */}
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
            className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/10 text-[11px] font-semibold text-white/90 active:scale-95 transition-all cursor-pointer w-fit shadow-xs group/client"
          >
            {listing.clientLogoUrl ? (
              <img
                src={listing.clientLogoUrl}
                alt=""
                className="w-3.5 h-3.5 rounded-full object-cover flex-shrink-0"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
              />
            ) : (
              <Store className="w-3 h-3 text-sky-400 flex-shrink-0" />
            )}
            <span className="truncate max-w-[150px] group-hover/client:underline">
              {listing.clientBusinessName || listing.clientSlug}
            </span>
            {listing.clientVerified && (
              <span
                className="inline-flex items-center justify-center w-3 h-3 rounded-full bg-[#1d9bf0] text-white flex-shrink-0"
                title="Verified business"
              >
                <Check className="w-2 h-2 stroke-[3]" />
              </span>
            )}
          </div>
        )}

        {/* Title */}
        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug line-clamp-1 group-hover:text-amber-100 transition-colors">
          {listing.title}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-[13px] text-stone-300/85 leading-relaxed line-clamp-2 sm:line-clamp-3 font-normal">
          {descriptionText}
        </p>

        {/* Badges / Chips Row (e.g. 🏆 Guest Favorite, 4 Night Stay / Distance / Hours) */}
        <div className="flex items-center gap-2 flex-wrap pt-0.5">
          {/* Pill 1: Guest Favorite / Verified / Category */}
          <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/10 text-stone-200 border border-white/10 backdrop-blur-md shadow-xs">
            <span>{listing.clientVerified ? '🏆' : categoryConfig.icon}</span>
            <span>{listing.clientVerified ? 'Guest Favorite' : categoryConfig.label}</span>
          </span>

          {/* Pill 2: Distance or Operating Hours or Landmark */}
          {listing.distanceKm !== undefined && listing.distanceKm !== null ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/10 text-stone-200 border border-white/10 backdrop-blur-md shadow-xs">
              <span>📍</span>
              <span>{listing.distanceKm} km</span>
            </span>
          ) : listing.dailyOpenTime && listing.dailyCloseTime ? (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/10 text-stone-200 border border-white/10 backdrop-blur-md shadow-xs">
              <span>⏰</span>
              <span>{listing.dailyOpenTime.slice(0, 5)} - {listing.dailyCloseTime.slice(0, 5)}</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-white/10 text-stone-200 border border-white/10 backdrop-blur-md shadow-xs">
              <span>📍</span>
              <span className="truncate max-w-[130px]">{listing.landmark || listing.city || 'Kolkata'}</span>
            </span>
          )}

          {/* Pill 3: Highlighted Offer if present */}
          {listing.offerText && (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md shadow-xs">
              <span>🏷️</span>
              <span className="truncate max-w-[140px]">{listing.offerText}</span>
            </span>
          )}

          {/* Pill 4: Other client updates if applicable */}
          {listing.otherUpdatesCount && listing.otherUpdatesCount > 0 && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClientClick}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium bg-sky-500/20 text-sky-300 border border-sky-500/30 backdrop-blur-md shadow-xs hover:bg-sky-500/30 transition-colors cursor-pointer"
            >
              <span>✨</span>
              <span>+{listing.otherUpdatesCount} updates</span>
            </span>
          )}
        </div>

        {/* Standout Full-Width White Pill Button */}
        <div className="pt-2">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onSelect(listing);
            }}
            className="w-full py-3.5 px-6 rounded-full bg-white hover:bg-stone-100 active:scale-[0.99] text-stone-900 font-bold text-sm sm:text-base text-center transition-all duration-200 shadow-md cursor-pointer"
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </article>
  );
}
