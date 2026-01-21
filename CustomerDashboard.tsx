
import React, { useState, useEffect, useRef } from 'react';

// Types
import type { User, Order, Village, Offer, OrderCategory, Restaurant, MenuItem, CartItem, District, Ad } from '../types';
import { OrderStatus, VehicleType } from '../types';
import { MENOFIA_DATA, DEFAULT_PRICING } from '../config/constants';

// React Leaflet
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';

// Utils
import { stripFirestore, compressImage, getRoadDistance } from '../utils';

// Services
import { db } from '../services/firebase';
import { 
  collection, addDoc, query, where, onSnapshot, 
  doc, updateDoc, increment, orderBy
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Icons
import { 
  MapPin, Bike, Check, 
  ChevronDown, ChevronRight, Star,
  User as UserIcon, MessageCircle, Loader2,
  Bot, History, Navigation2, UtensilsCrossed, 
  ShoppingBag, ArrowRight, ArrowLeft, ThumbsUp, PartyPopper,
  Plus, Minus, PhoneCall, Pill,
  Zap, Car, X, Navigation, Map as MapIcon,
  Camera, FileText, Search, Edit2, CheckCircle2,
  Utensils, Store, Trash2, ZoomIn, Download, ChevronLeft,
  Timer, Milestone, AlertTriangle, Home, Megaphone, UploadCloud,
  Crosshair, Compass, Calculator, Radar, ClipboardList, PenTool, PlusSquare, PlusCircle
} from 'lucide-react';

// Components
import ProfileView from './ProfileView';
import ActivityView from './ActivityView';
import WalletView from './WalletView';
import ChatView from '../components/ChatView';
import AIAssistant from '../config/AIAssistant';

// --- Custom Marker Icons ---
const driverIcon = L.divIcon({
  html: `<div class="bg-white p-2 rounded-full shadow-2xl border-4 border-emerald-500 animate-bounce text-xl flex items-center justify-center">🛵</div>`,
  className: 'custom-driver-icon',
  iconSize: [45, 45],
  iconAnchor: [22, 22]
});

const userLiveIcon = L.divIcon({
  html: `<div class="bg-white p-2 rounded-full shadow-2xl border-4 border-blue-500 text-xl flex items-center justify-center">👤</div>`,
  className: 'custom-user-icon',
  iconSize: [40, 40],
  iconAnchor: [20, 20]
});

// --- Helper to Auto-fit Map ---
const MapAutoFit: React.FC<{ points: [number, number][] }> = ({ points }) => {
  const map = useMap();
  useEffect(() => {
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      map.fitBounds(bounds, { padding: [70, 70] });
    }
  }, [points, map]);
  return null;
};

// --- Sub Components ---

const AdsSlider: React.FC<{ ads: Ad[], onAdClick: (ad: Ad) => void }> = ({ ads, onAdClick }) => {
  if (ads.length === 0) return null;
  return (
    <div className="w-full space-y-4">
       <div className="flex gap-4 overflow-x-auto no-scrollbar px-2 pb-2">
          {ads.map(ad => (
            <div key={ad.id} onClick={() => onAdClick(ad)} className="min-w-[85vw] md:min-w-[400px] aspect-[21/9] bg-slate-900 rounded-[2.5rem] relative overflow-hidden shadow-xl cursor-pointer group active:scale-95 transition-all">
               <img src={ad.imageUrl} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" alt={ad.title} />
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent p-6 flex flex-col justify-end text-right">
                  <h4 className="text-white font-black text-lg">{ad.title}</h4>
                  <div className="mt-2 bg-emerald-500 text-white self-end px-5 py-1.5 rounded-full font-black text-[10px]">{ad.ctaText || 'اطلب الآن'}</div>
               </div>
            </div>
          ))}
       </div>
    </div>
  );
};

const LocationSelector: React.FC<{
  label: string, helper: string, icon: React.ReactNode, iconBg: string,
  selectedDistrict: District | null, selectedVillage: Village | null,
  onSelectDistrict: (d: District) => void, onSelectVillage: (v: Village) => void,
  addressNote?: string, onAddressChange?: (val: string) => void,
  minimal?: boolean
}> = ({ label, helper, icon, iconBg, selectedDistrict, selectedVillage, onSelectDistrict, onSelectVillage, addressNote, onAddressChange, minimal = false }) => {
  const [showDistricts, setShowDistricts] = useState(false);
  const [showVillages, setShowVillages] = useState(false);

  return (
    <div className={`bg-white rounded-[2.5rem] card-shadow space-y-4 border border-slate-50 ${minimal ? 'p-4' : 'p-6'}`}>
      {!minimal && (
        <div className="flex items-center gap-4 flex-row-reverse text-right">
          <div className={`${iconBg} p-3.5 rounded-2xl text-white shadow-lg`}>{icon}</div>
          <div className="flex-1">
            <h4 className="font-black text-slate-900 text-xl">{label}</h4>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5">{helper}</p>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3" dir="rtl">
        <div className="relative">
          <button type="button" onClick={() => { setShowDistricts(!showDistricts); setShowVillages(false); }} className="w-full bg-[#F8FAFC] p-4 rounded-2xl text-right flex justify-between items-center text-xs border border-slate-100">
             <ChevronDown className={`h-4 w-4 text-slate-300 ${showDistricts ? 'rotate-180' : ''}`} />
             <span className="font-black text-slate-800 truncate">{selectedDistrict?.name || "اختر المركز"}</span>
          </button>
          {showDistricts && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl z-[6000] max-h-48 overflow-y-auto no-scrollbar border border-slate-100 animate-in zoom-in">
               {MENOFIA_DATA.map(d => (
                 <button key={d.id} type="button" onClick={() => { onSelectDistrict(d); setShowDistricts(false); }} className="w-full p-4 text-right hover:bg-emerald-50 font-black text-xs border-b border-slate-50 last:border-none">{d.name}</button>
               ))}
            </div>
          )}
        </div>
        <div className="relative">
          <button type="button" onClick={() => { if(selectedDistrict) setShowVillages(!showVillages); setShowDistricts(false); }} disabled={!selectedDistrict} className="w-full bg-[#F8FAFC] p-4 rounded-2xl text-right flex justify-between items-center text-xs disabled:opacity-50 border border-slate-100">
             <ChevronDown className={`h-4 w-4 text-slate-300 ${showVillages ? 'rotate-180' : ''}`} />
             <span className="font-black text-slate-800 truncate">{selectedVillage?.name || "اختر القرية"}</span>
          </button>
          {showVillages && selectedDistrict && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl z-[6000] max-h-48 overflow-y-auto no-scrollbar border border-slate-100 animate-in zoom-in">
               {selectedDistrict.villages.map(v => (
                 <button key={v.id} type="button" onClick={() => { onSelectVillage(v); setShowVillages(false); }} className="w-full p-4 text-right hover:bg-emerald-50 font-black text-xs border-b border-slate-50 last:border-none">{v.name}</button>
               ))}
            </div>
          )}
        </div>
      </div>
      {onAddressChange !== undefined && (
        <input value={addressNote} onChange={e => onAddressChange(e.target.value)} placeholder="رقم المنزل، علامة مميزة.." className="w-full bg-[#F8FAFC] p-5 rounded-2xl text-xs font-bold text-right outline-none focus:border-emerald-500/20 border-2 border-transparent transition-all shadow-inner" />
      )}
    </div>
  );
};

