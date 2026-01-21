
import React, { useState, useEffect } from 'react';
import { User, Order, OrderStatus } from '../types';
import { STORAGE_KEYS } from '../constants';
import { MapPin, Navigation, Phone, CheckCircle, AlertCircle } from 'lucide-react';

const DriverDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [availableOrders, setAvailableOrders] = useState<Order[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  useEffect(() => {
    const refresh = () => {
      const all: Order[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
      // Show orders for the driver's operator and within his zone
      const available = all.filter(o => o.status === OrderStatus.PENDING && o.operatorId === user.operatorId);
      setAvailableOrders(available);

      const active = all.find(o => o.driverId === user.id && [OrderStatus.ACCEPTED, OrderStatus.PICKED_UP].includes(o.status));
      setActiveOrder(active || null);
    };

    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [user.id, user.operatorId]);

  const updateOrder = (orderId: string, newStatus: OrderStatus) => {
    const all: Order[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
    const idx = all.findIndex(o => o.id === orderId);
    if (idx !== -1) {
      all[idx].status = newStatus;
      if (newStatus === OrderStatus.ACCEPTED) all[idx].driverId = user.id;
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(all));
      alert(`تم تحديث حالة الطلب إلى: ${newStatus}`);
    }
  };

  // Fixed: Property 'isApproved' does not exist on type 'User', using status field instead
  if (user.status !== 'APPROVED') {
    return (
      <div className="bg-amber-50 p-8 rounded-3xl border-2 border-amber-200 text-center max-w-lg mx-auto">
        <AlertCircle className="h-16 w-16 text-amber-500 mx-auto mb-4" />
        <h2 className="text-2xl font-black text-amber-800">حسابك بانتظار التفعيل</h2>
        <p className="mt-2 text-amber-700 opacity-80 leading-relaxed">
          شكراً لتسجيلك كمندوب في مشوار أشمون. يرجى التواصل مع المشغل المحلي لتفعيل حسابك والبدء في استقبال الطلبات.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {activeOrder ? (
        <div className="space-y-4">
          <h2 className="text-xl font-black flex items-center gap-2">
            <Navigation className="text-emerald-600" />
            المهمة الحالية
          </h2>
          <div className="bg-white rounded-3xl shadow-xl border border-emerald-100 overflow-hidden">
            <div className="bg-emerald-600 p-6 text-white flex justify-between items-center">
              <div>
                <p className="text-xs opacity-80">حالة التوصيل</p>
                <p className="text-xl font-black">{activeOrder.status === OrderStatus.ACCEPTED ? 'توجه للاستلام' : 'جاري التوصيل'}</p>
              </div>
              <div className="text-right">
                <p className="text-xs opacity-80">مطلوب تحصيله</p>
                <p className="text-2xl font-black">{activeOrder.price} ج.م</p>
              </div>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="space-y-4">
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600 shrink-0">
                    <MapPin />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400">نقطة الاستلام</p>
                    <p className="font-bold">{activeOrder.pickup.address}</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="h-10 w-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-600 shrink-0">
                    <MapPin />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400">وجهة العميل</p>
                    <p className="font-bold">{activeOrder.dropoff.address}</p>
                  </div>
                </div>
              </div>

              <div className="flex gap-3">
                <a href={`tel:${activeOrder.customerPhone}`} className="flex-1 bg-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2">
                  <Phone className="h-5 w-5" />
                  اتصال بالعميل
                </a>
                {activeOrder.status === OrderStatus.ACCEPTED ? (
                  <button onClick={() => updateOrder(activeOrder.id, OrderStatus.PICKED_UP)} className="flex-1 bg-emerald-600 text-white font-bold py-4 rounded-2xl">
                    تم الاستلام
                  </button>
                ) : (
                  <button onClick={() => updateOrder(activeOrder.id, OrderStatus.DELIVERED)} className="flex-1 bg-emerald-600 text-white font-bold py-4 rounded-2xl">
                    تم التسليم
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-black">طلبات متاحة في منطقتك</h2>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping"></span>
              <span className="text-xs font-bold text-emerald-600">أونلاين</span>
            </div>
          </div>

          {availableOrders.length === 0 ? (
            <div className="bg-white p-20 text-center rounded-3xl border-2 border-dashed border-slate-200">
              <p className="text-slate-400 font-bold">لا توجد طلبات جديدة حالياً</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {availableOrders.map(order => (
                <div key={order.id} className="bg-white p-5 rounded-3xl shadow-sm border border-slate-100 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="bg-emerald-50 px-3 py-1 rounded-lg">
                      <span className="text-emerald-700 font-black">{order.price} ج.م</span>
                    </div>
                    <span className="text-[10px] text-slate-300">منذ دقيقة</span>
                  </div>
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-slate-400">المسار:</p>
                    <p className="text-sm font-bold truncate">من: {order.pickup.address}</p>
                    <p className="text-sm font-bold truncate">إلى: {order.dropoff.address}</p>
                  </div>
                  <button 
                    onClick={() => updateOrder(order.id, OrderStatus.ACCEPTED)}
                    className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl hover:bg-emerald-700 transition-all"
                  >
                    قبول المهمة
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DriverDashboard;
