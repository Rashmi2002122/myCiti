import React, { useState } from 'react';
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

  return (
    <>
      {/* Backdrop with higher z-index to overlay over profile views if opened from inside */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-[3600] animate-in fade-in duration-200"
      />

      {/* Sheet Container */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[3601] max-w-xl mx-auto bg-white dark:bg-slate-900 rounded-t-[30px] shadow-sheet border-t border-slate-200/50 dark:border-slate-800 animate-in slide-in-from-bottom duration-250 max-h-[85dvh] flex flex-col overflow-hidden"
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
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Open Now
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400">
                Closed
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            aria-label="Close details"
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 flex items-center justify-center transition-colors mt-2"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* Image Carousel / Hero Image */}
          {images.length > 0 && (
            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 shadow-inner">
              <img
                src={images[activeImageIndex].url}
                alt={listing.title}
                className="w-full h-full object-cover transition-all duration-300"
              />

              {/* Prev / Next buttons for multi-image */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1))}
                    aria-label="Previous image"
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-xs hover:bg-black/70 transition-all"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setActiveImageIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0))}
                    aria-label="Next image"
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/50 text-white flex items-center justify-center backdrop-blur-xs hover:bg-black/70 transition-all"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>

                  {/* Dot Indicators */}
                  <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-black/40 px-2.5 py-1 rounded-full backdrop-blur-xs">
                    {images.map((_, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveImageIndex(idx)}
                        aria-label={`Go to image ${idx + 1}`}
                        className={`w-1.5 h-1.5 rounded-full transition-all ${
                          idx === activeImageIndex ? 'bg-white w-3' : 'bg-white/60'
                        }`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Title & Business Attribution */}
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-50 leading-tight">
              {listing.title}
            </h2>

            {/* Business Profile Attribution Card */}
            {listing.clientSlug && (
              <div
                role="button"
                tabIndex={0}
                onClick={() => {
                  onClose();
                  if (onOpenClientProfile) {
                    onOpenClientProfile(listing.clientSlug);
                  } else {
                    window.history.pushState({}, '', `/c/${listing.clientSlug}`);
                    window.dispatchEvent(new PopStateEvent('popstate'));
                  }
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onClose();
                    if (onOpenClientProfile) {
                      onOpenClientProfile(listing.clientSlug);
                    } else {
                      window.history.pushState({}, '', `/c/${listing.clientSlug}`);
                      window.dispatchEvent(new PopStateEvent('popstate'));
                    }
                  }
                }}
                className="mt-3 group relative flex items-center justify-between gap-3 p-3 rounded-2xl bg-gradient-to-r from-sky-50/80 via-white to-blue-50/50 dark:from-slate-800/90 dark:via-slate-800/70 dark:to-sky-950/40 border border-sky-100 dark:border-slate-700/80 hover:border-city-blue/40 dark:hover:border-sky-500/40 shadow-xs hover:shadow-md transition-all cursor-pointer active:scale-[0.99]"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {/* Business Logo or Avatar */}
                  <div className="relative w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 bg-white dark:bg-slate-700 shadow-xs border border-slate-200/60 dark:border-slate-600 flex items-center justify-center">
                    {listing.clientLogoUrl ? (
                      <img
                        src={listing.clientLogoUrl}
                        alt={listing.clientBusinessName || 'Business profile'}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    ) : (
                      <Store className="w-5 h-5 text-city-blue dark:text-sky-400" />
                    )}
                  </div>

                  {/* Business Name & Tag */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="font-extrabold text-sm text-slate-900 dark:text-white truncate group-hover:text-city-blue dark:group-hover:text-sky-400 transition-colors">
                        {listing.clientBusinessName || listing.clientSlug}
                      </span>
                      {listing.clientVerified && (
                        <span
                          className="inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-[#1d9bf0] text-white flex-shrink-0 shadow-sm"
                          title="Verified business"
                        >
                          <svg className="w-2.5 h-2.5 fill-current stroke-current" viewBox="0 0 24 24" strokeWidth="3" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                          </svg>
                        </span>
                      )}
                    </div>
                    <span className="text-[11px] text-city-blue dark:text-sky-400 font-semibold flex items-center gap-1 mt-0.5">
                      View business profile & all posts
                    </span>
                  </div>
                </div>

                {/* Right Arrow Action */}
                <div className="w-7 h-7 rounded-full bg-white dark:bg-slate-700 shadow-xs flex items-center justify-center flex-shrink-0 text-slate-400 group-hover:text-city-blue dark:group-hover:text-sky-400 group-hover:translate-x-0.5 transition-all">
                  <ChevronRight className="w-4 h-4" />
                </div>
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
