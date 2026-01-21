
import React, { useState, useEffect } from 'react';

// Types
import type { User, Order } from '../types';
import { OrderStatus } from '../types';
import { MENOFIA_DATA } from '../config/constants';

// Services
import { db } from '../services/firebase';
import { collection, query, where, onSnapshot } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// Utils
import { stripFirestore } from '../utils';

// Icons
import { 
  Clock, Loader2, ChevronRight, CheckCircle2, 
  XCircle, Bike, Car, MapPin, Building2, Filter 
} from 'lucide-react';

const ActivityView: React.FC<{ user: User, onBack: () => void }> = ({ user, onBack }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDistrict, setSelectedDistrict] = useState<string>('الكل');

  useEffect(() => {
    const field = user.role === 'DRIVER' ? 'driverId' : 'customerId';
    const q = query(collection(db, "orders"), where(field, "==", user.id));
    return onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...stripFirestore(d.data()) })) as Order[];
      setOrders(docs.sort((a, b) => b.createdAt - a.createdAt));
      setLoading(false);
    });
  }, [user.id, user.role]);

  const getDistrictName = (villageName?: string) => {
    return MENOFIA_DATA.find(d => d.villages.some(v => v.name === villageName))?.name || 'المنوفية';
  };

  const getStatusStyle = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.DELIVERED:
      case OrderStatus.DELIVERED_RATED:
        return 'bg-emerald-100 text-emerald-600';
      case OrderStatus.CANCELLED:
        return 'bg-rose-100 text-rose-600';
      default:
        return 'bg-slate-100 text-slate-400';
    }
  };

  const filteredOrders = orders.filter(o => {
    if (selectedDistrict === 'الكل') return true;
    const pickupDist = getDistrictName(o.pickup?.villageName);
    const dropoffDist = getDistrictName(o.dropoff?.villageName);
    return pickupDist === selectedDistrict || dropoffDist === selectedDistrict;
  });

  return (
    <div className="max-w-2xl mx-auto space-y-8 pb-32 p-6 animate-in slide-in-from-right duration-500 h-full overflow-y-auto no-scrollbar">
      <div className="flex justify-between items-center px-2">
        <div className="text-right">
           <h2 className="text-3xl font-black text-slate-900 tracking-tighter">تاريخ مشاويري</h2>
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">سجل رحلاتك في المنوفية</p>
        </div>
        <button onClick={onBack} className="p-3.5 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm active:scale-90 transition-all">
          <ChevronRight />
        </button>
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2">
         <button 
           onClick={() => setSelectedDistrict('الكل')}
           className={`px-6 py-3 rounded-2xl text-[10px] font-black whitespace-nowrap transition-all border ${selectedDistrict === 'الكل' ? 'bg-slate-900 border-slate-900 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:text-slate-900'}`}
         >
           الكل
         </button>
         {MENOFIA_DATA.map(d => (
           <button 
             key={d.id}
             onClick={() => setSelectedDistrict(d.name)}
             className={`px-6 py-3 rounded-2xl text-[10px] font-black whitespace-nowrap transition-all border ${selectedDistrict === d.name ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400 hover:text-emerald-600'}`}
           >
             مركز {d.name}
           </button>
         ))}
      </div>

      <div className="space-y-6">
        {loading ? (
          <div className="py-20 flex justify-center"><Loader2 className="h-10 w-10 animate-spin text-emerald-500" /></div>
        ) : filteredOrders.length === 0 ? (
          <div className="py-32 text-center text-slate-300 font-bold border-4 border-dashed border-slate-100 rounded-[4rem] bg-white/50">
            <Filter className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>لا يوجد سجل في هذه المنطقة حالياً</p>
          </div>
        ) : filteredOrders.map(order => (
          <div key={order.id} className="bg-white p-8 rounded-[3.5rem] border border-slate-50 shadow-sm flex flex-col gap-6 hover:shadow-xl transition-all group animate-in slide-in-from-bottom">
            <div className="flex justify-between items-start">
               <div className="flex items-center gap-4">
                  <div className="bg-slate-50 p-4 rounded-2xl text-slate-400 group-hover:bg-slate-950 group-hover:text-emerald-400 transition-all">
                    {order.requestedVehicleType === 'CAR' ? <Car className="h-6 w-6" /> : <Bike className="h-6 w-6" />}
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{new Date(order.createdAt).toLocaleDateString('ar-EG')}</p>
                    <span className={`inline-block mt-1 px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${getStatusStyle(order.status)}`}>{order.status}</span>
                  </div>
               </div>
               <p className="text-2xl font-black text-slate-900">{order.price} <span className="text-xs font-bold opacity-30">ج.م</span></p>
            </div>

            <div className="space-y-4 px-2">
               <div className="flex gap-4 items-start text-right">
                  <div className="bg-slate-50 p-2 rounded-xl mt-1"><MapPin className="h-4 w-4 text-emerald-500 shrink-0" /></div>
                  <div className="flex-1">
                    <p className="text-sm font-black text-slate-800 leading-tight">
                       مركز {getDistrictName(order.pickup?.villageName)} ({order.pickup?.villageName})
                       <br />
                       ← مركز {getDistrictName(order.dropoff?.villageName)} ({order.dropoff?.villageName})
                    </p>
                  </div>
               </div>
            </div>

            <div className="pt-4 border-t border-slate-50 flex justify-between items-center text-[10px] font-bold text-slate-300 uppercase tracking-widest">
               <span>ID: #{order.id.slice(-6)}</span>
               <div className="flex items-center gap-2">
                  <span className="text-slate-400">{user.role === 'DRIVER' ? 'العميل' : 'الكابتن'}</span>
                  <p className="text-slate-600 font-black">{user.role === 'DRIVER' ? order.customerPhone : (order.driverName || 'بانتظار عرض')}</p>
               </div>
            </div>
          </div>
        ))}
      </div>
      <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.5em] py-8">وصـــلــهــا المنوفية • تغطية شاملة</p>
    </div>
  );
};

export default ActivityView;
