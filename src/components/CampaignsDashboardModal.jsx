import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Sparkles, Bell, Plus, Play, Pause, Trash2, Eye,
  MousePointerClick, TrendingUp, AlertCircle, Calendar,
  MapPin, CheckCircle2, Clock, ShieldCheck
} from 'lucide-react';
import {
  fetchMyCampaigns,
  pauseCampaign,
  resumeCampaign,
  deleteCampaign,
  fetchMyAnnouncements
} from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function CampaignsDashboardModal({
  isOpen,
  onClose,
  onOpenCreateCampaign,
  onOpenCreateAnnouncement
}) {
  const { accessToken, isAuthenticated, canPost } = useAuth();
  const [activeTab, setActiveTab] = useState('CAMPAIGNS'); // 'CAMPAIGNS' | 'ANNOUNCEMENTS'
  const [campaigns, setCampaigns] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadData = useCallback(async () => {
    if (!accessToken || !canPost) return;
    try {
      setIsLoading(true);
      setError('');
      if (activeTab === 'CAMPAIGNS') {
        const data = await fetchMyCampaigns(accessToken);
        setCampaigns(data);
      } else {
        const data = await fetchMyAnnouncements(accessToken);
        setAnnouncements(data);
      }
    } catch (err) {
      console.error('Failed to load campaigns/announcements:', err);
      setError('Unable to load data.');
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, canPost, activeTab]);

  useEffect(() => {
    if (isOpen && isAuthenticated) {
      loadData();
    }
  }, [isOpen, isAuthenticated, loadData]);

  if (!isOpen) return null;

  const handleTogglePause = async (camp) => {
    try {
      setActionLoadingId(camp.id);
      if (camp.status === 'ACTIVE') {
        const updated = await pauseCampaign(accessToken, camp.id);
        setCampaigns((prev) => prev.map((c) => (c.id === camp.id ? updated : c)));
      } else if (camp.status === 'PAUSED') {
        const updated = await resumeCampaign(accessToken, camp.id);
        setCampaigns((prev) => prev.map((c) => (c.id === camp.id ? updated : c)));
      }
    } catch (err) {
      alert(err.message || 'Failed to update campaign status');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteCampaign = async (camp) => {
    if (!window.confirm(`Are you sure you want to delete campaign "${camp.headline}"?`)) return;
    try {
      setActionLoadingId(camp.id);
      await deleteCampaign(accessToken, camp.id);
      setCampaigns((prev) => prev.filter((c) => c.id !== camp.id));
    } catch (err) {
      alert(err.message || 'Failed to delete campaign');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'ACTIVE':
      case 'SENT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            {status}
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            PAUSED
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 animate-pulse">
            UNDER REVIEW
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
            REJECTED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 text-slate-600">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-2xl w-full p-6 shadow-2xl border border-slate-100 dark:border-slate-800 animate-in zoom-in-95 duration-200 relative my-6 max-h-[88vh] flex flex-col">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 flex items-center justify-center transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span>Marketing & Announcements</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your local ad campaigns, target radius, and neighborhood alerts
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenCreateCampaign) onOpenCreateCampaign();
              }}
              className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-soft transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Ad</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                if (onOpenCreateAnnouncement) onOpenCreateAnnouncement();
              }}
              className="px-3.5 py-1.5 rounded-full bg-city-blue hover:bg-blue-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-soft transition-all"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Alert</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-2 mb-4 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => setActiveTab('CAMPAIGNS')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'CAMPAIGNS'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Ad Campaigns ({campaigns.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ANNOUNCEMENTS')}
            className={`px-4 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'ANNOUNCEMENTS'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Announcements ({announcements.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-3">
          {isLoading && (
            <div className="py-16 text-center text-xs text-slate-400 font-semibold">
              Loading marketing dashboard...
            </div>
          )}

          {error && (
            <div className="p-3 rounded-2xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Ad Campaigns List */}
          {activeTab === 'CAMPAIGNS' && !isLoading && campaigns.length === 0 && (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-amber-50 dark:bg-slate-800 text-amber-500 mx-auto flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                No active ad campaigns yet
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Promote your approved store, offer, or pandal to nearby users in your neighborhood.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenCreateCampaign) onOpenCreateCampaign();
                }}
                className="px-4 py-2 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs"
              >
                Create Your First Campaign
              </button>
            </div>
          )}

          {activeTab === 'CAMPAIGNS' && campaigns.map((camp) => {
            const ctr = camp.impressionsCount > 0
              ? ((camp.clicksCount / camp.impressionsCount) * 100).toFixed(1)
              : '0.0';

            return (
              <div
                key={camp.id}
                className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-3 shadow-2xs"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusBadge(camp.status)}
                      <span className="text-[11px] font-bold text-slate-400">
                        Listing #{camp.listingId}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {camp.headline}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {camp.listingTitle}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {(camp.status === 'ACTIVE' || camp.status === 'PAUSED') && (
                      <button
                        type="button"
                        onClick={() => handleTogglePause(camp)}
                        disabled={actionLoadingId === camp.id}
                        title={camp.status === 'ACTIVE' ? 'Pause Campaign' : 'Resume Campaign'}
                        className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                      >
                        {camp.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-600" />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteCampaign(camp)}
                      disabled={actionLoadingId === camp.id}
                      title="Delete Campaign"
                      className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Target info & Dates */}
                <div className="flex items-center gap-4 text-[11px] text-slate-500 dark:text-slate-400 flex-wrap">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-city-blue" />
                    {camp.targetType === 'RADIUS'
                      ? `${camp.radiusKm} km radius`
                      : camp.targetAreaName || 'City Target'}
                  </span>
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" />
                    {camp.startDate} to {camp.endDate}
                  </span>
                </div>

                {/* Metrics Bar */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl text-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center justify-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span>Views</span>
                    </div>
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      {camp.impressionsCount}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl text-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center justify-center gap-1">
                      <MousePointerClick className="w-3 h-3" />
                      <span>Clicks</span>
                    </div>
                    <div className="text-sm font-black text-slate-900 dark:text-white">
                      {camp.clicksCount}
                    </div>
                  </div>

                  <div className="bg-slate-50 dark:bg-slate-800/60 p-2 rounded-xl text-center">
                    <div className="text-[10px] text-slate-400 font-bold uppercase flex items-center justify-center gap-1">
                      <TrendingUp className="w-3 h-3" />
                      <span>CTR</span>
                    </div>
                    <div className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                      {ctr}%
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Announcements List */}
          {activeTab === 'ANNOUNCEMENTS' && !isLoading && announcements.length === 0 && (
            <div className="py-16 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-blue-50 dark:bg-slate-800 text-city-blue mx-auto flex items-center justify-center">
                <Bell className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-800 dark:text-slate-200">
                No announcements sent yet
              </h3>
              <p className="text-xs text-slate-400 max-w-xs mx-auto">
                Send timely notifications (aarti times, flash offers) to nearby people via web push.
              </p>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  if (onOpenCreateAnnouncement) onOpenCreateAnnouncement();
                }}
                className="px-4 py-2 rounded-2xl bg-city-blue hover:bg-blue-600 text-white font-bold text-xs"
              >
                Send Your First Announcement
              </button>
            </div>
          )}

          {activeTab === 'ANNOUNCEMENTS' && announcements.map((ann) => (
            <div
              key={ann.id}
              className="p-4 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-2 shadow-2xs"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {getStatusBadge(ann.status)}
                  <span className="text-[10px] text-slate-400 font-bold">
                    Target: {ann.targetType}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium">
                  ID: #{ann.id}
                </div>
              </div>

              <h4 className="text-sm font-black text-slate-900 dark:text-white">
                {ann.title}
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {ann.message}
              </p>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  Expires: {ann.expiresAt ? new Date(ann.expiresAt).toLocaleString() : 'N/A'}
                </span>
                {ann.dispatchedCount !== undefined && (
                  <span className="font-bold text-slate-600 dark:text-slate-300">
                    Dispatched to {ann.dispatchedCount} users
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
