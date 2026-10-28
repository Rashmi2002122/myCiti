import React, { useState, useEffect } from 'react';
import {
  X, Check, Clock, CheckCircle2, XCircle, MapPin,
  User, Calendar, Image as ImageIcon
} from 'lucide-react';
import {
  fetchAdminSubmissions,
  approveAdminSubmission,
  declineAdminSubmission,
  CATEGORIES
} from '../services/api';

const QUICK_REASONS = [
  'Incomplete details',
  'Wrong location coordinates',
  'Duplicate submission',
  'Unclear or low quality photos',
  'Not allowed festival or business content'
];

export default function AdminReviewQueue({ token, onApprovedOrDeclined }) {
  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING | APPROVED | DECLINED
  const [submissions, setSubmissions] = useState([]);
  const [counts, setCounts] = useState({ PENDING: 0, APPROVED: 0, DECLINED: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Selected submission for full review screen
  const [reviewingItem, setReviewingItem] = useState(null);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Decline dialog state
  const [isDeclineModalOpen, setIsDeclineModalOpen] = useState(false);
  const [declineReason, setDeclineReason] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const loadQueue = async (statusTab) => {
    if (!token) return;
    try {
      setIsLoading(true);
      setError('');
      const data = await fetchAdminSubmissions(token, statusTab);
      setSubmissions(data.submissions || []);
      setCounts(data.counts || { PENDING: 0, APPROVED: 0, DECLINED: 0 });
      // If currently reviewing item is no longer in this tab, update or reset
      if (reviewingItem) {
        const found = (data.submissions || []).find((s) => s.id === reviewingItem.id);
        if (!found && statusTab === 'PENDING' && data.submissions?.length > 0) {
          setReviewingItem(data.submissions[0]);
          setSelectedPhotoIndex(0);
        } else if (!found) {
          setReviewingItem(null);
        }
      }
    } catch (err) {
      console.error(err);
      setError(err.message || 'Failed to load review queue');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadQueue(activeTab);
  }, [activeTab, token]);

  const handleSelectSubmission = (sub) => {
    setReviewingItem(sub);
    setSelectedPhotoIndex(0);
    setActionError('');
  };

  const handleApprove = async () => {
    if (!reviewingItem || !token) return;
    setIsActionLoading(true);
    setActionError('');
    try {
      await approveAdminSubmission(token, reviewingItem.id);
      if (onApprovedOrDeclined) onApprovedOrDeclined();
      
      // Reload queue and pick next pending item
      const refreshed = await fetchAdminSubmissions(token, activeTab);
      setSubmissions(refreshed.submissions || []);
      setCounts(refreshed.counts || { PENDING: 0, APPROVED: 0, DECLINED: 0 });

      if (activeTab === 'PENDING' && refreshed.submissions && refreshed.submissions.length > 0) {
        setReviewingItem(refreshed.submissions[0]);
        setSelectedPhotoIndex(0);
      } else {
        setReviewingItem(null);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to approve submission');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeclineSubmit = async (e) => {
    e.preventDefault();
    if (!reviewingItem || !token) return;
    if (!declineReason.trim() || declineReason.trim().length < 10) {
      setActionError('Reason must be at least 10 characters');
      return;
    }

    setIsActionLoading(true);
    setActionError('');
    try {
      await declineAdminSubmission(token, reviewingItem.id, declineReason.trim());
      setIsDeclineModalOpen(false);
      setDeclineReason('');
      if (onApprovedOrDeclined) onApprovedOrDeclined();

      // Reload queue and pick next pending item
      const refreshed = await fetchAdminSubmissions(token, activeTab);
      setSubmissions(refreshed.submissions || []);
      setCounts(refreshed.counts || { PENDING: 0, APPROVED: 0, DECLINED: 0 });

      if (activeTab === 'PENDING' && refreshed.submissions && refreshed.submissions.length > 0) {
        setReviewingItem(refreshed.submissions[0]);
        setSelectedPhotoIndex(0);
      } else {
        setReviewingItem(null);
      }
    } catch (err) {
      setActionError(err.message || 'Failed to decline submission');
    } finally {
      setIsActionLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Tab Switcher */}
      <div className="flex items-center justify-between flex-wrap gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          {[
            { id: 'PENDING', label: 'Pending Review', count: counts.PENDING, icon: Clock, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
            { id: 'APPROVED', label: 'Approved', count: counts.APPROVED, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
            { id: 'DECLINED', label: 'Declined', count: counts.DECLINED, icon: XCircle, color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40' }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setReviewingItem(null);
                }}
                className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 ${
                  isSelected
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-sm'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${isSelected ? 'bg-white/20 dark:bg-black/20 text-white dark:text-slate-900' : tab.color}`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => loadQueue(activeTab)}
          className="text-xs font-bold text-city-blue hover:underline"
        >
          ↻ Refresh
        </button>
      </div>

      {error && (
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {/* Main Grid: Queue List on Left, Detailed Review Card on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: List of Submissions */}
        <div className={`${reviewingItem ? 'lg:col-span-5' : 'lg:col-span-12'} space-y-3`}>
          {isLoading && submissions.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Loading review queue...
            </div>
          ) : submissions.length === 0 ? (
            <div className="py-12 text-center bg-slate-50 dark:bg-slate-800/40 rounded-2xl p-6">
              <span className="text-3xl block mb-2">🎉</span>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
                No submissions in {activeTab.toLowerCase()} status
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                When users post new ads, they will appear here for verification.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[65vh] overflow-y-auto pr-1">
              {submissions.map((item) => {
                const isSelected = reviewingItem?.id === item.id;
                const catMeta = CATEGORIES[item.category] || CATEGORIES.PANDAL;
                const thumb = item.images && item.images.length > 0 ? item.images[0].url : null;

                return (
                  <div
                    key={item.id}
                    onClick={() => handleSelectSubmission(item)}
                    className={`p-3.5 rounded-2xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-city-blue bg-blue-50/50 dark:bg-blue-950/30 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/50 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex gap-3 items-start">
                      {/* Thumbnail */}
                      <div className="w-14 h-14 rounded-xl bg-slate-100 dark:bg-slate-700 flex-shrink-0 overflow-hidden flex items-center justify-center border border-slate-100 dark:border-slate-700">
                        {thumb ? (
                          <img src={thumb} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-slate-400" />
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-1">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${catMeta.badgeBg}`}>
                            {item.category}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono">
                            #{item.id}
                          </span>
                        </div>

                        <h4 className="font-extrabold text-xs text-slate-900 dark:text-slate-100 truncate">
                          {item.title}
                        </h4>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          {item.landmark || item.address}
                        </p>

                        <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                          <span>By {item.submitterName || 'User'}</span>
                          <span>{item.createdAt ? new Date(item.createdAt).toLocaleDateString() : ''}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Column: Detailed Review Screen */}
        {reviewingItem && (
          <div className="lg:col-span-7 bg-white dark:bg-slate-800 rounded-3xl p-5 border border-slate-200 dark:border-slate-700 space-y-4 max-h-[65vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-100 dark:border-slate-700">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${(CATEGORIES[reviewingItem.category] || CATEGORIES.PANDAL).badgeBg}`}>
                    {reviewingItem.category}
                  </span>
                  <span className="font-mono text-xs text-slate-400 font-bold">
                    Submission #{reviewingItem.id}
                  </span>
                </div>
                <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                  {reviewingItem.title}
                </h3>
              </div>

              <button
                onClick={() => setReviewingItem(null)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-700 flex items-center justify-center text-slate-500 hover:text-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {actionError && (
              <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs font-semibold">
                {actionError}
              </div>
            )}

            {/* Photos Carousel / Grid */}
            {reviewingItem.images && reviewingItem.images.length > 0 && (
              <div className="space-y-2">
                <div className="h-48 rounded-2xl overflow-hidden bg-slate-900 flex items-center justify-center border border-slate-200 dark:border-slate-700">
                  <img
                    src={reviewingItem.images[selectedPhotoIndex]?.url || reviewingItem.images[0]?.url}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </div>
                {reviewingItem.images.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto pb-1">
                    {reviewingItem.images.map((img, idx) => (
                      <button
                        key={img.id || idx}
                        onClick={() => setSelectedPhotoIndex(idx)}
                        className={`w-14 h-14 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all ${
                          selectedPhotoIndex === idx ? 'border-city-blue scale-105' : 'border-transparent opacity-70'
                        }`}
                      >
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Description */}
            <div className="bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-2xl text-xs text-slate-700 dark:text-slate-300 leading-relaxed whitespace-pre-wrap">
              {reviewingItem.description}
            </div>

            {/* Venue & Location Details */}
            <div className="space-y-2 text-xs">
              <div className="flex items-start gap-2 text-slate-600 dark:text-slate-300">
                <MapPin className="w-4 h-4 text-city-blue flex-shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-slate-800 dark:text-slate-100">
                    {reviewingItem.venueName || reviewingItem.title}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {reviewingItem.address} {reviewingItem.landmark && `(Near ${reviewingItem.landmark})`}
                  </p>
                  <p className="font-mono text-[10px] text-city-blue mt-0.5">
                    📍 Lat: {reviewingItem.latitude?.toFixed(4)}, Lng: {reviewingItem.longitude?.toFixed(4)}
                  </p>
                </div>
              </div>

              {/* Submitter Info */}
              <div className="flex items-center gap-3 p-3 rounded-2xl bg-blue-50/60 dark:bg-slate-900/60 border border-blue-100 dark:border-slate-700">
                <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-slate-700 text-city-blue flex items-center justify-center font-bold text-xs">
                  <User className="w-4 h-4" />
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-bold text-slate-900 dark:text-slate-100">
                    {reviewingItem.submitterName} ({reviewingItem.submitterAccountType || 'INDIVIDUAL'})
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-2">
                    <span>📞 Contact: {reviewingItem.contactPhone}</span>
                  </div>
                </div>
              </div>

              {/* Timings */}
              <div className="flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-300">
                <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span>
                  {reviewingItem.startDate} &rarr; {reviewingItem.endDate} ({reviewingItem.dailyOpenTime?.slice(0, 5)} - {reviewingItem.dailyCloseTime?.slice(0, 5)})
                </span>
              </div>

              {/* Special Offer text if any */}
              {reviewingItem.offerText && (
                <div className="p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-amber-800 dark:text-amber-200 text-xs font-semibold">
                  🎁 Offer: {reviewingItem.offerText}
                </div>
              )}

              {/* Decline Reason if already declined */}
              {reviewingItem.status === 'DECLINED' && reviewingItem.declineReason && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs">
                  <span className="font-bold block mb-1">Decline Reason:</span>
                  {reviewingItem.declineReason}
                </div>
              )}
            </div>

            {/* Action Buttons for Pending or Re-review */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setDeclineReason('');
                  setIsDeclineModalOpen(true);
                }}
                disabled={isActionLoading}
                className="min-h-[44px] px-5 py-2 rounded-full border border-rose-300 dark:border-rose-800 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-all disabled:opacity-50"
              >
                Decline...
              </button>

              <button
                type="button"
                onClick={handleApprove}
                disabled={isActionLoading || reviewingItem.status === 'APPROVED'}
                className="min-h-[44px] px-6 py-2 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{reviewingItem.status === 'APPROVED' ? 'Approved' : 'Approve & Publish'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Decline Reason Modal */}
      {isDeclineModalOpen && (
        <div className="fixed inset-0 z-[3500] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-md w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="font-black text-base text-slate-900 dark:text-slate-100">
                Decline Advertisement
              </h3>
              <button
                onClick={() => setIsDeclineModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Please choose or write a clear explanation. This reason will be emailed to the submitter and displayed on their "Declined" card.
            </p>

            {/* Quick Pick Reasons */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block">
                Quick-Pick Reasons:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {QUICK_REASONS.map((reason) => (
                  <button
                    key={reason}
                    type="button"
                    onClick={() => setDeclineReason(reason)}
                    className={`px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                      declineReason === reason
                        ? 'bg-rose-50 border-rose-300 text-rose-700 dark:bg-rose-950/40'
                        : 'bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    {reason}
                  </button>
                ))}
              </div>
            </div>

            {/* Custom Reason Input */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 block mb-1">
                Explanation (min 10 characters) *
              </label>
              <textarea
                rows={3}
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Specify what needs to be corrected before resubmission..."
                required
                className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
              <span className="text-[10px] text-slate-400 block mt-1 text-right">
                {declineReason.length}/10 chars minimum
              </span>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={() => setIsDeclineModalOpen(false)}
                className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeclineSubmit}
                disabled={isActionLoading || declineReason.trim().length < 10}
                className="min-h-[44px] px-6 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
              >
                {isActionLoading ? 'Declining...' : 'Confirm Decline'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
