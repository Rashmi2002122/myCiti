import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Camera,
  Upload,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  Copy,
  Check,
  AlertCircle,
  Store,
  Building2,
  User as UserIcon,
  Navigation,
  Sparkles,
  Loader2
} from 'lucide-react';
import {
  fetchMyClientProfile,
  updateMyClientProfile,
  uploadClientLogo,
  uploadClientCover
} from '../services/api';
import LocationPickerMap from './LocationPickerMap';

const INDIAN_PHONE_REGEX = /^[6-9]\d{9}$/;

export default function ClientProfileEditModal({
  isOpen,
  onClose,
  accessToken,
  onViewPublicProfile,
  onProfileUpdated
}) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [locatingUser, setLocatingUser] = useState(false);

  // Form Fields
  const [businessName, setBusinessName] = useState('');
  const [clientType, setClientType] = useState('STORE');
  const [bio, setBio] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);
  const [publicPhone, setPublicPhone] = useState('');
  const [showPhone, setShowPhone] = useState(false);
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [dailyOpenTime, setDailyOpenTime] = useState('');
  const [dailyCloseTime, setDailyCloseTime] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [slug, setSlug] = useState('');
  const [verified, setVerified] = useState(false);

  // Feedback & State
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [toastMessage, setToastMessage] = useState(null);
  const [slugCopied, setSlugCopied] = useState(false);

  const initialFormRef = useRef(null);
  const logoInputRef = useRef(null);
  const coverInputRef = useRef(null);

  // Load client's profile
  useEffect(() => {
    if (!isOpen || !accessToken) return;
    let isMounted = true;
    setLoading(true);
    setServerError('');
    setErrors({});

    fetchMyClientProfile(accessToken)
      .then((data) => {
        if (!isMounted) return;
        setProfile(data);
        setBusinessName(data.businessName || '');
        setClientType(data.clientType || 'STORE');
        setBio(data.bio || '');
        setAddress(data.address || '');
        setLandmark(data.landmark || '');
        setLatitude(data.latitude || null);
        setLongitude(data.longitude || null);
        setPublicPhone(data.publicPhone || '');
        setShowPhone(Boolean(data.showPhone));
        setWhatsappNumber(data.whatsappNumber || '');
        setDailyOpenTime(data.dailyOpenTime ? data.dailyOpenTime.slice(0, 5) : '09:00');
        setDailyCloseTime(data.dailyCloseTime ? data.dailyCloseTime.slice(0, 5) : '21:00');
        setLogoUrl(data.logoUrl || '');
        setCoverUrl(data.coverUrl || '');
        setSlug(data.slug || '');
        setVerified(Boolean(data.verified));

        initialFormRef.current = {
          businessName: data.businessName || '',
          clientType: data.clientType || 'STORE',
          bio: data.bio || '',
          address: data.address || '',
          landmark: data.landmark || '',
          latitude: data.latitude || null,
          longitude: data.longitude || null,
          publicPhone: data.publicPhone || '',
          showPhone: Boolean(data.showPhone),
          whatsappNumber: data.whatsappNumber || '',
          dailyOpenTime: data.dailyOpenTime ? data.dailyOpenTime.slice(0, 5) : '09:00',
          dailyCloseTime: data.dailyCloseTime ? data.dailyCloseTime.slice(0, 5) : '21:00'
        };

        setLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Failed to load profile for editing:', err);
        setServerError(err.message || 'Unable to load profile data.');
        setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, accessToken]);

  // Dirty form detection
  const isDirty = useMemo(() => {
    if (!initialFormRef.current) return false;
    const init = initialFormRef.current;
    return (
      businessName !== init.businessName ||
      clientType !== init.clientType ||
      bio !== init.bio ||
      address !== init.address ||
      landmark !== init.landmark ||
      latitude !== init.latitude ||
      longitude !== init.longitude ||
      publicPhone !== init.publicPhone ||
      showPhone !== init.showPhone ||
      whatsappNumber !== init.whatsappNumber ||
      dailyOpenTime !== init.dailyOpenTime ||
      dailyCloseTime !== init.dailyCloseTime
    );
  }, [
    businessName,
    clientType,
    bio,
    address,
    landmark,
    latitude,
    longitude,
    publicPhone,
    showPhone,
    whatsappNumber,
    dailyOpenTime,
    dailyCloseTime
  ]);

  if (!isOpen) return null;

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleCopySlug = () => {
    const fullUrl = `${window.location.origin}/c/${slug}`;
    navigator.clipboard
      .writeText(fullUrl)
      .then(() => {
        setSlugCopied(true);
        showToast('Profile URL copied to clipboard');
        setTimeout(() => setSlugCopied(false), 2000);
      })
      .catch(() => {
        showToast('URL: ' + fullUrl);
      });
  };

  // Upload Logo
  const handleLogoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Logo image must be smaller than 5 MB');
      return;
    }

    setUploadingLogo(true);
    try {
      const res = await uploadClientLogo(accessToken, file);
      setLogoUrl(res.logoUrl || res.url);
      showToast('Logo updated successfully');
      if (onProfileUpdated) onProfileUpdated();
    } catch (err) {
      alert(err.message || 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
      if (logoInputRef.current) logoInputRef.current.value = '';
    }
  };

  // Upload Cover
  const handleCoverFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Cover banner image must be smaller than 5 MB');
      return;
    }

    setUploadingCover(true);
    try {
      const res = await uploadClientCover(accessToken, file);
      setCoverUrl(res.coverUrl || res.url);
      showToast('Cover banner updated successfully');
      if (onProfileUpdated) onProfileUpdated();
    } catch (err) {
      alert(err.message || 'Failed to upload cover banner');
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  // Use Current Location
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setLocatingUser(false);
        showToast('Location updated from device GPS');
      },
      (err) => {
        setLocatingUser(false);
        alert('Could not obtain current location: ' + err.message);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const validate = () => {
    const newErrors = {};

    if (!businessName.trim()) {
      newErrors.businessName = 'Business name is required';
    } else if (businessName.trim().length > 120) {
      newErrors.businessName = 'Business name cannot exceed 120 characters';
    }

    if (bio && bio.length > 160) {
      newErrors.bio = 'Bio cannot exceed 160 characters';
    }

    if (publicPhone.trim()) {
      const cleaned = publicPhone.trim().replace(/^(\+91|\+91-|\+91\s|0)/, '').replace(/[\s\-()]+/g, '');
      if (!INDIAN_PHONE_REGEX.test(cleaned)) {
        newErrors.publicPhone = 'Enter a valid 10-digit Indian mobile number';
      }
    }

    if (whatsappNumber.trim()) {
      const cleaned = whatsappNumber.trim().replace(/^(\+91|\+91-|\+91\s|0)/, '').replace(/[\s\-()]+/g, '');
      if (!INDIAN_PHONE_REGEX.test(cleaned)) {
        newErrors.whatsappNumber = 'Enter a valid 10-digit Indian WhatsApp number';
      }
    }

    if ((latitude !== null && longitude === null) || (latitude === null && longitude !== null)) {
      newErrors.location = 'Both latitude and longitude must be provided together';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) return;

    setSaving(true);
    try {
      const cleanedPhone = publicPhone.trim()
        ? publicPhone.trim().replace(/^(\+91|\+91-|\+91\s|0)/, '').replace(/[\s\-()]+/g, '')
        : null;

      const cleanedWa = whatsappNumber.trim()
        ? whatsappNumber.trim().replace(/^(\+91|\+91-|\+91\s|0)/, '').replace(/[\s\-()]+/g, '')
        : null;

      const payload = {
        businessName: businessName.trim(),
        clientType,
        bio: bio.trim() || null,
        address: address.trim() || null,
        landmark: landmark.trim() || null,
        latitude: latitude !== null ? Number(latitude) : null,
        longitude: longitude !== null ? Number(longitude) : null,
        publicPhone: cleanedPhone,
        showPhone,
        whatsappNumber: cleanedWa,
        dailyOpenTime: dailyOpenTime ? `${dailyOpenTime}:00` : null,
        dailyCloseTime: dailyCloseTime ? `${dailyCloseTime}:00` : null
      };

      const updated = await updateMyClientProfile(accessToken, payload);
      setProfile(updated);

      initialFormRef.current = {
        businessName: updated.businessName || '',
        clientType: updated.clientType || 'STORE',
        bio: updated.bio || '',
        address: updated.address || '',
        landmark: updated.landmark || '',
        latitude: updated.latitude || null,
        longitude: updated.longitude || null,
        publicPhone: updated.publicPhone || '',
        showPhone: Boolean(updated.showPhone),
        whatsappNumber: updated.whatsappNumber || '',
        dailyOpenTime: updated.dailyOpenTime ? updated.dailyOpenTime.slice(0, 5) : '09:00',
        dailyCloseTime: updated.dailyCloseTime ? updated.dailyCloseTime.slice(0, 5) : '21:00'
      };

      showToast('Business profile updated successfully!');
      if (onProfileUpdated) onProfileUpdated();
    } catch (err) {
      setServerError(err.message || 'Failed to save profile. Please check your inputs.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[3600] bg-black/70 backdrop-blur-xs flex items-center justify-center p-0 sm:p-4 overflow-y-auto overscroll-contain animate-in fade-in duration-160">
      <div className="bg-white dark:bg-[#10141c] w-full max-w-2xl min-h-screen sm:min-h-0 sm:rounded-[24px] shadow-2xl border border-slate-200 dark:border-[#303139] flex flex-col relative my-auto text-slate-900 dark:text-[#f4f5f7]">

        {/* --- Top Sticky Header --- */}
        <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#10141c]/95 backdrop-blur-md px-5 py-3.5 border-b border-slate-200 dark:border-[#303139] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#101522] text-slate-700 dark:text-[#f4f5f7] hover:border-[#ff951f]/50 flex items-center justify-center transition-all border border-slate-200 dark:border-[#303139] cursor-pointer active:scale-95"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>
            <div>
              <h2 className="text-base font-medium tracking-tight text-slate-900 dark:text-[#f4f5f7] leading-tight">
                Business Profile
              </h2>
              <p className="text-[11px] font-mono text-slate-500 dark:text-[#c9ced8]">Manage your client public identity</p>
            </div>
          </div>
        </div>

        {/* --- Loading Skeleton --- */}
        {loading && (
          <div className="p-8 flex flex-col items-center justify-center gap-3 text-slate-400 py-20">
            <Loader2 className="w-8 h-8 animate-spin text-city-blue" />
            <p className="text-xs font-semibold">Loading business details...</p>
          </div>
        )}

        {/* --- Form Body --- */}
        {!loading && (
          <form onSubmit={handleSubmit} className="flex-1 flex flex-col">
            <div className="p-5 space-y-6 pb-28">

              {serverError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{serverError}</span>
                </div>
              )}

              {/* --- Cover Banner Uploader --- */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  Cover Banner
                </label>
                <div className="relative w-full aspect-[3/1] rounded-2xl bg-gradient-to-r from-[#cfe7ff] via-[#dbeafe] to-[#eaf4ff] dark:from-slate-800 dark:to-slate-900 overflow-hidden border border-slate-200 dark:border-slate-700 group">
                  {coverUrl ? (
                    <img src={coverUrl} alt="Cover" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-1">
                      <Upload className="w-6 h-6 stroke-[1.5]" />
                      <span>Upload cover photo (max 5 MB)</span>
                    </div>
                  )}

                  {/* Change cover button overlay */}
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <button
                      type="button"
                      disabled={uploadingCover}
                      onClick={() => coverInputRef.current?.click()}
                      className="min-h-[44px] px-4 py-2 bg-white/90 text-slate-900 rounded-full font-bold text-xs shadow-lg backdrop-blur-md flex items-center gap-2 cursor-pointer active:scale-95 transition-all"
                    >
                      {uploadingCover ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-city-blue" />
                          <span>Uploading cover...</span>
                        </>
                      ) : (
                        <>
                          <Camera className="w-4 h-4" />
                          <span>{coverUrl ? 'Replace cover' : 'Upload cover'}</span>
                        </>
                      )}
                    </button>
                  </div>

                  <input
                    ref={coverInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleCoverFileChange}
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1">Recommended: 1200 x 400 px, JPG or PNG</p>
              </div>

              {/* --- Logo Avatar Uploader --- */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full bg-sky-100 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 overflow-hidden flex items-center justify-center flex-shrink-0 shadow-md">
                    {logoUrl ? (
                      <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-2xl font-black text-city-blue dark:text-sky-400">
                        {(businessName || 'C').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    disabled={uploadingLogo}
                    onClick={() => logoInputRef.current?.click()}
                    aria-label="Upload logo"
                    className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-city-blue text-white shadow-md flex items-center justify-center hover:bg-blue-600 active:scale-95 transition-all cursor-pointer"
                  >
                    {uploadingLogo ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Camera className="w-4 h-4" />
                    )}
                  </button>
                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleLogoFileChange}
                  />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200">Business Logo</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Square ratio (400 x 400 px), max 5 MB</p>
                </div>
              </div>

              {/* --- Business Name & Read-only Slug --- */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Business Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={120}
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Das & Sons Sweets"
                    className={`w-full min-h-[44px] px-3.5 text-xs rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-city-blue ${
                      errors.businessName ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                    }`}
                  />
                  {errors.businessName && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1">{errors.businessName}</p>
                  )}
                </div>

                {/* Slug (Read-only) */}
                {slug && (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Public Handle & URL
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 min-h-[44px] px-3.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-300">
                        <span className="truncate">mycite.in/c/{slug}</span>
                        {verified && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                            Verified
                          </span>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={handleCopySlug}
                        aria-label="Copy link"
                        className="w-11 h-11 min-w-[44px] min-h-[44px] rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-300 transition-colors cursor-pointer"
                      >
                        {slugCopied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Slug is permanent to preserve share links and search bookmarks.
                    </p>
                  </div>
                )}
              </div>

              {/* --- Client Type Selector --- */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2">
                  Client Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'STORE', label: 'Store', icon: Store, desc: 'Retail / Shop' },
                    { id: 'COMPANY', label: 'Company', icon: Building2, desc: 'Enterprise / Brand' },
                    { id: 'INDIVIDUAL', label: 'Individual', icon: UserIcon, desc: 'Freelancer / Pro' }
                  ].map((t) => {
                    const Icon = t.icon;
                    const selected = clientType === t.id;
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => setClientType(t.id)}
                        className={`min-h-[52px] p-2.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                          selected
                            ? 'border-city-blue bg-blue-50/50 dark:bg-blue-950/40 text-city-blue dark:text-sky-300 ring-1 ring-city-blue'
                            : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <Icon className="w-4 h-4" />
                          {selected && <Check className="w-3.5 h-3.5" />}
                        </div>
                        <div className="mt-1">
                          <p className="text-xs font-bold leading-none">{t.label}</p>
                          <p className="text-[9px] text-slate-400 mt-0.5 leading-tight">{t.desc}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* --- Bio (160 char limit) --- */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    Short Bio
                  </label>
                  <span className={`text-[10px] font-semibold ${bio.length > 150 ? 'text-amber-500' : 'text-slate-400'}`}>
                    {bio.length}/160
                  </span>
                </div>
                <textarea
                  rows={3}
                  maxLength={160}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Tell customers about your business, specialties, or history..."
                  className={`w-full text-xs p-3 rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-city-blue resize-none ${
                    errors.bio ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                  }`}
                />
                {errors.bio && <p className="text-[11px] text-rose-500 font-semibold mt-1">{errors.bio}</p>}
              </div>

              {/* --- Location Section & Interactive Map Picker --- */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-city-blue" />
                      <span>Location & Address</span>
                    </h3>
                    <p className="text-[11px] text-slate-400">Pin your store or venue on the city map</p>
                  </div>
                  <button
                    type="button"
                    disabled={locatingUser}
                    onClick={handleUseCurrentLocation}
                    className="min-h-[36px] px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <Navigation className="w-3.5 h-3.5 text-city-blue" />
                    <span>{locatingUser ? 'Locating...' : 'Use GPS'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Street Address
                    </label>
                    <input
                      type="text"
                      maxLength={500}
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. 14B College Street"
                      className="w-full min-h-[44px] px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-city-blue"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Landmark / Area
                    </label>
                    <input
                      type="text"
                      maxLength={255}
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Near Central Metro Gate 2"
                      className="w-full min-h-[44px] px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-city-blue"
                    />
                  </div>
                </div>

                {/* Map Pin Picker */}
                <div>
                  <LocationPickerMap
                    lat={latitude}
                    lng={longitude}
                    onSelectLocation={(lat, lng) => {
                      setLatitude(lat);
                      setLongitude(lng);
                    }}
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 px-1">
                    <span>
                      Coordinates: {latitude ? `${latitude.toFixed(4)}, ${longitude?.toFixed(4)}` : 'Tap map to place pin'}
                    </span>
                    {latitude && (
                      <button
                        type="button"
                        onClick={() => {
                          setLatitude(null);
                          setLongitude(null);
                        }}
                        className="text-rose-500 hover:underline cursor-pointer"
                      >
                        Clear pin
                      </button>
                    )}
                  </div>
                  {errors.location && (
                    <p className="text-[11px] text-rose-500 font-semibold mt-1">{errors.location}</p>
                  )}
                </div>
              </div>

              {/* --- Contact Details & Phone Visibility Toggle --- */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-city-blue" />
                  <span>Contact Information</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Public Calling Phone
                    </label>
                    <input
                      type="tel"
                      value={publicPhone}
                      onChange={(e) => setPublicPhone(e.target.value)}
                      placeholder="e.g. 9830123456"
                      className={`w-full min-h-[44px] px-3 text-xs rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-city-blue ${
                        errors.publicPhone ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                    {errors.publicPhone && (
                      <p className="text-[11px] text-rose-500 font-semibold mt-1">{errors.publicPhone}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      WhatsApp Number (Optional)
                    </label>
                    <input
                      type="tel"
                      value={whatsappNumber}
                      onChange={(e) => setWhatsappNumber(e.target.value)}
                      placeholder="e.g. 9830123456"
                      className={`w-full min-h-[44px] px-3 text-xs rounded-xl border bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-city-blue ${
                        errors.whatsappNumber ? 'border-rose-500' : 'border-slate-200 dark:border-slate-700'
                      }`}
                    />
                    {errors.whatsappNumber && (
                      <p className="text-[11px] text-rose-500 font-semibold mt-1">{errors.whatsappNumber}</p>
                    )}
                  </div>
                </div>

                {/* Privacy Toggle: Show phone number on public profile */}
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-start justify-between gap-3">
                  <div className="flex-1 pr-2">
                    <p className="text-xs font-bold text-slate-900 dark:text-slate-100">
                      Show phone number on public profile
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">
                      {showPhone
                        ? 'Your phone number is visible to public visitors with a direct "Call" button.'
                        : 'When off, visitors cannot see or call your phone number directly.'}
                    </p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer flex-shrink-0 mt-0.5">
                    <input
                      type="checkbox"
                      checked={showPhone}
                      onChange={(e) => setShowPhone(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-slate-600 peer-checked:bg-city-blue"></div>
                  </label>
                </div>
              </div>

              {/* --- Operating Hours --- */}
              <div className="space-y-3 pt-2 border-t border-slate-100 dark:border-slate-800">
                <h3 className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-city-blue" />
                  <span>Daily Operating Hours</span>
                </h3>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Opening Time
                    </label>
                    <input
                      type="time"
                      value={dailyOpenTime}
                      onChange={(e) => setDailyOpenTime(e.target.value)}
                      className="w-full min-h-[44px] px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-city-blue"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">
                      Closing Time
                    </label>
                    <input
                      type="time"
                      value={dailyCloseTime}
                      onChange={(e) => setDailyCloseTime(e.target.value)}
                      className="w-full min-h-[44px] px-3 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-city-blue"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* --- Sticky Bottom Action Bar --- */}
            <div className="sticky bottom-0 z-30 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-5 py-3.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
              <span className="text-[11px] text-slate-400 font-medium">
                {isDirty ? 'Unsaved changes' : 'All changes saved'}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-4 py-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={!isDirty || saving}
                  className="min-h-[44px] px-6 py-2.5 rounded-full bg-city-blue hover:bg-blue-600 active:scale-95 text-white font-bold text-xs shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 cursor-pointer"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}

        {/* --- Floating Toast --- */}
        {toastMessage && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[4200] max-w-sm w-[90%] bg-slate-900/95 dark:bg-white/95 text-white dark:text-slate-900 px-4 py-3 rounded-2xl shadow-2xl backdrop-blur-md text-xs font-bold flex items-center justify-center gap-2 animate-in slide-in-from-bottom-4 duration-200">
            <Check className="w-4 h-4 text-emerald-400 dark:text-emerald-600 flex-shrink-0" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>
    </div>
  );
}
