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
  Store
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
      text: `${listing.title} - ${listing.landmark}, ${listing.city || 'Bhubaneswar'}`,
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
        className="fixed inset-0 bg-black/75 backdrop-blur-md z-[3600] animate-in fade-in duration-160"
      />

      {/* Floating Modal Card Wrapper */}
      <div className="fixed inset-0 z-[3601] flex items-end sm:items-center justify-center p-3 sm:p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-label={listing.title}
          className="pointer-events-auto w-full max-w-md bg-white dark:bg-[#10141c] text-slate-900 dark:text-[#f4f5f7] rounded-[6px] sm:rounded-[8px] overflow-hidden shadow-2xl border border-slate-200 dark:border-[#303139] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-160 flex flex-col max-h-[92dvh]"
        >
          {/* Top Hero Image Section with Seamless Gradient Fade */}
          <div className="relative w-full aspect-[4/3] flex-shrink-0 bg-slate-100 dark:bg-[#101522] overflow-hidden">
            {images.length > 0 ? (
              <img
                src={images[activeImageIndex].url}
                alt={listing.title}
                className="w-full h-full object-cover transition-opacity duration-160"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-[#101522] text-amber-600 dark:text-[#edcd8c]">
                <span className="text-5xl mb-2">{categoryConfig.icon}</span>
                <span className="text-xs uppercase tracking-widest font-mono font-medium text-slate-500 dark:text-[#c9ced8]">
                  {categoryConfig.label}
                </span>
              </div>
            )}

            {/* Smooth Atmospheric Gradient overlay fading seamlessly into surface */}
            <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 dark:from-[#10141c] dark:via-[#10141c]/60 to-transparent pointer-events-none" />

            {/* Top Left: Category Badge */}
            <div className="absolute top-3.5 left-3.5 z-20 flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-white/90 dark:bg-[#10141c]/90 backdrop-blur-md border border-slate-200 dark:border-[#303139] text-slate-800 dark:text-[#f4f5f7] shadow-sm">
                <span>{categoryConfig.icon}</span>
                <span>{categoryConfig.label}</span>
              </span>
            </div>

            {/* Top Right: Save, Share & Close Buttons */}
            <div className="absolute top-3.5 right-3.5 z-20 flex items-center gap-1.5">
              <button
                onClick={handleSave}
                aria-label="Save listing"
                className="w-9 h-9 rounded-full bg-white/90 dark:bg-[#10141c]/90 hover:bg-slate-100 dark:hover:bg-[#101522] backdrop-blur-md border border-slate-200 dark:border-[#303139] hover:border-[#ff951f]/60 text-slate-800 dark:text-[#f4f5f7] flex items-center justify-center transition-all duration-160 cursor-pointer active:scale-95"
              >
                <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-600 text-amber-600 dark:fill-[#edcd8c] dark:text-[#edcd8c]' : 'text-slate-700 dark:text-[#f4f5f7]'}`} />
              </button>

              <button
                onClick={handleShare}
                aria-label="Share listing"
                className="w-9 h-9 rounded-full bg-white/90 dark:bg-[#10141c]/90 hover:bg-slate-100 dark:hover:bg-[#101522] backdrop-blur-md border border-slate-200 dark:border-[#303139] hover:border-[#ff951f]/60 text-slate-800 dark:text-[#f4f5f7] flex items-center justify-center transition-all duration-160 cursor-pointer active:scale-95"
              >
                {copied ? <Check className="w-4 h-4 text-[#ff951f]" /> : <Share2 className="w-4 h-4 text-slate-700 dark:text-[#f4f5f7]" />}
              </button>

              <button
                onClick={onClose}
                aria-label="Close details"
                className="w-9 h-9 rounded-full bg-white/90 dark:bg-[#10141c]/90 hover:bg-slate-100 dark:hover:bg-[#101522] backdrop-blur-md border border-slate-200 dark:border-[#303139] hover:border-[#ff951f]/60 text-slate-800 dark:text-[#f4f5f7] flex items-center justify-center transition-all duration-160 cursor-pointer active:scale-95"
              >
                <X className="w-4 h-4 text-slate-700 dark:text-[#f4f5f7]" />
              </button>
            </div>

            {/* Multi-Image Controls */}
            {images.length > 1 && (
              <>
                <button
                  onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                  aria-label="Previous image"
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-[#10141c]/90 hover:bg-slate-100 dark:hover:bg-[#101522] text-slate-800 dark:text-[#f4f5f7] flex items-center justify-center backdrop-blur-md border border-slate-200 dark:border-[#303139] transition-all duration-160 cursor-pointer z-10"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <button
                  onClick={() => setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                  aria-label="Next image"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-white/90 dark:bg-[#10141c]/90 hover:bg-slate-100 dark:hover:bg-[#101522] text-slate-800 dark:text-[#f4f5f7] flex items-center justify-center backdrop-blur-md border border-slate-200 dark:border-[#303139] transition-all duration-160 cursor-pointer z-10"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>

                {/* Dot Indicators */}
                <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white/90 dark:bg-[#10141c]/90 px-2.5 py-1 rounded-full backdrop-blur-md border border-slate-200 dark:border-[#303139] z-10">
                  {images.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActiveImageIndex(idx)}
                      aria-label={`Go to image ${idx + 1}`}
                      className={`h-1.5 rounded-full transition-all duration-160 ${
                        idx === activeImageIndex ? 'bg-[#ff951f] w-3.5' : 'bg-slate-400 dark:bg-[#c9ced8]/50 w-1.5'
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Content Body */}
          <div className="relative -mt-14 sm:-mt-16 z-10 px-6 pt-1 pb-4 space-y-3.5 overflow-y-auto flex-1">
            {/* Title */}
            <div>
              <h2 className="text-2xl sm:text-[26px] font-medium text-slate-900 dark:text-[#f4f5f7] tracking-tight leading-tight">
                {listing.title}
              </h2>
            </div>

            {/* Description */}
            {listing.description && (
              <p className="text-sm text-slate-600 dark:text-[#c9ced8] leading-relaxed font-normal">
                {listing.description}
              </p>
            )}

            {/* Pills / Badges Row */}
            <div className="flex items-center gap-2 flex-wrap pt-1">
              {/* Live Status Pill */}
              {listing.openNow ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-medium bg-slate-100 dark:bg-[#101522] border border-slate-200 dark:border-[#303139] text-slate-800 dark:text-[#f4f5f7]">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#ff951f] animate-pulse" />
                  <span>Live Now</span>
                </div>
              ) : (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#101522] border border-slate-200 dark:border-[#303139] text-slate-600 dark:text-[#c9ced8] text-xs font-mono font-medium">
                  <span>Closed</span>
                </div>
              )}

              {/* Operating Hours Pill */}
              {listing.dailyOpenTime && listing.dailyCloseTime && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#101522] border border-slate-200 dark:border-[#303139] text-amber-700 dark:text-[#edcd8c] text-xs font-mono font-medium">
                  <Clock className="w-3.5 h-3.5 text-[#ff951f]" />
                  <span>{listing.dailyOpenTime.slice(0, 5)} - {listing.dailyCloseTime.slice(0, 5)}</span>
                </div>
              )}

              {/* Location Landmark & Distance Pill */}
              {(listing.landmark || listing.city) && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-[#101522] border border-slate-200 dark:border-[#303139] text-slate-600 dark:text-[#c9ced8] text-xs font-mono font-medium">
                  <MapPin className="w-3.5 h-3.5 text-[#ff951f]" />
                  <span className="truncate max-w-[160px] text-slate-800 dark:text-[#f4f5f7]">{listing.landmark || listing.city}</span>
                  {listing.distanceKm !== undefined && listing.distanceKm !== null && (
                    <span className="text-amber-700 dark:text-[#edcd8c] font-bold">• {listing.distanceKm} km</span>
                  )}
                </div>
              )}

              {/* Special Offer Pill */}
              {listing.offerText && (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-[#101522] border border-amber-200/60 dark:border-[#303139] text-amber-800 dark:text-[#edcd8c] text-xs font-mono font-semibold">
                  <Tag className="w-3.5 h-3.5 text-[#ff951f]" />
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
                className="flex items-center justify-between p-3 rounded-[5px] bg-slate-100 dark:bg-[#101522] hover:bg-slate-200/70 dark:hover:bg-[#101522]/80 border border-slate-200 dark:border-[#303139] hover:border-[#ff951f]/50 transition-all duration-160 cursor-pointer group active:scale-[0.99] mt-2"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-[4px] overflow-hidden bg-white dark:bg-[#10141c] border border-slate-200 dark:border-[#303139] flex items-center justify-center flex-shrink-0">
                    {listing.clientLogoUrl ? (
                      <img
                        src={listing.clientLogoUrl}
                        alt=""
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <Store className="w-4 h-4 text-[#ff951f]" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-slate-800 dark:text-[#f4f5f7] truncate group-hover:text-[#ff951f] transition-colors duration-160">
                        {listing.clientBusinessName || listing.clientSlug}
                      </span>
                      {listing.clientVerified && (
                        <span
                          className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#ff951f] text-[#07090e] font-bold text-[8px] flex-shrink-0"
                          title="Verified business"
                        >
                          ✓
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-mono text-slate-500 dark:text-[#c9ced8] truncate">
                      {listing.openNow ? 'Checkout other updates & live posts' : 'View business profile'}
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 dark:text-[#c9ced8] group-hover:text-[#ff951f] group-hover:translate-x-0.5 transition-all duration-160 flex-shrink-0" />
              </div>
            )}

            {/* Address / Directions Info */}
            {listing.address && listing.address !== listing.landmark && (
              <div className="flex items-start gap-2 pt-1 text-xs text-slate-600 dark:text-[#c9ced8]">
                <MapPin className="w-3.5 h-3.5 text-[#ff951f] flex-shrink-0 mt-0.5" />
                <span className="leading-snug">{listing.address}</span>
              </div>
            )}
          </div>

          {/* Sticky Bottom Action Button Section */}
          <div className="p-4 sm:p-5 pt-3 bg-white dark:bg-[#10141c] border-t border-slate-100 dark:border-[#303139] flex items-center gap-3">
            <button
              onClick={handleDirections}
              className="flex-1 py-3.5 sm:py-4 px-6 active:scale-[0.98] rounded-full font-semibold text-sm sm:text-base shadow-xl flex items-center justify-center gap-2 transition-all duration-160 cursor-pointer bg-[#ff951f] hover:bg-[#e68416] text-[#07090e]"
            >
              <Navigation className="w-4 h-4 fill-[#07090e] text-[#07090e]" />
              <span>Get Directions</span>
            </button>

            {listing.contactPhone && (
              <a
                href={`tel:${listing.contactPhone}`}
                aria-label="Call venue"
                className="w-12 h-12 sm:w-13 sm:h-13 rounded-full bg-slate-100 dark:bg-[#101522] hover:bg-slate-200 dark:hover:bg-[#101522]/80 text-slate-800 dark:text-[#f4f5f7] flex items-center justify-center border border-slate-200 dark:border-[#303139] hover:border-[#ff951f]/50 transition-colors duration-160 flex-shrink-0 active:scale-95"
              >
                <Phone className="w-4 h-4 text-amber-700 dark:text-[#edcd8c]" />
              </a>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
