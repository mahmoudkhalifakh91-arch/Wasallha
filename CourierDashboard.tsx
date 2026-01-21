
import React, { useState, useEffect, useRef } from 'react';

// Types
import type { User, Order } from '../types';
import { OrderStatus } from '../types';

// Utils
import { stripFirestore } from '../utils';

// Icons
import { 
  Bike, MapPin, Loader2, Power, 
  MessageCircle, History, X,
  PhoneCall, User as UserIcon, Home, 
  ShieldAlert, Bot, Zap, Car, Map as MapIcon,
  AlertTriangle, Crosshair, ArrowRight, ClipboardList
} from 'lucide-react';

// React Leaflet
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Services
import { db } from '../services/firebase';
import { 
  collection, query, where, onSnapshot, updateDoc, 
  doc, addDoc, getDoc, deleteField
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Components
import ChatView from '../components/ChatView';
import ActivityView from './ActivityView';
import ProfileView from './ProfileView';

// --- Custom Marker Icons ---
const createDriverIcon = (type: string) => {
  let emoji = '🛵';
  if (type === 'CAR') emoji = '🚗';
  if (type === 'TOKTOK') emoji = '🛺';
  
  return L.divIcon({
    html: `<div class="bg-white p-2 rounded-full shadow-2xl border-4 border-emerald-500 animate-pulse text-xl flex items-center justify-center">${emoji}</div>`,
    className: 'custom-driver-icon',
    iconSize: [45, 45],
    iconAnchor: [22, 22]
  });
};

const userIcon = L.divIcon({
  html: `<div class="bg-white p-2 rounded-full shadow-lg border-4 border-blue-500 text-lg flex items-center justify-center">👤</div>`,
  className: 'user-live-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

const pickupIcon = L.divIcon({
  html: `<div class="bg-white p-2 rounded-full shadow-lg border-4 border-rose-500 text-lg flex items-center justify-center">📍</div>`,
  className: 'pickup-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

// --- Helper to Auto-fit Map ---
const MapAutoFit: React.FC<{ points: [number, number][] }> = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [70, 70] });
    }
  }, [points, map]);
  return null;
};

const CourierDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [activeView, setActiveView] = useState<'HOME' | 'MAP' | 'ACTIVITY' | 'PROFILE'>('HOME');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [isOnline, setIsOnline] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOfferInput, setShowOfferInput] = useState<string | null>(null);
  const [offerPrice, setOfferPrice] = useState<string>('');
  const [showChat, setShowChat] = useState(false);
  
  // GPS Location
  const [currentLocation, setCurrentLocation] = useState({ lat: 30.556, lng: 31.008 });
  const [customerLocation, setCustomerLocation] = useState<{lat: number, lng: number} | null>(null);
  const watchId = useRef<number | null>(null);

  // --- Browser History (Back Button) Handler ---
  useEffect(() => {
    const handlePopState = () => {
      if (showChat) { setShowChat(false); return; }
      if (activeView !== 'HOME') {
        setActiveView('HOME');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [activeView, showChat]);

  useEffect(() => {
    const isDefault = activeView === 'HOME' && !showChat;
    if (!isDefault) {
      window.history.pushState({ depth: 1 }, '');
    }
  }, [activeView, showChat]);

  useEffect(() => {
    if (isOnline) {
      if ("geolocation" in navigator) {
        watchId.current = navigator.geolocation.watchPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            const newLoc = { lat: latitude, lng: longitude };
            setCurrentLocation(newLoc);
            // تحديث موقع الكابتن في Firestore ليراه العميل
            updateDoc(doc(db, "users", user.id), {
              location: { ...newLoc, updatedAt: Date.now() }
            });
          },
          (err) => console.error(err),
          { enableHighAccuracy: true }
        );
      }
    }
    return () => { if (watchId.current !== null) navigator.geolocation.clearWatch(watchId.current); };
  }, [isOnline, user.id]);

  // تتبع موقع العميل المباشر فور قبول الطلب (إذا كان العميل يشارك موقعه)
  useEffect(() => {
    if (activeOrder?.customerId) {
       const unsubCustomer = onSnapshot(doc(db, "users", activeOrder.customerId), (doc) => {
         if (doc.exists() && doc.data().location) {
           setCustomerLocation(doc.data().location);
         }
       });
       return () => unsubCustomer();
    }
  }, [activeOrder?.customerId]);

  useEffect(() => {
    if (!isOnline || user.status !== 'APPROVED') return;
    const unsubAvailable = onSnapshot(query(collection(db, "orders"), where("status", "==", OrderStatus.WAITING_FOR_OFFERS)), (snapshot) => {
      setAvailableOrders(snapshot.docs.map(d => ({ id: d.id, ...stripFirestore(d.data()) })) as Order[]);
    });
    const unsubActive = onSnapshot(query(collection(db, "orders"), where("driverId", "==", user.id)), (snapshot) => {
      const all = snapshot.docs.map(d => ({ id: d.id, ...stripFirestore(d.data()) } as Order));
      setActiveOrder(all.find(o => ![OrderStatus.DELIVERED, OrderStatus.DELIVERED_RATED, OrderStatus.CANCELLED].includes(o.status)) || null);
    });
    return () => { unsubAvailable(); unsubActive(); };
  }, [isOnline, user.id, user.status]);

  const handleSendOffer = async (orderId: string) => {
    const price = parseFloat(offerPrice);
    if (!price || isSubmitting) return;
    setIsSubmitting(true);
    try {
      // جلب بيانات الكابتن (التقييم والصورة) لضمها للعرض
      const userSnap = await getDoc(doc(db, "users", user.id));
      const userData = userSnap.data();
      const rating = userData?.rating || 5.0;
      const photo = userData?.photoURL || null;

      await addDoc(collection(db, "offers"), {
        orderId: orderId, // التأكد من إرسال الـ ID الصحيح
        driverId: user.id,
        driverName: user.name,
        driverPhone: user.phone,
        driverRating: rating,
        driverPhoto: photo,
        vehicleType: user.vehicleType || 'TOKTOK',
        price: price,
        createdAt: Date.now()
      });
      setShowOfferInput(null);
      setOfferPrice('');
      alert('تم إرسال عرضك للعميل بنجاح');
    } catch (e) { alert('خطأ في إرسال العرض'); } finally { setIsSubmitting(false); }
  };

  const updateOrderStatus = async (status: OrderStatus) => {
    if (!activeOrder || isSubmitting) return;
    setIsSubmitting(true);
    try {
      const updates: any = { status };
      if (status === OrderStatus.DELIVERED) updates.deliveredAt = Date.now();
      await updateDoc(doc(db, "orders", activeOrder.id), updates);
    } catch (e) { alert('خطأ'); } finally { setIsSubmitting(false); }
  };

  const handleRejectOrder = async () => {
    if (!activeOrder) return;
    const confirmReject = window.confirm("هل تريد الاعتذار عن هذا المشوار؟ سيعود الطلب متاحاً للكباتن الآخرين.");
    if (!confirmReject) return;

    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "orders", activeOrder.id), {
        status: OrderStatus.WAITING_FOR_OFFERS,
        driverId: null,
        driverName: null,
        driverPhone: null,
        acceptedAt: null
      });
      alert('تم الاعتذار عن المشوار بنجاح');
    } catch (e) { alert('فشل الاعتذار'); } finally { setIsSubmitting(false); }
  };

  if (user.status !== 'APPROVED') {
     return (
       <div className="p-12 text-center font-black space-y-6">
         <ShieldAlert className="h-20 w-20 mx-auto text-emerald-600 animate-bounce" />
         <h2 className="text-3xl tracking-tighter">حسابك بانتظار التفعيل</h2>
         <p className="text-slate-400 text-sm">يرجى التواصل مع الإدارة للبدء في استقبال الطلبات.</p>
         <button onClick={() => window.open('https://wa.me/201065019364')} className="w-full bg-[#25D366] text-white py-6 rounded-[2rem] font-black shadow-xl">تواصل عبر واتساب</button>
       </div>
     );
  }

  if (showChat && activeOrder) return <ChatView user={user} order={activeOrder} onBack={() => setShowChat(false)} />;
  if (activeView === 'ACTIVITY') return <ActivityView user={user} onBack={() => setActiveView('HOME')} />;
  if (activeView === 'PROFILE') return <ProfileView user={user} onBack={() => setActiveView('HOME')} onUpdate={() => {}} />;

  return (
    <div className="rh-layout relative">
      
      {/* واجهة الخريطة للكابتن */}
      {activeView === 'MAP' && (
        <div className="map-page-container animate-in fade-in duration-500">
           <div className="absolute top-10 left-6 right-6 z-[1010] flex justify-between items-center">
              <button onClick={() => setActiveView('HOME')} className="p-4 bg-white rounded-3xl shadow-xl border border-slate-100 active:scale-90 transition-all"><ArrowRight className="h-6 w-6" /></button>
              <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl text-[10px] font-black uppercase tracking-widest">تتبع مسار العميل</div>
           </div>
           <MapContainer center={[currentLocation.lat, currentLocation.lng]} zoom={14} zoomControl={false} className="w-full h-full">
              <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
              
              {/* موقع الكابتن الحالي */}
              <Marker position={[currentLocation.lat, currentLocation.lng]} icon={createDriverIcon(user.vehicleType || 'TOKTOK')}>
                <Popup><p className="font-black text-xs text-right">موقعي الحالي</p></Popup>
              </Marker>

              {/* موقع العميل المباشر (👤) */}
              {customerLocation && (
                <Marker position={[customerLocation.lat, customerLocation.lng]} icon={userIcon}>
                   <Popup><p className="font-black text-xs text-right">مكان العميل الآن</p></Popup>
                </Marker>
              )}

              {/* نقاط الطلب والمسار */}
              {activeOrder && (
                <>
                  <Marker position={[activeOrder.pickup.lat, activeOrder.pickup.lng]} icon={pickupIcon}>
                    <Popup><p className="font-black text-xs text-right">نقطة الاستلام</p></Popup>
                  </Marker>
                  <Marker position={[activeOrder.dropoff.lat, activeOrder.dropoff.lng]}>
                    <Popup><p className="font-black text-xs text-right">نقطة الوصول</p></Popup>
                  </Marker>
                  <Polyline 
                    positions={[
                      [activeOrder.pickup.lat, activeOrder.pickup.lng],
                      [activeOrder.dropoff.lat, activeOrder.dropoff.lng]
                    ]} 
                    color="#0085C7" 
                    dashArray="10, 10"
                    weight={4}
                    opacity={0.6}
                  />
                </>
              )}

              <MapAutoFit points={[
                [currentLocation.lat, currentLocation.lng],
                ...(customerLocation ? [[customerLocation.lat, customerLocation.lng] as [number, number]] : []),
                ...(activeOrder ? [[activeOrder.pickup.lat, activeOrder.pickup.lng] as [number, number], [activeOrder.dropoff.lat, activeOrder.dropoff.lng] as [number, number]] : [])
              ]} />
           </MapContainer>
        </div>
      )}

      <div className={`page-container no-scrollbar ${activeView === 'MAP' ? 'hidden' : 'block'}`}>
        <div className="p-6 md:p-12 space-y-8 max-w-2xl mx-auto text-right">
            <div className={`p-8 md:p-10 rounded-[3rem] text-white flex justify-between items-center shadow-2xl transition-all duration-700 ${isOnline ? 'bg-emerald-600' : 'bg-slate-950'}`}>
               <div><h2 className="text-3xl font-black tracking-tighter leading-none">{isOnline ? 'نشط الآن' : 'متوقف'}</h2><p className="text-[10px] font-black opacity-60 mt-2 uppercase tracking-widest">كباتن المنوفية</p></div>
               <button onClick={() => setIsOnline(!isOnline)} className={`p-6 rounded-[2rem] shadow-2xl active:scale-90 transition-all ${isOnline ? 'bg-white text-emerald-600' : 'bg-emerald-500 text-white'}`}><Power className="h-10 w-10" /></button>
            </div>

            {activeOrder ? (
               <div className="bg-white rounded-[4rem] shadow-2xl border-t-8 border-t-emerald-500 p-8 space-y-8 animate-reveal">
                  <div className="flex justify-between items-center">
                     <span className="bg-emerald-100 text-emerald-700 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest">{activeOrder.status}</span>
                     <p className="text-5xl font-black text-slate-950">{activeOrder.price} <span className="text-xs font-bold opacity-30">ج.م</span></p>
                  </div>

                  {activeOrder.category === 'FOOD' && activeOrder.foodItems && (
                     <div className="bg-slate-50 p-6 rounded-[2.5rem] border border-slate-100 space-y-4">
                        <div className="flex items-center gap-2 mb-2 flex-row-reverse">
                           <ClipboardList className="h-5 w-5 text-emerald-500" />
                           <h4 className="font-black text-slate-800 text-sm">أصناف الطلب:</h4>
                        </div>
                        <div className="space-y-2">
                           {activeOrder.foodItems.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center bg-white p-3 rounded-2xl border border-slate-50 flex-row-reverse text-right">
                                 <p className="font-black text-xs text-slate-700">{item.name}</p>
                                 <div className="bg-emerald-100 px-3 py-1 rounded-lg">
                                    <span className="text-[10px] font-black text-emerald-700">عدد: {item.quantity}</span>
                                 </div>
                              </div>
                           ))}
                        </div>
                     </div>
                  )}

                  <div className="space-y-6">
                     <div className="flex gap-4 items-start flex-row-reverse text-right">
                        <div className="bg-slate-50 p-4 rounded-2xl text-emerald-600 shadow-sm shrink-0 shadow-inner"><MapPin className="h-6 w-6" /></div>
                        <div className="flex-1">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">مسار الرحلة الحالية</p>
                           <p className="font-black text-lg text-slate-900 leading-tight mt-1">{activeOrder.pickup?.villageName} ← {activeOrder.dropoff?.villageName}</p>
                        </div>
                     </div>
                  </div>
                  <div className="grid grid-cols-1 gap-4">
                     <button onClick={() => setActiveView('MAP')} className="w-full bg-emerald-500 text-white py-7 rounded-[2.2rem] font-black flex items-center justify-center gap-4 active:scale-95 transition-all shadow-xl shadow-emerald-900/10">
                        <Crosshair className="h-7 w-7" /> الخريطة ومتابعة العميل
                     </button>
                     <div className="grid grid-cols-2 gap-4">
                        <a href={`tel:${activeOrder.customerPhone}`} className="bg-slate-950 text-white py-6 rounded-3xl font-black flex items-center justify-center gap-3 active:scale-95 transition-all shadow-xl"><PhoneCall className="h-6 w-6" /> اتصال</a>
                        <button onClick={() => setShowChat(true)} className="bg-white border-2 border-slate-100 text-slate-900 py-6 rounded-3xl font-black flex items-center justify-center gap-3 active:scale-95 shadow-sm"><MessageCircle className="h-6 w-6" /> دردشة</button>
                     </div>
                     <button onClick={() => updateOrderStatus(activeOrder.status === OrderStatus.ACCEPTED ? OrderStatus.PICKED_UP : OrderStatus.DELIVERED)} disabled={isSubmitting} className="w-full bg-emerald-600 text-white py-7 rounded-[2rem] font-black text-lg shadow-2xl active:scale-95 transition-all">
                        {isSubmitting ? <Loader2 className="h-7 w-7 animate-spin mx-auto" /> : activeOrder.status === OrderStatus.ACCEPTED ? 'تأكيد الاستلام' : 'تأكيد التوصيل'}
                     </button>
                     
                     {activeOrder.status === OrderStatus.ACCEPTED && (
                        <button 
                           onClick={handleRejectOrder}
                           disabled={isSubmitting}
                           className="py-3 text-rose-500 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-rose-50 rounded-2xl transition-all"
                        >
                           <AlertTriangle className="h-4 w-4" /> اعتذار عن المشوار
                        </button>
                     )}
                  </div>
               </div>
            ) : (
               <div className="space-y-6 animate-reveal">
                  <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest text-right px-4">مشاوير بانتظارك في المنوفية ({availableOrders.length})</h3>
                  {availableOrders.map(o => (
                     <div key={o.id} className="bg-white p-8 rounded-[3.5rem] border-2 border-slate-50 shadow-xl space-y-6 animate-reveal hover:border-emerald-500 transition-all">
                        {showOfferInput === o.id ? (
                           <div className="space-y-6 animate-in zoom-in text-center">
                              <h4 className="text-xl font-black">تقديم عرض سعر للمشوار</h4>
                              <input autoFocus type="number" value={offerPrice} onChange={e => setOfferPrice(e.target.value)} placeholder={o.price.toString()} className="w-full bg-slate-50 border-none rounded-3xl p-8 text-5xl font-black text-center outline-none shadow-inner focus:ring-4 focus:ring-emerald-500/5" />
                              <div className="flex gap-4">
                                 <button onClick={() => setShowOfferInput(null)} className="flex-1 py-6 rounded-2xl font-black text-slate-400">إلغاء</button>
                                 <button onClick={() => handleSendOffer(o.id)} className="flex-[2] bg-emerald-600 text-white py-6 rounded-2xl font-black shadow-xl shadow-emerald-900/20 active:scale-95">إرسال العرض</button>
                              </div>
                           </div>
                        ) : (
                           <>
                              <div className="flex justify-between items-start text-right">
                                 <div className="space-y-2">
                                    <p className="text-2xl font-black text-slate-950 leading-tight">{o.pickup?.villageName} ← {o.dropoff?.villageName}</p>
                                    <div className="flex gap-2 items-center justify-end">
                                       <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-4 py-1.5 rounded-full">{o.requestedVehicleType}</span>
                                       {o.category === 'FOOD' && <span className="text-[10px] font-black text-amber-600 bg-amber-50 px-4 py-1.5 rounded-full">طلب مطعم 🍔</span>}
                                    </div>
                                    {o.category === 'FOOD' && o.foodItems && (
                                       <div className="pt-2 border-t border-slate-100 mt-2">
                                          <p className="text-[9px] font-bold text-slate-400">الأصناف: {o.foodItems.map(i => i.name).join('، ')}</p>
                                       </div>
                                    )}
                                 </div>
                                 <div className="bg-slate-950 text-emerald-400 p-6 rounded-[2.2rem] font-black text-3xl shrink-0 shadow-2xl">{o.price}</div>
                              </div>
                              <button onClick={() => { setShowOfferInput(o.id); setOfferPrice(o.price.toString()); }} className="w-full bg-slate-950 text-white py-7 rounded-[2.5rem] font-black text-xl shadow-2xl active:scale-95 transition-all flex items-center justify-center gap-4">
                                 <Zap className="h-6 w-6 text-emerald-400" /> تقديم عرض سريع
                              </button>
                           </>
                        )}
                     </div>
                  ))}
                  {availableOrders.length === 0 && (
                     <div className="py-24 text-center text-slate-300 font-black border-4 border-dashed border-slate-100 rounded-[4rem] bg-white/50 animate-reveal">
                        <Bot className="h-16 w-16 mx-auto mb-6 opacity-20" />
                        <p className="tracking-widest uppercase text-xs">بانتظار طلبات جديدة من مراكز المنوفية...</p>
                     </div>
                  )}
               </div>
            )}
        </div>
      </div>

      {/* Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-slate-100 px-6 py-6 flex justify-around items-center z-[150] shadow-2xl flex-row-reverse rounded-t-[3.5rem]">
         {[
           {id: 'HOME', icon: <Home className="h-6 w-6" />, label: 'الرئيسية'},
           {id: 'MAP', icon: <MapIcon className="h-6 w-6" />, label: 'الخريطة'},
           {id: 'ACTIVITY', icon: <History className="h-6 w-6" />, label: 'سجلي'},
           {id: 'PROFILE', icon: <UserIcon className="h-6 w-6" />, label: 'حسابي'}
         ].map(tab => (
           <button key={tab.id} onClick={() => setActiveView(tab.id as any)} className={`flex flex-col items-center gap-1 transition-all ${activeView === tab.id ? 'text-emerald-600' : 'text-slate-300'}`}>
              <div className={`p-3.5 rounded-2xl transition-all ${activeView === tab.id ? 'bg-emerald-50 shadow-inner scale-110' : ''}`}>{tab.icon}</div>
              <span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span>
           </button>
         ))}
      </nav>
    </div>
  );
};

export default CourierDashboard;
