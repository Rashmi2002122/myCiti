import React, { useState } from 'react';
import { X, Navigation, Bookmark, Share2, Clock, MapPin, Phone, Tag, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { CATEGORIES } from '../services/api';

export default function BottomSheet({ listing, onClose, isSaved, onToggleSave, onOpenClientProfile }) {
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [copied, setCopied] = useState(false);

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
      title: `${listing.title} - myCiti`,
      text: `${listing.title} (${categoryConfig.label})\n${listing.landmark}, ${listing.address}`,
      url: `${window.location.origin}/?listingId=${listing.id}`
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        if (err.name !== 'AbortError') {
          copyFallback(shareData.url);
        }
      }
    } else {
      copyFallback(shareData.url);
    }
  };

  const copyFallback = (url) => {
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[2000] animate-in fade-in duration-200"
      />

      {/* Sheet Container */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[2001] max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-t-[30px] shadow-sheet border-t border-slate-200/50 dark:border-slate-800 animate-in slide-in-from-bottom duration-250 max-h-[85dvh] flex flex-col overflow-hidden"
      >
        {/* Drag handle & close header */}
        <div className="relative pt-3 pb-2 px-6 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
          <div className="w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2.5" />
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${categoryConfig.badgeBg}`}
            >
              <span>{categoryConfig.icon}</span>
              <span>{categoryConfig.label}</span>
            </span>
            {listing.openNow ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Open now
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-100 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                Closed
              </span>
            )}
            {listing.distanceKm !== null && listing.distanceKm !== undefined && (
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                &bull; {listing.distanceKm} km away
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close sheet"
            className="min-w-[44px] min-h-[44px] w-11 h-11 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors mt-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto px-5 py-4 space-y-4">
          {/* Photo Carousel */}
          {images.length > 0 && (
            <div className="relative rounded-[22px] overflow-hidden bg-slate-100 dark:bg-slate-800 aspect-[16/10] shadow-sm">
              <img
                src={images[activeImageIndex]?.url}
                alt={listing.title}
                loading="lazy"
                className="w-full h-full object-cover transition-opacity duration-300"
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                    aria-label="Previous photo"
                    className="absolute left-2.5 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-xs transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                    aria-label="Next photo"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 min-w-[44px] min-h-[44px] w-11 h-11 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-xs transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1.5 bg-black/30 backdrop-blur-xs px-2.5 py-1 rounded-full">
                    {images.map((_, i) => (
                      <span
                        key={i}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          i === activeImageIndex ? 'bg-white w-3' : 'bg-white/50'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Title & Offer */}
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 leading-tight">
              {listing.title}
            </h2>

            {/* Client Attribution Link */}
            {listing.clientSlug && (
              <div className="mt-1.5 mb-1">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onOpenClientProfile) {
                      onOpenClientProfile(listing.clientSlug);
                    } else {
                      window.history.pushState({}, '', `/c/${listing.clientSlug}`);
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-city-blue dark:hover:text-sky-400 active:scale-95 transition-all cursor-pointer group"
                >
                  <span className="text-slate-400 font-normal">Posted by</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100 group-hover:underline">
                    {listing.clientBusinessName || listing.clientSlug}
                  </span>
                  {listing.clientVerified && (
                    <span
                      className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#1d9bf0] text-white flex-shrink-0 shadow-sm"
                      title="Verified client"
                    >
                      <svg
                        className="w-2.5 h-2.5 fill-current stroke-current"
                        viewBox="0 0 24 24"
                        strokeWidth="3"
                        stroke="currentColor"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </span>
                  )}
                </button>
              </div>
            )}

            {listing.offerText && (
              <div className="mt-2.5 p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-start gap-2.5 text-emerald-800 dark:text-emerald-300 text-xs font-semibold">
                <Tag className="w-4 h-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                <span>{listing.offerText}</span>
              </div>
            )}
          </div>

          {/* Description */}
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
            {listing.description}
          </p>

          {/* Details & Metadata Cards */}
          <div className="grid grid-cols-1 gap-2.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-3.5 rounded-[22px] border border-slate-100 dark:border-slate-800">
            {/* Address */}
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-city-blue flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100">{listing.landmark}</span>
                <p className="text-slate-500 dark:text-slate-400 text-[11px] leading-snug">{listing.address}</p>
              </div>
            </div>

            {/* Timing */}
            <div className="flex items-center gap-2.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50">
              <Clock className="w-4 h-4 text-city-blue flex-shrink-0" />
              <span>
                Daily: <strong className="font-semibold text-slate-900 dark:text-slate-100">{listing.dailyOpenTime?.slice(0, 5)} - {listing.dailyCloseTime?.slice(0, 5)}</strong> (Asia/Kolkata)
              </span>
            </div>

            {/* Contact */}
            {listing.contactPhone && (
              <div className="flex items-center gap-2.5 pt-1.5 border-t border-slate-200/50 dark:border-slate-700/50">
                <Phone className="w-4 h-4 text-city-blue flex-shrink-0" />
                <a href={`tel:${listing.contactPhone}`} className="text-city-blue hover:underline font-semibold">
                  {listing.contactPhone}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Sticky Action Footer */}
        <div className="p-4 pb-[max(1rem,calc(1rem+env(safe-area-inset-bottom)))] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex items-center gap-2.5">
          <button
            onClick={handleDirections}
            className="flex-1 min-h-[44px] py-2.5 px-4 bg-city-blue hover:bg-blue-600 active:scale-[0.98] text-white rounded-full font-bold text-sm shadow-md flex items-center justify-center gap-2 transition-all"
          >
            <Navigation className="w-4 h-4 fill-white" />
            <span>Get Directions</span>
          </button>

          <button
            onClick={handleSave}
            aria-label="Save listing"
            className={`min-w-[44px] min-h-[44px] px-3.5 flex items-center justify-center rounded-full font-semibold text-xs border transition-all ${
              isSaved
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-300'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 border-transparent'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-amber-500 text-amber-500' : ''}`} />
          </button>

          <button
            onClick={handleShare}
            aria-label="Share listing"
            className="min-w-[44px] min-h-[44px] px-3.5 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </>
  );
}
