import { fetchVapidKey, subscribePush } from './api';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, '+')
    .replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

let pendingRegistrationPromise = null;

/**
 * Register background Web Push subscription with the browser and backend.
 * Enables phone bar notifications even when the application is closed.
 */
export async function registerPushSubscription(token) {
  if (pendingRegistrationPromise) return pendingRegistrationPromise;
  pendingRegistrationPromise = (async () => {
    if (typeof window === 'undefined') return null;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('[WebPush] PushManager not supported in this browser.');
      return null;
    }
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return null;
    }

  try {
    const vapidKey = await fetchVapidKey();
    if (!vapidKey) {
      console.warn('[WebPush] VAPID public key unavailable from server.');
      return null;
    }

    const reg = await navigator.serviceWorker.ready;
    let subscription = await reg.pushManager.getSubscription();

    // If subscription already exists, ensure backend has it recorded
    if (!subscription) {
      const convertedKey = urlBase64ToUint8Array(vapidKey);
      subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedKey
      });
    }

    if (subscription && token) {
      await subscribePush(token, subscription);
      console.log('[WebPush] Device registered for background notifications.');
    }
    return subscription;
    } catch (err) {
      console.error('[WebPush] Error setting up push subscription:', err);
      return null;
    } finally {
      pendingRegistrationPromise = null;
    }
  })();
  return pendingRegistrationPromise;
}

/**
 * Request notification permission from user and automatically register device with push service.
 */
export async function requestPushPermissionAndSubscribe(token) {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { status: 'unsupported' };
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      const sub = await registerPushSubscription(token);
      return { status: 'granted', subscription: sub };
    }
    return { status: permission };
  } catch (err) {
    console.error('[WebPush] Request permission error:', err);
    return { status: 'error', error: err };
  }
}
