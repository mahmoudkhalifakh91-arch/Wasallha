
import React, { useState, useEffect, useRef } from 'react';

// Types
import type { User, Order } from '../types';
import { OrderStatus } from '../types';
import { District, MENOFIA_DATA } from '../config/constants';

// Services
import { db } from '../services/firebase';
import { 
  collection, query, onSnapshot, orderBy, doc, 
  updateDoc, where, getDocs, limit 
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Utils
import { stripFirestore } from '../utils';

// Icons
import { 
  Activity, Bike, X, MapPin, Phone, ChevronRight, Clock, 
  Zap, Loader2, XCircle, StickyNote, Map as MapIcon,
  Search, ShieldCheck, TrendingUp, AlertCircle, Info, 
  MessageCircle, Share2, Building2, Smartphone, ArrowLeft,
  CheckCircle2, DollarSign, User as UserIcon, Pill, Utensils,
  Eye, Download, ZoomIn, ArrowUp, ClipboardList
} from 'lucide-react';

// --- Expanded Order Details Modal ---
const OrderDetailsModal: React.FC<{ order: Order, onClose: () => void }> = ({ order, onClose }) => {
  const getDistrictName = (villageName?: string) => {
    return MENOFIA_DATA.find(d => d.villages.some(v => v.name === villageName))?.name || 'المنوفية';
  };

  return (
    <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-xl z-[12000] flex items-center justify-center p-4 animate-in fade-in duration-300">
       <div className="bg-white w-full max-w-2xl rounded-[3.5rem] flex flex-col max-h-[90vh] shadow-2xl overflow-hidden animate-in zoom-in duration-500">
          {/* Header */}
          <div className="p-6 md:p-8 bg-slate-50 border-b border-slate-100 flex justify-between items-center shrink-0">
             <div className="flex items-center gap-4">
                <div className="bg-emerald-600 p-3 rounded-2xl text-white shadow-lg">
                   <Zap className="h-6 w-6" />
                </div>
                <div className="text-right">
                   <h3 className="text-lg md:text-xl font-black text-slate-900">تفاصيل الرحلة</h3>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">تطبيق وصلها - وحدة التحكم</p>
                </div>
             </div>
             <button onClick={onClose} className="p-3 md:p-4 bg-white shadow-sm border border-slate-100 rounded-2xl text-slate-400 hover:text-rose-500 active:scale-90 transition-all">
                <X className="h-6 w-6" />
             </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-6 md:p-8 space-y-8 no-scrollbar">
             {/* Status & Price */}
             <div className="grid grid-cols-2 gap-4">
                <div className="bg-emerald-50 p-6 rounded-[2rem] text-center border-2 border-emerald-100/50">
                   <p className="text-[10px] font-black text-emerald-600 uppercase mb-1">التكلفة</p>
                   <h4 className="text-2xl md:text-3xl font-black text-emerald-700">{order.price} <span className="text-xs">ج.م</span></h4>
                </div>
                <div className="bg-slate-900 p-6 rounded-[2rem] text-center">
                   <p className="text-[10px] font-black text-slate-400 uppercase mb-1">الحالة</p>
                   <h4 className="text-xs md:text-sm font-black text-white">{order.status}</h4>
                </div>
             </div>

             {/* Food Items Details */}
             {order.category === 'FOOD' && order.foodItems && (
                <div className="bg-white p-6 rounded-[2.5rem] border border-emerald-100 shadow-sm space-y-4">
                   <div className="flex items-center gap-3 flex-row-reverse">
                      <ClipboardList className="h-6 w-6 text-emerald-500" />
                      <h4 className="font-black text-slate-800">قائمة الوجبات المطلوبة:</h4>
                   </div>
                   <div className="divide-y divide-slate-100">
                      {order.foodItems.map((item, idx) => (
                         <div key={idx} className="py-4 flex justify-between items-center flex-row-reverse text-right">
                            <div>
                               <p className="font-black text-sm text-slate-800">{item.name}</p>
                               <p className="text-[10px] font-bold text-slate-400 mt-1">سعر القطعة: {item.price} ج.م</p>
                            </div>
                            <div className="bg-slate-900 text-emerald-400 px-4 py-2 rounded-xl font-black text-xs">
                               الكمية: {item.quantity}
                            </div>
                         </div>
                      ))}
                   </div>
                </div>
             )}

             {/* Participants */}
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                   <div className="flex items-center gap-3 flex-row-reverse text-right">
                      <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><UserIcon className="h-5 w-5" /></div>
                      <div className="flex-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase">العميل</p>
                         <p className="font-black text-slate-800 text-xs md:text-sm">{order.customerPhone}</p>
                      </div>
                   </div>
                   <a href={`tel:${order.customerPhone}`} className="w-full bg-slate-50 p-4 rounded-2xl flex items-center justify-center gap-2 group hover:bg-emerald-50 transition-all">
                      <Phone className="h-4 w-4 text-emerald-500" />
                      <span className="font-bold text-slate-600 text-xs">اتصال</span>
                   </a>
                </div>

                <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                   <div className="flex items-center gap-3 flex-row-reverse text-right">
                      <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Bike className="h-5 w-5" /></div>
                      <div className="flex-1">
                         <p className="text-[9px] font-black text-slate-400 uppercase">الكابتن</p>
                         <p className="font-black text-slate-800 text-xs md:text-sm">{order.driverName || 'لم يحدد'}</p>
                      </div>
                   </div>
                   {order.driverPhone ? (
                     <a href={`tel:${order.driverPhone}`} className="w-full bg-slate-50 p-4 rounded-2xl flex items-center justify-center gap-2 group hover:bg-amber-50 transition-all">
                        <Phone className="h-4 w-4 text-amber-500" />
                        <span className="font-bold text-slate-600 text-xs">اتصال</span>
                     </a>
                   ) : (
                     <div className="p-4 text-center text-[9px] font-bold text-slate-300 italic">بانتظار عرض...</div>
                   )}
                </div>
             </div>

             {/* Path & Notes */}
             <div className="bg-slate-50 p-6 md:p-8 rounded-[2.5rem] space-y-6">
                <div className="flex gap-4 md:gap-6 flex-row-reverse text-right">
                   <div className="flex flex-col items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div>
                      <div className="w-0.5 flex-1 bg-slate-200 border-dashed border-l-2"></div>
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div>
                   </div>
                   <div className="flex-1 space-y-6">
                      <div>
                         <p className="text-[9px] font-black text-emerald-600 uppercase">الاستلام</p>
                         <p className="font-black text-slate-800 text-xs md:text-sm">{order.pickup?.villageName}</p>
                      </div>
                      <div>
                         <p className="text-[9px] font-black text-rose-600 uppercase">الوصول</p>
                         <p className="font-black text-slate-800 text-xs md:text-sm">{order.dropoff?.villageName}</p>
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div className="p-6 md:p-8 bg-slate-50 border-t border-slate-100 flex gap-4 shrink-0">
             <button onClick={onClose} className="w-full bg-slate-900 text-white py-4 md:py-5 rounded-3xl font-black text-xs active:scale-95 transition-all">
                إغلاق
             </button>
          </div>
       </div>
    </div>
  );
};

const ManualAssignModal: React.FC<{ order: Order, onClose: () => void }> = ({ order, onClose }) => {
  const [drivers, setDrivers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(collection(db, "users"), where("role", "==", "DRIVER"), where("status", "==", "APPROVED"), limit(30));
    getDocs(q).then(snap => {
      setDrivers(snap.docs.map(d => ({ id: d.id, ...stripFirestore(d.data()) })) as User[]);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const assignDriver = async (driver: User) => {
    try {
      await updateDoc(doc(db, "orders", order.id), {
        driverId: driver.id,
        driverName: driver.name || 'كابتن',
        driverPhone: driver.phone || '',
        status: OrderStatus.ACCEPTED,
        acceptedAt: Date.now()
      });
      onClose();
    } catch (e) { alert('فشل التوجيه'); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl z-[11000] flex items-center justify-center p-4 animate-in fade-in">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] md:rounded-[3.5rem] p-6 md:p-10 flex flex-col max-h-[80vh] shadow-2xl overflow-hidden">
        <div className="flex justify-between items-center mb-6 px-2 shrink-0">
           <h3 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight text-right w-full">توجيه كابتن</h3>
           <button onClick={onClose} className="p-2 bg-slate-100 rounded-xl hover:bg-slate-200"><X className="h-5 w-5" /></button>
        </div>
        <div className="flex-1 overflow-auto no-scrollbar space-y-2 px-2">
          {loading ? (
             <div className="py-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-emerald-500" /></div>
          ) : drivers.map(d => (
            <div key={d.id} onClick={() => assignDriver(d)} className="p-4 md:p-5 bg-slate-50 rounded-[1.8rem] md:rounded-[2.5rem] flex justify-between items-center hover:bg-emerald-50 transition-all cursor-pointer group">
              <div className="flex items-center gap-3 md:gap-4">
                 <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center font-black text-slate-300 text-lg group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-sm">
                    {(d.name || 'ك')[0]}
                 </div>
                 <div className="text-right">
                    <p className="font-black text-slate-800 text-sm md:text-base">{d.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase">{d.vehicleType}</p>
                 </div>
              </div>
              <ChevronRight className="h-5 w-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const OperatorDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [drivers, setDrivers] = useState<User[]>([]);
  const [activeTab, setActiveTab] = useState<'LIVE' | 'DRIVERS' | 'HISTORY'>('LIVE');
  const [assignTarget, setAssignTarget] = useState<Order | null>(null);
  const [selectedOrderDetails, setSelectedOrderDetails] = useState<Order | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const unsubOrders = onSnapshot(query(collection(db, "orders"), orderBy("createdAt", "desc"), limit(100)), (snap) => {
      setOrders(snap.docs.map(d => ({ id: d.id, ...stripFirestore(d.data()) })) as Order[]);
    });
    const unsubDrivers = onSnapshot(query(collection(db, "users"), where("role", "==", "DRIVER")), (snap) => {
      setDrivers(snap.docs.map(d => ({ id: d.id, ...stripFirestore(d.data()) })) as User[]);
    });
    return () => { unsubOrders(); unsubDrivers(); };
  }, []);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setShowScrollTop(e.currentTarget.scrollTop > 400);
  };

  const getDistrictName = (villageName?: string) => {
    return MENOFIA_DATA.find(d => d.villages.some(v => v.name === villageName))?.name || 'المنوفية';
  };

  const handleShareWhatsApp = (order: Order) => {
    const pickupDist = getDistrictName(order.pickup?.villageName);
    const dropoffDist = getDistrictName(order.dropoff?.villageName);
    const msg = `*📢 طلب متاح في وصلها الآن*\n📍 *من:* مركز ${pickupDist} (${order.pickup?.villageName})\n🏁 *إلى:* مركز ${dropoffDist} (${order.dropoff?.villageName})\n💰 *السعر:* ${order.price} ج.م\n🛵 *المركبة:* ${order.requestedVehicleType}\n_افتح التطبيق الآن واقبل الطلب!_`;
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const liveOrders = orders.filter(o => ![OrderStatus.DELIVERED, OrderStatus.DELIVERED_RATED, OrderStatus.CANCELLED].includes(o.status));
  const historyOrders = orders.filter(o => [OrderStatus.DELIVERED, OrderStatus.DELIVERED_RATED, OrderStatus.CANCELLED].includes(o.status));

  return (
    <div 
      ref={scrollContainerRef}
      onScroll={handleScroll}
      className="h-full overflow-auto scroll-smooth relative bg-[#f8fafc]"
      dir="rtl"
    >
      <div className="min-w-full">
        <div className="max-w-7xl mx-auto space-y-6 md:space-y-10 pb-40 p-4 md:p-6 animate-in fade-in duration-700 text-right">
          {assignTarget && <ManualAssignModal order={assignTarget} onClose={() => setAssignTarget(null)} />}
          {selectedOrderDetails && <OrderDetailsModal order={selectedOrderDetails} onClose={() => setSelectedOrderDetails(null)} />}
          
          {/* Header Bar */}
          <div className="bg-white p-6 md:p-8 rounded-[2.5rem] md:rounded-[3.5rem] shadow-xl border border-slate-100 flex flex-col lg:flex-row-reverse justify-between items-center gap-6 md:gap-8 sticky top-0 z-[100] backdrop-blur-xl bg-white/95">
             <div className="flex items-center gap-4 md:gap-6">
                <div className="text-right">
                   <h2 className="text-2xl md:text-3xl font-black text-slate-950 tracking-tighter">تحكم المنوفية</h2>
                   <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-1">المراقبة المركزية للرحلات</p>
                </div>
                <div className="bg-slate-900 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2.5rem] shadow-2xl text-emerald-400 animate-glow">
                   <Activity className="h-8 w-8 md:h-10 md:w-10 animate-pulse" />
                </div>
             </div>
             <div className="flex gap-2 bg-slate-50 p-2 rounded-[2rem] md:rounded-[2.5rem] shadow-inner overflow-x-auto no-scrollbar w-full lg:w-auto">
                {[
                  { id: 'LIVE', label: 'النشاط', icon: <Zap className="h-4 w-4" />, count: liveOrders.length },
                  { id: 'DRIVERS', label: 'الكباتن', icon: <Bike className="h-4 w-4" />, count: drivers.filter(d => d.status === 'APPROVED').length },
                  { id: 'HISTORY', label: 'السجل', icon: <Clock className="h-4 w-4" /> }
                ].map(tab => (
                  <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-8 py-4 md:px-10 md:py-5 rounded-[1.5rem] md:rounded-[1.8rem] text-[10px] md:text-[11px] font-black transition-all flex items-center gap-2 md:gap-3 whitespace-nowrap active:scale-95 ${activeTab === tab.id ? 'bg-slate-950 text-white shadow-2xl' : 'text-slate-400 hover:text-slate-950'}`}>
                    {tab.icon} {tab.label}
                    {tab.count !== undefined && <span className={`px-2 py-0.5 rounded-full text-[8px] ${activeTab === tab.id ? 'bg-emerald-500 text-white' : 'bg-slate-200 text-slate-400'}`}>{tab.count}</span>}
                  </button>
                ))}
             </div>
          </div>

          {activeTab === 'LIVE' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
               {liveOrders.map((order) => (
                 <div key={order.id} className="bg-white rounded-[3rem] md:rounded-[4rem] border border-slate-100 shadow-2xl overflow-hidden group hover:border-emerald-500 transition-all animate-reveal relative flex flex-col">
                    <button 
                       onClick={() => setSelectedOrderDetails(order)}
                       className="absolute top-6 left-6 z-20 bg-white/80 backdrop-blur-md p-3 rounded-2xl shadow-sm text-slate-400 hover:text-emerald-500 transition-all"
                    >
                       <Eye className="h-5 w-5" />
                    </button>

                    <div className="bg-slate-50 p-6 md:p-8 flex justify-between items-center group-hover:bg-slate-900 group-hover:text-white transition-all cursor-pointer" onClick={() => setSelectedOrderDetails(order)}>
                       <p className="text-2xl md:text-3xl font-black">{order.price} <span className="text-xs opacity-40 font-bold">ج.م</span></p>
                       <div className="flex items-center gap-2 md:gap-3 flex-row-reverse">
                          <div className={`w-2.5 h-2.5 rounded-full ${order.driverId ? 'bg-emerald-500' : 'bg-amber-500 animate-bounce'}`}></div>
                          <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">{order.status}</span>
                       </div>
                    </div>
                    <div className="p-8 md:p-10 space-y-6 md:space-y-8 flex-1">
                       <div className="space-y-6">
                          <div className="flex gap-4 md:gap-6 items-start flex-row-reverse">
                             <div className="bg-emerald-50 p-3 md:p-4 rounded-2xl text-emerald-600 shadow-sm shrink-0"><MapPin className="h-5 w-5 md:h-6 md:w-6" /></div>
                             <div className="flex-1 min-w-0">
                                <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">المسار</p>
                                <p className="text-base md:text-lg font-black text-slate-800 leading-tight">
                                   {order.pickup?.villageName}
                                   <br /> <span className="text-emerald-500 text-xs">←</span> {order.dropoff?.villageName}
                                </p>
                             </div>
                          </div>
                          {order.category === 'FOOD' && order.foodItems && (
                             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-right">
                                <p className="text-[8px] font-black text-slate-400 uppercase mb-1">الوجبات:</p>
                                <p className="text-xs font-bold text-slate-600 truncate">{order.foodItems.map(i => i.name).join('، ')}</p>
                             </div>
                          )}
                          <div className="flex gap-4 md:gap-6 items-center pt-2 border-t border-slate-50 flex-row-reverse">
                             <Smartphone className="h-4 w-4 md:h-5 md:w-5 text-slate-300" />
                             <p className="text-xs font-bold font-mono tracking-widest text-slate-400" dir="ltr">{order.customerPhone}</p>
                          </div>
                       </div>
                       
                       <div className="flex flex-col gap-3 mt-auto">
                         <div className="flex gap-2">
                            {!order.driverId ? (
                               <button onClick={() => setAssignTarget(order)} className="flex-1 bg-amber-500 text-white py-4 md:py-6 rounded-[1.5rem] md:rounded-[1.8rem] font-black text-xs shadow-xl active:scale-95 transition-all">توجيه كابتن</button>
                            ) : (
                               <a href={`tel:${order.driverPhone}`} className="flex-1 bg-slate-950 text-white py-4 md:py-6 rounded-[1.5rem] md:rounded-[1.8rem] font-black text-xs flex items-center justify-center gap-3 shadow-2xl"><Phone className="h-4 w-4" /> اتصال</a>
                            )}
                            <button onClick={() => handleShareWhatsApp(order)} className="p-4 md:p-6 bg-emerald-50 text-emerald-600 rounded-[1.2rem] md:rounded-[1.5rem] hover:bg-emerald-100 transition-all"><Share2 className="h-5 w-5 md:h-6 md:w-6" /></button>
                         </div>
                         <button onClick={() => { if(window.confirm('إلغاء الطلب؟')) updateDoc(doc(db, "orders", order.id), { status: OrderStatus.CANCELLED }); }} className="w-full py-3 text-rose-500 font-black text-[8px] md:text-[9px] uppercase tracking-widest hover:bg-rose-50 rounded-2xl transition-all">إلغاء الرحلة</button>
                       </div>
                    </div>
                 </div>
               ))}
               {liveOrders.length === 0 && (
                 <div className="col-span-full py-32 md:py-40 text-center bg-white rounded-[3rem] md:rounded-[4rem] border-4 border-dashed border-slate-100">
                    <Zap className="h-16 w-16 md:h-20 md:w-20 mx-auto text-slate-100 mb-6" />
                    <p className="text-slate-300 font-black text-lg md:text-xl">لا توجد رحلات نشطة حالياً</p>
                 </div>
               )}
            </div>
          )}

          {activeTab === 'HISTORY' && (
            <div className="bg-white p-6 md:p-12 rounded-[3rem] md:rounded-[4rem] border border-slate-100 shadow-2xl space-y-8 md:space-y-10 animate-reveal">
               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10">
                  <div className="bg-emerald-50 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-emerald-100 text-center">
                     <CheckCircle2 className="h-6 w-6 md:h-8 md:w-8 text-emerald-600 mx-auto mb-3" />
                     <h4 className="text-xl md:text-2xl font-black text-emerald-700">{historyOrders.filter(o => o.status !== 'CANCELLED').length}</h4>
                     <p className="text-[9px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest">مكتملة</p>
                  </div>
                  <div className="bg-slate-900 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] text-center text-white">
                     <DollarSign className="h-6 w-6 md:h-8 md:w-8 text-emerald-400 mx-auto mb-3" />
                     <h4 className="text-xl md:text-2xl font-black">{historyOrders.filter(o => o.status !== 'CANCELLED').reduce((acc, curr) => acc + curr.price, 0).toLocaleString()}</h4>
                     <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">إجمالي المبيعات</p>
                  </div>
                  <div className="bg-rose-50 p-6 md:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-rose-100 text-center text-rose-600">
                     <XCircle className="h-6 w-6 md:h-8 md:w-8 mx-auto mb-3" />
                     <h4 className="text-xl md:text-2xl font-black">{historyOrders.filter(o => o.status === 'CANCELLED').length}</h4>
                     <p className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">ملغاة</p>
                  </div>
               </div>
               
               <div className="space-y-4">
                  {historyOrders.slice(0, 50).map(order => (
                    <div key={order.id} onClick={() => setSelectedOrderDetails(order)} className="p-5 md:p-6 bg-slate-50 rounded-3xl flex flex-col md:flex-row-reverse justify-between items-center hover:bg-slate-100 transition-all border border-transparent hover:border-emerald-100 cursor-pointer group gap-4">
                       <div className="text-right w-full md:w-auto">
                          <p className="font-black text-sm text-slate-800 leading-tight">{order.pickup?.villageName} ← {order.dropoff?.villageName}</p>
                          <p className="text-[8px] md:text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString('ar-EG')} • {new Date(order.createdAt).toLocaleTimeString('ar-EG')}</p>
                       </div>
                       <div className="flex items-center justify-between w-full md:w-auto gap-4 md:gap-6 border-t md:border-t-0 pt-3 md:pt-0 border-slate-200">
                          <span className={`px-4 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${order.status === 'CANCELLED' ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-600'}`}>{order.status}</span>
                          <p className="text-base md:text-lg font-black text-slate-900 group-hover:text-emerald-600 transition-colors">{order.price} ج.م</p>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'DRIVERS' && (
            <div className="bg-white p-6 md:p-10 rounded-[3rem] md:rounded-[4rem] border border-slate-100 shadow-xl animate-reveal">
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {drivers.map(d => (
                    <div key={d.id} className="p-6 md:p-8 bg-slate-50 rounded-[2.5rem] md:rounded-[3rem] flex items-center gap-4 md:gap-6 border-2 border-transparent hover:border-emerald-500 hover:bg-white hover:shadow-2xl transition-all group">
                       <div className="w-16 h-16 md:w-20 md:h-20 bg-white rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center font-black text-slate-300 text-2xl md:text-3xl group-hover:bg-slate-950 group-hover:text-emerald-400 transition-all shadow-sm shrink-0">
                          {(d.name || 'ك')[0]}
                       </div>
                       <div className="flex-1 min-w-0">
                          <p className="font-black text-slate-900 text-base md:text-lg leading-none mb-2 truncate">{d.name}</p>
                          <p className="text-[10px] md:text-xs font-bold text-slate-400" dir="ltr">{d.phone}</p>
                          <div className="flex items-center gap-2 mt-3">
                             <div className={`w-2 h-2 md:w-2.5 md:h-2.5 rounded-full ${d.status === 'APPROVED' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                             <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400">{d.status}</span>
                          </div>
                       </div>
                       <button onClick={() => window.open(`tel:${d.phone}`)} className="p-4 md:p-5 bg-white rounded-2xl shadow-sm text-slate-400 hover:text-emerald-600 transition-all active:scale-90"><Phone className="h-5 w-5" /></button>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Scroll Top Button */}
      {showScrollTop && (
        <button 
          onClick={() => scrollContainerRef.current?.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-10 left-10 z-[1000] bg-slate-900 text-white p-6 rounded-full shadow-2xl animate-in fade-in zoom-in active:scale-90 transition-all"
        >
          <ArrowUp className="h-8 w-8" />
        </button>
      )}
    </div>
  );
};

export default OperatorDashboard;
