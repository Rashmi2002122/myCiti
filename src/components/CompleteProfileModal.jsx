import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateMyProfile } from '../services/api';
import { User, Store, Building2, CheckCircle2, AlertCircle, Phone, ArrowRight } from 'lucide-react';

export default function CompleteProfileModal({ isOpen, onClose }) {
  const { user, accessToken, updateUserProfile } = useAuth();

  const [accountType, setAccountType] = useState('INDIVIDUAL'); // INDIVIDUAL | STORE | COMPANY
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  if (!isOpen || !user) return null;

  const validate = () => {
    const newErrors = {};

    // Validate business name for STORE and COMPANY
    if ((accountType === 'STORE' || accountType === 'COMPANY') && !businessName.trim()) {
      newErrors.businessName = `Please enter your ${accountType === 'STORE' ? 'store' : 'company'} name`;
    }

    // Validate Indian phone number (10 digits starting with 6, 7, 8, 9; optional +91 prefix)
    const cleanedPhone = phone.trim().replace(/^(\+91|\+91-|\+91\s)/, '');
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!cleanedPhone) {
      newErrors.phone = 'Phone number is required';
    } else if (!phoneRegex.test(cleanedPhone)) {
      newErrors.phone = 'Enter a valid 10-digit Indian mobile number (e.g., 9830123456)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const payload = {
        accountType,
        businessName: (accountType === 'STORE' || accountType === 'COMPANY') ? businessName.trim() : null,
        phone: phone.trim(),
      };

      const updated = await updateMyProfile(accessToken, payload);
      updateUserProfile(updated);
      onClose();
    } catch (err) {
      setServerError(err.message || 'Failed to save profile. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const accountTypes = [
    {
      id: 'INDIVIDUAL',
      label: 'Individual',
      subtitle: 'Personal pandal hopper & enthusiast',
      icon: User,
      color: 'text-blue-600 dark:text-blue-400',
      activeBorder: 'border-city-blue bg-blue-50/60 dark:bg-blue-950/30 ring-2 ring-city-blue/30'
    },
    {
      id: 'STORE',
      label: 'Store / Shop',
      subtitle: 'Retailer offering festive deals & discounts',
      icon: Store,
      color: 'text-emerald-600 dark:text-emerald-400',
      activeBorder: 'border-emerald-500 bg-emerald-50/60 dark:bg-emerald-950/30 ring-2 ring-emerald-500/30'
    },
    {
      id: 'COMPANY',
      label: 'Company / Org',
      subtitle: 'Brand, agency, puja committee or sponsor',
      icon: Building2,
      color: 'text-purple-600 dark:text-purple-400',
      activeBorder: 'border-purple-500 bg-purple-50/60 dark:bg-purple-950/30 ring-2 ring-purple-500/30'
    }
  ];

  return (
    <div className="fixed inset-0 z-[3000] bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
      <div className="bg-gradient-to-b from-[#cfe7ff] to-[#eaf4ff] dark:from-slate-900 dark:to-slate-950 p-6 sm:p-7 rounded-[30px] max-w-lg w-full shadow-2xl border border-white/60 dark:border-slate-800 animate-in zoom-in-95 duration-200">
        <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-[26px] p-6 shadow-soft border border-white/60 dark:border-slate-800 space-y-5">
          {/* Header */}
          <div className="text-center space-y-1">
            <div className="w-12 h-12 bg-sky-base dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-2xl shadow-sm mb-2">
              ✨
            </div>
            <h2 className="text-xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
              {user.role === 'USER' ? 'Register Business Profile' : 'Complete Your Profile'}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {user.role === 'USER'
                ? 'Upgrade to a Client account to post advertisements, deals, and listings on myCiti.'
                : <>Welcome, <strong className="text-slate-800 dark:text-slate-200">{user.name || user.email}</strong>! Select your account type to continue.</>}
            </p>
          </div>

          {serverError && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 3 Selectable Account Type Cards */}
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Choose Account Type *
              </label>
              <div className="grid grid-cols-1 gap-2.5">
                {accountTypes.map((type) => {
                  const Icon = type.icon;
                  const isSelected = accountType === type.id;
                  return (
                    <button
                      type="button"
                      key={type.id}
                      onClick={() => {
                        setAccountType(type.id);
                        setErrors((prev) => ({ ...prev, businessName: null }));
                      }}
                      className={`min-h-[58px] p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all duration-200 ${
                        isSelected
                          ? type.activeBorder
                          : 'border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center bg-white dark:bg-slate-800 shadow-sm ${type.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="font-extrabold text-sm text-slate-900 dark:text-slate-100">
                            {type.label}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 leading-tight">
                            {type.subtitle}
                          </div>
                        </div>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-city-blue fill-city-blue/10 flex-shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Business / Store Name (conditional) */}
            {(accountType === 'STORE' || accountType === 'COMPANY') && (
              <div className="space-y-1 animate-in fade-in slide-in-from-top-1 duration-150">
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                  {accountType === 'STORE' ? 'Store / Brand Name *' : 'Company / Organization Name *'}
                </label>
                <input
                  type="text"
                  value={businessName}
                  onChange={(e) => {
                    setBusinessName(e.target.value);
                    if (errors.businessName) setErrors((prev) => ({ ...prev, businessName: null }));
                  }}
                  placeholder={accountType === 'STORE' ? 'e.g. Gariahat Handloom Sarees' : 'e.g. Calcutta Cultural Society'}
                  className={`w-full px-4 py-2.5 rounded-2xl border text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-city-blue ${
                    errors.businessName ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {errors.businessName && (
                  <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
                    {errors.businessName}
                  </p>
                )}
              </div>
            )}

            {/* Indian Phone Number */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Contact Phone Number (10 digits) *
              </label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-xs font-bold text-slate-400">
                  +91
                </span>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    if (errors.phone) setErrors((prev) => ({ ...prev, phone: null }));
                  }}
                  placeholder="9830123456"
                  maxLength={13}
                  className={`w-full pl-12 pr-4 py-2.5 rounded-2xl border text-sm text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-city-blue ${
                    errors.phone ? 'border-rose-400 bg-rose-50/30' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
              </div>
              {errors.phone && (
                <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-0.5">
                  {errors.phone}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full min-h-[46px] py-3 rounded-full bg-city-blue hover:bg-blue-600 text-white font-extrabold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving Profile...</span>
                </>
              ) : (
                <>
                  <span>Complete & Start Exploring</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
