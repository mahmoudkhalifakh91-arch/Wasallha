
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// Types
import type { User, Order, Restaurant } from '../types';
import { OrderStatus } from '../types';

// Utils
import { stripFirestore } from '../utils';

// Services
import { db } from '../services/firebase';
import { 
  collection, query, doc, onSnapshot, orderBy, limit, setDoc, updateDoc, deleteDoc, where
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Icons
import { 
  Users2, UtensilsCrossed, Megaphone, MapPin, 
  TrendingUp, ShieldCheck, ArrowDown, Bell, 
  MessageCircle, LogOut, ChevronLeft, Zap, 
  Activity, ArrowUpRight, Search, PlusCircle,
  Camera, FileText, X, Building2, Smartphone, Loader2,
  ArrowRight, ArrowUp
} from 'lucide-react';

// Sub-components
import AdminUsersList from './AdminUsersList';
import AdminRestaurantManager from './AdminRestaurantManager';
import AdminAdsManager from './AdminAdsManager';
import AdminGeographyManager from './AdminGeographyManager';

const SuperAdminDashboard: React.FC<{ user: User }> = ({ user }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState<User[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [activeTab, setActiveTab] = useState<'DASHBOARD' | 'USERS' | 'RESTAURANTS' | 'ADS' | 'GEO'>('DASHBOARD');
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const activityRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...stripFirestore(d.data()) })) as User[]);
    });
    const unsubOrders = onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(20)), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...stripFirestore(d.data()) })) as Order[]);
    });
    return () => { unsubUsers(); unsubOrders(); };
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setShowScrollTop(e.currentTarget.scrollTop > 400);
  };

  const stats = {
    systemBalance: users.reduce((acc, curr) => acc + (curr.wallet?.balance || 0), 0),
    driversCount: users.filter(u => u.role === 'DRIVER' && u.status === 'APPROVED').length,
    customersCount: users.filter(u => u.role === 'CUSTOMER').length,
    activeOrders: orders.filter(o => ![OrderStatus.DELIVERED, OrderStatus.DELIVERED_RATED, OrderStatus.CANCELLED].includes(o.status)).length
  };

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.DELIVERED: return 'bg-emerald-500/20 text-emerald-400';
      case OrderStatus.DELIVERED_RATED: return 'bg-emerald-900/40 text-emerald-500';
      case OrderStatus.CANCELLED: return 'bg-rose-500/20 text-rose-400';
      default: return 'bg-amber-500/20 text-amber-400';
    }
  };

  if (activeTab !== 'DASHBOARD') {
     const renderDetailedView = () => {
        switch(activeTab) {
           case 'USERS': return <AdminUsersList user={user} />;
           case 'RESTAURANTS': return <AdminRestaurantManager user={user} />;
           case 'ADS': return <AdminAdsManager user={user} />;
           case 'GEO': return <AdminGeographyManager user={user} />;
        }
     };
     return (
       <div className="h-full overflow-auto bg-slate-50" dir="rtl">
          <div className="bg-white border-b border-slate-100 p-4 sticky top-0 z-[200] flex justify-between items-center px-4 md:px-8 shadow-sm">
             <button onClick={() => setActiveTab('DASHBOARD')} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black text-xs flex items-center gap-2 active:scale-95 transition-all">
                <ArrowRight className="h-4 w-4 rotate-180" /> العودة
             </button>
             <h2 className="font-black text-slate-800 text-sm md:text-base">وحدة التحكم</h2>
          </div>
          <div className="min-w-full">
            {renderDetailedView()}
          </div>
       </div>
     );
  }

  return (
    <div 
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="h-full overflow-auto scroll-smooth bg-[#f8fafc] text-right" 
      dir="rtl"
    >
      <div className="min-w-full">
        {/* Top Navigation / Header */}
        <div className="max-w-6xl mx-auto pt-6 md:pt-10 px-4 md:px-6 flex justify-between items-start mb-8 md:mb-12">
           <div className="flex gap-2 md:gap-3">
              <button className="p-3 md:p-4 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-rose-500 transition-all border border-slate-50 active:scale-90">
                 <LogOut className="h-5 w-5 rotate-180" />
              </button>
              <button className="p-3 md:p-4 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-emerald-500 transition-all border border-slate-100 active:scale-90">
                 <Bell className="h-5 w-5" />
              </button>
           </div>

           <div className="flex items-center gap-4 md:gap-6">
              <div className="text-right">
                 <h1 className="text-2xl md:text-4xl font-black text-slate-900 tracking-tighter">مركز الإدارة العليا</h1>
                 <p className="text-[9px] md:text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-1">التحكم المطلق في المنظومة</p>
              </div>
              <div className="bg-slate-900 p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] shadow-2xl text-emerald-400">
                 <ShieldCheck className="h-8 w-8 md:h-10 md:w-10" />
              </div>
           </div>
        </div>

        {/* Hero Stats Grid - Horizontal Scroll on small screens if needed */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12 md:mb-16">
           <div className="bg-[#10b981] p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] text-white shadow-2xl relative overflow-hidden group h-48 md:h-56 flex flex-col justify-between">
              <TrendingUp className="absolute -bottom-4 -left-4 h-24 w-24 md:h-32 md:w-32 opacity-10 group-hover:scale-110 transition-transform duration-700" />
              <div className="relative z-10">
                 <p className="text-[10px] md:text-[11px] font-black opacity-60 uppercase tracking-widest mb-1">رصيد المنظومة</p>
                 <h3 className="text-3xl md:text-5xl font-black tracking-tighter">{stats.systemBalance.toLocaleString('en-US', { minimumFractionDigits: 1 })} <span className="text-xs md:text-sm opacity-60">ج.م</span></h3>
              </div>
              <button onClick={() => activityRef.current?.scrollIntoView({behavior: 'smooth'})} className="self-end bg-white/20 backdrop-blur-md px-4 py-2 rounded-xl text-[9px] md:text-[10px] font-black flex items-center gap-2">
                 متابعة النشاط <ArrowDown className="h-3 w-3" />
              </button>
           </div>

           <div className="bg-[#020617] p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] text-white shadow-2xl h-48 md:h-56 flex flex-col justify-center text-center">
              <p className="text-[10px] md:text-[11px] font-black opacity-40 uppercase tracking-widest mb-2 md:mb-4">كباتن معتمدين</p>
              <h3 className="text-5xl md:text-7xl font-black tracking-tighter">{stats.driversCount}</h3>
           </div>

           <div className="bg-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100 shadow-sm h-48 md:h-56 flex flex-col justify-center text-center">
              <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 md:mb-4">إجمالي العملاء</p>
              <h3 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter">{stats.customersCount}</h3>
           </div>

           <div className="bg-white p-8 md:p-10 rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-100 shadow-sm h-48 md:h-56 flex flex-col justify-center text-center">
              <p className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2 md:mb-4">رحلات نشطة</p>
              <h3 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter">{stats.activeOrders}</h3>
           </div>
        </div>

        {/* Control Units Grid */}
        <div className="max-w-6xl mx-auto px-4 md:px-6 grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-16 md:mb-20">
           {[
             { id: 'USERS', label: 'إدارة الأعضاء', desc: 'تعديل، تفعيل، وحظر المستخدمين', icon: <Users2 className="h-8 w-8" />, color: 'bg-indigo-50 text-indigo-500' },
             { id: 'RESTAURANTS', label: 'إدارة المطاعم', desc: 'إضافة مطاعم وتعديل المنيو', icon: <UtensilsCrossed className="h-8 w-8" />, color: 'bg-emerald-50 text-emerald-500' },
             { id: 'ADS', label: 'إدارة الإعلانات', desc: 'نشر عروض ترويجية', icon: <Megaphone className="h-8 w-8" />, color: 'bg-amber-50 text-amber-500' },
             { id: 'GEO', label: 'إدارة الجغرافيا', desc: 'إضافة قرى ومراكز جديدة', icon: <MapPin className="h-8 w-8" />, color: 'bg-rose-50 text-rose-500' }
           ].map(item => (
            <button key={item.id} onClick={() => setActiveTab(item.id as any)} className="bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3rem] border border-slate-100 shadow-sm flex items-center justify-between hover:shadow-xl hover:border-emerald-500 transition-all group active:scale-[0.98]">
               <ChevronLeft className="h-5 w-5 text-slate-200 group-hover:text-emerald-500 transition-all" />
               <div className="flex items-center gap-4 md:gap-6">
                  <div className="text-right">
                     <h5 className="text-xl md:text-2xl font-black text-slate-900">{item.label}</h5>
                     <p className="text-[10px] md:text-[11px] font-bold text-slate-400">{item.desc}</p>
                  </div>
                  <div className={`${item.color} p-4 md:p-6 rounded-[1.8rem] md:rounded-[2.2rem]`}>{item.icon}</div>
               </div>
            </button>
           ))}
        </div>

        {/* Live Feed */}
        <div ref={activityRef} className="max-w-6xl mx-auto px-4 md:px-6 pb-20">
           <div className="bg-[#020617] rounded-[3rem] md:rounded-[4rem] p-8 md:p-12 shadow-2xl relative overflow-hidden border border-white/5">
              <div className="flex justify-between items-center mb-8 md:mb-12">
                 <div className="bg-white/5 border border-white/10 px-4 py-1.5 rounded-full text-[9px] font-black text-emerald-400 uppercase tracking-widest">Live Activity</div>
                 <h3 className="text-2xl md:text-3xl font-black text-white flex items-center gap-4 flex-row-reverse">آخر العمليات <Activity className="text-[#10b981] animate-pulse" /></h3>
              </div>

              <div className="space-y-4">
                 {orders.map((order) => (
                   <div key={order.id} className="bg-white/5 border border-white/5 hover:border-white/10 p-5 md:p-7 rounded-[2rem] md:rounded-[2.5rem] flex justify-between items-center transition-all group">
                      <div className="flex items-center gap-4 md:gap-6 flex-row-reverse text-right">
                         <div>
                            <p className="text-xl md:text-2xl font-black text-emerald-400">{order.price} <span className="text-xs opacity-50 font-bold">ج.م</span></p>
                            <span className={`inline-block mt-2 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${getStatusBadge(order.status)}`}>
                               {order.status}
                            </span>
                         </div>
                         <div className="text-right">
                            <p className="text-base md:text-lg font-black text-slate-200 leading-tight">
                               {order.pickup?.villageName} <span className="text-emerald-500/50 mx-2">←</span> {order.dropoff?.villageName}
                            </p>
                            <p className="text-[9px] md:text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">
                               {new Date(order.createdAt).toLocaleTimeString('ar-EG')} • {order.category}
                            </p>
                         </div>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Floating Scroll Top */}
      {showScrollTop && (
        <button 
          onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 left-6 z-[1000] bg-slate-900 text-white p-4 md:p-6 rounded-full shadow-2xl animate-in fade-in zoom-in active:scale-90 transition-all"
        >
          <ArrowUp className="h-6 w-6 md:h-8 md:w-8" />
        </button>
      )}
    </div>
  );
};

export default SuperAdminDashboard;
