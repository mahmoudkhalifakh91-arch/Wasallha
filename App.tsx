
import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Navigate, Link } from "react-router-dom";

// Types
import type { User } from '../types';

// Utils
import { stripFirestore } from '../utils';

// Icons
import { LogOut, RefreshCcw, WifiOff, Loader2, Bell, MessageCircle, X } from 'lucide-react';

// Services
import { auth, db } from '../services/firebase';
import { onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { doc, getDoc, collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Pages
import Login from './Login';
import CustomerDashboard from './CustomerDashboard';
import CourierDashboard from './CourierDashboard';
import OperatorDashboard from './OperatorDashboard';
import SuperAdminDashboard from './SuperAdminDashboard';
import AdminEditUser from './AdminEditUser';
import AdminUsersList from './AdminUsersList';
import AdminRestaurantManager from './AdminRestaurantManager';
import AdminAdsManager from './AdminAdsManager';
import AdminGeographyManager from './AdminGeographyManager';
import NotificationsView from './NotificationsView';
import SupportView from './SupportView';

const APP_LOGO_ICON = "https://img.icons8.com/fluency-systems-filled/512/FFFFFF/bicycle.png";

const LogoutModal: React.FC<{ isOpen: boolean, onConfirm: () => void, onCancel: () => void }> = ({ isOpen, onConfirm, onCancel }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[10000] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
      <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in border border-white/20">
        <div className="p-8 text-center space-y-6">
           <div className="bg-rose-50 w-20 h-20 rounded-[2.2rem] flex items-center justify-center mx-auto text-rose-500 shadow-inner">
              <LogOut className="h-10 w-10 rotate-180" />
           </div>
           <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tighter">تسجيل الخروج؟</h3>
              <p className="text-[10px] font-bold text-slate-400 leading-relaxed px-4">هل أنت متأكد أنك تريد مغادرة التطبيق الآن؟</p>
           </div>
           <div className="flex flex-col gap-2.5 pt-2">
              <button onClick={onConfirm} className="w-full bg-rose-500 text-white py-4 rounded-2xl font-black shadow-xl active:scale-95 transition-all">خروج</button>
              <button onClick={onCancel} className="w-full bg-slate-50 text-slate-400 py-3.5 rounded-2xl font-black active:scale-95 transition-all">إلغاء</button>
           </div>
        </div>
      </div>
    </div>
  );
};

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectionError, setConnectionError] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (fbUser) => {
      try {
        if (fbUser) {
          await fetchUserData(fbUser.uid);
        } else {
          setUser(null);
          setLoading(false);
        }
      } catch (error) {
        console.error("Auth error:", error);
        setLoading(false);
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const fetchUserData = async (uid: string) => {
    const userRef = doc(db, "users", uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = stripFirestore(docSnap.data()) as User;
        setUser(data);
        setLoading(false);
        setConnectionError(false);

        const q = query(collection(db, "notifications"), where("userId", "in", [data.id, "ALL", data.role]));
        onSnapshot(q, (snap) => {
          const unread = snap.docs.filter(d => !d.data().read).length;
          setUnreadCount(unread);
        });
      } else {
        setUser(null);
        setLoading(false);
      }
    }, (error) => {
      if (!navigator.onLine) setConnectionError(true);
      setLoading(false);
    });
    return unsubscribe;
  };

  const handleLogout = async () => {
    setIsLogoutModalOpen(false);
    await signOut(auth);
    window.location.reload();
  };

  if (loading) return (
    <div className="min-h-screen bg-[#10b981] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white/20 p-8 rounded-[4rem] backdrop-blur-3xl mb-8 animate-pulse border border-white/30">
         <img src={APP_LOGO_ICON} alt="Loading..." className="h-20 w-20 md:h-28 md:w-28 object-contain" />
      </div>
      <h2 className="text-white font-black text-4xl md:text-5xl tracking-tighter mb-4">وصـــلــهــا</h2>
      <div className="flex items-center gap-3 bg-black/10 px-6 py-2.5 rounded-full backdrop-blur-md">
        <Loader2 className="h-4 w-4 text-white animate-spin" />
        <p className="text-white/80 font-bold text-[10px] uppercase tracking-widest">جاري التحميل...</p>
      </div>
    </div>
  );

  if (connectionError) return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-10 text-center">
       <WifiOff className="h-14 w-14 text-rose-500 mb-6" />
       <h2 className="text-xl font-black text-slate-800 mb-4">لا يوجد اتصال</h2>
       <button onClick={() => window.location.reload()} className="bg-[#10b981] text-white px-8 py-4 rounded-[1.5rem] font-black shadow-xl flex items-center gap-3"><RefreshCcw className="h-4 w-4" /> تحديث</button>
    </div>
  );

  if (!user) return <Login onLogin={(u) => setUser(stripFirestore(u))} />;

  const getDashboard = () => {
    if (showNotifications) return <NotificationsView user={user} onBack={() => setShowNotifications(false)} />;
    if (showSupport) return <SupportView user={user} onBack={() => setShowSupport(false)} />;
    
    switch (user.role) {
      case 'ADMIN': return <SuperAdminDashboard user={user} />;
      case 'OPERATOR': return <OperatorDashboard user={user} />;
      case 'DRIVER': return <CourierDashboard user={user} />;
      case 'CUSTOMER': return <CustomerDashboard user={user} />;
      default: return <div className="p-20 text-center font-black">الحساب معلق</div>;
    }
  };

  return (
    <HashRouter>
      <LogoutModal isOpen={isLogoutModalOpen} onConfirm={handleLogout} onCancel={() => setIsLogoutModalOpen(false)} />
      <div className="app-container">
        <header className="bg-white/95 backdrop-blur-md border-b border-slate-100 sticky top-0 z-[110] px-5 h-[65px] md:h-[80px] flex items-center shadow-sm">
          <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
            <Link to="/" onClick={() => { setShowNotifications(false); setShowSupport(false); }} className="flex items-center gap-3">
              <div className="bg-[#10b981] p-1.5 rounded-xl shadow-lg">
                <img src={APP_LOGO_ICON} alt="Logo" className="h-6 w-6 md:h-8 md:w-8" />
              </div>
              <div className="flex flex-col">
                <h1 className="font-black text-lg md:text-2xl text-slate-800 tracking-tighter leading-none mb-0.5">وصـــلــهــا</h1>
                <span className="text-[7px] md:text-[9px] font-black text-slate-300 uppercase tracking-widest">المنوفية</span>
              </div>
            </Link>
            <div className="flex items-center gap-2">
              <button onClick={() => setShowSupport(true)} className="p-3 bg-slate-50 text-slate-400 rounded-xl transition-all hover:text-emerald-600">
                <MessageCircle className="h-5 w-5" />
              </button>
              <button onClick={() => setShowNotifications(true)} className="p-3 bg-slate-50 text-slate-400 rounded-xl relative transition-all hover:text-emerald-600">
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white w-4 h-4 rounded-full text-[8px] flex items-center justify-center border-2 border-white font-black">{unreadCount}</span>
                )}
              </button>
              <button onClick={() => setIsLogoutModalOpen(true)} className="p-3 bg-rose-50 text-rose-500 rounded-xl transition-all hover:bg-rose-100">
                <LogOut className="h-5 w-5 rotate-180" />
              </button>
            </div>
          </div>
        </header>
        <main className="main-content">
          <Routes>
            <Route path="/" element={getDashboard()} />
            {user?.role === 'ADMIN' && (
              <>
                <Route path="/admin/users" element={<AdminUsersList user={user} />} />
                <Route path="/admin/edit-user/:userId" element={<AdminEditUser user={user} />} />
                <Route path="/admin/restaurants" element={<AdminRestaurantManager user={user} />} />
                <Route path="/admin/ads" element={<AdminAdsManager user={user} />} />
                <Route path="/admin/geography" element={<AdminGeographyManager user={user} />} />
              </>
            )}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </div>
    </HashRouter>
  );
};

export default App;
