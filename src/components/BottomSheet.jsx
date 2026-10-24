import React, { useState, useEffect } from 'react';
import {
  X,
  Navigation,
  Bookmark,
  Share2,
  Clock,
  MapPin,
  Phone,
  Tag,
  ChevronLeft,
  ChevronRight,
  Check,
  Store,
  Sparkles
} from 'lucide-react';
import { CATEGORIES } from '../services/api';

export default function BottomSheet({
  listing,
  onClose,
  isSaved,
  onToggleSave,
  onOpenClientProfile
}) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!listing) return null;

  const categoryConfig = CATEGORIES[listing.category] || CATEGORIES.PANDAL;
  const images = listing.images && listing.images.length > 0
    ? listing.images
    : listing.primaryImageUrl
      ? [{ url: listing.primaryImageUrl }]
      : [];

  const handleDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${listing.latitude},${listing.longitude}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleSave = () => {
    if (onToggleSave) {
      onToggleSave(listing.id);
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `${listing.title} on myCiti`,
      text: `${listing.title} - ${listing.landmark}, ${listing.city || 'Kolkata'}`,
      url: window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClientProfileClick = () => {
    onClose();
    if (onOpenClientProfile) {
      onOpenClientProfile(listing.clientSlug);
    } else {
      window.history.pushState({}, '', `/c/${listing.clientSlug}`);
      window.dispatchEvent(new PopStateEvent('popstate'));
    }
  };

  return (
    <>
      {/* Blurred Dark Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[3600] animate-in fade-in duration-200"
      />

      {/* Floating Modal Card Wrapper */}
      <div className="fixed inset-0 z-[3601] flex items-end sm:items-center justify-center p-3 sm:p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={listing.title}
          className="pointer-events-auto w-full max-w-md bg-[#161714] text-white rounded-[32px] sm:rounded-[36px] overflow-hidden shadow-2xl border border-white/10 animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-250 flex flex-col max-h-[92dvh]"
        >
          {/* Top Hero Image Section with Seamless Gradient Fade */}
          <div className="relative w-full aspect-[4/3] flex-shrink-0 bg-stone-900 overflow-hidden">
            {images.length > 0 ? (
              <img
                src={images[activeImageIndex].url}
                alt={listing.title}
                className="w-full h-full object-cover transition-opacity duration-300"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-stone-800 via-stone-900 to-[#161714] text-stone-400">
                <span className="text-5xl mb-2">{categoryConfig.icon}</span>
                <span className="text-xs uppercase tracking-widest font-bold text-stone-400">
                  {categoryConfig.label}
                </span>
              </div>
            )}

            {/* Smooth Atmospheric Gradient overlay fading seamlessly into #161714 */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#161714] via-[#161714]/60 to-transparent pointer-events-none" />

            {/* Top Left: Category Badge */}
            <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-black/40 backdrop-blur-md border border-white/15 text-white/95 shadow-sm">
                <span>{categoryConfig.icon}</span>
                <span>{categoryConfig.label}</span>
              </span>
            </div>

            {/* Top Right: Save, Share & Close Buttons */}
            <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5">
              <button
                onClick={handleSave}
                aria-label="Save listing"
                className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-400 text-amber-400' : 'text-white'}`} />
              </button>

              <button
                onClick={handleShare}
                aria-label="Share listing"
                className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-white" />}
              </button>

              <button
                onClick={onClose}
                aria-label="Close details"
                className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md border border-white/15 text-white flex items-center justify-center transition-all cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Multi-Image Controls */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                  aria-label="Previous image"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-all cursor-pointer z-10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                  aria-label="Next image"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-md border border-white/10 transition-all cursor-pointer z-10"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Dot Indicators */}
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-md border border-white/10 z-10">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      aria-label={`Go to image ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all ${
                        idx === activeImageIndex ? 'bg-white w-3.5' : 'bg-white/50 w-1.5'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Content Body (negative margin brings title over the atmospheric gradient fade) */}
          <div className="relative -mt-14 sm:-mt-16 z-10 px-6 pt-1 pb-4 space-y-3.5 overflow-y-auto flex-1">
            {/* Title */}
            <div>
              <h2 className="text-2xl sm:text-[26px] font-bold text-white tracking-tight leading-tight drop-shadow-sm">
                {listing.title}
              </h2>
            </div>

            {/* Description */}
            {listing.description && (
              <p className="text-sm text-neutral-300 leading-relaxed font-normal">
                {listing.description}
              </p>
            )}

            {/* Pills / Badges Row (Matches reference design) */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {/* Live Status Pill */}
              {listing.openNow ? (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#272b22] border border-emerald-500/30 text-emerald-300 text-xs font-semibold backdrop-blur-sm shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Live Now</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#2b2d28] border border-white/10 text-neutral-400 text-xs font-medium">
                  <span>Closed</span>
                </div>
              )}

              {/* Operating Hours Pill */}
              {listing.dailyOpenTime && listing.dailyCloseTime && (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#2b2d28] border border-white/10 text-neutral-200 text-xs font-medium backdrop-blur-sm">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  <span>{listing.dailyOpenTime.slice(0, 5)} - {listing.dailyCloseTime.slice(0, 5)}</span>
                </div>
              )}

              {/* Location Landmark & Distance Pill */}
              {(listing.landmark || listing.city) && (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#2b2d28] border border-white/10 text-neutral-200 text-xs font-medium backdrop-blur-sm">
                  <MapPin className="w-3.5 h-3.5 text-neutral-400" />
                  <span className="truncate max-w-[160px]">{listing.landmark || listing.city}</span>
                  {listing.distanceKm !== undefined && listing.distanceKm !== null && (
                    <span className="text-neutral-400 font-bold">• {listing.distanceKm} km</span>
                  )}
                </div>
              )}

              {/* Special Offer Pill */}
              {listing.offerText && (
                <div className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#352c1e] border border-amber-500/30 text-amber-200 text-xs font-semibold backdrop-blur-sm">
                  <Tag className="w-3.5 h-3.5 text-amber-400" />
                  <span>{listing.offerText}</span>
                </div>
              )}
            </div>

            {/* Client Business Profile Attribution Card */}
            {listing.clientSlug && (
              <div
                role="button"
                tabIndex={0}
                onClick={handleClientProfileClick}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleClientProfileClick();
                  }
                }}
                className="flex items-center justify-between p-3 rounded-2xl bg-white/[0.05] hover:bg-white/[0.09] border border-white/10 transition-all cursor-pointer group active:scale-[0.99] mt-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl overflow-hidden bg-white/10 border border-white/15 flex items-center justify-center flex-shrink-0">
                    {listing.clientLogoUrl ? (
                      <img
                        src={listing.clientLogoUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <Store className="w-4 h-4 text-white/70" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-bold text-white truncate group-hover:text-sky-300 transition-colors">
                        {listing.clientBusinessName || listing.clientSlug}
                      </span>
                      {listing.clientVerified && (
                        <span
                          className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#1d9bf0] text-white flex-shrink-0"
                          title="Verified business"
                        >
                          <svg className="w-2.5 h-2.5 fill-current stroke-current" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-400 truncate">
                      {listing.openNow ? 'Checkout other updates & live posts' : 'View business profile'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-white group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </div>
            )}

            {/* Address / Directions Info */}
            {listing.address && listing.address !== listing.landmark && (
              <div className="flex items-start gap-2 pt-1 text-xs text-neutral-400">
                <MapPin className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{listing.address}</span>
              </div>
            )}
          </div>

          {/* Sticky Bottom Action Button Section (Dominant Clean Pill Button matching the reference) */}
          <div className="p-4 sm:p-5 pt-3 bg-gradient-to-t from-[#161714] via-[#161714] to-transparent border-t border-white/5 flex items-center gap-3">
            <button
              onClick={handleDirections}
              className="flex-1 py-3.5 sm:py-4 px-6 bg-white hover:bg-neutral-100 active:scale-[0.98] text-[#161714] rounded-full font-bold text-sm sm:text-base shadow-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Navigation className="w-4 h-4 fill-[#161714] text-[#161714]" />
              <span>Get Directions</span>
            </button>

            {listing.contactPhone && (
              <a
                href={`tel:${listing.contactPhone}`}
                aria-label="Call venue"
                className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-white/10 hover:bg-white/15 text-white flex items-center justify-center border border-white/10 transition-colors flex-shrink-0 active:scale-95"
              >
                <Phone className="w-4 h-4 text-white" />
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
