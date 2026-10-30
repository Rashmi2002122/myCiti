import React from 'react';
import { X, AlertCircle, Calendar, Mail, Edit3, Trash2 } from 'lucide-react';

export default function DeclineInfoSheet({
  isOpen,
  onClose,
  submission,
  onEditAndResubmit,
  onDelete
}) {
  if (!isOpen || !submission) return null;

  const formatDate = (isoStr) => {
    if (!isoStr) return 'Recently';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-IN', {
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
    <div className="fixed inset-0 z-[3500] bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-[#10141c] p-5 sm:p-6 rounded-t-[30px] sm:rounded-[30px] max-w-md w-full shadow-2xl border border-slate-200 dark:border-[#303139] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close decline details"
          className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/80 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 flex items-center justify-center transition-colors shadow-soft"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="bg-white dark:bg-[#10141c] rounded-[24px] p-5 sm:p-6 shadow-soft border border-slate-200 dark:border-[#303139] space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center flex-shrink-0 text-xl font-black">
              <AlertCircle className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300">
                <span>Declined</span>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100 leading-snug">
                {submission.title}
              </h3>
            </div>
          </div>

          {/* Reason Box */}
          <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 space-y-1.5">
            <span className="text-[11px] font-bold uppercase tracking-wider text-rose-800 dark:text-rose-300">
              Reviewer Reason
            </span>
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
              "{submission.declineReason || 'Incomplete or unverified details'}"
            </p>
          </div>

          {/* Details & Review Timestamp */}
          <div className="text-xs text-slate-500 dark:text-slate-400 space-y-2 border-y border-slate-100 dark:border-slate-800 py-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span>Reviewed on: <strong>{formatDate(submission.reviewedAt)}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-city-blue flex-shrink-0" />
              <span>
                Need help? Write to{' '}
                <a
                  href="mailto:admin@mycite.com"
                  className="font-bold text-city-blue underline hover:opacity-80"
                >
                  admin@mycite.com
                </a>
              </span>
            </div>
          </div>

          {/* Action Buttons (44px min touch target) */}
          <div className="flex flex-col sm:flex-row gap-2.5 pt-1">
            <button
              onClick={() => {
                onClose();
                if (onEditAndResubmit) onEditAndResubmit(submission);
              }}
              className="flex-1 min-h-[44px] px-4 py-2.5 rounded-2xl bg-city-blue hover:bg-blue-600 active:scale-[0.98] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md transition-all"
            >
              <Edit3 className="w-4 h-4" />
              <span>Edit and resubmit</span>
            </button>
            <button
              onClick={() => {
                onClose();
                if (onDelete) onDelete(submission);
              }}
              className="min-h-[44px] px-4 py-2.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-rose-600 dark:text-rose-400 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-rose-200/60 dark:border-rose-900"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
