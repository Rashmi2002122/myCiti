// myCiti Push Notification Service Worker Extension
// Handles background web push and notification click events

self.addEventListener('push', (event) => {
  let data = {
    title: 'myCiti Local Announcement',
    body: 'New update from your neighborhood.',
    url: '/',
    tag: 'myciti-notification'
  };

  if (event.data) {
    try {
      const parsed = event.data.json();
      data = { ...data, ...parsed };
    } catch {
      data.body = event.data.text();
    }
  }

  const options = {
    body: data.body,
    icon: data.icon || '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/'
    },
    tag: data.tag || 'myciti-announcement',
    renotify: true
  };

  event.waitUntil(
    self.registration.showNotification(data.title, options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const rawUrl = (event.notification.data && event.notification.data.url)
    ? String(event.notification.data.url).trim()
    : '/';

  // Security guard: Validate URL to prevent open redirect; strictly restrict to same-origin relative URLs
  let safeTargetUrl = '/';
  try {
    const parsed = new URL(rawUrl, self.location.origin);
    if (parsed.origin === self.location.origin && !rawUrl.startsWith('//')) {
      safeTargetUrl = parsed.pathname + parsed.search + parsed.hash;
    }
  } catch {
    safeTargetUrl = '/';
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      for (const client of windowClients) {
        if (client.url.includes(safeTargetUrl) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(safeTargetUrl);
      }
    })
  );
});
