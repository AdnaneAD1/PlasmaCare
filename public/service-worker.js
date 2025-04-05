// Service Worker pour les notifications push
self.addEventListener('push', function(event) {
  if (!event.data) {
    console.log('Réception d\'un événement push sans données');
    return;
  }

  try {
    const data = event.data.json();
    console.log('Notification reçue:', data);

    const options = {
      body: data.body || '',
      icon: data.icon || '/logo192.png',
      badge: '/badge.png',
      data: data.data || {},
      tag: data.tag,
      actions: data.actions || []
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Notification', options)
    );
  } catch (err) {
    console.error('Erreur lors du traitement de la notification:', err);
  }
});

self.addEventListener('notificationclick', function(event) {
  console.log('Notification cliquée:', event);

  event.notification.close();

  // Ouvrir ou focus sur la page principale
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(function(clientList) {
      for (var i = 0; i < clientList.length; i++) {
        var client = clientList[i];
        if ('focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Activer immédiatement le nouveau service worker
self.addEventListener('install', function(event) {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', function(event) {
  event.waitUntil(self.clients.claim());
});