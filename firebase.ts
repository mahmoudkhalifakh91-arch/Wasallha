
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getMessaging, getToken, onMessage } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

const firebaseConfig = {
  apiKey: "AIzaSyDlfpN0JCsmpCKdTyb4ZX_QN0sZbypIv48",
  authDomain: "sada-51292.firebaseapp.com",
  databaseURL: "https://sada-51292-default-rtdb.firebaseio.com",
  projectId: "sada-51292",
  storageBucket: "sada-51292.firebasestorage.app",
  messagingSenderId: "821734316791",
  appId: "1:821734316791:web:a41030678e2ecaa168d1f2",
  measurementId: "G-XZMSDBYW43"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// إعداد Firestore بطريقة تضمن استقرار الشبكة وتقليل أخطاء الذاكرة المؤقتة (Bloom Filter Errors)
export const db = initializeFirestore(app, {
  experimentalForceLongPolling: true,
  useFetchStreams: false,
  ignoreUndefinedProperties: true,
  // استخدام الكاش المحلي لضمان العمل أوفلاين دون أخطاء في الفلترة
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() })
});

// إعداد Messaging
export const messaging = getMessaging(app);

export { getToken, onMessage };
export default app;
