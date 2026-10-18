import { fetchVapidKey, subscribePush } from '../services/api';

/**
 * Converts a base64 string to a Uint8Array for VAPID applicationServerKey.
 */
export function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

function arrayBuffersEqual(buf1, buf2) {
  if (!buf1 || !buf2) return false;
  const a = new Uint8Array(buf1);
  const b = new Uint8Array(buf2);
  if (a.byteLength !== b.byteLength) return false;
  for (let i = 0; i < a.byteLength; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Registers browser with ServiceWorker PushManager and syncs subscription with backend.
 */
export async function registerPushSubscription(accessToken) {
  if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') {
    return null;
  }
  if (!('serviceWorker' in navigator)) {
    return null;
  }

  try {
    const reg = await navigator.serviceWorker.ready;
    if (!reg.pushManager) {
      console.warn('[Push] pushManager not supported by browser.');
      return null;
    }

    const DEFAULT_VAPID_PUBLIC_KEY = 'BI6X8efg0NneUwweP4_8iN03fs8lni8tJxhAuVeSIe47d_KMgAvurPgHCs1hQWVHdRcPEDKeclb3i0lVxQSF5aU';

    let vapidKey = null;
    try {
      vapidKey = await fetchVapidKey();
    } catch (vapidErr) {
      console.warn('[Push] Error fetching VAPID key from API:', vapidErr);
    }

    const activeKey = (vapidKey && vapidKey.trim().length > 0) ? vapidKey.trim() : DEFAULT_VAPID_PUBLIC_KEY;
    const keyBytes = urlBase64ToUint8Array(activeKey);

    let sub = await reg.pushManager.getSubscription();

    // If an existing subscription was registered under an old/different VAPID key, unsubscribe to renew
    if (sub && sub.options && sub.options.applicationServerKey) {
      if (!arrayBuffersEqual(sub.options.applicationServerKey, keyBytes.buffer)) {
        console.info('[Push] Subscription uses outdated VAPID key. Renewing subscription...');
        try {
          await sub.unsubscribe();
        } catch (unsubErr) {
          console.warn('[Push] Unsubscribe error:', unsubErr);
        }
        sub = null;
      }
    }

    if (!sub) {
      const subscribeOptions = {
        userVisibleOnly: true,
        applicationServerKey: keyBytes
      };

      sub = await reg.pushManager.subscribe(subscribeOptions);
    }

    if (sub && accessToken) {
      await subscribePush(accessToken, sub);
      console.log('[Push] Successfully registered push subscription with backend.');
    }
    return sub;
  } catch (err) {
    console.warn('[Push] Error subscribing to push:', err);
    return null;
  }
}
