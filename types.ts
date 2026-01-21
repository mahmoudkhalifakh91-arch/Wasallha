
export type UserRole = 'ADMIN' | 'OPERATOR' | 'DRIVER' | 'CUSTOMER';
export type UserStatus = 'PENDING_APPROVAL' | 'APPROVED' | 'SUSPENDED';
export type PaymentMethod = 'CASH' | 'WALLET';
export type VehicleType = 'TOKTOK' | 'MOTORCYCLE' | 'CAR';
export type OrderCategory = 'TAXI' | 'FOOD' | 'PHARMACY' | 'GROCERY' | 'PARCEL';

export enum OrderStatus {
  PENDING = 'PENDING',
  WAITING_FOR_OFFERS = 'WAITING_FOR_OFFERS',
  ACCEPTED = 'ACCEPTED',
  PICKED_UP = 'PICKED_UP',
  ON_THE_WAY = 'ON_THE_WAY',
  DELIVERED = 'DELIVERED',
  DELIVERED_RATED = 'DELIVERED_RATED',
  CANCELLED = 'CANCELLED'
}

// Added Ad interface to fix exported member errors in dashboards
export interface Ad {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string; // نص الزر مثل "اطلب الآن"
  type: 'special_offer' | 'restaurant' | 'service' | 'general';
  targetId?: string; // ID المطعم أو الخدمة المرتبطة
  targetCategory?: OrderCategory;
  whatsappNumber?: string; // حقل رقم الواتساب الجديد
  isActive: boolean;
  displayOrder: number;
  views: number;
  clicks: number;
  createdAt: number;
}

export interface MenuItem {
  id: string;
  name: string;
  price: number;
  description?: string;
  photoURL?: string;
}

export interface Restaurant {
  id: string;
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
  photoURL?: string;
  menuImageURL?: string; 
  menuImageURLs?: string[];
  menu: MenuItem[];
  isOpen: boolean;
  isFeatured?: boolean; // حقل جديد للإعلانات
  promoText?: string;   // نص العرض الخاص
}

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Offer {
  id: string;
  orderId: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  driverRating: number;
  driverPhoto?: string;
  vehicleType: VehicleType;
  price: number;
  createdAt: number;
}

export interface Village {
  id: string;
  name: string;
  center: { lat: number, lng: number };
}

// Added District interface to fix exported member errors in constants.ts and dashboards
export interface District {
  id: string;
  name: string;
  villages: Village[];
}

export interface Zone {
  id: string;
  name: string;
  operatorId: string;
  pricing: {
    basePrice: number;
    pricePerKm: number;
    minPrice: number;
    maxPrice: number;
    sameVillagePrice: number;
    multipliers: Record<VehicleType, number>;
  };
  center: { lat: number; lng: number };
  villages?: Village[];
}

export interface Order {
  id: string;
  customerId: string;
  customerPhone: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverPhoto?: string;
  // Added driverRating to support displaying driver rating in CustomerDashboard
  driverRating?: number;
  operatorId: string;
  zoneId: string;
  category: OrderCategory;
  pickup: { address: string; lat: number; lng: number; villageName?: string };
  dropoff: { address: string; lat: number; lng: number; villageName?: string };
  status: OrderStatus;
  price: number;
  distance: number;
  commission: number;
  operatorCut: number;
  driverCut: number;
  createdAt: number;
  acceptedAt?: number;
  deliveredAt?: number;
  cancelledAt?: number;
  ratedAt?: number;
  notes?: string;
  pickupNotes?: string;
  dropoffNotes?: string;
  passengerCount?: number;
  prescriptionImage?: string;
  paymentMethod: PaymentMethod;
  requestedVehicleType: VehicleType;
  transactionId?: string;
  rating?: number;
  feedback?: string;
  foodItems?: CartItem[];
  restaurantId?: string;
  restaurantName?: string;
}

export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  role: UserRole;
  status: UserStatus;
  photoURL?: string;
  password?: string; // حقل كلمة السر (لأغراض الإدارة)
  vehicleType?: VehicleType;
  plateNumber?: string; // رقم لوحة المركبة
  operatorId?: string;
  zoneId?: string;
  wallet: {
    balance: number;
    totalEarnings: number;
    withdrawn: number;
  };
  location?: {
    lat: number;
    lng: number;
    updatedAt: number;
  };
}