const AdDetailsView: React.FC<{ ad: Ad, onClose: () => void }> = ({ ad, onClose }) => {
  return (
    <div className="fixed inset-0 z-[11000] bg-slate-950/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300" dir="rtl">
       <div className="bg-white w-full max-w-lg rounded-[3.5rem] flex flex-col max-h-[90vh] shadow-2xl overflow-hidden animate-in zoom-in duration-500">
          <div className="relative aspect-[21/9] shrink-0">
             <img src={ad.imageUrl} className="w-full h-full object-cover" alt={ad.title} />
             <button onClick={onClose} className="absolute top-6 left-6 p-3 bg-white/20 backdrop-blur-md rounded-2xl text-white hover:bg-white/40 transition-all">
                <X className="h-6 w-6" />
             </button>
          </div>
          <div className="flex-1 overflow-auto p-8 md:p-10 space-y-6 no-scrollbar text-right">
             <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">{ad.title}</h3>
                <div className="h-1.5 w-16 bg-emerald-500 rounded-full"></div>
             </div>
             <p className="text-slate-500 font-bold leading-relaxed whitespace-pre-wrap">{ad.description}</p>
             
             {ad.whatsappNumber && (
               <button 
                 onClick={() => {
                   updateDoc(doc(db, "ads", ad.id), { clicks: increment(1) });
                   window.open(`https://wa.me/${ad.whatsappNumber}`, '_blank');
                 }}
                 className="w-full bg-[#25D366] text-white py-6 rounded-[2rem] font-black text-lg shadow-xl shadow-emerald-900/10 active:scale-95 transition-all flex items-center justify-center gap-4"
               >
                  <MessageCircle className="h-6 w-6" /> {ad.ctaText || 'اطلب عبر واتساب'}
               </button>
             )}
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

// --- Restaurant Details & Menu View ---
const RestaurantMenuView: React.FC<{ 
  restaurant: Restaurant, 
  initialDropoffVillage: Village | null,
  initialDistrict: District | null,
  selectedVehicle: VehicleType,
  onClose: () => void, 
  onConfirmOrder: (cart: CartItem[], foodTotal: number, deliveryTotal: number, grandTotal: number, distance: number, village: Village, customNote?: string) => void 
}> = ({ restaurant, initialDropoffVillage, initialDistrict, selectedVehicle, onClose, onConfirmOrder }) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showFullMenuImage, setShowFullMenuImage] = useState(false);
  const [roadDist, setRoadDist] = useState<number>(0);
  const [isCalculating, setIsCalculating] = useState(false);
  const [customItemNote, setCustomItemNote] = useState('');
  
  const [currentDistrict, setCurrentDistrict] = useState<District | null>(initialDistrict);
  const [currentVillage, setCurrentVillage] = useState<Village | null>(initialDropoffVillage);

  useEffect(() => {
    if (currentVillage) {
      setIsCalculating(true);
      getRoadDistance(restaurant.lat, restaurant.lng, currentVillage.center.lat, currentVillage.center.lng)
        .then(res => {
          setRoadDist(res.distance);
          setIsCalculating(false);
        })
        .catch(() => setIsCalculating(false));
    }
  }, [restaurant, currentVillage]);

  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.map(i => i.id === id ? { ...i, quantity: Math.max(0, i.quantity - 1) } : i).filter(i => i.quantity > 0));
  };

  const totalFoodItemsPrice = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const getDeliveryPrice = () => {
    if (!currentVillage) return 0;
    
    // التوصيل داخل نفس القرية بـ 25 ج.م
    const isSameVillage = restaurant.address === currentVillage.name;
    const { sameVillagePrice, foodOutsidePricePerKm } = DEFAULT_PRICING;

    if (isSameVillage) {
      return sameVillagePrice;
    }

    // إذا كان خارج القرية: حساب المسافة × 3 جنيه
    const calc = roadDist * foodOutsidePricePerKm;
    return Math.round(calc);
  };

  const deliveryPrice = getDeliveryPrice();
  const finalEstimatedPrice = totalFoodItemsPrice + deliveryPrice;

  return (
    <div className="fixed inset-0 z-[5000] bg-white flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden" dir="rtl">
       <div className="relative h-[25vh] shrink-0">
          <img src={restaurant.photoURL || 'https://images.unsplash.com/photo-1517248135467-4c7ed9d42339'} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
          <button onClick={onClose} className="absolute top-6 right-6 p-4 bg-white/20 backdrop-blur-md text-white rounded-2xl active:scale-90 transition-all">
             <ArrowRight className="h-6 w-6" />
          </button>
          <div className="absolute bottom-4 right-8 left-8 text-right text-white">
             <h2 className="text-2xl font-black">{restaurant.name}</h2>
             <p className="text-emerald-400 font-bold text-xs">{restaurant.category} • {restaurant.address}</p>
          </div>
       </div>

       <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 no-scrollbar bg-slate-50">
          
          <div className="space-y-4">
             <h3 className="text-xl font-black text-slate-800 pr-2 border-r-4 border-emerald-500">منطقة الاستلام (التوصيل)</h3>
             <LocationSelector 
                label="" helper="" icon={<MapPin />} iconBg="bg-rose-500" 
                selectedDistrict={currentDistrict} 
                selectedVillage={currentVillage}
                onSelectDistrict={setCurrentDistrict}
                onSelectVillage={setCurrentVillage}
                minimal
             />
          </div>

          {restaurant.menuImageURL && (
            <button onClick={() => setShowFullMenuImage(true)} className="w-full bg-emerald-600 p-5 rounded-[2.5rem] text-white flex justify-between items-center shadow-xl active:scale-95 transition-all">
               <ZoomIn className="h-7 w-7" />
               <div className="text-right">
                  <h4 className="font-black text-md">عرض المنيو الورقي</h4>
                  <p className="text-[10px] font-bold opacity-80 mt-1">تصفح صور قائمة الطعام كاملة</p>
               </div>
            </button>
          )}

          <div className="space-y-6">
             <h3 className="text-xl font-black text-slate-800 pr-2 border-r-4 border-emerald-500">الأصناف المتاحة</h3>
             <div className="grid gap-4">
                {restaurant.menu?.map(item => (
                  <div key={item.id} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 flex justify-between items-center group">
                     <div className="flex items-center gap-3">
                        <button onClick={() => addToCart(item)} className="p-3 bg-emerald-500 text-white rounded-2xl shadow-lg active:scale-75 transition-all"><Plus className="h-5 w-5" /></button>
                        <span className="font-black text-lg w-8 text-center text-slate-800">{cart.find(i => i.id === item.id)?.quantity || 0}</span>
                        <button onClick={() => removeFromCart(item.id)} className="p-3 bg-rose-50 text-rose-500 rounded-2xl active:scale-75 transition-all"><Minus className="h-5 w-5" /></button>
                     </div>
                     <div className="text-right flex items-center gap-4 flex-row-reverse">
                        <div className="w-16 h-16 bg-slate-100 rounded-[1.8rem] overflow-hidden shrink-0 shadow-inner">
                           {item.photoURL ? <img src={item.photoURL} className="w-full h-full object-cover" /> : <Utensils className="p-5 text-slate-300" />}
                        </div>
                        <div>
                           <p className="font-black text-slate-900 text-lg leading-tight">{item.name}</p>
                           <p className="text-emerald-600 font-black text-sm mt-1">{item.price} ج.م</p>
                        </div>
                     </div>
                  </div>
                ))}

                {/* طلب صنف إضافي غير موجود في المنيو */}
                <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border-2 border-dashed border-emerald-200 space-y-4">
                   <div className="flex items-center gap-3 flex-row-reverse text-right">
                      <PenTool className="text-emerald-500 h-5 w-5" />
                      <h4 className="font-black text-slate-800 text-sm">طلب صنف مش موجود في المنيو؟</h4>
                   </div>
                   <textarea 
                     value={customItemNote}
                     onChange={e => setCustomItemNote(e.target.value)}
                     placeholder="اكتب طلبك الخاص هنا أو أي تعديلات على الوجبات..."
                     className="w-full bg-slate-50 rounded-2xl p-4 text-xs font-bold text-right outline-none focus:border-emerald-500/20 border-2 border-transparent transition-all min-h-[80px]"
                   />
                </div>
             </div>
          </div>
       </div>

       <div className="p-8 pb-10 bg-white/80 backdrop-blur-xl border-t border-slate-100 shadow-2xl">
          <div className="grid grid-cols-2 gap-4 mb-4">
             <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">حساب الطلبات</p>
                <p className="text-lg font-black text-slate-900">{totalFoodItemsPrice} ج.م</p>
             </div>
             <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 text-right">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-1">توصيل إلى {currentVillage?.name || '...'}</p>
                <p className="text-lg font-black text-emerald-600">
                   {isCalculating ? <Loader2 className="h-4 w-4 animate-spin inline ml-1" /> : `${deliveryPrice} ج.م`}
                </p>
             </div>
          </div>

          <button 
            onClick={() => currentVillage && onConfirmOrder(cart, totalFoodItemsPrice, deliveryPrice, finalEstimatedPrice, roadDist, currentVillage, customItemNote)}
            disabled={(cart.length === 0 && !customItemNote.trim()) || !currentVillage || isCalculating}
            className="w-full bg-[#10b981] text-white py-6 rounded-[2rem] font-black text-lg shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all disabled:opacity-30"
          >
             <ShoppingBag className="h-6 w-6" /> تأكيد وإرسال الطلب ({finalEstimatedPrice} ج.م)
          </button>
       </div>

       {showFullMenuImage && (
         <div className="fixed inset-0 z-[6000] bg-black flex flex-col p-4 animate-in zoom-in">
            <div className="flex justify-between items-center mb-4">
               <button onClick={() => setShowFullMenuImage(false)} className="p-4 bg-white/10 text-white rounded-2xl"><X /></button>
               <h3 className="text-white font-black">قائمة الطعام</h3>
            </div>
            <div className="flex-1 overflow-auto flex items-center justify-center">
               <img src={restaurant.menuImageURL} className="max-w-full max-h-full object-contain" />
            </div>
         </div>
       )}
    </div>
  );
};

