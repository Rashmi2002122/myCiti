import React, { useEffect, useRef, useState } from 'react';
import { Sparkles, Flag, ExternalLink, MapPin, Tag } from 'lucide-react';
import { recordAdImpression, recordAdClick, CATEGORIES } from '../services/api';
import { getOptimizedImageUrl } from '../utils/imageUtils';
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

  const rawImageUrl = ad.imageUrl || ad.listingImageUrl;
  const imageUrl = getOptimizedImageUrl(rawImageUrl, 400, 300);

  return (
    <>
      <article
        onClick={handleClick}
        className="cursor-pointer bg-white dark:bg-[#10141c] rounded-[5px] p-3.5 shadow-soft hover:border-[#ff951f]/50 border border-slate-200 dark:border-[#303139] transition-all duration-160 flex flex-col gap-3 group relative overflow-hidden active:scale-[0.99]"
      >
        {/* Top bar: Sponsored Label + Report action */}
        <div className="flex items-center justify-between gap-2 relative z-10">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-[#ff951f] text-[#07090e] shadow-xs">
              <Sparkles className="w-3 h-3 fill-[#07090e]" />
              <span>Sponsored</span>
            </span>
            {ad.targetAreaName && (
              <span className="text-[11px] font-mono text-amber-700 dark:text-[#edcd8c]">
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
            className="p-1 rounded-full text-slate-400 dark:text-[#c9ced8] hover:text-[#ff951f] hover:bg-slate-100 dark:hover:bg-[#101522] transition-colors"
          >
            <Flag className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Ad Media & Body */}
        <div className="flex flex-col sm:flex-row gap-3.5">
          {imageUrl && (
            <div className="relative w-full sm:w-36 h-36 sm:h-28 rounded-[4px] overflow-hidden bg-slate-100 dark:bg-[#101522] flex-shrink-0">
              <img
                src={imageUrl}
                alt={ad.headline || 'Sponsored'}
                loading="lazy"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-160"
              />
              <span className="absolute bottom-1.5 left-1.5 bg-white/90 dark:bg-[#10141c]/90 text-slate-800 dark:text-[#f4f5f7] border border-slate-200 dark:border-[#303139] text-[9px] font-mono px-1.5 py-0.5 rounded-full">
                {categoryCfg.icon} {categoryCfg.label}
              </span>
            </div>
          )}

          <div className="flex-1 flex flex-col justify-between space-y-1.5">
            <div>
              <h3 className="font-medium text-slate-900 dark:text-[#f4f5f7] text-base leading-snug group-hover:text-[#ff951f] transition-colors duration-160 tracking-tight">
                {ad.headline || ad.listingTitle}
              </h3>

              {ad.description && (
                <p className="text-xs text-slate-600 dark:text-[#c9ced8] mt-1 line-clamp-2 leading-relaxed">
                  {ad.description}
                </p>
              )}

              {ad.listingLandmark && (
                <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-[#c9ced8] mt-1">
                  <MapPin className="w-3.5 h-3.5 text-[#ff951f] flex-shrink-0" />
                  <span className="truncate">{ad.listingLandmark}</span>
                </div>
              )}
            </div>

            {/* Call To Action button */}
            <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-[#303139]">
              <span className="text-[11px] font-mono font-medium text-[#ff951f] flex items-center gap-1">
                <span>{ad.callToAction || 'View Details'}</span>
                <span className="group-hover:translate-x-0.5 transition-transform duration-160">&rarr;</span>
              </span>
              <span className="text-[10px] font-mono text-slate-400 dark:text-[#c9ced8]/70">Verified Partner</span>
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
