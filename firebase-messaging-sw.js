
/* eslint-disable no-undef */
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// تهيئة Firebase في عامل الخدمة
firebase.initializeApp({
  apiKey: "AIzaSyDlfpN0JCsmpCKdTyb4ZX_QN0sZbypIv48",
  authDomain: "sada-51292.firebaseapp.com",
  projectId: "sada-51292",
  storageBucket: "sada-51292.firebasestorage.app",
  messagingSenderId: "821734316791",
  appId: "1:821734316791:web:a41030678e2ecaa168d1f2"
});

const messaging = firebase.messaging();

// معالجة الإشعارات عندما يكون التطبيق في الخلفية
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'وصلها أشمون';
  const notificationOptions = {
    body: payload.notification?.body || 'لديك تحديث جديد في طلبك',
    icon: 'https://img.icons8.com/fluency-systems-filled/192/2D9469/bicycle.png',
    badge: 'https://img.icons8.com/fluency-systems-filled/96/2D9469/bicycle.png',
    vibrate: [200, 100, 200],
    data: {
      url: payload.data?.url || '/'
    }
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});

// التعامل مع النقر على الإشعار
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      if (clientList.length > 0) {
        return clientList[0].focus();
      }
      return clients.openWindow(event.notification.data.url);
    })
  );
});