// --- Main Dashboard Component ---

const CustomerDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [activeView, setActiveView] = useState<'NEW' | 'PROFILE' | 'ACTIVITY' | 'WALLET' | 'MAP'>('NEW');
  const [selectedCategory, setSelectedCategory] = useState<OrderCategory>('TAXI');
  
  const [pickupDistrict, setPickupDistrict] = useState<District | null>(null);
  const [pickupVillage, setPickupVillage] = useState<Village | null>(null);
  const [pickupNote, setPickupNote] = useState('');
  
  const [dropoffDistrict, setDropoffDistrict] = useState<District | null>(null);
  const [dropoffVillage, setDropoffVillage] = useState<Village | null>(null);
  const [dropoffNote, setDropoffNote] = useState('');

  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [ads, setAds] = useState<Ad[]>([]);
  const [viewingAd, setViewingAd] = useState<Ad | null>(null);
  const [viewingRestaurant, setViewingRestaurant] = useState<Restaurant | null>(null);
  
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleType>('MOTORCYCLE');
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [incomingOffers, setIncomingOffers] = useState<Offer[]>([]);
  
  const [actualRoadDist, setActualRoadDist] = useState<number>(0);
  const [isCalculatingDist, setIsCalculatingDist] = useState(false);
  
  const [aiOpen, setAiOpen] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [rating, setRating] = useState(5);
  const [feedback, setFeedback] = useState('');
  
  const [prescriptionImg, setPrescriptionImg] = useState<string | null>(null);
  const [medsList, setMedsList] = useState('');
  const prescriptionRef = useRef<HTMLInputElement>(null);

  // States for Custom Restaurant Form
  const [showCustomRestForm, setShowCustomRestForm] = useState(false);
  const [customRestName, setCustomRestName] = useState('');
  const [customRestOrder, setCustomRestOrder] = useState('');
  const [customRestPickupDistrict, setCustomRestPickupDistrict] = useState<District | null>(null);
  const [customRestPickupVillage, setCustomRestPickupVillage] = useState<Village | null>(null);

  const adminWhatsApp = "201065019364";

  // تتبع المسافة الفعلية للطريق (Google Maps Like)
  useEffect(() => {
    if (pickupVillage && dropoffVillage) {
      if (pickupVillage.id === dropoffVillage.id) {
        setActualRoadDist(0);
      } else {
        setIsCalculatingDist(true);
        getRoadDistance(pickupVillage.center.lat, pickupVillage.center.lng, dropoffVillage.center.lat, dropoffVillage.center.lng)
          .then(res => {
            setActualRoadDist(res.distance);
            setIsCalculatingDist(false);
          })
          .catch(() => {
            setIsCalculatingDist(false);
          });
      }
    } else if (selectedCategory === 'PHARMACY' && dropoffVillage) {
        setIsCalculatingDist(true);
        const refLat = 30.2931; // أشمون المدينة
        const refLng = 30.9863;
        getRoadDistance(refLat, refLng, dropoffVillage.center.lat, dropoffVillage.center.lng)
          .then(res => {
            setActualRoadDist(res.distance);
            setIsCalculatingDist(false);
          })
          .catch(() => setIsCalculatingDist(false));
    }
  }, [pickupVillage, dropoffVillage, selectedCategory]);

  const handlePrescriptionUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = async () => {
      const compressed = await compressImage(reader.result as string);
      setPrescriptionImg(compressed);
    };
    reader.readAsDataURL(file);
  };

  const getEstimatedPrice = () => {
    if (!dropoffVillage) return 0;
    
    const { basePrice, pricePerKm, minPrice, sameVillagePrice, deliveryBasePrice, foodOutsidePricePerKm } = DEFAULT_PRICING;
    const multiplier = DEFAULT_PRICING.multipliers[selectedVehicle] || 1;

    if (selectedCategory === 'TAXI' && pickupVillage?.id === dropoffVillage.id) {
      return sameVillagePrice;
    }

    if (selectedCategory === 'PHARMACY') {
       const calc = (deliveryBasePrice + (actualRoadDist * pricePerKm)) * multiplier;
       return Math.max(deliveryBasePrice, Math.round(calc));
    }

    if (selectedCategory === 'FOOD' && pickupVillage?.id !== dropoffVillage.id) {
       return Math.round(actualRoadDist * foodOutsidePricePerKm);
    }

    const calc = (basePrice + (actualRoadDist * pricePerKm)) * multiplier;
    return Math.max(minPrice, Math.round(calc));
  };

  useEffect(() => {
    onSnapshot(query(collection(db, "restaurants"), orderBy("name", "asc")), (snap) => {
      setRestaurants(snap.docs.map(d => ({ id: d.id, ...stripFirestore(d.data()) })) as Restaurant[]);
    });

    onSnapshot(query(collection(db, "ads"), orderBy("displayOrder", "asc")), (snap) => {
      setAds(snap.docs.map(d => ({ id: d.id, ...stripFirestore(d.data()) })).filter(ad => ad.isActive) as Ad[]);
    });

    return onSnapshot(query(collection(db, "orders"), where("customerId", "==", user.id)), (snapshot) => {
      const all = snapshot.docs.map(d => ({ id: d.id, ...stripFirestore(d.data()) } as Order));
      setActiveOrder(all.find(o => ![OrderStatus.DELIVERED_RATED, OrderStatus.CANCELLED].includes(o.status)) || null);
    });
  }, [user.id]);

  useEffect(() => {
    if (activeOrder?.id && activeOrder.status === OrderStatus.WAITING_FOR_OFFERS) {
      return onSnapshot(query(collection(db, "offers"), where("orderId", "==", activeOrder.id)), (snap) => {
        setIncomingOffers(snap.docs.map(d => ({ id: d.id, ...stripFirestore(d.data()) })) as Offer[]);
      });
    }
  }, [activeOrder?.id, activeOrder?.status]);

  const handleAcceptOffer = async (offer: Offer) => {
    if (!activeOrder) return;
    try {
      await updateDoc(doc(db, "orders", activeOrder.id), {
        driverId: offer.driverId,
        driverName: offer.driverName,
        driverPhone: offer.driverPhone,
        driverPhoto: offer.driverPhoto || null,
        status: OrderStatus.ACCEPTED,
        acceptedAt: Date.now(),
        price: offer.price 
      });
    } catch (e) { alert('فشل قبول العرض'); }
  };

  const handleCreateOrder = async (extraData: any = {}) => {
    const finalVillage = extraData.deliveryVillage || dropoffVillage;
    if(!finalVillage) return alert('يرجى تحديد مكان التوصيل');
    setIsSubmitting(true);
    try {
      const finalPrice = extraData.price || getEstimatedPrice();
      
      const orderData = {
        customerId: user.id, customerPhone: user.phone, category: selectedCategory,
        status: OrderStatus.WAITING_FOR_OFFERS, createdAt: Date.now(), paymentMethod: 'CASH',
        pickup: (selectedCategory === 'TAXI' && pickupVillage) ? { address: pickupVillage.name, lat: pickupVillage.center.lat, lng: pickupVillage.center.lng, villageName: pickupVillage.name } : (extraData.pickup || null),
        dropoff: { address: finalVillage.name, lat: finalVillage.center.lat, lng: finalVillage.center.lng, villageName: finalVillage.name },
        requestedVehicleType: selectedVehicle, price: finalPrice, distance: extraData.distance || actualRoadDist,
        pickupNotes: selectedCategory === 'PHARMACY' ? medsList : (selectedCategory === 'TAXI' ? pickupNote : (extraData.customNote || '')),
        dropoffNotes: dropoffNote,
        prescriptionImage: prescriptionImg,
        ...extraData
      };

      // تحضير رسالة الواتساب مع التفاصيل الكاملة
      let foodDetailsMsg = "";
      if (orderData.category === 'FOOD') {
          foodDetailsMsg = `\n🏪 *المطعم:* ${orderData.restaurantName || 'مطعم خارجي'}`;
          
          if (orderData.foodItems && orderData.foodItems.length > 0) {
              foodDetailsMsg += "\n\n📋 *الوجبات المطلوبة:*\n" + orderData.foodItems.map((item: any) => `• ${item.name} (عدد: ${item.quantity}) - ${item.price}ج`).join('\n');
          }
          
          if (orderData.customNote) {
              foodDetailsMsg += `\n\n📝 *طلبات خاصة:* ${orderData.customNote}`;
          }
      }
      
      await addDoc(collection(db, "orders"), stripFirestore(orderData));
      
      const whatsappMsg = `🚀 *طلب جديد عبر وصلها*\n👤 *العميل:* ${user.name}\n📍 *المسار:* ${orderData.pickup?.villageName || 'موقعي'} ← ${finalVillage.name}\n💰 *السعر الإجمالي:* ${finalPrice} ج.م${foodDetailsMsg}\n\n_يرجى مراجعة التطبيق وتوجيه كابتن_`;
      
      window.open(`https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(whatsappMsg)}`, '_blank');
      setPrescriptionImg(null); setMedsList(''); setShowCustomRestForm(false);
      setCustomRestName(''); setCustomRestOrder('');
    } catch (e) { alert('خطأ في إرسال الطلب'); } finally { setIsSubmitting(false); }
  };

  const handleRateOrder = async () => {
    if (!activeOrder) return;
    setIsSubmitting(true);
    try {
      await updateDoc(doc(db, "orders", activeOrder.id), { 
        status: OrderStatus.DELIVERED_RATED, 
        rating, 
        feedback: feedback.trim(), 
        ratedAt: Date.now() 
      });
      setFeedback('');
      setRating(5);
      alert('شكراً لتقييمك! تم حفظ رأيك بنجاح.');
    } catch (e) {
      alert('حدث خطأ أثناء حفظ التقييم');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showChat && activeOrder) return <ChatView user={user} order={activeOrder} onBack={() => setShowChat(false)} />;
  if (activeView === 'WALLET') return <WalletView user={user} onBack={() => setActiveView('NEW')} />;
  if (activeView === 'PROFILE') return <ProfileView user={user} onUpdate={() => {}} onBack={() => setActiveView('NEW')} onOpenWallet={() => setActiveView('WALLET')} />;
  if (activeView === 'ACTIVITY') return <ActivityView user={user} onBack={() => setActiveView('NEW')} />;

  return (
    <div className="rh-layout relative h-full w-full bg-slate-50 overflow-hidden">
      <AIAssistant isOpen={aiOpen} onClose={() => setAiOpen(false)} />
      {viewingAd && <AdDetailsView ad={viewingAd} onClose={() => setViewingAd(null)} />}
      
      {viewingRestaurant && (
        <RestaurantMenuView 
          restaurant={viewingRestaurant} 
          initialDropoffVillage={dropoffVillage}
          initialDistrict={dropoffDistrict}
          selectedVehicle={selectedVehicle}
          onClose={() => setViewingRestaurant(null)} 
          onConfirmOrder={(cart, foodTotal, deliveryTotal, grandTotal, distance, village, customNote) => {
            handleCreateOrder({ 
              restaurantId: viewingRestaurant.id, 
              restaurantName: viewingRestaurant.name, 
              foodItems: cart,
              price: grandTotal,
              distance: distance,
              deliveryVillage: village,
              customNote: customNote,
              pickup: { address: viewingRestaurant.name, lat: viewingRestaurant.lat, lng: viewingRestaurant.lng, villageName: viewingRestaurant.address } 
            });
            setViewingRestaurant(null);
          }} 
        />
      )}

      {/* مودال طلب مطعم مخصص (غير موجود في القائمة) */}
      {showCustomRestForm && (
        <div className="fixed inset-0 z-[7000] bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in" dir="rtl">
           <div className="bg-white w-full max-w-lg rounded-[3.5rem] p-8 space-y-8 shadow-2xl animate-in zoom-in duration-500 overflow-y-auto max-h-[90vh] no-scrollbar">
              <div className="flex justify-between items-center">
                 <div className="text-right">
                    <h3 className="text-2xl font-black text-slate-900 tracking-tight">طلب مطعم آخر</h3>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">مطعمك مش مسجل؟ اطلبه يدوياً</p>
                 </div>
                 <button onClick={() => setShowCustomRestForm(false)} className="p-3 bg-slate-100 rounded-2xl hover:bg-slate-200 transition-all"><X /></button>
              </div>

              <div className="space-y-6">
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 block text-right">اسم المطعم</label>
                    <input 
                      value={customRestName} 
                      onChange={e => setCustomRestName(e.target.value)} 
                      placeholder="مثال: حضرموت، كشري التحرير..." 
                      className="w-full bg-slate-50 rounded-2xl p-5 font-black text-sm text-right outline-none border-2 border-transparent focus:border-emerald-500 transition-all shadow-inner" 
                    />
                 </div>

                 <LocationSelector 
                    label="مكان المطعم" helper="فين مكان المطعم ده؟" icon={<Store />} iconBg="bg-emerald-500" 
                    selectedDistrict={customRestPickupDistrict} selectedVillage={customRestPickupVillage} 
                    onSelectDistrict={setCustomRestPickupDistrict} onSelectVillage={setCustomRestPickupVillage} 
                    minimal 
                 />
                 
                 <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 block text-right">طلباتك بالتفصيل</label>
                    <textarea 
                      value={customRestOrder} 
                      onChange={e => setCustomRestOrder(e.target.value)} 
                      placeholder="اكتب الوجبات اللي عايز تطلبها هنا بالتفصيل..." 
                      className="w-full bg-slate-50 rounded-2xl p-5 font-bold text-sm text-right outline-none border-2 border-transparent focus:border-emerald-500 transition-all shadow-inner min-h-[120px]" 
                    />
                 </div>

                 <LocationSelector 
                    label="مكان التوصيل" helper="فين مكانك انت؟" icon={<CheckCircle2 />} iconBg="bg-rose-500" 
                    selectedDistrict={dropoffDistrict} selectedVillage={dropoffVillage} 
                    onSelectDistrict={setDropoffDistrict} onSelectVillage={setDropoffVillage} 
                    minimal 
                 />
              </div>

              <button 
                onClick={() => {
                   if(!customRestName || !customRestPickupVillage || !dropoffVillage || !customRestOrder) return alert('يرجى إكمال البيانات');
                   handleCreateOrder({
                      pickup: { address: customRestName, lat: customRestPickupVillage.center.lat, lng: customRestPickupVillage.center.lng, villageName: customRestPickupVillage.name },
                      customNote: customRestOrder,
                      restaurantName: customRestName,
                      deliveryVillage: dropoffVillage,
                      distance: 0 // سيتم حسابه لاحقاً أو تقديره من الكابتن
                   });
                }} 
                disabled={isSubmitting}
                className="w-full bg-emerald-600 text-white py-6 rounded-[2rem] font-black text-lg shadow-xl active:scale-95 transition-all"
              >
                 {isSubmitting ? <Loader2 className="animate-spin h-6 w-6 mx-auto" /> : 'تأكيد وإرسال الطلب'}
              </button>
           </div>
        </div>
      )}

      <div className="page-container no-scrollbar h-full overflow-y-auto">
        <div className="p-6 md:p-10 space-y-8 pb-32 max-w-2xl mx-auto">
          {!activeOrder ? (
            <>
              <div className="flex items-center justify-between">
                 <div className="text-right">
                    <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none">وصـــلــهــا</h2>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">توصيل ذكي حقيقي للطرق</p>
                 </div>
                 <button onClick={() => setAiOpen(true)} className="p-4 bg-emerald-50 text-emerald-600 rounded-3xl active:scale-90 transition-all shadow-sm border border-emerald-100"><Bot /></button>
              </div>

              <AdsSlider ads={ads} onAdClick={(ad) => setViewingAd(ad)} />

              <div className="flex justify-center gap-4">
                  {[ 
                    { id: 'PHARMACY', label: 'صيدلية', icon: <Pill className="h-8 w-8" /> }, 
                    { id: 'FOOD', label: 'أكل', icon: <UtensilsCrossed className="h-8 w-8" /> }, 
                    { id: 'TAXI', label: 'مشوار', icon: <Bike className="h-8 w-8" /> } 
                  ].map(cat => (
                    <button key={cat.id} onClick={() => setSelectedCategory(cat.id as OrderCategory)} className={`flex-1 py-8 rounded-[2.5rem] flex flex-col items-center gap-3 bg-white card-shadow transition-all ${selectedCategory === cat.id ? 'border-4 border-emerald-500 scale-105 shadow-xl' : 'opacity-40 grayscale'}`}>
                       {cat.icon}
                       <span className="text-[10px] font-black uppercase tracking-widest">{cat.label}</span>
                    </button>
                  ))}
              </div>

              <div className="space-y-6 animate-reveal">
                {selectedCategory === 'FOOD' ? (
                  <div className="grid gap-5">
                    <div className="flex justify-between items-center px-2 flex-row-reverse">
                       <h3 className="text-lg font-black text-slate-800 text-right">المطاعم في المنوفية</h3>
                       <button onClick={() => setShowCustomRestForm(true)} className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-black text-[10px] flex items-center gap-2 active:scale-95 transition-all">
                          <PlusSquare className="h-4 w-4" /> مطعم آخر
                       </button>
                    </div>

                    {/* بطاقة طلب مطعم غير مسجل */}
                    <div onClick={() => setShowCustomRestForm(true)} className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-[3rem] shadow-xl flex flex-row-reverse justify-between items-center cursor-pointer active:scale-95 transition-all group overflow-hidden relative">
                       <div className="absolute top-0 left-0 w-32 h-full bg-white/5 skew-x-12 -translate-x-10 group-hover:translate-x-40 transition-transform duration-1000"></div>
                       <div className="flex items-center gap-4 flex-row-reverse text-right relative z-10">
                          <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-[1.5rem] flex items-center justify-center border border-white/30 shadow-lg">
                             <PlusCircle className="h-8 w-8 text-white" />
                          </div>
                          <div>
                             <h4 className="text-lg font-black text-white leading-tight">مطعمك مش في القائمة؟</h4>
                             <p className="text-[10px] font-bold text-emerald-100 opacity-80">اطلب من أي مطعم تحبه بضغطة زر</p>
                          </div>
                       </div>
                       <ArrowLeft className="h-6 w-6 text-white group-hover:-translate-x-2 transition-transform" />
                    </div>

                    {restaurants.map(rest => (
                      <div key={rest.id} onClick={() => setViewingRestaurant(rest)} className="bg-white p-5 rounded-[3rem] card-shadow flex flex-row-reverse justify-between items-center cursor-pointer hover:border-emerald-500 border-2 border-transparent transition-all active:scale-95">
                         <div className="flex items-center gap-4 flex-row-reverse text-right">
                            <div className="w-16 h-16 bg-slate-900 rounded-[1.8rem] overflow-hidden shadow-lg border border-white/10">
                               {rest.photoURL ? <img src={rest.photoURL} className="w-full h-full object-cover" /> : <UtensilsCrossed className="p-5 text-emerald-400" />}
                            </div>
                            <div><h4 className="text-lg font-black text-slate-800 leading-tight">{rest.name}</h4><p className="text-[10px] font-bold text-slate-400">{rest.category}</p></div>
                         </div>
                         <ChevronRight className="h-5 w-5 text-slate-300 rotate-180" />
                      </div>
                    ))}
                  </div>
                ) : selectedCategory === 'PHARMACY' ? (
                  <div className="space-y-6 animate-reveal">
                     <h3 className="text-xl font-black text-slate-800 text-right pr-2 border-r-4 border-emerald-500">طلب من الصيدلية</h3>
                     
                     <div className="bg-white p-6 rounded-[2.5rem] card-shadow space-y-6">
                        <div className="flex gap-4">
                           <div onClick={() => prescriptionRef.current?.click()} className="flex-1 aspect-square bg-slate-50 rounded-3xl border-4 border-dashed border-emerald-200 flex flex-col items-center justify-center cursor-pointer overflow-hidden relative group">
                              {prescriptionImg ? (
                                <>
                                  <img src={prescriptionImg} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-black">تغيير الصورة</div>
                                </>
                              ) : (
                                <>
                                  <Camera className="h-10 w-10 text-emerald-300 mb-2" />
                                  <span className="text-[10px] font-black text-slate-400">صورة الروشتة</span>
                                </>
                              )}
                           </div>
                           <input type="file" ref={prescriptionRef} className="hidden" accept="image/*" onChange={handlePrescriptionUpload} />
                           
                           <div className="flex-[2] bg-slate-50 rounded-3xl p-4 border border-slate-100">
                              <textarea 
                                value={medsList} 
                                onChange={e => setMedsList(e.target.value)} 
                                placeholder="اكتب أسماء الأدوية المطلوبة هنا..." 
                                className="w-full h-full bg-transparent border-none outline-none text-right font-bold text-xs resize-none"
                              />
                           </div>
                        </div>
                     </div>

                     <LocationSelector label="مكان التوصيل" helper="أين ستستلم طلبك؟" icon={<CheckCircle2 />} iconBg="bg-rose-500" selectedDistrict={dropoffDistrict} selectedVillage={dropoffVillage} onSelectDistrict={setDropoffDistrict} onSelectVillage={setDropoffVillage} addressNote={dropoffNote} onAddressChange={setDropoffNote} />
                     
                     <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right px-2">وسيلة التوصيل</p>
                        <div className="grid grid-cols-2 gap-3">
                           {[ { id: 'MOTORCYCLE', label: 'موتوسيكل', icon: <Bike className="h-6 w-6" /> }, { id: 'TOKTOK', label: 'توكتوك', icon: <Zap className="h-6 w-6" /> } ].map(v => (
                             <button key={v.id} onClick={() => setSelectedVehicle(v.id as VehicleType)} className={`py-6 rounded-3xl flex flex-col items-center gap-2 transition-all border-4 ${selectedVehicle === v.id ? 'bg-emerald-50 border-emerald-500 text-emerald-600 scale-105 shadow-lg' : 'bg-slate-50 border-transparent text-slate-300'}`}>
                                {v.icon} <span className="text-[9px] font-black">{v.label}</span>
                             </button>
                           ))}
                        </div>
                     </div>

                     {dropoffVillage && (
                        <div className="bg-emerald-50 p-6 rounded-[2.5rem] border-2 border-emerald-100 flex justify-between items-center animate-in zoom-in shadow-sm">
                           <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-50">
                              <p className="text-2xl font-black text-emerald-600">
                                 {isCalculatingDist ? <Loader2 className="h-5 w-5 animate-spin" /> : `${getEstimatedPrice()} ج.م`}
                              </p>
                           </div>
                           <div className="text-right">
                              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">
                                 {isCalculatingDist ? 'جاري الحساب...' : `توصيل: ${actualRoadDist} كم`}
                              </p>
                              <p className="text-[11px] font-bold text-slate-400 mt-1">سعر تقريبي للتوصيل</p>
                           </div>
                        </div>
                     )}

                     <button onClick={() => handleCreateOrder()} disabled={isSubmitting || !dropoffVillage || isCalculatingDist} className="w-full bg-slate-950 text-white py-7 rounded-[2.5rem] font-black text-xl shadow-2xl active:scale-95 transition-all">
                        {isSubmitting ? <Loader2 className="animate-spin h-7 w-7 mx-auto" /> : 'إرسال طلب الصيدلية'}
                     </button>
                  </div>
                ) : (
                  <>
                    {selectedCategory === 'TAXI' && (
                      <LocationSelector label="نقطة الانطلاق" helper="موقع استلامك" icon={<MapPin />} iconBg="bg-emerald-500" selectedDistrict={pickupDistrict} selectedVillage={pickupVillage} onSelectDistrict={setPickupDistrict} onSelectVillage={setPickupVillage} addressNote={pickupNote} onAddressChange={setPickupNote} />
                    )}
                    <LocationSelector label="مكان التوصيل" helper="أين ستستلم طلبك؟" icon={<CheckCircle2 />} iconBg="bg-rose-500" selectedDistrict={dropoffDistrict} selectedVillage={dropoffVillage} onSelectDistrict={setDropoffDistrict} onSelectVillage={setDropoffVillage} addressNote={dropoffNote} onAddressChange={setDropoffNote} />
                    
                    <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-right px-2">اختر وسيلة التوصيل</p>
                       <div className="grid grid-cols-3 gap-3">
                          {[ { id: 'MOTORCYCLE', label: 'موتوسيكل', icon: <Bike className="h-6 w-6" /> }, { id: 'TOKTOK', label: 'توكتوك', icon: <Zap className="h-6 w-6" /> }, { id: 'CAR', label: 'سيارة', icon: <Car className="h-6 w-6" /> } ].map(v => (
                            <button key={v.id} onClick={() => setSelectedVehicle(v.id as VehicleType)} className={`py-6 rounded-3xl flex flex-col items-center gap-2 transition-all border-4 ${selectedVehicle === v.id ? 'bg-emerald-50 border-emerald-500 text-emerald-600 scale-105 shadow-lg' : 'bg-slate-50 border-transparent text-slate-300'}`}>
                               {v.icon} <span className="text-[9px] font-black">{v.label}</span>
                            </button>
                          ))}
                       </div>
                    </div>

                    {dropoffVillage && (
                       <div className="bg-emerald-50 p-6 rounded-[2.5rem] border-2 border-emerald-100 flex justify-between items-center animate-in zoom-in shadow-sm">
                          <div className="bg-white p-4 rounded-2xl shadow-sm border border-emerald-50">
                             <p className="text-2xl font-black text-emerald-600">
                                {isCalculatingDist ? <Loader2 className="h-5 w-5 animate-spin" /> : `${getEstimatedPrice()} ج.م`}
                             </p>
                          </div>
                          <div className="text-right">
                             <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest leading-none">
                                {isCalculatingDist ? 'جاري حساب مسافة الطريق...' : `مسافة الطريق: ${actualRoadDist} كم`}
                             </p>
                             <p className="text-[11px] font-bold text-slate-400 mt-1">سعر الكيلومتر: {DEFAULT_PRICING.pricePerKm} جنيه</p>
                          </div>
                       </div>
                    )}

                    <button onClick={() => handleCreateOrder()} disabled={isSubmitting || !dropoffVillage || isCalculatingDist} className="w-full bg-slate-950 text-white py-7 rounded-[2.5rem] font-black text-xl shadow-2xl active:scale-95 transition-all">
                       {isSubmitting ? <Loader2 className="animate-spin h-7 w-7 mx-auto" /> : 'إرسال طلب التوصيل الآن'}
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-12 py-10">
               {activeOrder.status === OrderStatus.WAITING_FOR_OFFERS ? (
                 <div className="text-center space-y-8 animate-reveal">
                    <div className="bg-white p-12 rounded-full card-shadow relative inline-block border-4 border-emerald-50 shadow-2xl shadow-emerald-900/10">
                       <Radar className="h-20 w-20 text-emerald-600 animate-pulse" />
                    </div>
                    <div className="space-y-2">
                       <h2 className="text-3xl font-black text-slate-900 tracking-tighter">جاري البحث عن كباتن متاحين...</h2>
                       <p className="text-xs font-bold text-slate-400">ستظهر العروض في الأسفل خلال لحظات</p>
                    </div>

                    <div className="space-y-4">
                       {incomingOffers.map(offer => (
                         <div key={offer.id} className="bg-white p-6 rounded-[2.5rem] card-shadow flex justify-between items-center animate-in zoom-in border-2 border-emerald-50 hover:border-emerald-500 transition-all">
                            <button onClick={() => handleAcceptOffer(offer)} className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black text-xs shadow-lg active:scale-95 transition-all">قبول {offer.price} ج.م</button>
                            <div className="text-right">
                               <p className="font-black text-slate-900">{offer.driverName}</p>
                               <div className="flex items-center gap-1 justify-end"><span className="text-[10px] font-black text-amber-500">{offer.driverRating || '5.0'}</span><Star className="h-3 w-3 fill-amber-400 text-amber-400" /></div>
                            </div>
                         </div>
                       ))}
                    </div>
                    <button onClick={() => updateDoc(doc(db, "orders", activeOrder.id), { status: OrderStatus.CANCELLED })} className="text-rose-500 font-black text-xs uppercase hover:underline tracking-widest mt-8">إلغاء الطلب</button>
                 </div>
               ) : activeOrder.status === OrderStatus.DELIVERED ? (
                 <div className="animate-in zoom-in space-y-8 text-center bg-white p-10 rounded-[4rem] shadow-2xl border-4 border-emerald-500/10">
                    <PartyPopper className="h-20 w-20 text-emerald-500 mx-auto animate-bounce" />
                    <h2 className="text-3xl font-black text-slate-900 tracking-tighter">الحمد لله على السلامة!</h2>
                    <div className="bg-slate-50 p-8 rounded-[3.5rem] space-y-8 shadow-inner">
                       <div className="space-y-2">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4 block">قيم تجربتك مع الكابتن {activeOrder.driverName}</p>
                          <div className="h-1 w-12 bg-emerald-500 mx-auto rounded-full"></div>
                       </div>
                       <div className="flex justify-center gap-3">
                          {[1,2,3,4,5].map(s => (
                            <button 
                              key={s} 
                              type="button"
                              onClick={() => setRating(s)} 
                              className={`transition-all active:scale-75 border-none bg-transparent outline-none ${rating >= s ? 'scale-110 drop-shadow-xl' : 'opacity-20 grayscale'}`}
                            >
                               <Star className={`h-12 w-12 ${rating >= s ? 'fill-amber-400 text-amber-400' : 'text-slate-300'}`} />
                            </button>
                          ))}
                       </div>
                       <textarea 
                         value={feedback} 
                         onChange={e => setFeedback(e.target.value)} 
                         placeholder="كيف كانت الخدمة؟ (اختياري)" 
                         className="w-full bg-white border-2 border-slate-100 rounded-[2rem] p-6 font-bold text-sm outline-none text-right shadow-sm focus:border-emerald-500 transition-all" 
                         dir="rtl" 
                       />
                    </div>
                    <button 
                      onClick={handleRateOrder} 
                      disabled={isSubmitting}
                      className="w-full bg-[#10b981] text-white py-7 rounded-[3rem] font-black text-2xl shadow-2xl flex items-center justify-center gap-4 active:scale-95 transition-all shadow-emerald-900/10"
                    >
                       {isSubmitting ? <Loader2 className="h-8 w-8 animate-spin" /> : <><ThumbsUp className="h-8 w-8" /> تأكيد التقييم</>}
                    </button>
                 </div>
               ) : (
                 <div className="space-y-8 animate-reveal">
                    <div className="bg-emerald-600 p-8 rounded-[3rem] text-white flex justify-between items-center shadow-xl">
                       <div className="text-right"><p className="text-xs font-black opacity-60 uppercase mb-1">تتبع الرحلة</p><h3 className="text-2xl font-black">{activeOrder.status}</h3></div>
                       <div className="bg-white/20 p-4 rounded-2xl"><Navigation className="h-8 w-8 animate-bounce" /></div>
                    </div>
                    <div className="flex flex-col items-center gap-6">
                       <div className="w-32 h-32 bg-white rounded-[3rem] shadow-2xl border-8 border-slate-100 flex items-center justify-center overflow-hidden relative">
                          {activeOrder.driverPhoto ? <img src={activeOrder.driverPhoto} className="w-full h-full object-cover" /> : (activeOrder.driverName || 'ك')[0]}
                       </div>
                       <div className="text-center"><h4 className="text-3xl font-black text-slate-950 tracking-tight">{activeOrder.driverName}</h4><p className="text-xs font-bold text-emerald-600 bg-emerald-50 px-6 py-2 rounded-full inline-block mt-2">كابتن معتمد</p></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                       <a href={`tel:${activeOrder.driverPhone}`} className="bg-slate-950 text-white py-6 rounded-3xl font-black flex items-center justify-center gap-3 shadow-xl active:scale-95"><PhoneCall className="h-6 w-6" /> اتصال</a>
                       <button onClick={() => setShowChat(true)} className="bg-white border-2 border-slate-100 text-slate-900 py-6 rounded-3xl font-black flex items-center justify-center gap-3 active:scale-95 shadow-sm"><MessageCircle className="h-6 w-6" /> دردشة</button>
                    </div>
                 </div>
               )}
            </div>
          )}
        </div>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-2xl border-t border-slate-100 px-6 py-6 flex justify-around items-center z-[150] shadow-2xl flex-row-reverse rounded-t-[3.5rem]">
         {[ {id: 'NEW', icon: <Home className="h-6 w-6" />, label: 'الرئيسية'}, {id: 'ACTIVITY', icon: <History className="h-6 w-6" />, label: 'نشاطي'}, {id: 'PROFILE', icon: <UserIcon className="h-6 w-6" />, label: 'حسابي'} ].map(tab => (
           <button key={tab.id} onClick={() => setActiveView(tab.id as any)} className={`flex flex-col items-center gap-1.5 transition-all border-none bg-transparent ${activeView === tab.id ? 'text-[#2D9469]' : 'text-slate-300'}`}><div className={`p-3.5 rounded-2xl transition-all ${activeView === tab.id ? 'bg-[#EBFDF5] shadow-inner scale-110' : ''}`}>{tab.icon}</div><span className="text-[9px] font-black uppercase tracking-widest">{tab.label}</span></button>
         ))}
      </nav>
    </div>
  );
};

export default CustomerDashboard;
