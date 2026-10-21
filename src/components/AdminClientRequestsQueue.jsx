import React, { useState, useEffect, useCallback } from 'react';
import {
  X, Check, AlertCircle, Clock, CheckCircle2, XCircle, Phone,
  User, Building2, Store, Calendar, Mail, FileText, Sparkles
} from 'lucide-react';
import {
  fetchAdminClientRequests,
  approveAdminClientRequest,
  declineAdminClientRequest
} from '../services/api';

export default function AdminClientRequestsQueue({ token, onRequestsChanged }) {
  const [activeTab, setActiveTab] = useState('PENDING'); // PENDING | APPROVED | DECLINED
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // Selected request for decline reason dialog
  const [decliningItem, setDecliningItem] = useState(null);
  const [declineReason, setDeclineReason] = useState('');
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');

  const loadRequests = useCallback(async (status) => {
    if (!token) return;
    try {
      setIsLoading(true);
      setError('');
      const data = await fetchAdminClientRequests(token, status);
      setRequests(data.content || data || []);
    } catch (err) {
      console.error('Failed to load client requests:', err);
      setError('Unable to load client requests.');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    loadRequests(activeTab);
  }, [activeTab, loadRequests]);

  const handleApprove = async (id) => {
    if (!token) return;
    try {
      setIsActionLoading(true);
      setActionError('');
      await approveAdminClientRequest(token, id);
      await loadRequests(activeTab);
      if (onRequestsChanged) onRequestsChanged();
    } catch (err) {
      setActionError(err.message || 'Failed to approve request');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleDeclineSubmit = async (e) => {
    e.preventDefault();
    if (!token || !decliningItem) return;

    if (!declineReason.trim() || declineReason.trim().length < 10) {
      setActionError('Decline reason must be at least 10 characters');
      return;
    }

    try {
      setIsActionLoading(true);
      setActionError('');
      await declineAdminClientRequest(token, decliningItem.id, declineReason.trim());
      setDecliningItem(null);
      setDeclineReason('');
      await loadRequests(activeTab);
      if (onRequestsChanged) onRequestsChanged();
    } catch (err) {
      setActionError(err.message || 'Failed to decline request');
    } finally {
      setIsActionLoading(false);
    }
  };

  const formatDate = (isoStr) => {
    if (!isoStr) return '';
    try {
      return new Date(isoStr).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div className="space-y-4">
      {/* Sub-tabs: PENDING / APPROVED / DECLINED */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
        {[
          { id: 'PENDING', label: 'Pending Review', color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-800' },
          { id: 'APPROVED', label: 'Approved', color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-800' },
          { id: 'DECLINED', label: 'Declined', color: 'text-rose-600 bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-800' },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`min-h-[38px] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all border ${
              activeTab === tab.id
                ? `${tab.color} shadow-xs font-black`
                : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/40'
            }`}
          >
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {actionError && (
        <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {error && (
        <div className="p-4 text-center text-xs text-rose-500 font-bold bg-rose-50 dark:bg-rose-950/30 rounded-2xl">
          {error}
        </div>
      )}

      {isLoading ? (
        <div className="p-12 text-center text-slate-400 space-y-2">
          <div className="w-6 h-6 border-2 border-city-blue border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold">Loading client requests...</p>
        </div>
      ) : requests.length === 0 ? (
        <div className="p-12 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/30 rounded-2xl border border-slate-100 dark:border-slate-800">
          <Sparkles className="w-8 h-8 mx-auto text-slate-300 mb-2" />
          <p className="text-xs font-extrabold text-slate-600 dark:text-slate-300">
            No {activeTab.toLowerCase()} client requests
          </p>
          <p className="text-[11px] text-slate-400 mt-1">
            New upgrade requests submitted by users will appear here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => (
            <div
              key={req.id}
              className="p-4 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-soft space-y-3"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  {req.userPictureUrl ? (
                    <img
                      src={req.userPictureUrl}
                      alt={req.userName || 'User'}
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 dark:ring-slate-800"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/60 text-city-blue font-black flex items-center justify-center text-sm">
                      {req.userName ? req.userName.charAt(0).toUpperCase() : 'U'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                        {req.userName || 'Unknown User'}
                      </h4>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300">
                        {req.clientType}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                      {req.userEmail}
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  req.status === 'APPROVED'
                    ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                    : req.status === 'DECLINED'
                    ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                    : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                }`}>
                  {req.status}
                </span>
              </div>

              {/* Business Name and Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-slate-100 dark:border-slate-800/80">
                {req.businessName && (
                  <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                    <Store className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-bold">Business:</span>
                    <span className="font-semibold">{req.businessName}</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-bold">Phone:</span>
                  <a href={`tel:${req.contactPhone}`} className="text-city-blue hover:underline">
                    {req.contactPhone}
                  </a>
                </div>
              </div>

              {/* Note */}
              {req.note && (
                <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  <span className="font-bold text-slate-500 dark:text-slate-400 block text-[10px] uppercase tracking-wider mb-0.5">
                    Note:
                  </span>
                  "{req.note}"
                </div>
              )}

              {/* Decline Reason if Declined */}
              {req.declineReason && (
                <div className="p-2.5 bg-rose-50 dark:bg-rose-950/30 rounded-xl text-xs text-rose-700 dark:text-rose-300 border border-rose-200/60 dark:border-rose-900/40">
                  <span className="font-bold block text-[10px] uppercase tracking-wider mb-0.5">
                    Decline Reason:
                  </span>
                  "{req.declineReason}"
                </div>
              )}

              {/* Review Timestamps */}
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                <span>Submitted: {formatDate(req.createdAt)}</span>
                {req.reviewedAt && <span>Reviewed: {formatDate(req.reviewedAt)}</span>}
              </div>

              {/* Pending Action Buttons */}
              {req.status === 'PENDING' && (
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={() => {
                      setDecliningItem(req);
                      setDeclineReason('');
                      setActionError('');
                    }}
                    className="min-h-[36px] px-3.5 rounded-full border border-rose-200 text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-bold transition-colors cursor-pointer"
                  >
                    Decline
                  </button>
                  <button
                    type="button"
                    disabled={isActionLoading}
                    onClick={() => handleApprove(req.id)}
                    className="min-h-[36px] px-4 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Approve & Promote</span>
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Decline Reason Dialog */}
      {decliningItem && (
        <div className="fixed inset-0 z-[4000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-[28px] max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in zoom-in-95">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                Decline Client Request
              </h3>
              <button
                type="button"
                onClick={() => setDecliningItem(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400">
              Please enter the reason for declining <strong>{decliningItem.userName}</strong>'s request. The user will see this reason in their menu.
            </p>

            <form onSubmit={handleDeclineSubmit} className="space-y-3">
              <textarea
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="e.g., Incomplete documentation. Please contact admin@myciti.com..."
                rows={3}
                required
                minLength={10}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
              />

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setDecliningItem(null)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionLoading || declineReason.trim().length < 10}
                  className="px-4 py-2 rounded-full bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold shadow-xs transition-colors"
                >
                  {isActionLoading ? 'Declining...' : 'Confirm Decline'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
