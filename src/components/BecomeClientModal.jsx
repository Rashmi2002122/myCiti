import React, { useState } from 'react';
import { X, Sparkles, Store, Building2, User, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { createClientRequest } from '../services/api';

export default function BecomeClientModal({ isOpen, onClose, onSuccess }) {
  const { user, accessToken } = useAuth();

  const [clientType, setClientType] = useState('STORE'); // INDIVIDUAL | STORE | COMPANY
  const [businessName, setBusinessName] = useState('');
  const [contactPhone, setContactPhone] = useState(() => user?.phone || '');
  const [note, setNote] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  if (!isOpen) return null;

  const validate = () => {
    const errs = {};
    if (clientType === 'STORE' || clientType === 'COMPANY') {
      if (!businessName.trim()) {
        errs.businessName = `Business name is required for ${clientType === 'STORE' ? 'Store' : 'Company'}`;
      }
    }

    const cleanedPhone = contactPhone.trim().replace(/^(\+91|\+91-|\+91\s)/, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!cleanedPhone) {
      errs.contactPhone = 'Contact phone number is required';
    } else if (!phoneRegex.test(cleanedPhone)) {
      errs.contactPhone = 'Enter a valid 10-digit Indian mobile number (e.g., 9830123456)';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    try {
      setIsSubmitting(true);
      const cleanedPhone = contactPhone.trim().replace(/^(\+91|\+91-|\+91\s)/, '');
      const payload = {
        clientType,
        businessName: (clientType === 'STORE' || clientType === 'COMPANY') ? businessName.trim() : null,
        contactPhone: cleanedPhone,
        note: note.trim() || null
      };

      const result = await createClientRequest(accessToken, payload);
      if (onSuccess) onSuccess(result);
      onClose();
    } catch (err) {
      setServerError(err.message || 'Failed to submit client request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3600] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-160">
      <div className="bg-white dark:bg-[#10141c] p-5 sm:p-6 rounded-[24px] max-w-md w-full shadow-2xl border border-slate-200 dark:border-[#303139] animate-in zoom-in-95 duration-160 relative my-auto text-slate-900 dark:text-[#f4f5f7]">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close become client modal"
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 dark:bg-[#101522] text-slate-700 dark:text-[#f4f5f7] hover:border-[#ff951f]/50 flex items-center justify-center transition-all border border-slate-200 dark:border-[#303139] active:scale-95 cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        <div className="space-y-4 pt-1">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-sky-400 text-white flex items-center justify-center flex-shrink-0 shadow-md">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-city-blue bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                Upgrade Account
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 leading-tight mt-0.5">
                Become a Client
              </h2>
            </div>
          </div>

          <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
            Apply to promote pandals, melas, shops, or festival offers across myCiti. Once approved by our team, you can publish listings and run geo-targeted campaigns.
          </p>

          {serverError && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Account Type Selector */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Choose Client Type *
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'STORE', label: 'Store', desc: 'Shop / Outlet', icon: Store },
                  { id: 'COMPANY', label: 'Company', desc: 'Org / Agency', icon: Building2 },
                  { id: 'INDIVIDUAL', label: 'Individual', desc: 'Artist / Pandal', icon: User },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = clientType === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        setClientType(item.id);
                        if (errors.businessName) setErrors((prev) => ({ ...prev, businessName: null }));
                      }}
                      className={`min-h-[64px] p-2.5 rounded-2xl text-left border flex flex-col justify-between transition-all ${
                        isSelected
                          ? 'border-city-blue bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-city-blue/30 shadow-xs'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                      }`}
                    >
                      <div className="flex items-center justify-between w-full">
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-city-blue' : 'text-slate-400'}`} />
                        {isSelected && <span className="w-2 h-2 rounded-full bg-city-blue" />}
                      </div>
                      <div className="mt-1">
                        <div className="text-xs font-black text-slate-900 dark:text-slate-100">{item.label}</div>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 truncate">{item.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Business Name (required for STORE and COMPANY) */}
            {(clientType === 'STORE' || clientType === 'COMPANY') && (
              <div className="space-y-1">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  Business / Store Name *
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => {
                      setBusinessName(e.target.value);
                      if (errors.businessName) setErrors((prev) => ({ ...prev, businessName: null }));
                    }}
                    placeholder={clientType === 'STORE' ? 'e.g., Ganguram Sweets' : 'e.g., Bengal Festival Arts Ltd.'}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-city-blue"
                  />
                </div>
                {errors.businessName && (
                  <p className="text-[11px] font-bold text-rose-500">{errors.businessName}</p>
                )}
              </div>
            )}

            {/* Contact Phone */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Contact Phone (WhatsApp / Call) *
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  +91
                </div>
                <input
                  type="tel"
                  value={contactPhone}
                  onChange={(e) => {
                    setContactPhone(e.target.value);
                    if (errors.contactPhone) setErrors((prev) => ({ ...prev, contactPhone: null }));
                  }}
                  placeholder="9830123456"
                  className="w-full pl-11 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-city-blue"
                />
              </div>
              {errors.contactPhone && (
                <p className="text-[11px] font-bold text-rose-500">{errors.contactPhone}</p>
              )}
            </div>

            {/* Short Note */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Short Note / Description (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={1000}
                rows={2}
                placeholder="Tell us briefly about what you plan to post or promote..."
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-city-blue resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[46px] rounded-full bg-gradient-to-r from-blue-600 to-sky-500 hover:from-blue-700 hover:to-sky-600 active:scale-[0.99] text-white font-extrabold text-xs shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Submitting Request...</span>
                  </span>
                ) : (
                  <span>Submit Client Application</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
