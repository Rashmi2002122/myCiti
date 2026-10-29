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
  Flag,
  Calendar,
  AlertCircle,
  Check,
  X,
  Settings,
  Store,
  Building2,
  User as UserIcon
} from 'lucide-react';
import ClientPostCard, { AppVerifiedBadge } from './ClientPostCard';
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
  accessToken = null,
  _isOwner = false,
  onOpenEdit = null,
  refreshTrigger = 0
}) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Tabs: 'all' | 'active' | 'expired' | 'upcoming'
  const [currentTab, setCurrentTab] = useState('all');
  const [viewMode, setViewMode] = useState('card'); // 'card' (tweet stream) | 'grid' (media photos)
  const [allListings, setAllListings] = useState([]);
  const [activeListings, setActiveListings] = useState([]);
  const [upcomingListings, setUpcomingListings] = useState([]);
  const [expiredListings, setExpiredListings] = useState([]);
  const [listingsLoading, setListingsLoading] = useState(false);
  const [allPage, setAllPage] = useState(0);
  const [activePage, setActivePage] = useState(0);
  const [upcomingPage, setUpcomingPage] = useState(0);
  const [expiredPage, setExpiredPage] = useState(0);
  const [allHasMore, setAllHasMore] = useState(false);
  const [activeHasMore, setActiveHasMore] = useState(false);
  const [upcomingHasMore, setUpcomingHasMore] = useState(false);
  const [expiredHasMore, setExpiredHasMore] = useState(false);

  // UI state
  const [isScrolled, setIsScrolled] = useState(false);
  const [isOverflowOpen, setIsOverflowOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [reportReason, setReportReason] = useState('FAKE_OFFER');
  const [reportDetails, setReportDetails] = useState('');
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState(false);
  const [reportError, setReportError] = useState(null);

  const overflowRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Scroll listener for sticky header morphing
  const handleScroll = (e) => {
    const top = e.currentTarget.scrollTop;
    if (top > 120 && !isScrolled) setIsScrolled(true);
    else if (top <= 120 && isScrolled) setIsScrolled(false);
  };

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
  }, [slug, refreshTrigger]);

  // Load listings for current tab
  const loadTabListings = useCallback(
    async (tab, page = 0, isInitial = false) => {
      if (!slug) return;
      setListingsLoading(true);
      try {
        const data = await fetchClientListings(slug, tab, page, 10);
        const content = data.content || [];
        const hasMore = !data.last;

        if (tab === 'all') {
          setAllListings((prev) => (isInitial || page === 0 ? content : [...prev, ...content]));
          setAllHasMore(hasMore);
          setAllPage(page);
        } else if (tab === 'active' || tab === 'live') {
          setActiveListings((prev) => (isInitial || page === 0 ? content : [...prev, ...content]));
          setActiveHasMore(hasMore);
          setActivePage(page);
        } else if (tab === 'expired') {
          setExpiredListings((prev) => (isInitial || page === 0 ? content : [...prev, ...content]));
          setExpiredHasMore(hasMore);
          setExpiredPage(page);
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
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-50 dark:bg-[#101522] text-amber-800 dark:text-[#edcd8c] border border-amber-200 dark:border-[#303139]">
          <Building2 className="w-3 h-3 text-[#ff951f]" />
          <span>Company</span>
        </span>
      );
    }
    if (type === 'INDIVIDUAL') {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-50 dark:bg-[#101522] text-amber-800 dark:text-[#edcd8c] border border-amber-200 dark:border-[#303139]">
          <UserIcon className="w-3 h-3 text-[#ff951f]" />
          <span>Individual</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-mono font-medium bg-amber-50 dark:bg-[#101522] text-amber-800 dark:text-[#edcd8c] border border-amber-200 dark:border-[#303139]">
        <Store className="w-3 h-3 text-[#ff951f]" />
        <span>Store</span>
      </span>
    );
  };

  const renderListingsList = (listings) => {
    const todayStr = new Date().toISOString().split('T')[0];

    if (viewMode === 'grid') {
      return (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1">
          {listings.map((listing) => {
            const rawImageUrl = listing.primaryImageUrl || (listing.images && listing.images[0]?.url);
            const imageUrl = getOptimizedImageUrl(rawImageUrl, 400, 400);
            const catCfg = CATEGORIES[listing.category] || CATEGORIES.PANDAL;
            const isExpired = listing.isExpired === true || (listing.endDate && listing.endDate < todayStr);
            const isUpcoming = !isExpired && (listing.startDate && listing.startDate > todayStr);

            return (
              <article
                key={listing.id}
                onClick={() => onSelectListing && onSelectListing(listing)}
                className={`group relative aspect-square overflow-hidden bg-slate-100 dark:bg-[#101522] cursor-pointer hover:opacity-90 active:scale-[0.99] transition-all border border-slate-200/50 dark:border-[#303139] ${
                  isExpired ? 'opacity-80' : ''
                }`}
              >
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={listing.title}
                    loading="lazy"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 dark:bg-[#101522] text-3xl">
                    {catCfg.icon}
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent pointer-events-none" />

                {/* Top Badges */}
                <div className="absolute top-2 left-2 flex items-center gap-1 z-10">
                  <span className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center text-xs text-white">
                    {catCfg.icon}
                  </span>
                </div>

                <div className="absolute top-2 right-2 flex items-center gap-1 z-10">
                  {isExpired ? (
                    <span className="px-2 py-0.5 rounded-full bg-rose-950/85 text-rose-300 border border-rose-800/80 font-bold text-[9px] backdrop-blur-md">
                      Expired
                    </span>
                  ) : isUpcoming ? (
                    <span className="px-2 py-0.5 rounded-full bg-indigo-600/90 text-white font-bold text-[9px] backdrop-blur-md">
                      Upcoming
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/95 text-white font-bold text-[9px] backdrop-blur-md">
                      <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      Live
                    </span>
                  )}
                </div>

                {/* Bottom Content Overlay */}
                <div className="absolute bottom-2 left-2 right-2 z-10">
                  {listing.offerText && (
                    <span className="inline-block max-w-full truncate px-1.5 py-0.5 rounded bg-[#ff951f] text-[#07090e] font-bold text-[9px] mb-1">
                      🏷️ {listing.offerText}
                    </span>
                  )}
                  <h4 className="text-white text-xs font-semibold line-clamp-1 leading-tight group-hover:text-[#edcd8c] transition-colors">
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
      <div className="flex flex-col divide-y divide-slate-150 dark:divide-[#303139]">
        {listings.map((listing) => {
          const isExpired = listing.isExpired === true || (listing.endDate && listing.endDate < todayStr);
          const isUpcoming = !isExpired && (listing.startDate && listing.startDate > todayStr);
          return (
            <ClientPostCard
              key={listing.id}
              listing={listing}
              clientProfile={profile}
              onSelect={onSelectListing}
              isSaved={savedListingIds.includes(listing.id)}
              onToggleSave={onToggleSave}
              onShare={onShareListing}
              isUpcoming={isUpcoming}
            />
          );
        })}
      </div>
    );
  };

  const hasHours = profile?.dailyOpenTime && profile?.dailyCloseTime;
  const hoursFormatted = hasHours
    ? `${formatTime(profile.dailyOpenTime)} – ${formatTime(profile.dailyCloseTime)}`
    : profile?.dailyOpenTime
    ? `From ${formatTime(profile.dailyOpenTime)}`
    : profile?.dailyCloseTime
    ? `Until ${formatTime(profile.dailyCloseTime)}`
    : '';

  return (
    <div
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="fixed inset-0 z-[3500] bg-slate-100 dark:bg-[#07090e] overflow-y-auto overscroll-contain flex flex-col items-center"
    >
      <div className="w-full max-w-2xl min-h-screen bg-white dark:bg-[#10141c] border-x border-slate-200 dark:border-[#303139] flex flex-col relative pb-24 text-slate-900 dark:text-[#f4f5f7]">

        {/* --- Top Cover Banner (Fills completely from top Y=0, NO white bar above) --- */}
        <div className="relative w-full aspect-[2.6/1] sm:aspect-[3.2/1] min-h-[170px] sm:min-h-[220px] bg-slate-200 dark:bg-[#101522] overflow-hidden flex-shrink-0">
          {profile?.coverUrl ? (
            <img
              src={profile.coverUrl}
              alt={`${profile.businessName} cover`}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-[#ff951f] via-[#e68416] to-[#d9730d] dark:from-[#101522] dark:via-[#1a2030] dark:to-[#07090e]">
              <div className="w-full h-full opacity-25 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:20px_20px]" />
            </div>
          )}

          {/* Top subtle vignette shadow for clear button visibility */}
          <div className="absolute inset-x-0 top-0 h-20 bg-gradient-to-b from-black/60 via-black/25 to-transparent pointer-events-none" />

          {/* Floating Controls at Top of Cover Image */}
          <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10 pointer-events-auto">
            {/* Back Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Go back"
              className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-black/60 hover:bg-black/80 active:scale-95 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all shadow-md cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Right Action Buttons */}
            <div className="flex items-center gap-2">
              {onOpenEdit && (
                <button
                  type="button"
                  onClick={onOpenEdit}
                  aria-label="Edit Profile Settings"
                  title="Edit Profile Settings"
                  className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-black/60 hover:bg-black/80 active:scale-95 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all shadow-md cursor-pointer"
                >
                  <Settings className="w-5 h-5 text-[#ff951f]" />
                </button>
              )}

              <button
                type="button"
                onClick={handleShareProfile}
                aria-label="Share profile"
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-black/60 hover:bg-black/80 active:scale-95 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all shadow-md cursor-pointer"
              >
                <Share2 className="w-5 h-5" />
              </button>

              <div className="relative" ref={overflowRef}>
                <button
                  type="button"
                  onClick={() => setIsOverflowOpen((prev) => !prev)}
                  aria-label="More options"
                  aria-expanded={isOverflowOpen}
                  className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-black/60 hover:bg-black/80 active:scale-95 text-white backdrop-blur-md border border-white/20 flex items-center justify-center transition-all shadow-md cursor-pointer"
                >
                  <MoreVertical className="w-5 h-5" />
                </button>

                {isOverflowOpen && (
                  <div className="absolute right-0 mt-2 w-52 bg-white dark:bg-[#10141c] rounded-[5px] shadow-2xl border border-slate-200 dark:border-[#303139] py-1.5 z-30 animate-in fade-in zoom-in-95 duration-150">
                    {onOpenEdit ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsOverflowOpen(false);
                          onOpenEdit();
                        }}
                        className="w-full min-h-[44px] px-4 py-2.5 text-left text-sm font-medium text-slate-800 dark:text-[#f4f5f7] hover:bg-slate-50 dark:hover:bg-[#101522] flex items-center gap-2.5 cursor-pointer"
                      >
                        <Settings className="w-4 h-4 text-[#ff951f]" />
                        <span>Edit profile settings</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setIsOverflowOpen(false);
                          setIsReportOpen(true);
                        }}
                        className="w-full min-h-[44px] px-4 py-2.5 text-left text-sm font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 flex items-center gap-2.5 cursor-pointer"
                      >
                        <Flag className="w-4 h-4" />
                        <span>Report @{slug}</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleShareProfile}
                      className="w-full min-h-[44px] px-4 py-2.5 text-left text-sm font-medium text-slate-700 dark:text-[#c9ced8] hover:bg-slate-50 dark:hover:bg-[#101522] flex items-center gap-2.5 cursor-pointer"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Copy link to profile</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* --- Sticky Top Navigation Bar (Docks when user scrolls down past cover) --- */}
        {isScrolled && (
          <header className="sticky top-0 z-30 w-full h-14 px-3 sm:px-4 flex items-center justify-between bg-white/95 dark:bg-[#10141c]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#303139] shadow-sm animate-in fade-in duration-150 flex-shrink-0">
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <button
                type="button"
                onClick={onClose}
                aria-label="Go back"
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-slate-100 dark:bg-[#101522] hover:bg-slate-200 dark:hover:bg-[#1a2030] active:scale-95 text-slate-800 dark:text-[#f4f5f7] border border-slate-200 dark:border-[#303139] flex items-center justify-center transition-all cursor-pointer shadow-xs"
              >
                <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
              </button>

              <div className="flex flex-col justify-center min-w-0">
                <div className="flex items-center gap-1.5 min-w-0">
                  <span className="font-semibold text-sm sm:text-base text-slate-900 dark:text-[#f4f5f7] truncate leading-tight">
                    {profile?.businessName || 'Business Profile'}
                  </span>
                  {profile?.verified && <AppVerifiedBadge className="w-4 h-4" />}
                </div>
                <span className="text-[11px] font-mono text-slate-500 dark:text-[#c9ced8] leading-none mt-0.5">
                  {profile?.totalListingsCount ?? allListings.length} Posts
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {onOpenEdit && (
                <button
                  type="button"
                  onClick={onOpenEdit}
                  aria-label="Edit Profile Settings"
                  className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-slate-100 dark:bg-[#101522] hover:bg-slate-200 dark:hover:bg-[#1a2030] active:scale-95 text-slate-800 dark:text-[#f4f5f7] border border-slate-200 dark:border-[#303139] flex items-center justify-center transition-all cursor-pointer shadow-xs"
                >
                  <Settings className="w-4 h-4 text-[#ff951f]" />
                </button>
              )}
              <button
                type="button"
                onClick={handleShareProfile}
                aria-label="Share profile"
                className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-slate-100 dark:bg-[#101522] hover:bg-slate-200 dark:hover:bg-[#1a2030] active:scale-95 text-slate-800 dark:text-[#f4f5f7] border border-slate-200 dark:border-[#303139] flex items-center justify-center transition-all cursor-pointer shadow-xs"
              >
                <Share2 className="w-4 h-4 text-slate-600 dark:text-[#c9ced8]" />
              </button>
            </div>
          </header>
        )}

        {/* --- Loading State --- */}
        {loading && (
          <div className="p-8 flex flex-col items-center justify-center gap-3 text-slate-500 animate-pulse py-20">
            <div className="w-20 h-20 rounded-full bg-slate-200 dark:bg-slate-800" />
            <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded-md" />
            <p className="text-xs text-slate-400 font-medium mt-2">Loading business profile...</p>
          </div>
        )}

        {/* --- Error State --- */}
        {error && (
          <div className="p-8 flex flex-col items-center justify-center text-center gap-4 py-20">
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
              className="min-h-[40px] px-6 py-2 bg-[#ff951f] hover:bg-[#e68416] text-[#07090e] font-bold text-sm rounded-full shadow-md transition-all active:scale-95 cursor-pointer"
            >
              Back to Home
            </button>
          </div>
        )}

        {/* --- Loaded Profile Content --- */}
        {!loading && !error && profile && (
          <>
            {/* --- Avatar & Action Row --- */}
            <div className="px-5 relative flex justify-between items-end mb-3">
              {/* Round Avatar */}
              <div className="w-[88px] h-[88px] sm:w-[124px] sm:h-[124px] rounded-full border-[3px] border-white dark:border-[#10141c] bg-slate-100 dark:bg-[#101522] -mt-[44px] sm:-mt-[62px] relative z-10 overflow-hidden shadow-lg flex items-center justify-center flex-shrink-0">
                {profile.logoUrl ? (
                  <img
                    src={profile.logoUrl}
                    alt={profile.businessName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl sm:text-5xl font-mono font-bold text-[#ff951f]">
                    {(profile.businessName || 'C').charAt(0).toUpperCase()}
                  </span>
                )}
              </div>

              {/* Action Buttons on Right (Application Signature Amber Buttons) */}
              <div className="flex items-center gap-2 pb-0.5 z-10">
                {/* Call button */}
                {profile.showPhone && profile.publicPhone && (
                  <a
                    href={`tel:${profile.publicPhone}`}
                    className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-slate-100 dark:bg-[#101522] border border-slate-200 dark:border-[#303139] hover:border-[#ff951f]/50 text-slate-800 dark:text-[#f4f5f7] flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer"
                    title={`Call ${profile.publicPhone}`}
                  >
                    <Phone className="w-4 h-4 text-[#ff951f]" />
                  </a>
                )}

                {/* WhatsApp button */}
                {profile.whatsappNumber && (
                  <a
                    href={`https://wa.me/91${profile.whatsappNumber}?text=${encodeURIComponent('Hi, saw your profile on myciti')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400 text-emerald-700 dark:text-emerald-400 flex items-center justify-center transition-all active:scale-95 shadow-xs cursor-pointer"
                    title="Chat on WhatsApp"
                  >
                    <MessageCircle className="w-4.5 h-4.5" />
                  </a>
                )}

                {/* Edit Profile (Owner) or Directions (Customer CTA) */}
                {onOpenEdit ? (
                  <button
                    type="button"
                    onClick={onOpenEdit}
                    className="min-h-[40px] px-4 sm:px-5 py-2 rounded-full bg-slate-100 dark:bg-[#101522] border border-slate-200 dark:border-[#303139] hover:bg-slate-200 dark:hover:bg-[#1a2030] text-slate-800 dark:text-[#f4f5f7] font-semibold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-all active:scale-95 cursor-pointer"
                  >
                    <Settings className="w-4 h-4 text-[#ff951f]" />
                    <span>Edit Profile</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => window.open(getDirectionsUrl(), '_blank', 'noopener,noreferrer')}
                    className="min-h-[40px] px-4 sm:px-5 py-2 rounded-full bg-[#ff951f] hover:bg-[#e68416] text-[#07090e] font-semibold text-xs sm:text-sm transition-all active:scale-95 cursor-pointer shadow-md flex items-center gap-1.5"
                  >
                    <Navigation className="w-4 h-4 fill-[#07090e]" />
                    <span>Directions</span>
                  </button>
                )}
              </div>
            </div>

            {/* --- Profile Info Section --- */}
            <div className="px-5 flex flex-col gap-2.5 pb-4">
              {/* Name & Verified Badge */}
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-[#f4f5f7] leading-tight">
                    {profile.businessName}
                  </h1>
                  {profile.verified && <AppVerifiedBadge className="w-5 h-5" />}
                </div>

                <div className="flex items-center gap-2 text-xs sm:text-sm mt-1">
                  <span className="font-mono text-slate-500 dark:text-[#c9ced8]">@{profile.slug}</span>
                  <span className="text-slate-400">·</span>
                  <div>{renderClientTypePill()}</div>
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-sm font-normal text-slate-700 dark:text-[#c9ced8] leading-relaxed whitespace-pre-line mt-0.5">
                  {profile.bio}
                </p>
              )}

              {/* Metadata Row: Address, Hours, Verification */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-slate-600 dark:text-[#c9ced8] pt-1">
                {(profile.address || profile.landmark) && (
                  <button
                    type="button"
                    onClick={() => window.open(getDirectionsUrl(), '_blank', 'noopener,noreferrer')}
                    className="flex items-center gap-1.5 hover:text-[#ff951f] transition-colors cursor-pointer text-left"
                  >
                    <MapPin className="w-4 h-4 text-[#ff951f] flex-shrink-0" />
                    <span className="hover:underline font-medium">
                      {profile.landmark ? `${profile.landmark}, ` : ''}{profile.address || 'Bhubaneswar'}
                    </span>
                  </button>
                )}

                {(profile.dailyOpenTime || profile.dailyCloseTime) && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-4 h-4 text-[#ff951f] flex-shrink-0" />
                    {profile.openNow === true ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold font-mono text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Open now
                      </span>
                    ) : profile.openNow === false ? (
                      <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold font-mono text-xs">
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        Closed
                      </span>
                    ) : null}
                    <span className="font-mono">{hoursFormatted}</span>
                  </div>
                )}

                <div className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-[#ff951f] flex-shrink-0" />
                  <span>Verified business</span>
                </div>
              </div>

              {/* Stats Row */}
              <div className="flex items-center gap-5 text-xs sm:text-sm font-mono pt-1">
                <span
                  className="hover:underline cursor-pointer"
                  onClick={() => {
                    setCurrentTab('all');
                    setViewMode('card');
                  }}
                >
                  <strong className="font-bold text-slate-900 dark:text-[#f4f5f7]">
                    {profile.totalListingsCount ?? allListings.length}
                  </strong>{' '}
                  <span className="text-slate-500 dark:text-[#c9ced8]">Posts</span>
                </span>
                <span
                  className="hover:underline cursor-pointer"
                  onClick={() => {
                    setCurrentTab('active');
                    setViewMode('card');
                  }}
                >
                  <strong className="font-bold text-slate-900 dark:text-[#f4f5f7]">
                    {profile.activeListingsCount ?? activeListings.length}
                  </strong>{' '}
                  <span className="text-slate-500 dark:text-[#c9ced8]">Live</span>
                </span>
                {profile.expiredListingsCount > 0 && (
                  <span
                    className="hover:underline cursor-pointer"
                    onClick={() => {
                      setCurrentTab('expired');
                      setViewMode('card');
                    }}
                  >
                    <strong className="font-bold text-slate-900 dark:text-[#f4f5f7]">
                      {profile.expiredListingsCount}
                    </strong>{' '}
                    <span className="text-slate-500 dark:text-[#c9ced8]">Past</span>
                  </span>
                )}
              </div>
            </div>

            {/* --- Sticky Tabs Bar (Themed with Application Amber) --- */}
            <div className={`sticky ${isScrolled ? 'top-14' : 'top-0'} z-20 bg-white/95 dark:bg-[#10141c]/95 backdrop-blur-md border-b border-slate-200 dark:border-[#303139] flex transition-all`}>
              {/* Tab: Posts */}
              <button
                type="button"
                onClick={() => {
                  setCurrentTab('all');
                  setViewMode('card');
                }}
                className={`flex-1 h-12 px-2 flex items-center justify-center font-semibold text-xs sm:text-sm transition-colors relative cursor-pointer ${
                  currentTab === 'all' && viewMode === 'card'
                    ? 'text-[#ff951f]'
                    : 'text-slate-600 dark:text-[#c9ced8] hover:text-slate-900 dark:hover:text-[#f4f5f7]'
                }`}
              >
                <span>Posts</span>
                {currentTab === 'all' && viewMode === 'card' && (
                  <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                    <div className="h-0.5 w-12 sm:w-16 bg-[#ff951f] rounded-full" />
                  </div>
                )}
              </button>

              {/* Tab: Live */}
              <button
                type="button"
                onClick={() => {
                  setCurrentTab('active');
                  setViewMode('card');
                }}
                className={`flex-1 h-12 px-2 flex items-center justify-center font-semibold text-xs sm:text-sm transition-colors relative cursor-pointer ${
                  currentTab === 'active' && viewMode === 'card'
                    ? 'text-[#ff951f]'
                    : 'text-slate-600 dark:text-[#c9ced8] hover:text-slate-900 dark:hover:text-[#f4f5f7]'
                }`}
              >
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Live
                </span>
                {currentTab === 'active' && viewMode === 'card' && (
                  <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                    <div className="h-0.5 w-12 sm:w-16 bg-[#ff951f] rounded-full" />
                  </div>
                )}
              </button>

              {/* Tab: Media (Photo Grid) */}
              <button
                type="button"
                onClick={() => {
                  setCurrentTab('all');
                  setViewMode('grid');
                }}
                className={`flex-1 h-12 px-2 flex items-center justify-center font-semibold text-xs sm:text-sm transition-colors relative cursor-pointer ${
                  viewMode === 'grid'
                    ? 'text-[#ff951f]'
                    : 'text-slate-600 dark:text-[#c9ced8] hover:text-slate-900 dark:hover:text-[#f4f5f7]'
                }`}
              >
                <span>Media</span>
                {viewMode === 'grid' && (
                  <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                    <div className="h-0.5 w-12 sm:w-16 bg-[#ff951f] rounded-full" />
                  </div>
                )}
              </button>

              {/* Tab: Past */}
              <button
                type="button"
                onClick={() => {
                  setCurrentTab('expired');
                  setViewMode('card');
                }}
                className={`flex-1 h-12 px-2 flex items-center justify-center font-semibold text-xs sm:text-sm transition-colors relative cursor-pointer ${
                  currentTab === 'expired' && viewMode === 'card'
                    ? 'text-[#ff951f]'
                    : 'text-slate-600 dark:text-[#c9ced8] hover:text-slate-900 dark:hover:text-[#f4f5f7]'
                }`}
              >
                <span>Past</span>
                {currentTab === 'expired' && viewMode === 'card' && (
                  <div className="absolute bottom-0 left-0 right-0 flex justify-center">
                    <div className="h-0.5 w-12 sm:w-16 bg-[#ff951f] rounded-full" />
                  </div>
                )}
              </button>
            </div>

            {/* --- Feed Content --- */}
            <div className="flex-1">
              {(() => {
                const currentListings =
                  currentTab === 'all'
                    ? allListings
                    : currentTab === 'active'
                    ? activeListings
                    : currentTab === 'expired'
                    ? expiredListings
                    : upcomingListings;

                const currentHasMore =
                  currentTab === 'all'
                    ? allHasMore
                    : currentTab === 'active'
                    ? activeHasMore
                    : currentTab === 'expired'
                    ? expiredHasMore
                    : upcomingHasMore;

                const currentPage =
                  currentTab === 'all'
                    ? allPage
                    : currentTab === 'active'
                    ? activePage
                    : currentTab === 'expired'
                    ? expiredPage
                    : upcomingPage;

                const isCurrentTabLoading = listingsLoading && currentListings.length === 0;

                return (
                  <>
                    {isCurrentTabLoading ? (
                      <div className="py-16 flex flex-col items-center justify-center gap-3 text-slate-400">
                        <div className="w-7 h-7 border-2 border-[#ff951f] border-t-transparent rounded-full animate-spin" />
                        <p className="text-xs font-semibold">Loading posts...</p>
                      </div>
                    ) : currentListings.length > 0 ? (
                      renderListingsList(currentListings)
                    ) : (
                      /* Empty state */
                      <div className="py-20 px-4 flex flex-col items-center justify-center text-center">
                        <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-[#f4f5f7]">
                          {currentTab === 'active'
                            ? 'No live offers right now'
                            : currentTab === 'expired'
                            ? 'No past posts'
                            : viewMode === 'grid'
                            ? 'No media uploaded'
                            : 'No posts published yet'}
                        </h3>
                        <p className="text-xs sm:text-sm text-slate-500 dark:text-[#c9ced8] mt-1.5 max-w-sm leading-relaxed">
                          {currentTab === 'active'
                            ? 'Check back soon for new offers, store discounts, and announcements.'
                            : currentTab === 'expired'
                            ? 'There are no expired posts for this business.'
                            : viewMode === 'grid'
                            ? 'Photos and videos from published posts will appear here.'
                            : 'When this business shares updates, offers, or events, they will show up here.'}
                        </p>
                      </div>
                    )}

                    {/* Load More Button */}
                    {currentHasMore && (
                      <div className="py-6 flex justify-center border-t border-slate-100 dark:border-[#303139]">
                        <button
                          type="button"
                          disabled={listingsLoading}
                          onClick={() => loadTabListings(currentTab, currentPage + 1)}
                          className="min-h-[40px] px-6 py-2 rounded-full border border-slate-200 dark:border-[#303139] hover:bg-slate-50 dark:hover:bg-[#101522] text-slate-800 dark:text-[#f4f5f7] font-semibold text-xs transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                        >
                          {listingsLoading ? 'Loading...' : 'Show more posts'}
                        </button>
                      </div>
                    )}
                  </>
                );
              })()}
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
          <div className="bg-white dark:bg-[#10141c] w-full max-w-md rounded-t-[20px] sm:rounded-[20px] shadow-2xl border border-slate-200 dark:border-[#303139] p-5 animate-in slide-in-from-bottom duration-300 flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-150 dark:border-[#303139]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <Flag className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 dark:text-[#f4f5f7] text-base">
                  Report Profile
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsReportOpen(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-[#101522] flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-[#f4f5f7] cursor-pointer"
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
                <p className="text-xs text-slate-500 dark:text-[#c9ced8]">
                  Help us keep myCiti safe. Select a reason why you are reporting <strong>@{slug}</strong>:
                </p>

                {reportError && (
                  <div className="p-3 rounded-[5px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium">
                    {reportError}
                  </div>
                )}

                {/* Reason radio choices */}
                <div className="flex flex-col gap-1.5">
                  {REPORT_REASONS.map((r) => (
                    <label
                      key={r.id}
                      className={`min-h-[44px] flex items-center gap-3 px-3.5 py-2.5 rounded-[5px] border text-xs font-semibold cursor-pointer transition-colors ${
                        reportReason === r.id
                          ? 'border-[#ff951f] bg-amber-500/10 text-[#ff951f]'
                          : 'border-slate-200 dark:border-[#303139] hover:bg-slate-50 dark:hover:bg-[#101522] text-slate-700 dark:text-[#c9ced8]'
                      }`}
                    >
                      <input
                        type="radio"
                        name="reportReason"
                        value={r.id}
                        checked={reportReason === r.id}
                        onChange={(e) => setReportReason(e.target.value)}
                        className="text-[#ff951f] focus:ring-[#ff951f]"
                      />
                      <span>{r.label}</span>
                    </label>
                  ))}
                </div>

                {/* Details textarea */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-[#c9ced8] mb-1">
                    Additional details (optional, max 300 characters)
                  </label>
                  <textarea
                    rows={3}
                    maxLength={300}
                    value={reportDetails}
                    onChange={(e) => setReportDetails(e.target.value)}
                    placeholder="Provide context or explanation..."
                    className="w-full text-xs p-3 rounded-[5px] border border-slate-200 dark:border-[#303139] bg-white dark:bg-[#101522] text-slate-900 dark:text-[#f4f5f7] focus:outline-none focus:ring-1 focus:ring-[#ff951f] resize-none"
                  />
                  <div className="flex justify-end text-[10px] text-slate-400 font-mono mt-0.5">
                    {reportDetails.length}/300
                  </div>
                </div>

                {/* Modal Buttons */}
                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsReportOpen(false)}
                    className="min-h-[40px] px-4 py-2 rounded-full hover:bg-slate-100 dark:hover:bg-[#101522] text-slate-600 dark:text-[#c9ced8] font-semibold text-xs transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={reportSubmitting}
                    className="min-h-[40px] px-6 py-2 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
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
