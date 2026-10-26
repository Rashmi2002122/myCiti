import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateMyProfile } from '../services/api';
import { User, Store, Building2, CheckCircle2, AlertCircle, Phone, ArrowRight, X } from 'lucide-react';

export default function CompleteProfileModal({ isOpen, onClose }) {
  const { user, accessToken, updateUserProfile, refreshUserProfile } = useAuth();

  const isClientOrAdmin = user?.role === 'CLIENT' || user?.role === 'ADMIN' || user?.role === 'SUBMITTER';

  const [name, setName] = useState(() => user?.name || '');
  const [clientType, setClientType] = useState(() => user?.clientType || user?.accountType || 'INDIVIDUAL');
  const [businessName, setBusinessName] = useState(() => user?.businessName || '');
  const [phone, setPhone] = useState(() => user?.phone || '');
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState('');

  useEffect(() => {
    if (user && isOpen) {
      setName(user.name || '');
      setClientType(user.clientType || user.accountType || 'INDIVIDUAL');
      setBusinessName(user.businessName || '');
      setPhone(user.phone || '');
      setErrors({});
      setServerError('');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  const validate = () => {
    const newErrors = {};

    if (!name.trim()) {
      newErrors.name = 'Name is required';
    }

    if (isClientOrAdmin) {
      if ((clientType === 'STORE' || clientType === 'COMPANY') && !businessName.trim()) {
        newErrors.businessName = `Please enter your ${clientType === 'STORE' ? 'store' : 'company'} name`;
      }

      const cleanedPhone = phone.trim().replace(/^(\+91|\+91-|\+91\s)/, '');
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!cleanedPhone) {
        newErrors.phone = 'Phone number is required for Client accounts';
      } else if (!phoneRegex.test(cleanedPhone)) {
        newErrors.phone = 'Enter a valid 10-digit Indian mobile number (e.g., 9830123456)';
      }
    } else {
      // Optional phone for basic user
      if (phone.trim()) {
        const cleanedPhone = phone.trim().replace(/^(\+91|\+91-|\+91\s)/, '');
        const phoneRegex = /^[6-9]\d{9}$/;
        if (!phoneRegex.test(cleanedPhone)) {
          newErrors.phone = 'Enter a valid 10-digit Indian mobile number';
        }
      }
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
      const cleanedPhone = phone.trim() ? phone.trim().replace(/^(\+91|\+91-|\+91\s)/, '') : null;
      const payload = {
        name: name.trim(),
        clientType: isClientOrAdmin ? clientType : null,
        accountType: isClientOrAdmin ? clientType : null,
        businessName: isClientOrAdmin && (clientType === 'STORE' || clientType === 'COMPANY') ? businessName.trim() : null,
        phone: cleanedPhone,
      };

      const updated = await updateMyProfile(accessToken, payload);
      updateUserProfile(updated);
      if (refreshUserProfile) refreshUserProfile();
      onClose();
    } catch (err) {
      setServerError(err.message || 'Failed to save profile. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const accountTypes = [
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
    },
    {
      id: 'INDIVIDUAL',
      label: 'Individual',
      subtitle: 'Individual artist, organizer or promoter',
      icon: User,
      color: 'text-blue-600 dark:text-blue-400',
      activeBorder: 'border-city-blue bg-blue-50/60 dark:bg-blue-950/30 ring-2 ring-city-blue/30'
    }
  ];

  return (
    <div className="fixed inset-0 z-[3500] bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-in fade-in duration-160">
      <div className="bg-white dark:bg-[#10141c] p-5 sm:p-6 rounded-[24px] max-w-md w-full shadow-2xl border border-slate-200 dark:border-[#303139] animate-in zoom-in-95 duration-160 relative my-auto text-slate-900 dark:text-[#f4f5f7]">
        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close profile modal"
          className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-slate-100 dark:bg-[#101522] text-slate-700 dark:text-[#f4f5f7] hover:border-[#ff951f]/50 flex items-center justify-center transition-all border border-slate-200 dark:border-[#303139] active:scale-95 cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[2.5]" />
        </button>

        <div className="space-y-4 pt-1">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-city-blue/10 dark:bg-sky-500/20 text-city-blue dark:text-sky-400 flex items-center justify-center flex-shrink-0">
              <User className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-city-blue bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                {isClientOrAdmin ? 'Business Profile' : 'Basic Profile'}
              </span>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 leading-tight mt-0.5">
                {isClientOrAdmin ? 'Manage Business Profile' : 'Edit Profile'}
              </h2>
            </div>
          </div>

          {serverError && (
            <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{serverError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Display Name */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Display Name *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your full name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-city-blue"
              />
              {errors.name && (
                <p className="text-[11px] font-bold text-rose-500">{errors.name}</p>
              )}
            </div>

            {/* Email (Readonly from Google) */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                Email Address (Google Account)
              </label>
              <input
                type="email"
                value={user.email}
                disabled
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800/50 text-xs font-medium text-slate-500 dark:text-slate-400 cursor-not-allowed"
              />
            </div>

            {/* Client specific fields */}
            {isClientOrAdmin ? (
              <>
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                    Client Account Type *
                  </label>
                  <div className="space-y-2">
                    {accountTypes.map((type) => {
                      const Icon = type.icon;
                      const isSelected = clientType === type.id;
                      return (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setClientType(type.id)}
                          className={`w-full p-3 rounded-2xl text-left border flex items-center justify-between transition-all ${
                            isSelected
                              ? type.activeBorder
                              : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${type.color} bg-slate-100 dark:bg-slate-800`}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="text-xs font-extrabold text-slate-900 dark:text-slate-100">{type.label}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">{type.subtitle}</div>
                            </div>
                          </div>
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            isSelected ? 'border-city-blue' : 'border-slate-300 dark:border-slate-600'
                          }`}>
                            {isSelected && <div className="w-2 h-2 rounded-full bg-city-blue" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {(clientType === 'STORE' || clientType === 'COMPANY') && (
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Business Name *
                    </label>
                    <input
                      type="text"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="e.g., Ganguram Sweets"
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-city-blue"
                    />
                    {errors.businessName && (
                      <p className="text-[11px] font-bold text-rose-500">{errors.businessName}</p>
                    )}
                  </div>
                )}
              </>
            ) : null}

            {/* Phone */}
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                {isClientOrAdmin ? 'Contact Phone *' : 'Phone Number (Optional)'}
              </label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                  +91
                </div>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="9830123456"
                  className="w-full pl-11 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-city-blue"
                />
              </div>
              {errors.phone && (
                <p className="text-[11px] font-bold text-rose-500">{errors.phone}</p>
              )}
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full min-h-[46px] rounded-full bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-extrabold text-xs shadow-md transition-all active:scale-[0.99] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {isSubmitting ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    <span>Saving...</span>
                  </span>
                ) : (
                  <span>Save Profile</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
