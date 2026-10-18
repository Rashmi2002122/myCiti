const rawApiUrl = import.meta.env.VITE_API_URL || '';
export const API_BASE = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;

function api(endpoint) {
  return `${API_BASE}${endpoint}`;
}

// Category configuration for colors, icons, and styling
export const CATEGORIES = {
  PANDAL: {
    label: 'Pandal',
    color: '#f0592a',
    badgeBg: 'bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900',
    icon: '🪔',
    description: 'Durga Puja Pandals & Installations'
  },
  MELA: {
    label: 'Mela',
    color: '#8a4fe0',
    badgeBg: 'bg-purple-100 dark:bg-purple-950/40 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900',
    icon: '🎡',
    description: 'Carnivals, Fairs & Food Streets'
  },
  OFFER: {
    label: 'Offer',
    color: '#17a673',
    badgeBg: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
    icon: '🛍️',
    description: 'Festive Discounts & Sales'
  },
  INAUGURATION: {
    label: 'Inauguration',
    color: '#2f7bff',
    badgeBg: 'bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900',
    icon: '🎀',
    description: 'Store Launches & Openings'
  }
};

export const FILTER_CHIPS = [
  { id: 'ALL', label: 'All', icon: '✨' },
  { id: 'PANDAL', label: 'Pandal', icon: '🪔' },
  { id: 'MELA', label: 'Mela', icon: '🎡' },
  { id: 'OFFER', label: 'Offer', icon: '🛍️' },
  { id: 'INAUGURATION', label: 'Inauguration', icon: '🎀' }
];

export async function fetchListings({ category = null, city = null, lat = null, lng = null, radiusKm = null, q = null } = {}) {
  const params = new URLSearchParams();
  if (category && category !== 'ALL') params.append('category', category);
  if (city && city !== 'ALL') params.append('city', city);
  if (lat !== null && lat !== undefined) params.append('lat', lat);
  if (lng !== null && lng !== undefined) params.append('lng', lng);
  if (radiusKm) params.append('radiusKm', radiusKm);
  if (q && q.trim()) params.append('q', q.trim());

  const res = await fetch(api(`/api/listings?${params.toString()}`));
  if (!res.ok) {
    throw new Error(`Failed to fetch listings (${res.status})`);
  }
  return res.json();
}

export async function fetchListingById(id) {
  const res = await fetch(api(`/api/listings/${id}`));
  if (!res.ok) {
    throw new Error(`Failed to fetch listing #${id}`);
  }
  return res.json();
}

