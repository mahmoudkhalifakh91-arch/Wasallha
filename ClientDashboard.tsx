
import React, { useState, useEffect } from 'react';
// Fixed: Removed missing exported members Location and PricingConfig
import { User, Order, OrderStatus } from '../types';
// Fixed: DEFAULT_PRICING is now exported from constants
import { STORAGE_KEYS, DEFAULT_PRICING, PLATFORM_COMMISSION_RATE } from '../constants';
import { MapPin, Navigation, DollarSign, Clock, CheckCircle2, XCircle } from 'lucide-react';

interface ClientDashboardProps {
  user: User;
}

const ClientDashboard: React.FC<ClientDashboardProps> = ({ user }) => {
  const [pickup, setPickup] = useState<string>('ميدان العروسة، أشمون');
  const [destination, setDestination] = useState<string>('شارع السنترال، أشمون');
  const [orders, setOrders] = useState<Order[]>([]);
  const [isRequesting, setIsRequesting] = useState(false);
  
  // Simulated pricing calculation
  const calculatePrice = () => {
    const dist = 2.5; // Mocked distance
    const { basePrice, pricePerKm, minPrice } = DEFAULT_PRICING;
    const calculated = basePrice + (dist * pricePerKm);
    return Math.max(calculated, minPrice);
  };

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ORDERS);
    if (saved) {
      const allOrders: Order[] = JSON.parse(saved);
      // Fixed: Property clientId does not exist on type Order, changed to customerId
      setOrders(allOrders.filter(o => o.customerId === user.id));
    }
  }, [user.id]);

  const createOrder = () => {
    setIsRequesting(true);
    const price = calculatePrice();
    
    // Calculate shares (mocked percentages)
    const commission = price * (PLATFORM_COMMISSION_RATE || 0.1);
    const operatorCut = price * 0.15;
    const driverCut = price - commission - operatorCut;

    // Fixed: Updated object literal to match Order interface (customerId, customerPhone, dropoff, etc.)
    // Fixed: Added missing paymentMethod property to satisfy Order interface
    // Fixed: Added missing requestedVehicleType property to satisfy Order interface
    // Fixed: Added missing category property to satisfy Order interface
    const newOrder: Order = {
      id: `order_${Date.now()}`,
      customerId: user.id,
      customerPhone: user.phone,
      operatorId: 'op_1',
      zoneId: 'zone_central',
      category: 'TAXI',
      pickup: { lat: 30.298, lng: 30.983, address: pickup },
      dropoff: { lat: 30.31, lng: 30.99, address: destination },
      distance: 2.5,
      price: price,
      commission: commission,
      operatorCut: operatorCut,
      driverCut: driverCut,
      status: OrderStatus.PENDING,
      createdAt: Date.now(),
      paymentMethod: 'CASH',
      requestedVehicleType: 'TOKTOK'
    };

    setTimeout(() => {
      const existing = JSON.parse(localStorage.getItem(STORAGE_KEYS.ORDERS) || '[]');
      const updated = [newOrder, ...existing];
      localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(updated));
      setOrders(prev => [newOrder, ...prev]);
      setIsRequesting(false);
      alert('تم إرسال طلبك بنجاح! جاري البحث عن أقرب مندوب.');
    }, 1500);
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case OrderStatus.PENDING: return { text: 'في انتظار مندوب', color: 'bg-amber-100 text-amber-700', icon: <Clock className="h-4 w-4" /> };
      case OrderStatus.ACCEPTED: return { text: 'مندوب في الطريق إليك', color: 'bg-blue-100 text-blue-700', icon: <Navigation className="h-4 w-4" /> };
      case OrderStatus.PICKED_UP: return { text: 'جاري التوصيل', color: 'bg-indigo-100 text-indigo-700', icon: <Navigation className="h-4 w-4" /> };
      case OrderStatus.DELIVERED: return { text: 'تم التسليم', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="h-4 w-4" /> };
      case OrderStatus.CANCELLED: return { text: 'ملغي', color: 'bg-rose-100 text-rose-700', icon: <XCircle className="h-4 w-4" /> };
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Order Panel */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Navigation className="h-5 w-5 text-emerald-600" />
            طلب جديد
          </h2>
          
          <div className="space-y-4">
            <div className="relative pb-6">
              <div className="absolute top-8 bottom-4 right-5 w-0.5 bg-gray-200 border-dashed border-l"></div>
              
              <div className="flex items-start gap-3 relative">
                <div className="mt-1 h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">نقطة الاستلام</label>
                  <input 
                    className="w-full mt-1 bg-gray-50 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500"
                    value={pickup}
                    onChange={e => setPickup(e.target.value)}
                    placeholder="أين سيسلمك المندوب؟"
                  />
                </div>
              </div>
              
              <div className="flex items-start gap-3 mt-6 relative">
                <div className="mt-1 h-10 w-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                  <MapPin className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">وجهة التسليم</label>
                  <input 
                    className="w-full mt-1 bg-gray-50 border-none rounded-lg p-3 text-sm focus:ring-2 focus:ring-emerald-500"
                    value={destination}
                    onChange={e => setDestination(e.target.value)}
                    placeholder="إلى أين نذهب؟"
                  />
                </div>
              </div>
            </div>

            <div className="bg-emerald-50 p-4 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-emerald-700 font-bold">التكلفة التقريبية</p>
                <p className="text-2xl font-extrabold text-emerald-800">{calculatePrice()} ج.م</p>
              </div>
              <DollarSign className="h-10 w-10 text-emerald-600 opacity-20" />
            </div>

            <button 
              onClick={createOrder}
              disabled={isRequesting}
              className={`w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all transform active:scale-95 ${isRequesting ? 'bg-gray-400' : 'bg-emerald-600 hover:bg-emerald-700'}`}
            >
              {isRequesting ? 'جاري الطلب...' : 'اطلب الآن'}
            </button>
          </div>
        </div>
      </div>

      {/* Map Simulation & Recent Orders */}
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden h-64 relative group">
          <div className="absolute inset-0 bg-emerald-50 flex items-center justify-center">
            <div className="text-center">
              <MapPin className="h-12 w-12 text-emerald-600 mx-auto animate-bounce" />
              <p className="mt-2 text-emerald-800 font-bold">خريطة أشمون التفاعلية</p>
              <p className="text-sm text-emerald-600 px-4 opacity-75">سيتم عرض المسار والمندوب هنا فور قبوله للطلب</p>
            </div>
          </div>
          {/* Placeholder Grid */}
          <div className="absolute inset-0 grid grid-cols-12 grid-rows-6 opacity-10 pointer-events-none">
            {Array.from({ length: 72 }).map((_, i) => (
              <div key={i} className="border border-emerald-900"></div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Clock className="h-5 w-5 text-emerald-600" />
            طلباتي الأخيرة
          </h2>
          
          {orders.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-dashed border-gray-300">
              <p className="text-gray-400">لا توجد طلبات سابقة حتى الآن</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {orders.map(order => {
                const status = getStatusLabel(order.status);
                return (
                  <div key={order.id} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`p-3 rounded-full ${status.color}`}>
                        {status.icon}
                      </div>
                      <div>
                        <p className="font-bold text-gray-800">{order.dropoff.address}</p>
                        <p className="text-xs text-gray-500">من: {order.pickup.address}</p>
                        <p className="text-xs text-gray-400 mt-1">{new Date(order.createdAt).toLocaleString('ar-EG')}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between md:flex-col md:items-end gap-2 border-t md:border-t-0 pt-3 md:pt-0">
                      <span className={`text-xs px-3 py-1 rounded-full font-bold ${status.color}`}>
                        {status.text}
                      </span>
                      <p className="font-extrabold text-emerald-700">{order.price} ج.م</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientDashboard;
