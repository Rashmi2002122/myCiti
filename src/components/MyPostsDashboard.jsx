import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  fetchMySubmissions,
  deleteSubmission,
  unpublishSubmission,
  CATEGORIES
} from '../services/api';
import DeclineInfoSheet from './DeclineInfoSheet';
import {
  X, Plus, RefreshCw, AlertCircle, Info, MapPin, Calendar, Clock,
  Eye, Edit3, Trash2, EyeOff, CheckCircle2, AlertTriangle, Sparkles
} from 'lucide-react';

export default function MyPostsDashboard({
  isOpen,
  onClose,
  onOpenPostForm,
  onViewOnMap
}) {
  const { accessToken, isAuthenticated, canPost } = useAuth();
  const [activeTab, setActiveTab] = useState('ALL'); // ALL | PENDING | APPROVED | DECLINED
  const [submissions, setSubmissions] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Decline info sheet state
  const [selectedDeclined, setSelectedDeclined] = useState(null);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadSubmissions = useCallback(async () => {
    if (!accessToken || !canPost) return;
    try {
      setIsLoading(true);
      setError(null);
      const data = await fetchMySubmissions(accessToken, activeTab === 'ALL' ? null : activeTab);
      setSubmissions(data);
    } catch (err) {
      console.error('Failed to load user advertisements:', err);
      setError(err.message || 'Unable to load advertisements');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, canPost, activeTab]);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadSubmissions();
    }
  }, [isOpen, isAuthenticated, loadSubmissions]);

  if (!isOpen) return null;

  // Tab counts calculation from submissions if ALL loaded, or approximate
  const filteredSubmissions = activeTab === 'ALL'
    ? submissions
    : submissions.filter(s => s.status === activeTab);

  const handleDelete = async (sub) => {
    if (!window.confirm(`Are you sure you want to delete "${sub.title}"?`)) return;
    try {
      setActionLoadingId(sub.id);
      await deleteSubmission(accessToken, sub.id);
      setSubmissions(prev => prev.filter(s => s.id !== sub.id));
    } catch (err) {
      alert(err.message || 'Failed to delete advertisement');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleUnpublish = async (sub) => {
    if (!window.confirm(`Unpublishing will hide "${sub.title}" from the public map and listings.\n\nDo you want to proceed?`)) return;
    try {
      setActionLoadingId(sub.id);
      await unpublishSubmission(accessToken, sub.id);
      await loadSubmissions();
      alert('Advertisement unpublished successfully. It is no longer visible on the live map.');
    } catch (err) {
      alert(err.message || 'Failed to unpublish');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (sub) => {
    switch (sub.status) {
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 border border-amber-300/60 dark:border-amber-800 animate-pulse">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            Under Review
          </span>
        );
      case 'APPROVED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200 border border-emerald-300/60 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            Live on Map
          </span>
        );
      case 'DECLINED':
        return (
          <div className="flex items-center gap-1">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-300/60 dark:border-rose-800">
              <AlertCircle className="w-3 h-3 text-rose-600" />
              Declined
            </span>
            <button
              onClick={() => setSelectedDeclined(sub)}
              title="View decline reason"
              aria-label="View decline reason"
              className="w-6 h-6 rounded-full bg-rose-200 dark:bg-rose-900 text-rose-800 dark:text-rose-200 hover:bg-rose-300 flex items-center justify-center transition-colors"
            >
              <Info className="w-3.5 h-3.5 stroke-[2.5]" />
            </button>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-gradient-to-b from-[#cfe7ff] to-[#eaf4ff] dark:from-slate-900 dark:to-slate-950 p-4 sm:p-6 rounded-[30px] max-w-3xl w-full shadow-2xl border border-white/60 dark:border-slate-800 flex flex-col max-h-[92vh] animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/60 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 shadow-soft flex items-center justify-center text-xl">
              📢
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight">
                My Advertisements
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Track your submitted pandals, melas, offers and events
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                if (onOpenPostForm) onOpenPostForm();
              }}
              className="min-h-[44px] px-3.5 py-2 rounded-full bg-city-blue hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden xs:inline sm:inline">Post an Ad</span>
            </button>
            <button
              onClick={onClose}
              aria-label="Close my advertisements"
              className="w-10 h-10 rounded-full bg-white/80 dark:bg-slate-800 hover:bg-white dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center shadow-soft transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 py-3 overflow-x-auto no-scrollbar">
          {[
            { id: 'ALL', label: 'All Posts' },
            { id: 'PENDING', label: 'Pending', icon: '⏳' },
            { id: 'APPROVED', label: 'Approved', icon: '✅' },
            { id: 'DECLINED', label: 'Declined', icon: '❌' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-slate-800 text-city-blue shadow-soft scale-102 border border-blue-200 dark:border-blue-900'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-white/60 dark:hover:bg-slate-800/60'
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto space-y-3 pr-1 py-1">
          {isLoading ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-8 h-8 border-3 border-city-blue border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500 dark:text-slate-400">Loading your advertisements...</p>
            </div>
          ) : error ? (
            <div className="bg-rose-50 dark:bg-rose-950/40 p-5 rounded-2xl border border-rose-200 dark:border-rose-900 text-center space-y-2">
              <AlertCircle className="w-7 h-7 text-rose-500 mx-auto" />
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">{error}</p>
              <button
                onClick={loadSubmissions}
                className="min-h-[40px] px-4 py-1.5 rounded-full bg-rose-600 text-white text-xs font-bold shadow-sm"
              >
                Retry
              </button>
            </div>
          ) : filteredSubmissions.length === 0 ? (
            /* Empty State */
            <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-md rounded-[26px] p-8 text-center space-y-3 border border-white/80 dark:border-slate-800 my-4">
              <div className="w-14 h-14 bg-sky-base dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-2xl shadow-sm">
                🪔
              </div>
              <h3 className="font-extrabold text-slate-800 dark:text-slate-100 text-sm">
                No Advertisements in {activeTab === 'ALL' ? 'your account' : activeTab.toLowerCase()}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                Promote your Durga Puja pandal, festival mela, retail festive discount, or store inauguration to thousands of visitors.
              </p>
              <button
                onClick={() => {
                  onClose();
                  if (onOpenPostForm) onOpenPostForm();
                }}
                className="min-h-[44px] px-5 py-2.5 rounded-full bg-city-blue hover:bg-blue-600 text-white font-bold text-xs shadow-md transition-transform active:scale-95 inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Create an Advertisement</span>
              </button>
            </div>
          ) : (
            /* Posts List */
            filteredSubmissions.map((sub) => {
              const catInfo = CATEGORIES[sub.category] || CATEGORIES.PANDAL;
              const coverPhoto = sub.images && sub.images.length > 0 ? sub.images[0].url : null;
              const isWorking = actionLoadingId === sub.id;

              return (
                <div
                  key={sub.id}
                  className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-[24px] p-4 sm:p-5 shadow-soft border border-white/60 dark:border-slate-800 flex flex-col sm:flex-row gap-4 transition-all hover:shadow-float"
                >
                  {/* Thumbnail / Cover Photo */}
                  <div className="w-full sm:w-32 h-32 rounded-2xl bg-slate-100 dark:bg-slate-800 flex-shrink-0 overflow-hidden relative border border-slate-200/60 dark:border-slate-700/60">
                    {coverPhoto ? (
                      <img
                        src={coverPhoto}
                        alt={sub.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-3xl">
                        <span>{catInfo.icon}</span>
                        <span className="text-[10px] font-bold text-slate-400 mt-1 uppercase">No Photo</span>
                      </div>
                    )}
                    {sub.images && sub.images.length > 1 && (
                      <span className="absolute bottom-1.5 right-1.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        📷 {sub.images.length}
                      </span>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="flex-1 flex flex-col justify-between space-y-2">
                    <div>
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap mb-1.5">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${catInfo.badgeBg}`}>
                          <span>{catInfo.icon}</span>
                          <span>{catInfo.label}</span>
                        </span>
                        {getStatusBadge(sub)}
                      </div>

                      <h3 className="font-extrabold text-slate-900 dark:text-slate-100 text-sm leading-snug line-clamp-1">
                        {sub.title}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-city-blue flex-shrink-0" />
                        <span className="truncate">{sub.landmark}, {sub.address}</span>
                      </div>

                      <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-slate-400" />
                          {sub.startDate} to {sub.endDate}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {sub.dailyOpenTime} - {sub.dailyCloseTime}
                        </span>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
                      <div className="text-[11px] text-slate-400 font-medium">
                        ID: #{sub.id}
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Live Listing View on Map */}
                        {sub.status === 'APPROVED' && sub.listingId && (
                          <button
                            onClick={() => {
                              onClose();
                              if (onViewOnMap) onViewOnMap(sub.listingId);
                            }}
                            className="min-h-[36px] px-3 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-700 dark:text-emerald-300 font-bold text-xs flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View on map</span>
                          </button>
                        )}

                        {/* Edit Button */}
                        <button
                          onClick={() => {
                            onClose();
                            if (onOpenPostForm) onOpenPostForm(sub);
                          }}
                          className="min-h-[36px] px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-200 font-bold text-xs flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-city-blue" />
                          <span>{sub.status === 'APPROVED' ? 'Edit revision' : 'Edit'}</span>
                        </button>

                        {/* Unpublish Button (For Approved) */}
                        {sub.status === 'APPROVED' && (
                          <button
                            onClick={() => handleUnpublish(sub)}
                            disabled={isWorking}
                            className="min-h-[36px] px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-1 transition-colors disabled:opacity-50"
                          >
                            <EyeOff className="w-3.5 h-3.5" />
                            <span>Unpublish</span>
                          </button>
                        )}

                        {/* Delete Button (For Pending or Declined) */}
                        {sub.status !== 'APPROVED' && (
                          <button
                            onClick={() => handleDelete(sub)}
                            disabled={isWorking}
                            aria-label={`Delete ${sub.title}`}
                            className="w-9 h-9 rounded-full bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 text-rose-600 dark:text-rose-400 flex items-center justify-center transition-colors disabled:opacity-50"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Decline Info Bottom Sheet */}
      <DeclineInfoSheet
        isOpen={!!selectedDeclined}
        onClose={() => setSelectedDeclined(null)}
        submission={selectedDeclined}
        onEditAndResubmit={(sub) => {
          setSelectedDeclined(null);
          onClose();
          if (onOpenPostForm) onOpenPostForm(sub);
        }}
        onDelete={(sub) => {
          setSelectedDeclined(null);
          handleDelete(sub);
        }}
      />
    </div>
  );
}
