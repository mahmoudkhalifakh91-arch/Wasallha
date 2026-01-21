
import React, { useState, useEffect } from 'react';
import { User, Order, OrderStatus, Zone, UserStatus } from '../types';
import { STORAGE_KEYS, ASHMOUN_ZONES } from '../constants';
import { 
  ShoppingBag, Settings, TrendingUp, Bike, 
  DollarSign, PieChart, Save, Calculator, 
  MapPin, CheckCircle2, Users, Clock, 
  ArrowUpRight, AlertCircle, Ban, Search,
  Filter, ChevronLeft, MoreVertical, ShieldCheck
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell, AreaChart, Area 
} from 'recharts';
import { db } from '../firebase';
import { 
  collection, query, onSnapshot, doc, 
  updateDoc, getDocs, orderBy, limit 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { stripFirestore } from '../utils';

const AdminDashboard: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'STATS' | 'DRIVERS' | 'PRICING' | 'LOGS'>('STATS');
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const [priceConfig, setPriceConfig] = useState({
    basePrice: 12,
    pricePerKm: 6,
    minPrice: 20
  });

  useEffect(() => {
    const unsubOrders = onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(50)), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...stripFirestore(d.data()) })) as Order[]);
    });

    const unsubUsers = onSnapshot(collection(db, "users"), (snap) => {
      setUsers(snap.docs.map(d => ({ id: d.id, ...stripFirestore(d.data()) })) as User[]);
    });

    return () => { unsubOrders(); unsubUsers(); };
  }, []);

  const handleUpdateUserStatus = async (userId: string, status: UserStatus) => {
    try {
      await updateDoc(doc(db, "users", userId), { status });
      alert('تم تحديث حالة المستخدم بنجاح');
    } catch (e) {
      alert('فشل في التحديث');
    }
  };

  const stats = {
    revenue: orders.filter(o => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.DELIVERED_RATED).reduce((acc, curr) => acc + curr.price, 0),
    commission: orders.filter(o => o.status === OrderStatus.DELIVERED || o.status === OrderStatus.DELIVERED_RATED).reduce((acc, curr) => acc + (curr.commission || 0), 0),
    activeDrivers: users.filter(u => u.role === 'DRIVER' && u.status === 'APPROVED').length,
    pendingDrivers: users.filter(u => u.role === 'DRIVER' && u.status === 'PENDING_APPROVAL').length,
  };

  const chartData = [
    { name: 'السبت', orders: 12 },
    { name: 'الأحد', orders: 18 },
    { name: 'الاثنين', orders: 15 },
    { name: 'الثلاثاء', orders: 25 },
    { name: 'الأربعاء', orders: 32 },
    { name: 'الخميس', orders: 45 },
    { name: 'الجمعة', orders: 38 },
  ];

  const filteredDrivers = users.filter(u => 
    u.role === 'DRIVER' && 
    (u.name.includes(searchTerm) || u.phone.includes(searchTerm))
  );

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in pb-20">
      <div className="bg-white p-2 rounded-[2.5rem] shadow-sm border border-slate-100 flex gap-2 overflow-x-auto no-scrollbar">
        {[
          { id: 'STATS', label: 'التقارير', icon: <PieChart className="h-4 w-4" /> },
          { id: 'DRIVERS', label: 'إدارة الكباتن', icon: <Users className="h-4 w-4" />, badge: stats.pendingDrivers },
          { id: 'PRICING', label: 'الأسعار', icon: <DollarSign className="h-4 w-4" /> },
          { id: 'LOGS', label: 'النشاط', icon: <Clock className="h-4 w-4" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-3 px-8 py-4 rounded-[1.8rem] text-[11px] font-black transition-all whitespace-nowrap ${activeTab === tab.id ? 'bg-slate-900 text-white shadow-xl shadow-slate-200' : 'text-slate-400 hover:bg-slate-50'}`}
          >
            {tab.icon}
            {tab.label}
            {tab.badge ? <span className="bg-rose-500 text-white px-2 py-0.5 rounded-full text-[9px] animate-pulse">{tab.badge}</span> : null}
          </button>
        ))}
      </div>

      {activeTab === 'STATS' && (
        <div className="space-y-8 animate-in slide-in-from-bottom duration-500">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-emerald-600 p-8 rounded-[3rem] text-white shadow-2xl shadow-emerald-100 relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-3xl -mr-16 -mt-16"></div>
               <p className="text-[10px] font-black text-emerald-100 uppercase tracking-widest mb-2">دخل المنصة</p>
               <h3 className="text-3xl font-black">{stats.commission.toLocaleString()} <span className="text-sm opacity-60">ج.م</span></h3>
               <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-200">
                  <ArrowUpRight className="h-3 w-3" /> +15% عن الأسبوع الماضي
               </div>
            </div>
            
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm group">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">الكباتن النشطين</p>
               <h3 className="text-3xl font-black text-slate-800">{stats.activeDrivers}</h3>
               <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-emerald-500">
                  <CheckCircle2 className="h-3 w-3" /> متاحين في أشمون الآن
               </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm group">
               <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">إجمالي المشاوير</p>
               <h3 className="text-3xl font-black text-slate-800">{orders.length}</h3>
               <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-blue-500">
                  <ShoppingBag className="h-3 w-3" /> رحلات مكتملة ونشطة
               </div>
            </div>

            <div className="bg-rose-50 p-8 rounded-[3rem] border border-rose-100 group">
               <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-2">طلبات معلقة</p>
               <h3 className="text-3xl font-black text-rose-600">{stats.pendingDrivers}</h3>
               <div className="mt-4 animate-pulse bg-rose-500 h-1.5 w-12 rounded-full"></div>
            </div>
          </div>

          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm">
             <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-black text-slate-800 flex items-center gap-3"><TrendingUp className="text-emerald-500" /> تحليل أداء الأسبوع</h3>
                <div className="flex gap-2">
                   <span className="bg-slate-50 px-4 py-2 rounded-xl text-[10px] font-black text-slate-400">آخر 7 أيام</span>
                </div>
             </div>
             <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fontWeight: 900, fill: '#94a3b8'}} />
                    <Tooltip contentStyle={{borderRadius: '20px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)'}} />
                    <Area type="monotone" dataKey="orders" stroke="#10b981" strokeWidth={4} fillOpacity={1} fill="url(#colorOrders)" />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>
        </div>
      )}

      {activeTab === 'DRIVERS' && (
        <div className="bg-white p-8 rounded-[3.5rem] shadow-sm border border-slate-100 space-y-6 animate-in slide-in-from-right">
           <div className="flex flex-col md:flex-row justify-between items-center gap-4">
              <div className="relative flex-1 w-full">
                 <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 h-5 w-5" />
                 <input 
                   value={searchTerm} 
                   onChange={e => setSearchTerm(e.target.value)}
                   placeholder="ابحث عن كابتن بالاسم أو الرقم..." 
                   className="w-full bg-slate-50 rounded-[2rem] py-5 pr-14 pl-6 font-bold text-sm outline-none border border-transparent focus:border-emerald-500 transition-all" 
                 />
              </div>
           </div>

           <div className="grid gap-4">
              {filteredDrivers.map(driver => (
                <div key={driver.id} className="p-6 bg-slate-50 rounded-[2.5rem] border border-transparent hover:border-slate-200 transition-all flex flex-col sm:flex-row justify-between items-center gap-6">
                   <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm text-slate-300 relative overflow-hidden">
                        {driver.photoURL ? <img src={driver.photoURL} className="w-full h-full object-cover" /> : <Users className="h-8 w-8" />}
                        {driver.status === 'APPROVED' && <div className="absolute top-1 left-1 bg-emerald-500 p-1 rounded-full border-2 border-white"><CheckCircle2 className="h-2 w-2 text-white" /></div>}
                      </div>
                      <div>
                         <p className="text-lg font-black text-slate-800">{driver.name}</p>
                         <p className="text-xs font-bold text-slate-400 mt-1">{driver.phone} • {driver.vehicleType || 'توكتوك'}</p>
                      </div>
                   </div>
                   <div className="flex gap-2">
                      {driver.status === 'PENDING_APPROVAL' ? (
                        <button 
                          onClick={() => handleUpdateUserStatus(driver.id, 'APPROVED')}
                          className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-xs shadow-lg shadow-emerald-100 active:scale-95 transition-all"
                        >
                          تفعيل الحساب
                        </button>
                      ) : driver.status === 'SUSPENDED' ? (
                        <button 
                          onClick={() => handleUpdateUserStatus(driver.id, 'APPROVED')}
                          className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black text-xs active:scale-95 transition-all"
                        >
                          فك الحظر
                        </button>
                      ) : (
                        <button 
                          onClick={() => handleUpdateUserStatus(driver.id, 'SUSPENDED')}
                          className="bg-rose-50 text-rose-500 px-8 py-3 rounded-2xl font-black text-xs hover:bg-rose-100 active:scale-95 transition-all"
                        >
                          إيقاف مؤقت
                        </button>
                      )}
                      <button className="p-4 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-slate-600">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}
      {/* باقي الأقسام تظل كما هي */}
    </div>
  );
};

export default AdminDashboard;