// Admin APIs
export async function fetchAdminListings(token) {
  const res = await fetch(api('/api/admin/listings'), {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to load admin listings');
  return res.json();
}

export async function createAdminListing(token, listingData) {
  const res = await fetch(api('/api/admin/listings'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(listingData)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to create listing');
  }
  return res.json();
}

export async function updateAdminListing(token, id, listingData) {
  const res = await fetch(api(`/api/admin/listings/${id}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(listingData)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => null);
    throw new Error(errorData?.message || 'Failed to update listing');
  }
  return res.json();
}

export async function deleteAdminListing(token, id) {
  const res = await fetch(api(`/api/admin/listings/${id}`), {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to delete listing');
  return true;
}

export async function uploadListingImage(token, listingId, file, sortOrder = 1) {
  const formData = new FormData();
  formData.append('file', file);
  if (sortOrder) formData.append('sortOrder', sortOrder);

  const res = await fetch(api(`/api/admin/listings/${listingId}/images`), {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  if (!res.ok) throw new Error('Failed to upload image');
  return res.json();
}

// Google Authentication & Session APIs
export async function loginWithGoogle(idToken) {
  const res = await fetch(api('/api/auth/google'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
    credentials: 'include'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    const error = new Error(err?.message || 'Google sign-in failed');
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function refreshSession(fallbackToken = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (fallbackToken) {
    headers['X-Refresh-Token'] = fallbackToken;
  }
  const res = await fetch(api('/api/auth/refresh'), {
    method: 'POST',
    headers,
    body: fallbackToken ? JSON.stringify({ refreshToken: fallbackToken }) : undefined,
    credentials: 'include'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    const error = new Error(err?.message || 'Session expired');
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function logoutSession(fallbackToken = null) {
  const headers = { 'Content-Type': 'application/json' };
  if (fallbackToken) {
    headers['X-Refresh-Token'] = fallbackToken;
  }
  const res = await fetch(api('/api/auth/logout'), {
    method: 'POST',
    headers,
    body: fallbackToken ? JSON.stringify({ refreshToken: fallbackToken }) : undefined,
    credentials: 'include'
  });
  return res.ok;
}

// Signed-in User Profile APIs
export async function getMyProfile(token) {
  const res = await fetch(api('/api/me'), {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    const error = new Error(err?.message || 'Failed to fetch profile');
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function updateMyProfile(token, profileData) {
  const res = await fetch(api('/api/me'), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(profileData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    const error = new Error(err?.message || (err?.validationErrors ? err.validationErrors.join(', ') : 'Failed to update profile'));
    error.status = res.status;
    throw error;
  }
  return res.json();
}

export async function updateMyCoarseLocation(token, locationData) {
  const res = await fetch(api('/api/me/location'), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(locationData)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Failed to update location');
  }
  return res.json();
}

// Admin User Management APIs
export async function fetchAdminUsers(token, query = '') {
  const url = query ? api(`/api/admin/users?q=${encodeURIComponent(query)}`) : api('/api/admin/users');
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to load users');
  return res.json();
}

export async function suspendAdminUser(token, userId) {
  const res = await fetch(api(`/api/admin/users/${userId}/suspend`), {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to suspend user');
  return res.json();
}

export async function unsuspendAdminUser(token, userId) {
  const res = await fetch(api(`/api/admin/users/${userId}/unsuspend`), {
    method: 'PUT',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to unsuspend user');
  return res.json();
}

export async function fetchAdminAuditLogs(token) {
  const res = await fetch(api('/api/admin/audit-logs'), {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to load audit logs');
  return res.json();
}

// Submitter Advertisement APIs
export async function fetchMySubmissions(token, status = null) {
  const url = status ? api(`/api/submissions?status=${status}`) : api('/api/submissions');
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to load your advertisements');
  return res.json();
}

export async function fetchSubmissionById(token, id) {
  const res = await fetch(api(`/api/submissions/${id}`), {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error(`Failed to load submission #${id}`);
  return res.json();
}

export async function createSubmission(token, payload) {
  const res = await fetch(api('/api/submissions'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Failed to create advertisement');
  }
  return res.json();
}

export async function updateSubmission(token, id, payload) {
  const res = await fetch(api(`/api/submissions/${id}`), {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Failed to update advertisement');
  }
  return res.json();
}

export async function deleteSubmission(token, id) {
  const res = await fetch(api(`/api/submissions/${id}`), {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Failed to delete advertisement');
  }
  return true;
}

export async function unpublishSubmission(token, id) {
  const res = await fetch(api(`/api/submissions/${id}/unpublish`), {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Failed to unpublish advertisement');
  }
  return res.json();
}

export async function uploadSubmissionImages(token, id, files) {
  const formData = new FormData();
  if (Array.isArray(files)) {
    files.forEach(file => formData.append('files', file));
  } else {
    formData.append('file', files);
  }

  const res = await fetch(api(`/api/submissions/${id}/images`), {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Failed to upload image(s)');
  }
  return res.json();
}

export async function deleteSubmissionImage(token, id, imageId) {
  const res = await fetch(api(`/api/submissions/${id}/images/${imageId}`), {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to delete image');
  return true;
}

// Admin Submissions Management APIs
export async function fetchAdminSubmissions(token, status = 'PENDING') {
  const url = status ? api(`/api/admin/submissions?status=${status}`) : api('/api/admin/submissions');
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to load review queue');
  return res.json();
}

export async function approveAdminSubmission(token, id) {
  const res = await fetch(api(`/api/admin/submissions/${id}/approve`), {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Failed to approve advertisement');
  }
  return res.json();
}

export async function declineAdminSubmission(token, id, reason) {
  const res = await fetch(api(`/api/admin/submissions/${id}/decline`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ reason })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Failed to decline advertisement');
  }
  return res.json();
}



// --- Notification & Web Push APIs ---

export async function fetchVapidKey() {
  const res = await fetch(api('/api/notifications/vapid-public-key'));
  if (!res.ok) return '';
  const data = await res.json();
  return data.publicKey || '';
}

export async function subscribePush(token, subscription) {
  const key = subscription.getKey ? subscription.getKey('p256dh') : null;
  const auth = subscription.getKey ? subscription.getKey('auth') : null;
  const p256dh = key ? btoa(String.fromCharCode.apply(null, new Uint8Array(key))) : '';
  const authSecret = auth ? btoa(String.fromCharCode.apply(null, new Uint8Array(auth))) : '';

  const res = await fetch(api('/api/notifications/subscribe'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      endpoint: subscription.endpoint,
      p256dh,
      auth: authSecret
    })
  });
  if (!res.ok) throw new Error('Failed to save push subscription');
  return res.json();
}

export async function unsubscribePush(token, endpoint) {
  const res = await fetch(api(`/api/notifications/unsubscribe?endpoint=${encodeURIComponent(endpoint)}`), {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to unsubscribe push');
  return res.json();
}

export async function fetchNotifications(token) {
  const res = await fetch(api('/api/notifications'), {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchUnreadNotificationCount(token) {
  const res = await fetch(api('/api/notifications/unread-count'), {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) return 0;
  const data = await res.json();
  return data.unreadCount || 0;
}

export async function markNotificationAsRead(token, id) {
  await fetch(api(`/api/notifications/${id}/read`), {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return true;
}

export async function markAllNotificationsAsRead(token) {
  await fetch(api('/api/notifications/read-all'), {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return true;
}

// --- Geo-Targeted Ads APIs ---

export async function fetchActiveAds(latOrOptions = null, maybeLng = null, maybeCity = null) {
  let lat = latOrOptions;
  let lng = maybeLng;
  let city = maybeCity;
  if (latOrOptions && typeof latOrOptions === 'object') {
    lat = latOrOptions.lat;
    lng = latOrOptions.lng;
    city = latOrOptions.city;
  }
  const params = new URLSearchParams();
  if (lat !== null && lat !== undefined) params.append('lat', lat);
  if (lng !== null && lng !== undefined) params.append('lng', lng);
  if (city && city !== 'ALL') params.append('city', city);

  const res = await fetch(api(`/api/ads/active?${params.toString()}`));
  if (!res.ok) return [];
  return res.json();
}

export async function recordAdImpression(campaignId, count = 1) {
  fetch(api(`/api/ads/campaigns/${campaignId}/impressions?count=${count}`), {
    method: 'POST'
  }).catch(() => {});
}

export async function recordAdClick(campaignId) {
  fetch(api(`/api/ads/campaigns/${campaignId}/click`), {
    method: 'POST'
  }).catch(() => {});
}

export async function reportAd(campaignIdOrToken, campaignIdOrPayload, maybePayload) {
  let token = null;
  let campaignId = campaignIdOrToken;
  let payload = campaignIdOrPayload;
  if (typeof campaignIdOrToken === 'string' && typeof campaignIdOrPayload === 'number') {
    token = campaignIdOrToken;
    campaignId = campaignIdOrPayload;
    payload = maybePayload;
  }
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(api(`/api/ads/campaigns/${campaignId}/report`), {
    method: 'POST',
    headers,
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Failed to report advertisement');
  }
  return res.json();
}

export async function fetchAudienceEstimate(tokenOrParams, maybeParams) {
  let token = null;
  let paramsObj = tokenOrParams;
  if (typeof tokenOrParams === 'string') {
    token = tokenOrParams;
    paramsObj = maybeParams || {};
  }
  const params = new URLSearchParams();
  if (paramsObj.targetType) params.append('targetType', paramsObj.targetType);
  if (paramsObj.lat !== null && paramsObj.lat !== undefined) params.append('lat', paramsObj.lat);
  if (paramsObj.lng !== null && paramsObj.lng !== undefined) params.append('lng', paramsObj.lng);
  if (paramsObj.radiusKm) params.append('radiusKm', paramsObj.radiusKm);
  if (paramsObj.city || paramsObj.areaName) params.append('city', paramsObj.city || paramsObj.areaName);

  const headers = {};
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(api(`/api/ads/audience-estimate?${params.toString()}`), { headers });
  if (!res.ok) throw new Error('Failed to calculate audience estimate');
  return res.json();
}

export async function createAdCampaign(token, payload) {
  const res = await fetch(api('/api/ads/campaigns'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    const detailMsg = Array.isArray(err?.details) && err.details.length > 0
      ? err.details.join(', ')
      : (err?.message || 'Failed to create campaign');
    throw new Error(detailMsg);
  }
  return res.json();
}

export async function fetchMyCampaigns(token) {
  const res = await fetch(api('/api/ads/my-campaigns'), {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to load campaigns');
  return res.json();
}

export async function pauseCampaign(token, id) {
  const res = await fetch(api(`/api/ads/campaigns/${id}/pause`), {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to pause campaign');
  return res.json();
}

export async function resumeCampaign(token, id) {
  const res = await fetch(api(`/api/ads/campaigns/${id}/resume`), {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to resume campaign');
  return res.json();
}

// --- Announcements APIs ---

export async function createAnnouncement(token, payload) {
  const res = await fetch(api('/api/announcements'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    const detailMsg = Array.isArray(err?.details) && err.details.length > 0
      ? err.details.join(', ')
      : (err?.message || 'Failed to create announcement');
    throw new Error(detailMsg);
  }
  return res.json();
}

export async function fetchMyAnnouncements(token) {
  const res = await fetch(api('/api/announcements/my'), {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to load announcements');
  return res.json();
}

// --- Admin Ads & Announcement Oversight APIs ---

export async function fetchAdminCampaigns(token, status = null) {
  const url = status ? api(`/api/admin/ads?status=${status}`) : api('/api/admin/ads');
  const res = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to load ad campaigns');
  return res.json();
}

export async function approveAdminCampaign(token, id) {
  const res = await fetch(api(`/api/admin/ads/${id}/approve`), {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to approve campaign');
  return res.json();
}

export async function rejectAdminCampaign(token, id, reason) {
  const res = await fetch(api(`/api/admin/ads/${id}/reject`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ reason })
  });
  if (!res.ok) throw new Error('Failed to reject campaign');
  return res.json();
}

export async function deleteAdminCampaign(token, id) {
  const res = await fetch(api(`/api/admin/ads/${id}`), {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to delete campaign');
  return true;
}

export async function fetchAdminReports(token) {
  const res = await fetch(api('/api/admin/ads/reports'), {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to load reports');
  return res.json();
}

export async function fetchAdminAnnouncements(token) {
  const res = await fetch(api('/api/admin/announcements'), {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to load announcements');
  return res.json();
}

export async function approveAdminAnnouncement(token, id) {
  const res = await fetch(api(`/api/admin/announcements/${id}/approve`), {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to approve announcement');
  return res.json();
}

export async function rejectAdminAnnouncement(token, id, reason) {
  const res = await fetch(api(`/api/admin/announcements/${id}/reject`), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ reason })
  });
  if (!res.ok) throw new Error('Failed to reject announcement');
  return res.json();
}


// --- Aliases and Missing Marketing Oversight Methods ---
export const fetchMyNotifications = fetchNotifications;
export const fetchMyAdCampaigns = fetchMyCampaigns;
export const pauseAdCampaign = pauseCampaign;
export const resumeAdCampaign = resumeCampaign;

export async function deleteAdCampaign(token, id) {
  const res = await fetch(api(`/api/ads/campaigns/${id}`), {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to delete campaign');
  return true;
}

export const fetchAdminAdCampaigns = fetchAdminCampaigns;
export const approveAdminAdCampaign = approveAdminCampaign;
export const rejectAdminAdCampaign = rejectAdminCampaign;
export const deleteAdminAdCampaign = deleteAdminCampaign;
export const fetchAdminAdReports = fetchAdminReports;

export async function createAdminAnnouncement(token, payload) {
  const res = await fetch(api('/api/admin/announcements/broadcast'), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => null);
    throw new Error(err?.message || 'Failed to send admin broadcast');
  }
  return res.json();
}

export async function deleteAdminAnnouncement(token, id) {
  const res = await fetch(api(`/api/admin/announcements/${id}`), {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to delete announcement');
  return true;
}


export async function pauseAdminAdCampaign(token, id) {
  const res = await fetch(api(`/api/admin/ads/${id}/pause`), {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to pause campaign');
  return res.json();
}

export async function resumeAdminAdCampaign(token, id) {
  const res = await fetch(api(`/api/admin/ads/${id}/resume`), {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!res.ok) throw new Error('Failed to resume campaign');
  return res.json();
}
