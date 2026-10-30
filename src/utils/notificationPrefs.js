const STORAGE_KEY = 'mycite_notif_prefs';

export const NOTIFICATION_CATEGORIES = [
  {
    id: 'PANDAL',
    label: 'Pandal & Puja',
    description: 'Durga Puja, Kali Puja pandals, crowd updates & aarti schedules',
    icon: '🛕'
  },
  {
    id: 'MELA',
    label: 'Melas & Fairs',
    description: 'Book fairs, winter carnivals, artisan markets & exhibitions',
    icon: '🎪'
  },
  {
    id: 'OFFER',
    label: 'Offers & Discounts',
    description: 'Exclusive restaurant deals, store sales & neighborhood flash offers',
    icon: '🏷️'
  },
  {
    id: 'INAUGURATION',
    label: 'Inaugurations',
    description: 'New shop openings, cafe launches & community ribbon cuttings',
    icon: '🎉'
  }
];

export const DEFAULT_PREFERENCES = {
  PANDAL: true,
  MELA: true,
  OFFER: true,
  INAUGURATION: true
};

export function getNotificationPreferences() {
  if (typeof window === 'undefined') return { ...DEFAULT_PREFERENCES };
  try {
    const raw = (localStorage.getItem(STORAGE_KEY) || localStorage.getItem('myciti_notif_prefs'));
    if (!raw) return { ...DEFAULT_PREFERENCES };
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_PREFERENCES,
      ...parsed
    };
  } catch (e) {
    console.warn('Failed to parse notification preferences:', e);
    return { ...DEFAULT_PREFERENCES };
  }
}

export function saveNotificationPreferences(prefs) {
  if (typeof window === 'undefined') return;
  try {
    const merged = { ...DEFAULT_PREFERENCES, ...prefs };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent('mycite_notif_prefs_changed', { detail: merged }));
  } catch (e) {
    console.warn('Failed to save notification preferences:', e);
  }
}

export function isCategoryAllowed(category, prefs = null) {
  if (!category) return true;
  const current = prefs || getNotificationPreferences();
  const normalized = String(category).trim().toUpperCase();
  if (normalized in current) {
    return Boolean(current[normalized]);
  }
  return true;
}
