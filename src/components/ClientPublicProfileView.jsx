import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  ArrowLeft,
  Share2,
  MoreVertical,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Navigation,
  ChevronDown,
  ChevronUp,
  Flag,
  Sparkles,
  Calendar,
  AlertCircle,
  Check,
  X,
  ExternalLink,
  Store,
  Building2,
  User as UserIcon,
  LayoutGrid,
  Rows
} from 'lucide-react';
import ClientPostCard from './ClientPostCard';
import { getOptimizedImageUrl } from '../utils/imageUtils';
import {
  fetchPublicClientProfile,
  fetchClientListings,
  reportClientProfile,
  CATEGORIES
} from '../services/api';

const REPORT_REASONS = [
  { id: 'FAKE_OFFER', label: 'Fake or misleading offer' },
  { id: 'WRONG_LOCATION', label: 'Incorrect location or venue' },
  { id: 'SCAM', label: 'Scam or fraudulent activity' },
  { id: 'INAPPROPRIATE', label: 'Inappropriate or offensive content' },
  { id: 'OTHER', label: 'Other issue' }
];

export default function ClientPublicProfileView({
  slug,
  onClose,
  onSelectListing,
  savedListingIds = [],
  onToggleSave,
  onShareListing,
  accessToken = null
}) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tabs: 'active' | 'upcoming'
  const [currentTab, setCurrentTab] = useState('active');
  const [viewMode, setViewMode] = useState('card'); // 'card' | 'grid'
  const [activeListings, setActiveListings] = useState([]);
  const [upcomingListings, setUpcomingListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [activePage, setActivePage] = useState(0);
  const [upcomingPage, setUpcomingPage] = useState(0);
  const [activeHasMore, setActiveHasMore] = useState(false);
  const [upcomingHasMore, setUpcomingHasMore] = useState(false);

  // UI state
  const [isHoursExpanded, setIsHoursExpanded] = useState(false);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('FAKE_OFFER');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState(null);

  const overflowRef = useRef(null);

  // Close overflow menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (overflowRef.current && !overflowRef.current.contains(e.target)) {
        setIsOverflowOpen(false);
      }
    }
    if (isOverflowOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOverflowOpen]);

  // Load public profile
  useEffect(() => {
    if (!slug) return;
    let isCancelled = false;
    setLoading(true);
    setError(null);

    fetchPublicClientProfile(slug)
      .then((data) => {
        if (!isCancelled) {
          setProfile(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!isCancelled) {
          console.error('Failed to load client profile:', err);
          setError(
            err.status === 404
              ? 'This business profile is not available or has been deactivated.'
              : 'Unable to load profile. Please check your internet connection.'
          );
          setLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [slug]);

  // Load listings for current tab
  const loadTabListings = useCallback(
    async (tab, page = 0, isInitial = false) => {
      if (!slug) return;
      setListingsLoading(true);
      try {
        const data = await fetchClientListings(slug, tab, page, 10);
        const content = data.content || [];
        const hasMore = !data.last;

        if (tab === 'active') {
          setActiveListings((prev) => (isInitial || page === 0 ? content : [...prev, ...content]));
          setActiveHasMore(hasMore);
          setActivePage(page);
        } else {
          setUpcomingListings((prev) => (isInitial || page === 0 ? content : [...prev, ...content]));
          setUpcomingHasMore(hasMore);
          setUpcomingPage(page);
        }
      } catch (err) {
        console.error(`Failed to load ${tab} listings:`, err);
      } finally {
        setListingsLoading(false);
      }
    },
    [slug]
  );

  useEffect(() => {
    if (!profile) return;
    loadTabListings(currentTab, 0, true);
  }, [profile, currentTab, loadTabListings]);

  // Share profile
  const handleShareProfile = async () => {
    setIsOverflowOpen(false);
    const shareUrl = window.location.href;
    const shareTitle = `${profile?.businessName || 'Business Profile'} - myCiti`;
    const shareText = profile?.bio
      ? `${profile.businessName}: ${profile.bio}`
      : `Check out ${profile?.businessName} on myCiti!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: shareTitle,
          text: shareText,
          url: shareUrl
        });
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Navigator share error:', err);
        }
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      showToast('Link copied to clipboard!');
    } catch {
      showToast('Profile URL: ' + shareUrl);
    }
  };

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  // Submit report
  const handleSubmitReport = async (e) => {
    e.preventDefault();
    if (!reportReason) return;
    setReportSubmitting(true);
    setReportError(null);
    try {
      await reportClientProfile(
        slug,
        {
          reason: reportReason,
          details: reportDetails.trim() || null
        },
        accessToken
      );
      setReportSuccess(true);
      setTimeout(() => {
        setIsReportOpen(false);
        setReportSuccess(false);
        setReportDetails('');
        showToast('Thank you. Moderation team has received your report.');
      }, 1500);
    } catch (err) {
      setReportError(err.message || 'Failed to submit report. Please try again later.');
    } finally {
      setReportSubmitting(false);
    }
  };

  // Google Maps navigation link
  const getDirectionsUrl = () => {
    if (profile?.latitude && profile?.longitude) {
      return `https://www.google.com/maps/dir/?api=1&destination=${profile.latitude},${profile.longitude}`;
    }
    const query = encodeURIComponent(`${profile?.businessName || ''} ${profile?.address || ''} ${profile?.landmark || ''}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return '';
    try {
      const [h, m] = timeStr.split(':');
      const hour = parseInt(h, 10);
      const ampm = hour >= 12 ? 'PM' : 'AM';
      const formattedHour = hour % 12 || 12;
      return `${formattedHour}:${m} ${ampm}`;
    } catch {
      return timeStr.slice(0, 5);
    }
  };

  const renderClientTypePill = () => {
    const type = profile?.clientType;
    if (type === 'COMPANY') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          <Building2 className="w-3 h-3" />
          <span>Company</span>
        </span>
      );
    }
    if (type === 'INDIVIDUAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <UserIcon className="w-3 h-3" />
          <span>Individual</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-sky-50 dark:bg-sky-950/40 text-city-blue dark:text-sky-300 border border-sky-200 dark:border-sky-800">
        <Store className="w-3 h-3" />
        <span>Store</span>
      </span>
    );
  };

  const renderListingsList = (listings, isUpcomingTab) => {
    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {listings.map((listing) => {
            const rawImageUrl = listing.primaryImageUrl || (listing.images && listing.images[0]?.url);
            const imageUrl = getOptimizedImageUrl(rawImageUrl, 400, 400);
            const catCfg = CATEGORIES[listing.category] || CATEGORIES.PANDAL;

            return (
              <article
                key={listing.id}
                onClick={() => onSelectListing && onSelectListing(listing)}
                className="group relative aspect-square rounded-[22px] overflow-hidden bg-slate-100 dark:bg-slate-800 cursor-pointer shadow-soft hover:shadow-float active:scale-[0.98] transition-all border border-slate-100 dark:border-slate-800"
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={listing.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-sky-50 to-blue-100 dark:from-slate-800 dark:to-slate-900 text-3xl">
                    {catCfg.icon}
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent pointer-events-none" />

                {/* Top Badges */}
                <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
                  <span className="w-6 h-6 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-xs">
                    {catCfg.icon}
                  </span>
                </div>

                <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                  {isUpcomingTab ? (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-600/90 text-white font-bold text-[9px] backdrop-blur-md">
                      Upcoming
                    </span>
                  ) : listing.openNow ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/95 text-white font-bold text-[9px] backdrop-blur-md shadow-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Live
                    </span>
                  ) : null}
                </div>

                {/* Bottom Content Overlay */}
                <div className="absolute bottom-2.5 left-2.5 right-2.5 z-10">
                  {listing.offerText && (
                    <span className="inline-block max-w-full truncate px-1.5 py-0.5 rounded-md bg-amber-500 text-white font-extrabold text-[9px] mb-1 shadow-2xs">
                      🏷️ {listing.offerText}
                    </span>
                  )}
                  <h4 className="text-white text-xs font-black line-clamp-1 leading-tight group-hover:text-sky-300 transition-colors">
                    {listing.title}
                  </h4>
                </div>
              </article>
            );
          })}
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {listings.map((listing) => (
          <ClientPostCard
            key={listing.id}
            listing={listing}
            onSelect={onSelectListing}
            isSaved={savedListingIds.includes(listing.id)}
            onToggleSave={onToggleSave}
            onShare={onShareListing}
            isUpcoming={isUpcomingTab}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-[3500] bg-slate-50 dark:bg-slate-950 overflow-y-auto overscroll-contain flex flex-col items-center">
      <div className="w-full max-w-3xl min-h-screen bg-white dark:bg-slate-900 shadow-xl flex flex-col relative pb-20">

        {/* --- Top Cover Banner --- */}
        <div className="relative w-full aspect-[3/1] md:aspect-[16/9] md:max-h-[280px] bg-gradient-to-r from-[#cfe7ff] via-[#dbeafe] to-[#eaf4ff] dark:from-slate-800 dark:to-slate-900 overflow-hidden flex-shrink-0">
          {profile?.coverUrl ? (
            <img
              src={profile.coverUrl}
              alt={`${profile.businessName} cover`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full opacity-40 bg-[radial-gradient(#2f7bff_1px,transparent_1px)] [background-size:16px_16px]" />
          )}

          {/* Top Floating Controls */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-auto">
            {/* Round Back Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Go back"
              className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-black/40 hover:bg-black/60 active:scale-95 text-white backdrop-blur-md flex items-center justify-center transition-all shadow-md cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Top-right Action Buttons */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShareProfile}
                aria-label="Share profile"
                className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-black/40 hover:bg-black/60 active:scale-95 text-white backdrop-blur-md flex items-center justify-center transition-all shadow-md cursor-pointer"
              >
                <Share2 className="w-5 h-5" />
              </button>

              <div className="relative" ref={overflowRef}>
                <button
                  type="button"
                  onClick={() => setIsOverflowOpen((prev) => !prev)}
                  aria-label="More options"
                  aria-expanded={isOverflowOpen}
                  className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-full bg-black/40 hover:bg-black/60 active:scale-95 text-white backdrop-blur-md flex items-center justify-center transition-all shadow-md cursor-pointer"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {/* Overflow dropdown */}
                {isOverflowOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-100 dark:border-slate-700 py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                    <button
                      type="button"
                      onClick={() => {
                        setIsOverflowOpen(false);
                        setIsReportOpen(true);
                      }}
                      className="w-full min-h-[44px] px-4 py-2.5 text-left text-sm font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Flag className="w-4 h-4" />
                      <span>Report profile</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleShareProfile}
                      className="w-full min-h-[44px] px-4 py-2.5 text-left text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2.5 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share link</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* --- Loading State --- */}
        {loading && (
          <div className="p-8 flex flex-col items-center justify-center gap-3 text-slate-500 animate-pulse">
            <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <p className="text-xs text-slate-400 font-medium mt-2">Loading verified profile...</p>
          </div>
        )}

        {/* --- Error State --- */}
        {error && (
          <div className="p-8 flex flex-col items-center justify-center text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <AlertCircle className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Profile Unavailable</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-sm">{error}</p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] px-6 py-2.5 bg-city-blue hover:bg-blue-600 text-white font-bold text-sm rounded-full shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        )}

        {/* --- Loaded Profile Content --- */}
        {!loading && !error && profile && (
          <>
            {/* Header info & Avatar */}
            <div className="px-5 relative pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-end justify-between -mt-[44px] md:-mt-[56px] mb-3">
                {/* Round Avatar */}
                <div className="w-[88px] h-[88px] md:w-[112px] md:h-[112px] rounded-full border-[3px] border-white dark:border-slate-900 bg-sky-100 dark:bg-slate-800 shadow-lg overflow-hidden flex-shrink-0 flex items-center justify-center relative z-10">
                  {profile.logoUrl ? (
                    <img
                      src={profile.logoUrl}
                      alt={profile.businessName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl md:text-4xl font-extrabold text-city-blue dark:text-sky-400">
                      {(profile.businessName || 'C').charAt(0).toUpperCase()}
                    </span>
                  )}
                </div>

                {/* Client Type Pill on right */}
                <div className="mb-1">{renderClientTypePill()}</div>
              </div>

              {/* Title & Verified Badge */}
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl md:text-2xl font-black text-slate-900 dark:text-slate-50 tracking-tight leading-tight">
                  {profile.businessName}
                </h1>
                {profile.verified && (
                  <span
                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#1d9bf0] text-white flex-shrink-0 shadow-sm"
                    title="Verified client profile"
                  >
                    <svg
                      className="w-3 h-3 fill-current stroke-current"
                      viewBox="0 0 24 24"
                      strokeWidth="3"
                      stroke="currentColor"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  </span>
                )}
              </div>

              {/* Slug Handle */}
              <p className="text-xs text-slate-400 font-semibold mt-0.5">@{profile.slug}</p>

              {/* Bio */}
              {profile.bio && (
                <p className="mt-2.5 text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal whitespace-pre-line">
                  {profile.bio}
                </p>
              )}

              {/* Metadata Row: Address & Hours */}
              <div className="mt-3.5 flex flex-col gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-xs">
                {/* Location / Address */}
                {(profile.address || profile.landmark) && (
                  <button
                    type="button"
                    onClick={() => window.open(getDirectionsUrl(), '_blank', 'noopener,noreferrer')}
                    className="flex items-start gap-2 text-slate-600 dark:text-slate-300 hover:text-city-blue dark:hover:text-sky-400 text-left transition-colors cursor-pointer group"
                  >
                    <MapPin className="w-4 h-4 text-city-blue flex-shrink-0 mt-0.5" />
                    <span className="font-medium group-hover:underline">
                      {profile.landmark ? `${profile.landmark}, ` : ''}
                      {profile.address || 'Kolkata'}
                    </span>
                    <ExternalLink className="w-3 h-3 text-slate-400 opacity-60 flex-shrink-0 mt-0.5" />
                  </button>
                )}

                {/* Operating Hours & Open Now Badge */}
                {(profile.dailyOpenTime || profile.dailyCloseTime) && (
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => setIsHoursExpanded((prev) => !prev)}
                      className="flex items-center justify-between text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer py-1"
                    >
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-city-blue flex-shrink-0" />
                        {profile.openNow === true ? (
                          <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            Open now
                          </span>
                        ) : profile.openNow === false ? (
                          <span className="inline-flex items-center gap-1.5 font-bold text-rose-600 dark:text-rose-400">
                            <span className="w-2 h-2 rounded-full bg-rose-500" />
                            Closed
                          </span>
                        ) : (
                          <span className="font-medium">Operating Hours</span>
                        )}
                        <span className="text-slate-400 font-normal">
                          · {formatTime(profile.dailyOpenTime)} - {formatTime(profile.dailyCloseTime)}
                        </span>
                      </div>
                      <div className="text-slate-400">
                        {isHoursExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </div>
                    </button>

                    {isHoursExpanded && (
                      <div className="ml-6 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/70 text-[11px] text-slate-600 dark:text-slate-300 border border-slate-100 dark:border-slate-700/60 animate-in fade-in duration-200">
                        <p className="font-semibold text-slate-900 dark:text-slate-100">Standard Daily Hours:</p>
                        <p className="mt-0.5">
                          Daily: {formatTime(profile.dailyOpenTime)} to {formatTime(profile.dailyCloseTime)}
                        </p>
                        <p className="text-[10px] text-slate-400 mt-1">
                          * Hours may vary on public holidays and festival days.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons Row (min 44px touch target) */}
              <div className="mt-4 flex items-center gap-2.5 flex-wrap">
                {/* Call button (only shown if showPhone is true and publicPhone is present) */}
                {profile.showPhone && profile.publicPhone && (
                  <a
                    href={`tel:${profile.publicPhone}`}
                    className="min-h-[44px] px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                  >
                    <Phone className="w-4 h-4 text-city-blue" />
                    <span>Call</span>
                  </a>
                )}

                {/* WhatsApp button */}
                {profile.whatsappNumber && (
                  <a
                    href={`https://wa.me/91${profile.whatsappNumber}?text=${encodeURIComponent('Hi, saw your profile on myciti')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="min-h-[44px] px-4 py-2 rounded-full bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 font-bold text-xs flex items-center gap-2 transition-all shadow-sm active:scale-95 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>WhatsApp</span>
                  </a>
                )}

                {/* Get directions button */}
                <button
                  type="button"
                  onClick={() => window.open(getDirectionsUrl(), '_blank', 'noopener,noreferrer')}
                  className="min-h-[44px] px-4 py-2 rounded-full bg-city-blue hover:bg-blue-600 active:scale-95 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer"
                >
                  <Navigation className="w-4 h-4 fill-white" />
                  <span>Get directions</span>
                </button>

                {/* Share button */}
                <button
                  type="button"
                  onClick={handleShareProfile}
                  className="min-h-[44px] px-4 py-2 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 active:scale-95 text-slate-800 dark:text-slate-100 font-bold text-xs flex items-center gap-2 transition-all shadow-sm cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Share</span>
                </button>
              </div>
            </div>

            {/* --- Sticky Tabs --- */}
            <div className="sticky top-0 z-20 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex">
              <button
                type="button"
                onClick={() => setCurrentTab('active')}
                className={`flex-1 min-h-[48px] py-3 text-center text-sm font-bold transition-all relative cursor-pointer ${
                  currentTab === 'active'
                    ? 'text-city-blue dark:text-sky-400'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <span>Active ({profile.activeListingsCount ?? activeListings.length})</span>
                {currentTab === 'active' && (
                  <span className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-city-blue rounded-full" />
                )}
              </button>

              <button
                type="button"
                onClick={() => setCurrentTab('upcoming')}
                className={`flex-1 min-h-[48px] py-3 text-center text-sm font-bold transition-all relative cursor-pointer ${
                  currentTab === 'upcoming'
                    ? 'text-city-blue dark:text-sky-400'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                <span>Upcoming ({profile.upcomingListingsCount ?? upcomingListings.length})</span>
                {currentTab === 'upcoming' && (
                  <span className="absolute bottom-0 left-1/4 right-1/4 h-1 bg-city-blue rounded-full" />
                )}
              </button>
            </div>

            {/* --- Listings Content --- */}
            <div className="p-4 flex-1">
              {/* View Mode & Header Bar */}
              {((currentTab === 'active' && activeListings.length > 0) ||
                (currentTab === 'upcoming' && upcomingListings.length > 0)) && (
                <div className="flex items-center justify-between px-1 mb-3.5">
                  <p className="text-xs font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                    {currentTab === 'active'
                      ? `${activeListings.length} Active Update${activeListings.length > 1 ? 's' : ''}`
                      : `${upcomingListings.length} Scheduled Event${upcomingListings.length > 1 ? 's' : ''}`}
                  </p>

                  <div className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-full border border-slate-200/60 dark:border-slate-700/60">
                    <button
                      type="button"
                      onClick={() => setViewMode('card')}
                      aria-label="Feed card view"
                      title="Feed card view"
                      className={`p-1.5 rounded-full transition-all cursor-pointer ${
                        viewMode === 'card'
                          ? 'bg-white dark:bg-slate-700 text-city-blue dark:text-sky-400 shadow-xs'
                          : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <Rows className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setViewMode('grid')}
                      aria-label="Photo grid view"
                      title="Photo grid view"
                      className={`p-1.5 rounded-full transition-all cursor-pointer ${
                        viewMode === 'grid'
                          ? 'bg-white dark:bg-slate-700 text-city-blue dark:text-sky-400 shadow-xs'
                          : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                      }`}
                    >
                      <LayoutGrid className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {listingsLoading && (currentTab === 'active' ? activeListings.length === 0 : upcomingListings.length === 0) ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <div className="w-8 h-8 border-3 border-city-blue border-t-transparent rounded-full animate-spin" />
                  <p className="text-xs font-semibold">Loading offers & listings...</p>
                </div>
              ) : currentTab === 'active' ? (
                activeListings.length > 0 ? (
                  renderListingsList(activeListings, false)
                ) : (
                  /* Empty state for Active */
                  <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-sky-50 dark:bg-sky-950/40 text-city-blue dark:text-sky-400 flex items-center justify-center mb-3">
                      <Sparkles className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                      No active offers right now
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
                      Check back soon for festive pandal timings, store discounts, and announcements.
                    </p>
                  </div>
                )
              ) : (
                /* Upcoming Tab */
                upcomingListings.length > 0 ? (
                  renderListingsList(upcomingListings, true)
                ) : (
                  /* Empty state for Upcoming */
                  <div className="py-16 px-4 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 flex items-center justify-center mb-3">
                      <Calendar className="w-8 h-8" />
                    </div>
                    <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                      No upcoming events scheduled
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs leading-relaxed">
                      This business hasn't scheduled any upcoming events or offers yet.
                    </p>
                  </div>
                )
              )}

              {/* Load More Button if pagination available */}
              {((currentTab === 'active' && activeHasMore) || (currentTab === 'upcoming' && upcomingHasMore)) && (
                <div className="mt-6 flex justify-center">
                  <button
                    type="button"
                    disabled={listingsLoading}
                    onClick={() =>
                      loadTabListings(
                        currentTab,
                        currentTab === 'active' ? activePage + 1 : upcomingPage + 1
                      )
                    }
                    className="min-h-[44px] px-6 py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {listingsLoading ? 'Loading more...' : 'Load more listings'}
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* --- Floating Toast Notification --- */}
      {toastMessage && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[4200] max-w-sm w-[90%] bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-bold flex items-center justify-center gap-2 animate-in slide-in-from-bottom-4 duration-200">
          <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600 flex-shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* --- Report Modal / Sheet --- */}
      {isReportOpen && (
        <div className="fixed inset-0 z-[4100] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-t-[28px] sm:rounded-[28px] shadow-2xl border border-slate-100 dark:border-slate-800 p-5 animate-in slide-in-from-bottom duration-300 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Flag className="w-4 h-4" />
                </div>
                <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-base">
                  Report Profile
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReportOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {reportSuccess ? (
              <div className="py-6 flex flex-col items-center justify-center text-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Check className="w-12 h-12" />
                <p className="font-bold text-sm">Report submitted successfully.</p>
              </div>
            ) : (
              <form onSubmit={handleSubmitReport} className="flex flex-col gap-3.5">
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Help us keep myciti safe. Select a reason why you are reporting <strong>@{slug}</strong>:
                </p>

                {reportError && (
                  <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
                    {reportError}
                  </div>
                )}

                {/* Reason radio choices */}
                <div className="flex flex-col gap-1.5">
                  {REPORT_REASONS.map((r) => (
                    <label
                      key={r.id}
                      className={`min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer transition-colors ${
                        reportReason === r.id
                          ? 'border-city-blue bg-blue-50/50 dark:bg-blue-950/30 text-city-blue dark:text-sky-300'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={r.id}
                        checked={reportReason === r.id}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="text-city-blue focus:ring-city-blue"
                      />
                      <span>{r.label}</span>
                    </label>
                  ))}
                </div>

                {/* Details textarea */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Additional details (optional, max 300 characters)
                  </label>
                  <textarea
                    rows={3}
                    maxLength={300}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide context or explanation..."
                    className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-city-blue resize-none"
                  />
                  <div className="flex justify-end text-[10px] text-slate-400 mt-0.5">
                    {reportDetails.length}/300
                  </div>
                </div>

                {/* Modal Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(false)}
                    className="min-h-[44px] px-4 py-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="min-h-[44px] px-6 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                  >
                    {reportSubmitting ? 'Submitting...' : 'Submit Report'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
