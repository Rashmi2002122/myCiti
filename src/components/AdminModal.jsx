import React, { useState, useEffect } from 'react';
import {
  X, Plus, Edit2, Trash2, Upload, MapPin, Eye, LogOut, Check,
  AlertCircle, Sparkles, Image as ImageIcon
} from 'lucide-react';
import {
  fetchAdminListings,
  createAdminListing,
  updateAdminListing,
  deleteAdminListing,
  uploadListingImage,
  CATEGORIES
} from '../services/api';
import LocationPickerMap from './LocationPickerMap';
import AdminReviewQueue from './AdminReviewQueue';
import AdminAdsManager from './AdminAdsManager';
import AdminClientRequestsQueue from './AdminClientRequestsQueue';
import AdminUsersManager from './AdminUsersManager';
import { useAuth } from '../context/AuthContext';

export default function AdminModal({ isOpen, onClose, onListingChanged, onOpenCreateAnnouncement, initialSection = 'QUEUE' }) {
  const { user, accessToken, isAdmin, handleLogout: authLogout } = useAuth();
  const token = (isAdmin && accessToken) ? accessToken : null;
  const [adminSection, setAdminSection] = useState(initialSection || 'QUEUE'); // 'QUEUE' | 'CLIENT_REQUESTS' | 'USERS' | 'LISTINGS' | 'MARKETING'

  useEffect(() => {
    if (initialSection) {
      setAdminSection(initialSection);
    }
  }, [initialSection]);

  // Listing management state
  const [listings, setListings] = useState([]);
  const [isLoadingListings, setIsLoadingListings] = useState(false);
  const [editingListing, setEditingListing] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formError, setFormError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Image upload state
  const [uploadListingId, setUploadListingId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  // Form inputs
  const [formData, setFormData] = useState({
    title: '',
    category: 'PANDAL',
    description: '',
    address: '',
    landmark: '',
    latitude: 22.5726,
    longitude: 88.3639,
    startDate: '2026-10-06',
    endDate: '2026-10-25',
    dailyOpenTime: '08:00',
    dailyCloseTime: '02:00',
    offerText: '',
    contactPhone: '',
    status: 'PUBLISHED',
  });

  // Load admin listings on auth
  const loadAdminListings = async (jwt) => {
    try {
      setIsLoadingListings(true);
      const data = await fetchAdminListings(jwt);
      setListings(data);
    } catch (err) {
      console.error('Failed to load admin listings:', err);
    } finally {
      setIsLoadingListings(false);
    }
  };

  useEffect(() => {
    if (token && isOpen) {
      loadAdminListings(token);
    }
  }, [token, isOpen]);

  const handleLogout = () => {
    authLogout();
    onClose();
  };

  const openCreateForm = () => {
    setEditingListing(null);
    setFormData({
      title: '',
      category: 'PANDAL',
      description: '',
      address: '',
      landmark: '',
      latitude: 22.5726,
      longitude: 88.3639,
      startDate: '2026-10-06',
      endDate: '2026-10-25',
      dailyOpenTime: '08:00',
      dailyCloseTime: '02:00',
      offerText: '',
      contactPhone: '',
      status: 'PUBLISHED',
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const openEditForm = (item) => {
    setEditingListing(item);
    setFormData({
      title: item.title,
      category: item.category,
      description: item.description,
      address: item.address,
      landmark: item.landmark,
      latitude: item.latitude,
      longitude: item.longitude,
      startDate: item.startDate,
      endDate: item.endDate,
      dailyOpenTime: item.dailyOpenTime ? item.dailyOpenTime.slice(0, 5) : '08:00',
      dailyCloseTime: item.dailyCloseTime ? item.dailyCloseTime.slice(0, 5) : '02:00',
      offerText: item.offerText || '',
      contactPhone: item.contactPhone || '',
      status: item.status,
    });
    setFormError('');
    setIsFormOpen(true);
  };

  const handleSaveListing = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSaving(true);
    try {
      const payload = {
        ...formData,
        dailyOpenTime: formData.dailyOpenTime.length === 5 ? `${formData.dailyOpenTime}:00` : formData.dailyOpenTime,
        dailyCloseTime: formData.dailyCloseTime.length === 5 ? `${formData.dailyCloseTime}:00` : formData.dailyCloseTime,
      };

      if (editingListing) {
        await updateAdminListing(token, editingListing.id, payload);
      } else {
        await createAdminListing(token, payload);
      }

      setIsFormOpen(false);
      await loadAdminListings(token);
      if (onListingChanged) onListingChanged();
    } catch (err) {
      setFormError(err.message || 'Error saving listing');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteListing = async (id) => {
    if (!window.confirm(`Are you sure you want to delete listing #${id}?`)) return;
    try {
      await deleteAdminListing(token, id);
      await loadAdminListings(token);
      if (onListingChanged) onListingChanged();
    } catch (err) {
      alert(err.message || 'Failed to delete listing');
    }
  };

  const handleUploadImage = async (e) => {
    e.preventDefault();
    if (!selectedFile || !uploadListingId) return;
    setIsUploading(true);
    try {
      await uploadListingImage(token, uploadListingId, selectedFile);
      setSelectedFile(null);
      setUploadListingId(null);
      await loadAdminListings(token);
      if (onListingChanged) onListingChanged();
      alert('Photo compressed and uploaded successfully!');
    } catch (err) {
      alert(err.message || 'Image upload failed');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[3000] bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      <div className="bg-white dark:bg-[#10141c] rounded-[24px] shadow-2xl border border-slate-200 dark:border-[#303139] w-full max-w-4xl max-h-[92dvh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-160 text-slate-900 dark:text-[#f4f5f7]">
        {/* Modal Header */}
        <div className="px-6 py-3.5 border-b border-slate-200 dark:border-[#303139] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-950/60 text-city-blue flex items-center justify-center font-bold">
              🛠️
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">
                myCite Admin Panel
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {token ? 'Review user advertisements and manage public listings' : 'Authentication required'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {token && (
              <button
                onClick={handleLogout}
                className="px-3 py-1.5 min-h-[44px] rounded-full text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/40 hover:bg-rose-100 flex items-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            )}
            <button
              onClick={onClose}
              aria-label="Close admin modal"
              className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#101522] text-slate-700 dark:text-[#f4f5f7] hover:border-[#ff951f]/50 flex items-center justify-center transition-all border border-slate-200 dark:border-[#303139] cursor-pointer active:scale-95"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Section Navigation Tabs (Review Queue vs Listings) */}
        {token && (
          <div className="px-6 pt-3 pb-2 border-b border-slate-200 dark:border-[#303139] bg-slate-100/60 dark:bg-[#101522] flex items-center gap-1.5 overflow-x-auto">
            <button
              type="button"
              onClick={() => {
                setAdminSection('QUEUE');
                setIsFormOpen(false);
              }}
              className={`min-h-[40px] px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                adminSection === 'QUEUE'
                  ? 'bg-white dark:bg-[#10141c] text-[#ff951f] border border-slate-200 dark:border-[#ff951f]/40 font-mono shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Review Queue
            </button>
            <button
              type="button"
              onClick={() => {
                setAdminSection('CLIENT_REQUESTS');
                setIsFormOpen(false);
              }}
              className={`min-h-[40px] px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                adminSection === 'CLIENT_REQUESTS'
                  ? 'bg-white dark:bg-[#10141c] text-[#ff951f] border border-slate-200 dark:border-[#ff951f]/40 font-mono shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Client Requests
            </button>
            <button
              type="button"
              onClick={() => {
                setAdminSection('USERS');
                setIsFormOpen(false);
              }}
              className={`min-h-[40px] px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                adminSection === 'USERS'
                  ? 'bg-white dark:bg-[#10141c] text-[#ff951f] border border-slate-200 dark:border-[#ff951f]/40 font-mono shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              Users
            </button>
            <button
              type="button"
              onClick={() => {
                setAdminSection('LISTINGS');
              }}
              className={`min-h-[40px] px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                adminSection === 'LISTINGS'
                  ? 'bg-white dark:bg-[#10141c] text-[#ff951f] border border-slate-200 dark:border-[#ff951f]/40 font-mono shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              🗺️ All Listings Database ({listings.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setAdminSection('MARKETING');
                setIsFormOpen(false);
              }}
              className={`min-h-[40px] px-4 py-1.5 rounded-full text-xs font-black transition-all ${
                adminSection === 'MARKETING'
                  ? 'bg-white dark:bg-[#10141c] text-[#ff951f] border border-slate-200 dark:border-[#ff951f]/40 font-mono shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              📢 Ads & Announcements
            </button>
          </div>
        )}

        {/* Modal Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!token ? (
            /* Restricted Message - Admin credentials are never shown to users */
            <div className="max-w-sm mx-auto py-12 text-center space-y-4">
              <div className="w-16 h-16 bg-blue-50 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto text-3xl shadow-sm">
                🛡️
              </div>
              <h3 className="font-extrabold text-lg text-slate-800 dark:text-slate-100">
                Administrator Access Restricted
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                This panel is restricted to verified administrators. Please sign in with an authorized Google administrator account to manage listings.
              </p>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="min-h-[44px] px-6 py-2.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold shadow-md hover:opacity-90 transition-opacity"
                >
                  Close
                </button>
              </div>
            </div>
          ) : adminSection === 'QUEUE' ? (
            /* Review Queue for user-submitted advertisements */
            <AdminReviewQueue
              token={token}
              onApprovedOrDeclined={() => {
                loadAdminListings(token);
                if (onListingChanged) onListingChanged();
              }}
            />
          ) : adminSection === 'CLIENT_REQUESTS' ? (
            /* Client Upgrade Requests Panel */
            <AdminClientRequestsQueue
              token={token}
              onRequestsChanged={onListingChanged}
            />
          ) : adminSection === 'USERS' ? (
            /* Users Management Panel */
            <AdminUsersManager
              token={token}
              currentUserId={user?.id}
            />
          ) : adminSection === 'MARKETING' ? (
            /* Ads & Announcements Marketing Panel */
            <AdminAdsManager
              token={token}
              onOpenCreateAnnouncement={onOpenCreateAnnouncement}
            />
          ) : adminSection === 'LISTINGS' ? (
            isFormOpen ? (
              /* Add / Edit Listing Form with Pick Location Step */
            <form onSubmit={handleSaveListing} className="space-y-5 max-w-2xl mx-auto">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                  {editingListing ? `Edit Listing #${editingListing.id}` : 'Create New Listing'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
                >
                  Back to table
                </button>
              </div>

              {formError && (
                <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 text-rose-700 text-xs font-semibold">
                  {formError}
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Title *</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                    placeholder="e.g. Sreebhumi Sporting Club Grand Pandal"
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
                  >
                    <option value="PANDAL">🪔 Pandal</option>
                    <option value="MELA">🎡 Mela</option>
                    <option value="OFFER">🛍️ Offer</option>
                    <option value="INAUGURATION">🎀 Inauguration</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Publish Status *</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
                  >
                    <option value="PUBLISHED">🟢 Published (Live on Map)</option>
                    <option value="DRAFT">⚪ Draft (Hidden from Public)</option>
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Description *</label>
                  <textarea
                    rows={3}
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    required
                    placeholder="Highlight theme, architecture, special attraction..."
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Landmark *</label>
                  <input
                    type="text"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    required
                    placeholder="e.g. Near Lake Town Clock Tower"
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Full Address *</label>
                  <input
                    type="text"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    required
                    placeholder="Road, Area, Bhubaneswar"
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                {/* Step: Pick location on map */}
                <div className="sm:col-span-2 space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      📍 Pick Location on Map (Click to set Pin)
                    </label>
                    <span className="text-[11px] font-mono text-city-blue">
                      {formData.latitude.toFixed(4)}, {formData.longitude.toFixed(4)}
                    </span>
                  </div>
                  <LocationPickerMap
                    lat={formData.latitude}
                    lng={formData.longitude}
                    onSelectLocation={(lat, lng) => {
                      setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }));
                    }}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Daily Open Time *</label>
                  <input
                    type="time"
                    value={formData.dailyOpenTime}
                    onChange={(e) => setFormData({ ...formData, dailyOpenTime: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Daily Close Time *</label>
                  <input
                    type="time"
                    value={formData.dailyCloseTime}
                    onChange={(e) => setFormData({ ...formData, dailyCloseTime: e.target.value })}
                    required
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Offer Text (Optional)</label>
                  <input
                    type="text"
                    value={formData.offerText}
                    onChange={(e) => setFormData({ ...formData, offerText: e.target.value })}
                    placeholder="e.g. Flat 30% OFF on Festive Sarees"
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Contact Phone (Optional)</label>
                  <input
                    type="text"
                    value={formData.contactPhone}
                    onChange={(e) => setFormData({ ...formData, contactPhone: e.target.value })}
                    placeholder="+91-9830000000"
                    className="w-full px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-sm text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-4 py-2 rounded-full text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="px-6 py-2.5 rounded-full bg-city-blue hover:bg-blue-600 text-white font-bold text-xs shadow-md transition-all active:scale-95 disabled:opacity-50"
                >
                  {isSaving ? 'Saving...' : editingListing ? 'Update Listing' : 'Publish Listing'}
                </button>
              </div>
            </form>
          ) : (
            /* Listings Table View */
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-slate-100">
                    All Listings ({listings.length})
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Includes active, expired, and draft listings
                  </p>
                </div>

                <button
                  onClick={openCreateForm}
                  className="px-4 py-2 rounded-full bg-city-blue hover:bg-blue-600 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Listing</span>
                </button>
              </div>

              {/* Upload image mini dialog */}
              {uploadListingId && (
                <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
                  <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-200">
                    <ImageIcon className="w-4 h-4" />
                    <span>Upload image for Listing #{uploadListingId} (Resizes to 1200px & compresses)</span>
                  </div>
                  <form onSubmit={handleUploadImage} className="flex items-center gap-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setSelectedFile(e.target.files[0])}
                      required
                      className="text-xs text-slate-600 dark:text-slate-300 file:mr-2 file:py-1 file:px-2.5 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-city-blue file:text-white"
                    />
                    <button
                      type="submit"
                      disabled={isUploading || !selectedFile}
                      className="px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs disabled:opacity-50"
                    >
                      {isUploading ? 'Uploading...' : 'Upload'}
                    </button>
                    <button
                      type="button"
                      onClick={() => { setUploadListingId(null); setSelectedFile(null); }}
                      className="text-xs text-slate-500 hover:text-slate-800"
                    >
                      Cancel
                    </button>
                  </form>
                </div>
              )}

              {/* Table */}
              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
                  <thead className="bg-slate-50 dark:bg-slate-800/60 uppercase font-bold text-[11px] text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-3">ID</th>
                      <th className="py-3 px-3">Title</th>
                      <th className="py-3 px-3">Category</th>
                      <th className="py-3 px-3">Dates</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {listings.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-400">#{item.id}</td>
                        <td className="py-2.5 px-3">
                          <div className="font-extrabold text-slate-900 dark:text-slate-100">{item.title}</div>
                          <div className="text-[11px] text-slate-400 truncate max-w-xs">{item.landmark}</div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border ${(CATEGORIES[item.category] || CATEGORIES.PANDAL).badgeBg}`}>
                            {item.category}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[11px]">
                          {item.startDate} &rarr; {item.endDate}
                        </td>
                        <td className="py-2.5 px-3">
                          {item.status === 'PUBLISHED' ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Live
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-slate-400">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400" /> Draft
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              onClick={() => setUploadListingId(item.id)}
                              title="Upload Photo"
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300"
                            >
                              <Upload className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => openEditForm(item)}
                              title="Edit"
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-city-blue"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteListing(item.id)}
                              title="Delete"
                              className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-rose-500"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )) : null}
        </div>
      </div>
    </div>
  );
}