import React from 'react';
import { X, AlertCircle, Mail, Calendar, HelpCircle, Clock, Store, Phone, FileText } from 'lucide-react';

export default function ClientRequestDeclineSheet({ isOpen, onClose, request, onReapply }) {
  if (!isOpen || !request) return null;

  const isPending = request.status === 'PENDING';
  const isDeclined = request.status === 'DECLINED';

  const formatDate = (isoStr) => {
    if (!isoStr) return 'Recently';
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return isoStr;
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Client Request Status"
      className="fixed inset-0 z-[3600] bg-slate-900/60 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200"
    >
      <div className="bg-white dark:bg-[#10141c] p-5 sm:p-6 rounded-t-[32px] sm:rounded-[32px] max-w-md w-full shadow-2xl border border-slate-200 dark:border-[#303139] animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 relative max-h-[90vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close request status dialog"
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center justify-center transition-all shadow-md border border-slate-200/80 dark:border-slate-700 active:scale-95 cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        <div className="bg-white dark:bg-[#10141c] rounded-[24px] p-5 sm:p-6 shadow-soft border border-slate-200 dark:border-[#303139] space-y-4">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 text-xl font-black ${
              isPending
                ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                : 'bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
            }`}>
              {isPending ? (
                <Clock className="w-6 h-6 stroke-[2.5]" />
              ) : (
                <AlertCircle className="w-6 h-6 stroke-[2.5]" />
              )}
            </div>
            <div>
              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold ${
                isPending
                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                  : 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
              }`}>
                {isPending ? 'Request Under Review' : 'Application Declined'}
              </span>
              <h3 className="text-base font-black text-slate-900 dark:text-slate-100 leading-snug mt-0.5">
                {isPending ? 'Verification in Progress' : 'Client Request Status'}
              </h3>
            </div>
          </div>

          {/* Pending Information Box */}
          {isPending && (
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/80 dark:border-amber-900/60 space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800 dark:text-amber-300">
                Application Summary
              </span>
              <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed">
                Your request to become a Client is pending review by the myCiti administrative team. Once approved, you will gain access to listing management and ad campaigns.
              </p>

              <div className="pt-2 border-t border-amber-200/50 dark:border-amber-900/40 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <span>Client Type:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-200">{request.clientType}</span>
                </div>
                {request.businessName && (
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1"><Store className="w-3.5 h-3.5" /> Business:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-200">{request.businessName}</span>
                  </div>
                )}
                {request.contactPhone && (
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> Contact:</span>
                    <span className="font-bold text-slate-900 dark:text-slate-200">+91 {request.contactPhone}</span>
                  </div>
                )}
                {request.createdAt && (
                  <div className="flex items-center justify-between text-slate-600 dark:text-slate-400">
                    <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Submitted:</span>
                    <span className="font-semibold">{formatDate(request.createdAt)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Declined Reason Box */}
          {isDeclined && (
            <div className="p-4 rounded-2xl bg-rose-50/70 dark:bg-rose-950/30 border border-rose-200/80 dark:border-rose-900/60 space-y-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-800 dark:text-rose-300">
                Admin Review Feedback
              </span>
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed whitespace-pre-wrap">
                "{request.declineReason || 'Your application could not be verified with the provided details.'}"
              </p>
              {request.reviewedAt && (
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400 pt-1">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Reviewed on {formatDate(request.reviewedAt)}</span>
                </div>
              )}
            </div>
          )}

          {/* Contact Admin Card */}
          <div className="p-4 rounded-2xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200/80 dark:border-sky-900/60 flex items-start gap-3">
            <HelpCircle className="w-5 h-5 text-city-blue flex-shrink-0 mt-0.5" />
            <div className="space-y-1 text-xs">
              <p className="font-bold text-slate-800 dark:text-slate-200">
                {isPending ? 'Need faster verification?' : 'Need help or have questions?'}
              </p>
              <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                Contact our verification team with any inquiries. Please mention your registered email.
              </p>
              <a
                href="mailto:admin@myciti.com?subject=Client%20Request%20Inquiry"
                className="inline-flex items-center gap-1.5 text-city-blue font-extrabold hover:underline pt-1"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Contact admin@myciti.com</span>
              </a>
            </div>
          </div>

          {/* Reapply Button for Declined */}
          {isDeclined && onReapply && (
            <div className="pt-1">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onReapply();
                }}
                className="w-full min-h-[44px] rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold text-xs shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Submit New Application</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
