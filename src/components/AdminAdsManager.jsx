import React, { useState, useEffect, useCallback } from 'react';
import {
  Sparkles, Bell, Flag, CheckCircle2, XCircle, Pause, Play,
  Trash2, AlertTriangle, Users, MapPin, Calendar, Clock,
  ExternalLink, Eye, MousePointerClick, TrendingUp, Plus
} from 'lucide-react';
import {
  fetchAdminCampaigns,
  approveAdminCampaign,
  rejectAdminCampaign,
  deleteAdminCampaign,
  fetchAdminAnnouncements,
  approveAdminAnnouncement,
  rejectAdminAnnouncement,
  deleteAdminAnnouncement,
  fetchAdminReports,
  pauseCampaign,
  resumeCampaign
} from '../services/api';

export default function AdminAdsManager({ token, onOpenCreateAnnouncement }) {
  const [activeTab, setActiveTab] = useState('CAMPAIGNS'); // 'CAMPAIGNS' | 'ANNOUNCEMENTS' | 'REPORTS'
  const [campaigns, setCampaigns] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const loadData = useCallback(async () => {
    if (!token) return;
    try {
      setIsLoading(true);
      setError('');
      if (activeTab === 'CAMPAIGNS') {
        const data = await fetchAdminCampaigns(token);
        setCampaigns(data);
      } else if (activeTab === 'ANNOUNCEMENTS') {
        const data = await fetchAdminAnnouncements(token);
        setAnnouncements(data);
      } else if (activeTab === 'REPORTS') {
        const data = await fetchAdminReports(token);
        setReports(data);
      }
    } catch (err) {
      console.error('Failed to load admin marketing data:', err);
      setError('Unable to load moderation records.');
    } finally {
      setIsLoading(false);
    }
  }, [token, activeTab]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Campaign Moderation Actions
  const handleApproveCampaign = async (id) => {
    try {
      setActionLoadingId(id);
      const updated = await approveAdminCampaign(token, id);
      setCampaigns((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (err) {
      alert(err.message || 'Failed to approve campaign');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectCampaign = async (id) => {
    const reason = prompt('Please enter the rejection reason:');
    if (!reason) return;
    try {
      setActionLoadingId(id);
      const updated = await rejectAdminCampaign(token, id, reason);
      setCampaigns((prev) => prev.map((c) => (c.id === id ? updated : c)));
    } catch (err) {
      alert(err.message || 'Failed to reject campaign');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleTogglePauseCampaign = async (camp) => {
    try {
      setActionLoadingId(camp.id);
      if (camp.status === 'ACTIVE') {
        const updated = await pauseCampaign(token, camp.id);
        setCampaigns((prev) => prev.map((c) => (c.id === camp.id ? updated : c)));
      } else {
        const updated = await resumeCampaign(token, camp.id);
        setCampaigns((prev) => prev.map((c) => (c.id === camp.id ? updated : c)));
      }
    } catch (err) {
      alert(err.message || 'Failed to pause/resume campaign');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteCampaign = async (id) => {
    if (!window.confirm('Are you sure you want to delete this campaign?')) return;
    try {
      setActionLoadingId(id);
      await deleteAdminCampaign(token, id);
      setCampaigns((prev) => prev.filter((c) => c.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete campaign');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Announcement Moderation Actions
  const handleApproveAnnouncement = async (id) => {
    try {
      setActionLoadingId(id);
      const updated = await approveAdminAnnouncement(token, id);
      setAnnouncements((prev) => prev.map((a) => (a.id === id ? updated : a)));
      alert(`Announcement approved and dispatched to ${updated.dispatchedCount || 0} users!`);
    } catch (err) {
      alert(err.message || 'Failed to approve announcement');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleRejectAnnouncement = async (id) => {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;
    try {
      setActionLoadingId(id);
      const updated = await rejectAdminAnnouncement(token, id, reason);
      setAnnouncements((prev) => prev.map((a) => (a.id === id ? updated : a)));
    } catch (err) {
      alert(err.message || 'Failed to reject announcement');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleDeleteAnnouncement = async (id) => {
    if (!window.confirm('Delete this announcement?')) return;
    try {
      setActionLoadingId(id);
      await deleteAdminAnnouncement(token, id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert(err.message || 'Failed to delete announcement');
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
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {status}
          </span>
        );
      case 'PENDING':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200 animate-pulse">
            PENDING REVIEW
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300">
            REJECTED
          </span>
        );
      case 'PAUSED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            PAUSED
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
    <div className="space-y-4">
      {/* Sub Navigation */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800/60 p-1 rounded-2xl">
          <button
            type="button"
            onClick={() => setActiveTab('CAMPAIGNS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'CAMPAIGNS'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Ad Campaigns ({campaigns.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('ANNOUNCEMENTS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'ANNOUNCEMENTS'
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Announcements ({announcements.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('REPORTS')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all ${
              activeTab === 'REPORTS'
                ? 'bg-rose-500 text-white shadow-xs'
                : 'text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-slate-800'
            }`}
          >
            Reported Ads ({reports.length})
          </button>
        </div>

        {activeTab === 'ANNOUNCEMENTS' && onOpenCreateAnnouncement && (
          <button
            type="button"
            onClick={onOpenCreateAnnouncement}
            className="px-3.5 py-1.5 rounded-full bg-city-blue hover:bg-blue-600 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-soft transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Send City Broadcast</span>
          </button>
        )}
      </div>

      {isLoading && (
        <div className="py-12 text-center text-xs text-slate-400 font-semibold">
          Loading moderation records...
        </div>
      )}

      {error && (
        <div className="p-3 rounded-2xl bg-rose-50 text-rose-700 text-xs font-semibold flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* 1. Campaigns Tab */}
      {activeTab === 'CAMPAIGNS' && !isLoading && (
        <div className="space-y-3">
          {campaigns.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-semibold">
              No ad campaigns submitted.
            </div>
          ) : (
            campaigns.map((camp) => (
              <div
                key={camp.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusBadge(camp.status)}
                      <span className="text-[11px] font-bold text-slate-400">
                        Campaign #{camp.id} • Listing #{camp.listingId}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {camp.headline}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Targeting: {camp.targetType} {camp.radiusKm ? `(${camp.radiusKm} km)` : camp.targetAreaName}
                    </p>
                    <p className="text-[11px] text-slate-400 mt-1">
                      Dates: {camp.startDate} &rarr; {camp.endDate}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {camp.status === 'PENDING' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApproveCampaign(camp.id)}
                          disabled={actionLoadingId === camp.id}
                          className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1 shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectCampaign(camp.id)}
                          disabled={actionLoadingId === camp.id}
                          className="px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 hover:bg-rose-100 font-bold text-xs flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    {(camp.status === 'ACTIVE' || camp.status === 'PAUSED') && (
                      <button
                        type="button"
                        onClick={() => handleTogglePauseCampaign(camp)}
                        disabled={actionLoadingId === camp.id}
                        className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold text-xs flex items-center gap-1"
                      >
                        {camp.status === 'ACTIVE' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 text-emerald-600" />}
                        <span>{camp.status === 'ACTIVE' ? 'Pause' : 'Resume'}</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDeleteCampaign(camp.id)}
                      disabled={actionLoadingId === camp.id}
                      className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                      title="Delete Campaign"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-center">
                  <div className="text-xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Impressions</span>
                    <span className="font-black text-slate-900 dark:text-white">{camp.impressionsCount}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Clicks</span>
                    <span className="font-black text-slate-900 dark:text-white">{camp.clicksCount}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Reports</span>
                    <span className="font-black text-rose-500">{camp.reportsCount || 0}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. Announcements Tab */}
      {activeTab === 'ANNOUNCEMENTS' && !isLoading && (
        <div className="space-y-3">
          {announcements.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-semibold">
              No announcements submitted.
            </div>
          ) : (
            announcements.map((ann) => (
              <div
                key={ann.id}
                className="p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800/40 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getStatusBadge(ann.status)}
                      <span className="text-[10px] font-bold text-slate-400">
                        Target: {ann.targetType} {ann.radiusKm ? `(${ann.radiusKm} km)` : ann.targetAreaName}
                      </span>
                    </div>
                    <h4 className="text-sm font-black text-slate-900 dark:text-white">
                      {ann.title}
                    </h4>
                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {ann.message}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {ann.status === 'PENDING' && (
                      <>
                        <button
                          type="button"
                          onClick={() => handleApproveAnnouncement(ann.id)}
                          disabled={actionLoadingId === ann.id}
                          className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve & Send</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRejectAnnouncement(ann.id)}
                          disabled={actionLoadingId === ann.id}
                          className="px-3 py-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-600 font-bold text-xs"
                        >
                          Reject
                        </button>
                      </>
                    )}
                    <button
                      type="button"
                      onClick={() => handleDeleteAnnouncement(ann.id)}
                      disabled={actionLoadingId === ann.id}
                      className="p-1.5 text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-400">
                  <span>Expires: {ann.expiresAt ? new Date(ann.expiresAt).toLocaleString() : 'N/A'}</span>
                  <span>Dispatched: {ann.dispatchedCount || 0} users</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 3. Reports Tab */}
      {activeTab === 'REPORTS' && !isLoading && (
        <div className="space-y-3">
          {reports.length === 0 ? (
            <div className="py-12 text-center text-xs text-slate-400 font-semibold">
              No reported advertisements. Community health is looking good!
            </div>
          ) : (
            reports.map((rep) => (
              <div
                key={rep.id}
                className="p-4 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/40 dark:bg-rose-950/20 space-y-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white">
                        {rep.reason}
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Campaign #{rep.campaignId}
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-slate-900 dark:text-white">
                      Headline: "{rep.campaignHeadline}"
                    </h4>
                    {rep.details && (
                      <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 italic">
                        "{rep.details}"
                      </p>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDeleteCampaign(rep.campaignId)}
                    className="px-3 py-1.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs flex items-center gap-1 shadow-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Campaign</span>
                  </button>
                </div>

                <div className="text-[10px] text-slate-400 pt-1 border-t border-rose-100 dark:border-slate-800">
                  Reported at: {rep.createdAt ? new Date(rep.createdAt).toLocaleString() : 'Recent'}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
