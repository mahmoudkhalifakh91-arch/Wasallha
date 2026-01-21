
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

export interface Ad {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  ctaText: string; // نص الزر مثل "اطلب الآن"
  type: 'special_offer' | 'restaurant' | 'service' | 'general';
  targetId?: string; // ID المطعم أو الخدمة المرتبطة
  targetCategory?: OrderCategory;
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
  menu: MenuItem[];
  isOpen: boolean;
  isFeatured?: boolean;
  promoText?: string;
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

export interface District {
  id: string;
  name: string;
  villages: Village[];
}

export interface User {
  id: string;
  email: string;
  phone: string;
  name: string;
  password?: string; // حقل كلمة السر للإدارة
  role: UserRole;
  status: UserStatus;
  photoURL?: string;
  vehicleType?: VehicleType;
  zoneId?: string;
  wallet: {
    balance: number;
    totalEarnings: number;
    withdrawn: number;
  };
}

export interface Order {
  id: string;
  customerId: string;
  customerPhone: string;
  driverId?: string;
  driverName?: string;
  driverPhone?: string;
  driverPhoto?: string;
  driverRating?: number;
  category: OrderCategory;
  pickup: { address: string; lat: number; lng: number; villageName?: string };
  dropoff: { address: string; lat: number; lng: number; villageName?: string };
  status: OrderStatus;
  price: number;
  distance: number;
  createdAt: number;
  paymentMethod: PaymentMethod;
  requestedVehicleType: VehicleType;
  foodItems?: CartItem[];
  restaurantId?: string;
  restaurantName?: string;
  pickupNotes?: string;
  dropoffNotes?: string;
  passengerCount?: number;
  prescriptionImage?: string;
  notes?: string;
  rating?: number;
  feedback?: string;
}
