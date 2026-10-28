import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  createSubmission,
  updateSubmission,
  uploadSubmissionImages,
  CATEGORIES
} from '../services/api';
import LocationPickerMap from './LocationPickerMap';
import {
  X, ChevronRight, ChevronLeft, Sparkles, MapPin, Compass,
  Calendar, Phone, Tag, Image as ImageIcon, Trash2,
  Upload, AlertCircle
} from 'lucide-react';

const DRAFT_STORAGE_KEY = 'myciti_ad_draft';

const STEPS = [
  { id: 1, title: 'Basics', subtitle: 'Category & Details' },
  { id: 2, title: 'Contact', subtitle: 'Phone Number' },
  { id: 3, title: 'Location', subtitle: 'Venue & Map Pin' },
  { id: 4, title: 'Timings', subtitle: 'Dates & Schedule' },
  { id: 5, title: 'Photos', subtitle: 'Upload Images' },
  { id: 6, title: 'Review', subtitle: 'Confirm & Submit' },
];

function getLocalDateString(offsetDays = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function PostAdvertisementModal({
  isOpen,
  onClose,
  editingSubmission = null,
  onSuccess
}) {
  const { user, accessToken, canPost } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [isLocating, setIsLocating] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [createdSubmissionId, setCreatedSubmissionId] = useState(null);

  // Form State
  const [category, setCategory] = useState('PANDAL');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [venueName, setVenueName] = useState('');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [city, setCity] = useState('Bhubaneswar');
  const [latitude, setLatitude] = useState(20.2961);
  const [longitude, setLongitude] = useState(85.8245);
  const [startDate, setStartDate] = useState(() => getLocalDateString(1));
  const [endDate, setEndDate] = useState(() => getLocalDateString(10));
  const [dailyOpenTime, setDailyOpenTime] = useState('08:00');
  const [dailyCloseTime, setDailyCloseTime] = useState('23:00');
  const [offerText, setOfferText] = useState('');

  // Photos State
  const [existingImages, setExistingImages] = useState([]);
  const [newFiles, setNewFiles] = useState([]); // Array of File objects
  const [filePreviews, setFilePreviews] = useState([]); // Array of { file, previewUrl }
  const fileInputRef = useRef(null);

  // Field validation errors
  const [errors, setErrors] = useState({});

  // Initialize or restore draft
  useEffect(() => {
    if (!isOpen) return;

    if (editingSubmission) {
      // Load existing submission data
      setCategory(editingSubmission.category || 'PANDAL');
      setTitle(editingSubmission.title || '');
      setDescription(editingSubmission.description || '');
      setContactPhone(editingSubmission.contactPhone || user?.phone || '');
      setVenueName(editingSubmission.venueName || '');
      setAddress(editingSubmission.address || '');
      setLandmark(editingSubmission.landmark || '');
      setCity(editingSubmission.city || 'Bhubaneswar');
      setLatitude(editingSubmission.latitude || 20.2961);
      setLongitude(editingSubmission.longitude || 85.8245);
      setStartDate(editingSubmission.startDate || '');
      setEndDate(editingSubmission.endDate || '');
      setDailyOpenTime(editingSubmission.dailyOpenTime ? editingSubmission.dailyOpenTime.substring(0, 5) : '08:00');
      setDailyCloseTime(editingSubmission.dailyCloseTime ? editingSubmission.dailyCloseTime.substring(0, 5) : '23:00');
      setOfferText(editingSubmission.offerText || '');
      setExistingImages(editingSubmission.images || []);
      setNewFiles([]);
      setFilePreviews([]);
      setCurrentStep(1);
      setIsSubmittedSuccess(false);
      return;
    }

    // Try restoring draft from localStorage
    try {
      const saved = localStorage.getItem(DRAFT_STORAGE_KEY);
      if (saved) {
        const draft = JSON.parse(saved);
        setCategory(draft.category || 'PANDAL');
        setTitle(draft.title || '');
        setDescription(draft.description || '');
        setContactPhone(draft.contactPhone || user?.phone || '');
        setVenueName(draft.venueName || '');
        setAddress(draft.address || '');
        setLandmark(draft.landmark || '');
        setCity(draft.city || 'Bhubaneswar');
        setLatitude(draft.latitude || 20.2961);
        setLongitude(draft.longitude || 85.8245);
        setStartDate(draft.startDate || '');
        setEndDate(draft.endDate || '');
        setDailyOpenTime(draft.dailyOpenTime || '08:00');
        setDailyCloseTime(draft.dailyCloseTime || '23:00');
        setOfferText(draft.offerText || '');
      } else if (user?.phone) {
        setContactPhone(user.phone);
      }
    } catch (e) {
      console.warn('Failed to parse draft', e);
    }
    setCurrentStep(1);
    setIsSubmittedSuccess(false);
    setCreatedSubmissionId(null);
  }, [isOpen, editingSubmission, user]);

  // Auto-save local draft
  useEffect(() => {
    if (!isOpen || editingSubmission) return;

    const draft = {
      category,
      title,
      description,
      contactPhone,
      venueName,
      address,
      landmark,
      city,
      latitude,
      longitude,
      startDate,
      endDate,
      dailyOpenTime,
      dailyCloseTime,
      offerText,
    };
    try {
      localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draft));
    } catch {
      // Ignore quota exceeded
    }
  }, [isOpen, editingSubmission, category, title, description, contactPhone, venueName, address, landmark, city, latitude, longitude, startDate, endDate, dailyOpenTime, dailyCloseTime, offerText]);

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => {
      filePreviews.forEach(p => URL.revokeObjectURL(p.previewUrl));
    };
  }, [filePreviews]);

  if (!isOpen) return null;

  // Validation per step
  const validateStep = (step) => {
    const newErrors = {};

    if (step === 1) {
      if (!title.trim()) newErrors.title = 'Title is required';
      else if (title.trim().length > 255) newErrors.title = 'Title cannot exceed 255 characters';

      if (!description.trim()) newErrors.description = 'Description is required';
    }

    if (step === 2) {
      const cleanPhone = contactPhone.trim().replace(/^(\+91|\+91-|\+91\s)/, '');
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!cleanPhone) {
        newErrors.contactPhone = 'Contact phone number is required';
      } else if (!phoneRegex.test(cleanPhone)) {
        newErrors.contactPhone = 'Enter a valid 10-digit Indian mobile number (e.g. 9830123456)';
      }
    }

    if (step === 3) {
      if (!venueName.trim()) newErrors.venueName = 'Venue name is required';
      if (!address.trim()) newErrors.address = 'Address is required';
      if (!landmark.trim()) newErrors.landmark = 'Landmark is required';
      if (!city.trim()) newErrors.city = 'City is required';
      if (!latitude || !longitude) newErrors.location = 'Please place a pin on the map';
    }

    if (step === 4) {
      if (!startDate) newErrors.startDate = 'Start date is required';
      if (!endDate) newErrors.endDate = 'End date is required';
      if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
        newErrors.endDate = 'End date cannot be earlier than start date';
      }
      if (!dailyOpenTime) newErrors.dailyOpenTime = 'Open time is required';
      if (!dailyCloseTime) newErrors.dailyCloseTime = 'Close time is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, 6));
    }
  };

  const handleBack = () => {
    setErrors({});
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  // Location Geolocation helper
  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(pos.coords.latitude);
        setLongitude(pos.coords.longitude);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation denied or failed, using Bhubaneswar default', err);
        setLatitude(20.2961);
        setLongitude(85.8245);
        setIsLocating(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // File Handlers
  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const totalAllowed = 5 - (existingImages.length + newFiles.length);
    if (totalAllowed <= 0) {
      alert('Maximum 5 photos allowed per advertisement.');
      return;
    }

    const validFiles = [];
    const validPreviews = [];

    for (const file of files.slice(0, totalAllowed)) {
      if (file.size > 5 * 1024 * 1024) {
        alert(`"${file.name}" exceeds the 5 MB limit and will be skipped.`);
        continue;
      }
      const type = file.type.toLowerCase();
      if (!type.includes('jpeg') && !type.includes('jpg') && !type.includes('png') && !type.includes('webp')) {
        alert(`"${file.name}" is not a supported format (JPG, PNG, WEBP).`);
        continue;
      }

      validFiles.push(file);
      validPreviews.push({
        file,
        previewUrl: URL.createObjectURL(file)
      });
    }

    setNewFiles(prev => [...prev, ...validFiles]);
    setFilePreviews(prev => [...prev, ...validPreviews]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveNewPhoto = (index) => {
    const target = filePreviews[index];
    if (target) URL.revokeObjectURL(target.previewUrl);

    setNewFiles(prev => prev.filter((_, i) => i !== index));
    setFilePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveExistingPhoto = (index) => {
    setExistingImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleMoveNewPhoto = (index, direction) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= newFiles.length) return;

    const reorderedFiles = [...newFiles];
    const tempFile = reorderedFiles[index];
    reorderedFiles[index] = reorderedFiles[targetIdx];
    reorderedFiles[targetIdx] = tempFile;

    const reorderedPreviews = [...filePreviews];
    const tempPrev = reorderedPreviews[index];
    reorderedPreviews[index] = reorderedPreviews[targetIdx];
    reorderedPreviews[targetIdx] = tempPrev;

    setNewFiles(reorderedFiles);
    setFilePreviews(reorderedPreviews);
  };

  // Final Submission
  const handleSubmit = async () => {
    setSubmitError('');

    if (!canPost) {
      setSubmitError('Only registered Client accounts and Admins can post advertisements. Please complete your business profile.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        category,
        title: title.trim(),
        description: description.trim(),
        venueName: venueName.trim(),
        address: address.trim(),
        landmark: landmark.trim(),
        city: (city && city.trim()) ? city.trim() : 'Kolkata',
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        startDate,
        endDate,
        dailyOpenTime: dailyOpenTime.length === 5 ? `${dailyOpenTime}:00` : dailyOpenTime,
        dailyCloseTime: dailyCloseTime.length === 5 ? `${dailyCloseTime}:00` : dailyCloseTime,
        offerText: (category === 'OFFER' || category === 'INAUGURATION') ? offerText.trim() : null,
        contactPhone: contactPhone.trim(),
      };

      let result;
      const targetId = editingSubmission ? editingSubmission.id : createdSubmissionId;
      if (targetId) {
        result = await updateSubmission(accessToken, targetId, payload);
      } else {
        result = await createSubmission(accessToken, payload);
        if (result?.id) {
          setCreatedSubmissionId(result.id);
        }
      }

      // Upload newly attached photos
      const submissionId = targetId || result?.id;
      if (newFiles.length > 0 && submissionId) {
        await uploadSubmissionImages(accessToken, submissionId, newFiles);
      }

      // Clear draft on successful submit
      if (!editingSubmission) {
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      }

      setIsSubmittedSuccess(true);
      setCreatedSubmissionId(null);
      if (onSuccess) onSuccess(result);
    } catch (err) {
      console.error('Submission error:', err);
      setSubmitError(err.message || 'Failed to submit advertisement. Please check your inputs.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedCategoryConfig = CATEGORIES[category] || CATEGORIES.PANDAL;

  return (
    <div className="fixed inset-0 z-[3200] bg-black/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white dark:bg-[#10141c] p-4 sm:p-6 rounded-[24px] max-w-2xl w-full shadow-2xl border border-slate-200 dark:border-[#303139] flex flex-col max-h-[94dvh] animate-in zoom-in-95 duration-160 text-slate-900 dark:text-[#f4f5f7]">
        
        {/* Header & Close */}
        <div className="flex items-center justify-between pb-3.5 border-b border-slate-200 dark:border-[#303139]">
          <div>
            <h2 className="text-base sm:text-lg font-medium tracking-tight text-slate-900 dark:text-[#f4f5f7]">
              {editingSubmission ? `Edit Advertisement #${editingSubmission.id}` : 'Post an Advertisement'}
            </h2>
            <p className="text-xs font-mono text-slate-500 dark:text-[#c9ced8]">
              Step {currentStep} of 6 &bull; {STEPS[currentStep - 1].title} ({STEPS[currentStep - 1].subtitle})
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#101522] text-slate-700 dark:text-[#f4f5f7] hover:border-[#ff951f]/50 flex items-center justify-center transition-all border border-slate-200 dark:border-[#303139] cursor-pointer active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Stepper Progress Bar */}
        <div className="w-full bg-slate-100 dark:bg-[#101522] border border-slate-200 dark:border-[#303139] h-2 rounded-full overflow-hidden my-3">
          <div
            className="bg-[#ff951f] h-full transition-all duration-300 rounded-full"
            style={{ width: `${(currentStep / 6) * 100}%` }}
          />
        </div>

        {/* Success Screen */}
        {isSubmittedSuccess ? (
          <div className="py-12 px-4 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-300 rounded-full flex items-center justify-center mx-auto text-3xl shadow-soft animate-in zoom-in-75">
              🎉
            </div>
            <h3 className="text-xl font-black text-slate-900 dark:text-slate-100">
              {editingSubmission ? 'Revision Submitted for Approval!' : 'Submitted for Owner Review!'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto leading-relaxed">
              Your advertisement has been securely submitted with status <strong className="text-amber-600">Pending Review</strong>. Once approved by the administrator, it will appear on the live map and festival feed.
            </p>
            <div className="pt-3">
              <button
                onClick={onClose}
                className="min-h-[38px] px-6 py-2 rounded-full bg-[#ff951f] hover:bg-[#e07f12] text-black font-bold text-xs shadow-md transition-transform active:scale-95 cursor-pointer"
              >
                Back to My Advertisements
              </button>
            </div>
          </div>
        ) : (
          /* Step Contents */
          <div className="flex-1 overflow-y-auto pr-1 py-1 space-y-4">

            {/* Error Banner */}
            {submitError && (
              <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-700 dark:text-rose-300 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* STEP 1: BASICS */}
            {currentStep === 1 && (
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-800 dark:text-[#f4f5f7] mb-2">
                    Select Advertisement Category *
                  </label>
                  <div className="grid grid-cols-2 gap-2.5">
                    {Object.entries(CATEGORIES).map(([catKey, cat]) => {
                      const isSelected = category === catKey;
                      return (
                        <button
                          key={catKey}
                          type="button"
                          onClick={() => setCategory(catKey)}
                          className={`p-3.5 rounded-xl text-left border transition-all flex items-start gap-3 cursor-pointer ${
                            isSelected
                              ? 'bg-slate-100 dark:bg-[#101522] border-[#ff951f] ring-2 ring-[#ff951f]/25 text-[#ff951f] shadow-xs'
                              : 'bg-white dark:bg-[#10141c] border-slate-200 dark:border-[#303139] text-slate-700 dark:text-[#c9ced8] hover:border-[#ff951f]/40'
                          }`}
                        >
                          <span className="text-2xl">{cat.icon}</span>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-[#f4f5f7]">
                              {cat.label}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400 line-clamp-1">
                              {cat.description}
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-800 dark:text-[#f4f5f7] mb-1">
                    Advertisement Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Ballygunge Cultural Durga Puja 2026"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 dark:bg-[#07090e] border-slate-200 dark:border-[#303139] text-slate-900 dark:text-[#f4f5f7] focus:outline-none focus:border-[#ff951f] focus:ring-1 focus:ring-[#ff951f] transition-all ${
                      errors.title ? 'border-rose-400 ring-2 ring-rose-200' : 'border-white/80 dark:border-slate-700'
                    }`}
                  />
                  {errors.title && <p className="text-[11px] text-rose-500 font-bold mt-1">{errors.title}</p>}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-800 dark:text-[#f4f5f7] mb-1">
                    Description *
                  </label>
                  <textarea
                    rows={4}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Provide highlights, theme details, artisan names, special attractions, or mela offerings..."
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 dark:bg-[#07090e] border-slate-200 dark:border-[#303139] text-slate-900 dark:text-[#f4f5f7] focus:outline-none focus:border-[#ff951f] focus:ring-1 focus:ring-[#ff951f] transition-all ${
                      errors.description ? 'border-rose-400 ring-2 ring-rose-200' : 'border-white/80 dark:border-slate-700'
                    }`}
                  />
                  {errors.description && <p className="text-[11px] text-rose-500 font-bold mt-1">{errors.description}</p>}
                </div>
              </div>
            )}

            {/* STEP 2: CONTACT */}
            {currentStep === 2 && (
              <div className="space-y-4">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#101522] border border-slate-200 dark:border-[#303139] text-xs text-slate-700 dark:text-[#c9ced8] space-y-1">
                  <div className="font-extrabold flex items-center gap-1.5 text-[#ff951f]">
                    <Phone className="w-4 h-4" />
                    <span>Public Contact Number</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    This phone number will be displayed on the advertisement's card and bottom sheet so visitors and customers can contact you directly.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-800 dark:text-[#f4f5f7] mb-1">
                    Contact Phone Number (10 digits) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      +91
                    </span>
                    <input
                      type="tel"
                      value={contactPhone}
                      onChange={(e) => setContactPhone(e.target.value)}
                      placeholder="9830123456"
                      className={`w-full pl-12 pr-4 py-2.5 rounded-xl border text-sm bg-slate-50 dark:bg-[#07090e] border-slate-200 dark:border-[#303139] text-slate-900 dark:text-[#f4f5f7] focus:outline-none focus:border-[#ff951f] focus:ring-1 focus:ring-[#ff951f] transition-all ${
                        errors.contactPhone ? 'border-rose-400 ring-2 ring-rose-200' : 'border-white/80 dark:border-slate-700'
                      }`}
                    />
                  </div>
                  {errors.contactPhone && <p className="text-[11px] text-rose-500 font-bold mt-1">{errors.contactPhone}</p>}
                </div>
              </div>
            )}

            {/* STEP 3: VENUE & LOCATION */}
            {currentStep === 3 && (
              <div className="space-y-3.5">
                <div>
                  <label className="block text-xs font-medium text-slate-800 dark:text-[#f4f5f7] mb-1">
                    Venue or Compound Name *
                  </label>
                  <input
                    type="text"
                    value={venueName}
                    onChange={(e) => setVenueName(e.target.value)}
                    placeholder="e.g. Maddox Square Ground, City Centre 1"
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 dark:bg-[#07090e] border-slate-200 dark:border-[#303139] text-slate-900 dark:text-[#f4f5f7] focus:outline-none focus:border-[#ff951f] focus:ring-1 focus:ring-[#ff951f] transition-all ${
                      errors.venueName ? 'border-rose-400 ring-2 ring-rose-200' : 'border-white/80 dark:border-slate-700'
                    }`}
                  />
                  {errors.venueName && <p className="text-[11px] text-rose-500 font-bold mt-1">{errors.venueName}</p>}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-800 dark:text-[#f4f5f7] mb-1">
                      City *
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder="e.g. Bhubaneswar, Cuttack, Balasore"
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 dark:bg-[#07090e] border-slate-200 dark:border-[#303139] text-slate-900 dark:text-[#f4f5f7] focus:outline-none focus:border-[#ff951f] focus:ring-1 focus:ring-[#ff951f] transition-all ${
                        errors.city ? 'border-rose-400 ring-2 ring-rose-200' : 'border-white/80 dark:border-slate-700'
                      }`}
                    />
                    {errors.city && <p className="text-[11px] text-rose-500 font-bold mt-1">{errors.city}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-800 dark:text-[#f4f5f7] mb-1">
                      Landmark *
                    </label>
                    <input
                      type="text"
                      value={landmark}
                      onChange={(e) => setLandmark(e.target.value)}
                      placeholder="e.g. Near Hazra Road Crossing"
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 dark:bg-[#07090e] border-slate-200 dark:border-[#303139] text-slate-900 dark:text-[#f4f5f7] focus:outline-none focus:border-[#ff951f] focus:ring-1 focus:ring-[#ff951f] transition-all ${
                        errors.landmark ? 'border-rose-400 ring-2 ring-rose-200' : 'border-white/80 dark:border-slate-700'
                      }`}
                    />
                    {errors.landmark && <p className="text-[11px] text-rose-500 font-bold mt-1">{errors.landmark}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-800 dark:text-[#f4f5f7] mb-1">
                      Street Address *
                    </label>
                    <input
                      type="text"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="e.g. 15 Ritchie Rd, Ballygunge"
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 dark:bg-[#07090e] border-slate-200 dark:border-[#303139] text-slate-900 dark:text-[#f4f5f7] focus:outline-none focus:border-[#ff951f] focus:ring-1 focus:ring-[#ff951f] transition-all ${
                        errors.address ? 'border-rose-400 ring-2 ring-rose-200' : 'border-white/80 dark:border-slate-700'
                      }`}
                    />
                    {errors.address && <p className="text-[11px] text-rose-500 font-bold mt-1">{errors.address}</p>}
                  </div>
                </div>

                {/* Map Picker with Pin */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-medium text-slate-800 dark:text-[#f4f5f7] flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-city-blue" />
                      <span>Place Map Pin *</span>
                    </label>
                    <button
                      type="button"
                      onClick={handleUseMyLocation}
                      disabled={isLocating}
                      className="text-xs font-bold text-city-blue hover:underline flex items-center gap-1 min-h-[36px]"
                    >
                      <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin' : ''}`} />
                      <span>Use my current location</span>
                    </button>
                  </div>

                  <LocationPickerMap
                    lat={latitude}
                    lng={longitude}
                    onSelectLocation={(lat, lng) => {
                      setLatitude(lat);
                      setLongitude(lng);
                    }}
                  />
                  <div className="text-[11px] text-slate-400 text-right">
                    Lat: {latitude.toFixed(4)}, Lng: {longitude.toFixed(4)}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 4: TIMINGS & DATES */}
            {currentStep === 4 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-800 dark:text-[#f4f5f7] mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 dark:bg-[#07090e] border-slate-200 dark:border-[#303139] text-slate-900 dark:text-[#f4f5f7] focus:outline-none focus:border-[#ff951f] focus:ring-1 focus:ring-[#ff951f] transition-all ${
                        errors.startDate ? 'border-rose-400 ring-2 ring-rose-200' : 'border-white/80 dark:border-slate-700'
                      }`}
                    />
                    {errors.startDate && <p className="text-[11px] text-rose-500 font-bold mt-1">{errors.startDate}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-800 dark:text-[#f4f5f7] mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 dark:bg-[#07090e] border-slate-200 dark:border-[#303139] text-slate-900 dark:text-[#f4f5f7] focus:outline-none focus:border-[#ff951f] focus:ring-1 focus:ring-[#ff951f] transition-all ${
                        errors.endDate ? 'border-rose-400 ring-2 ring-rose-200' : 'border-white/80 dark:border-slate-700'
                      }`}
                    />
                    {errors.endDate && <p className="text-[11px] text-rose-500 font-bold mt-1">{errors.endDate}</p>}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-800 dark:text-[#f4f5f7] mb-1">
                      Daily Open Time *
                    </label>
                    <input
                      type="time"
                      value={dailyOpenTime}
                      onChange={(e) => setDailyOpenTime(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 dark:bg-[#07090e] border-slate-200 dark:border-[#303139] text-slate-900 dark:text-[#f4f5f7] focus:outline-none focus:border-[#ff951f] focus:ring-1 focus:ring-[#ff951f] transition-all ${
                        errors.dailyOpenTime ? 'border-rose-400 ring-2 ring-rose-200' : 'border-white/80 dark:border-slate-700'
                      }`}
                    />
                    {errors.dailyOpenTime && <p className="text-[11px] text-rose-500 font-bold mt-1">{errors.dailyOpenTime}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-800 dark:text-[#f4f5f7] mb-1">
                      Daily Close Time *
                    </label>
                    <input
                      type="time"
                      value={dailyCloseTime}
                      onChange={(e) => setDailyCloseTime(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm bg-slate-50 dark:bg-[#07090e] border-slate-200 dark:border-[#303139] text-slate-900 dark:text-[#f4f5f7] focus:outline-none focus:border-[#ff951f] focus:ring-1 focus:ring-[#ff951f] transition-all ${
                        errors.dailyCloseTime ? 'border-rose-400 ring-2 ring-rose-200' : 'border-white/80 dark:border-slate-700'
                      }`}
                    />
                    {errors.dailyCloseTime && <p className="text-[11px] text-rose-500 font-bold mt-1">{errors.dailyCloseTime}</p>}
                  </div>
                </div>

                {/* Offer Text (Only for OFFER and INAUGURATION) */}
                {(category === 'OFFER' || category === 'INAUGURATION') && (
                  <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900 space-y-1.5 animate-in fade-in">
                    <label className="block text-xs font-extrabold text-emerald-800 dark:text-emerald-300">
                      Promotional Offer Text (Displayed prominently)
                    </label>
                    <input
                      type="text"
                      value={offerText}
                      onChange={(e) => setOfferText(e.target.value)}
                      placeholder="e.g. 30% OFF festive thali with code FESTIVE30"
                      className="w-full px-4 py-2.5 rounded-2xl border border-emerald-200 dark:border-emerald-800 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                )}
              </div>
            )}

            {/* STEP 5: PHOTOS */}
            {currentStep === 5 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-medium text-slate-800 dark:text-[#f4f5f7]">
                      Photos ({existingImages.length + newFiles.length} of 5)
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Upload up to 5 photos (JPG, PNG, WEBP, max 5 MB each). Photos are auto-compressed and EXIF stripped.
                    </p>
                  </div>

                  {existingImages.length + newFiles.length < 5 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="min-h-[38px] px-4 py-1.5 rounded-full bg-[#ff951f] hover:bg-[#e07f12] text-black font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                    >
                      <Upload className="w-4 h-4" />
                      <span>Add Photos</span>
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                {/* Previews Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                  {/* Existing Images */}
                  {existingImages.map((img, idx) => (
                    <div
                      key={`existing-${img.id || idx}`}
                      className="relative rounded-2xl overflow-hidden aspect-square border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 group shadow-soft"
                    >
                      <img src={img.url} alt="Uploaded" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemoveExistingPhoto(idx)}
                        aria-label="Remove photo"
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <span className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        Saved #{idx + 1}
                      </span>
                    </div>
                  ))}

                  {/* New Files */}
                  {filePreviews.map((preview, idx) => (
                    <div
                      key={`new-${idx}`}
                      className="relative rounded-2xl overflow-hidden aspect-square border-2 border-city-blue/60 bg-slate-100 dark:bg-slate-800 shadow-soft group"
                    >
                      <img src={preview.previewUrl} alt="New upload" className="w-full h-full object-cover" />
                      
                      {/* Delete */}
                      <button
                        type="button"
                        onClick={() => handleRemoveNewPhoto(idx)}
                        aria-label="Remove photo"
                        className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-rose-600 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Reorder Arrows */}
                      <div className="absolute bottom-2 inset-x-2 flex items-center justify-between">
                        <span className="bg-city-blue text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm">
                          New #{existingImages.length + idx + 1}
                        </span>
                        <div className="flex gap-1">
                          {idx > 0 && (
                            <button
                              type="button"
                              onClick={() => handleMoveNewPhoto(idx, -1)}
                              aria-label="Move left"
                              className="w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs"
                            >
                              &larr;
                            </button>
                          )}
                          {idx < filePreviews.length - 1 && (
                            <button
                              type="button"
                              onClick={() => handleMoveNewPhoto(idx, 1)}
                              aria-label="Move right"
                              className="w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center text-xs"
                            >
                              &rarr;
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {/* Empty Slot Placeholder */}
                  {existingImages.length + newFiles.length === 0 && (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="col-span-2 sm:col-span-3 border-2 border-dashed border-slate-300 dark:border-[#303139] rounded-2xl p-8 text-center cursor-pointer hover:border-[#ff951f] transition-colors flex flex-col items-center justify-center gap-2 bg-slate-50 dark:bg-[#07090e]"
                    >
                      <div className="w-12 h-12 rounded-full bg-sky-base dark:bg-slate-800 flex items-center justify-center text-city-blue">
                        <ImageIcon className="w-6 h-6" />
                      </div>
                      <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                        Tap here to select photos from your device
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Supports camera capture, gallery selection (up to 5 photos)
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STEP 6: LIVE PREVIEW & CONFIRM */}
            {currentStep === 6 && (
              <div className="space-y-4">
                <div className="p-3 rounded-2xl bg-sky-50/80 dark:bg-slate-800/80 border border-sky-200/60 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300">
                  ✨ <strong>Live Preview</strong>: Here is how your advertisement will appear to visitors on the map and bottom sheet once approved.
                </div>

                {/* Bottom Sheet Card Preview */}
                <div className="bg-slate-50/60 dark:bg-[#101522] rounded-[20px] p-5 shadow-xs border border-slate-200 dark:border-[#303139] space-y-3.5">
                  {/* Photo Banner */}
                  <div className="h-44 rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 relative">
                    {filePreviews.length > 0 ? (
                      <img src={filePreviews[0].previewUrl} alt={title} className="w-full h-full object-cover" />
                    ) : existingImages.length > 0 ? (
                      <img src={existingImages[0].url} alt={title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-4xl">
                        <span>{selectedCategoryConfig.icon}</span>
                        <span className="text-[11px] font-bold text-slate-400 mt-2 uppercase">{selectedCategoryConfig.label}</span>
                      </div>
                    )}
                    <span className="absolute top-3 left-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-extrabold shadow-sm flex items-center gap-1.5">
                      <span>{selectedCategoryConfig.icon}</span>
                      <span>{selectedCategoryConfig.label}</span>
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-slate-100">
                      {title || 'Untitled Advertisement'}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-city-blue" />
                      <span>{venueName ? `${venueName}, ` : ''}{landmark}, {address}</span>
                    </div>
                  </div>

                  {offerText && (
                    <div className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" />
                      <span>{offerText}</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap leading-relaxed line-clamp-3">
                    {description || 'No description provided'}
                  </p>

                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 flex-wrap gap-2">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {startDate} to {endDate}
                    </span>
                    <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                      <Phone className="w-3.5 h-3.5 text-city-blue" />
                      +91 {contactPhone}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer Navigation Buttons */}
        {!isSubmittedSuccess && (
          <div className="pt-3 border-t border-slate-200 dark:border-[#303139] flex items-center justify-between gap-3">
            {currentStep > 1 ? (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="min-h-[38px] px-4 py-1.5 rounded-xl bg-slate-100 dark:bg-[#101522] text-slate-700 dark:text-[#f4f5f7] border border-slate-200 dark:border-[#303139] hover:border-[#ff951f]/50 font-mono font-medium text-xs flex items-center gap-1 cursor-pointer transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Back</span>
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              {currentStep < 6 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="min-h-[38px] px-6 py-2 rounded-full bg-[#ff951f] hover:bg-[#e07f12] text-black font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  <span>Continue</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="min-h-[38px] px-6 py-2 rounded-full bg-[#ff951f] hover:bg-[#e07f12] active:scale-95 text-black font-bold text-xs flex items-center gap-2 shadow-sm transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Submit for Approval</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
