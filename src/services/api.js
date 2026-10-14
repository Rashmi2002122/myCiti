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

export async function refreshSession() {
  const res = await fetch(api('/api/auth/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

export async function logoutSession() {
  const res = await fetch(api('/api/auth/logout'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
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

