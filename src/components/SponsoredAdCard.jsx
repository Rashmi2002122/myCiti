import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Flag, ExternalLink, MapPin, Tag } from 'lucide-react';
import { recordAdImpression, recordAdClick, CATEGORIES } from '../services/api';
import ReportAdModal from './ReportAdModal';

export default function SponsoredAdCard({
  ad,
  onSelectListing,
  onReportAd
}) {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const impressionRecordedRef = useRef(false);

  // Record impression once when ad mounts
  useEffect(() => {
    if (!ad?.id || impressionRecordedRef.current) return;
    impressionRecordedRef.current = true;
    recordAdImpression(ad.id).catch((err) => {
      console.warn('Failed to record ad impression:', err);
    });
  }, [ad?.id]);

  if (!ad) return null;

  const categoryCfg = (ad.listingCategory && CATEGORIES[ad.listingCategory]) || CATEGORIES.PANDAL;

  const handleClick = (e) => {
    // If click originated from the report button, ignore
    if (e.target.closest('[data-report-btn]')) return;

    recordAdClick(ad.id).catch((err) => {
      console.warn('Failed to record ad click:', err);
    });

    if (onSelectListing && ad.listingId) {
      onSelectListing({
        id: ad.listingId,
        title: ad.listingTitle,
        category: ad.listingCategory,
        landmark: ad.listingLandmark,
        primaryImageUrl: ad.listingImageUrl || ad.imageUrl,
        latitude: ad.targetLat,
        longitude: ad.targetLng
      });
    }
  };

  const imageUrl = ad.imageUrl || ad.listingImageUrl;

  return (
    <>
      <article
        onClick={handleClick}
        className="cursor-pointer bg-gradient-to-br from-amber-50/90 via-orange-50/40 to-white dark:from-amber-950/20 dark:via-slate-900 dark:to-slate-900 rounded-[26px] p-4 shadow-soft hover:shadow-float border border-amber-200/80 dark:border-amber-900/40 transition-all duration-200 flex flex-col gap-3 group relative overflow-hidden"
      >
        {/* Top bar: Sponsored Label + Report action */}
        <div className="flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-500 text-white shadow-2xs">
              <Sparkles className="w-3 h-3 fill-white" />
              <span>Sponsored</span>
            </span>
            {ad.targetAreaName && (
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                • {ad.targetAreaName}
              </span>
            )}
          </div>

          <button
            type="button"
            data-report-btn="true"
            onClick={(e) => {
              e.stopPropagation();
              setIsReportOpen(true);
            }}
            title="Report this advertisement"
            className="p-1 rounded-full text-slate-400 hover:text-rose-500 hover:bg-white dark:hover:bg-slate-800 transition-colors"
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Ad Media & Body */}
        <div className="flex flex-col sm:flex-row gap-3.5">
          {imageUrl && (
            <div className="relative w-full sm:w-36 h-36 sm:h-28 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 flex-shrink-0">
              <img
                src={imageUrl}
                alt={ad.headline || 'Sponsored'}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-extrabold px-1.5 py-0.5 rounded-full">
                {categoryCfg.icon} {categoryCfg.label}
              </span>
            </div>
          )}

          <div className="flex-1 flex flex-col justify-between space-y-1.5">
            <div>
              <h3 className="font-black text-slate-900 dark:text-slate-100 text-base leading-snug group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                {ad.headline || ad.listingTitle}
              </h3>

              {ad.description && (
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                  {ad.description}
                </p>
              )}

              {ad.listingLandmark && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <span className="truncate">{ad.listingLandmark}</span>
                </div>
              )}
            </div>

            {/* Call To Action button */}
            <div className="pt-2 flex items-center justify-between gap-2">
              <span className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <span>{ad.callToAction || 'View Details'}</span>
                <span className="group-hover:translate-x-0.5 transition-transform">&rarr;</span>
              </span>
              <span className="text-[10px] text-slate-400">Promoted by owner</span>
            </div>
          </div>
        </div>
      </article>

      {/* Report Ad Modal */}
      <ReportAdModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        campaign={ad}
        onReportSubmitted={onReportAd}
      />
    </>
  );
}
