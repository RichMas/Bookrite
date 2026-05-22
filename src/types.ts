export type UserRole = 'customer' | 'provider' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  role: UserRole;
  createdAt: any;
}

export interface Review {
  id: string;
  bookingId: string;
  customerId: string;
  customerName: string;
  providerId: string;
  rating: number;
  comment: string;
  createdAt: any;
}

export interface Chat {
  id: string;
  members: string[]; // [customerId, providerId]
  customerName: string;
  providerName: string;
  lastMessage?: string;
  lastMessageAt?: any;
  unreadCount?: Record<string, number>;
  updatedAt: any;
}

export interface Message {
  id: string;
  senderId: string;
  text: string;
  createdAt: any;
}

export type Category = 
  | 'Plumbers, Electricians & Mechanics' 
  | 'Handyman' 
  | 'Bakkie Hire' 
  | 'Catering' 
  | 'Personal Trainer' 
  | 'Private Chef' 
  | 'Builders' 
  | 'Machine Hire' 
  | 'Guesthouses & BnBs' 
  | 'Hair & Beauty' 
  | 'Art & Tattoos' 
  | 'Photographer' 
  | 'Tutors'
  | 'Backroom Rentals'
  | 'Bricklayers and Painters'
  | 'Cleaner';

export interface ServiceItem {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  unit?: string;
  custom?: boolean;
}

export interface DayAvailability {
  enabled: boolean;
  slots: string[]; // e.g. ["09:00", "10:00"]
}

export interface ProviderProfile {
  uid: string;
  name: string;
  category: Category;
  categories?: Category[];
  description: string;
  location: string;
  photoURL?: string;
  rating: number;
  reviewCount: number;
  isApproved: boolean;
  isVerified: 'pending' | 'verified' | 'rejected' | 'requirements' | 'none';
  ficaDocUrl?: string;
  verificationFeedback?: string;
  services: ServiceItem[];
  availability: Record<string, DayAvailability>; // "monday", "tuesday", etc.
  createdAt: any;
}

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface Booking {
  id: string;
  customerId: string;
  customerName: string;
  providerId: string;
  providerName: string;
  serviceName: string;
  category: string;
  date: string; 
  time: string;
  status: BookingStatus;
  totalAmount: number;
  paymentStatus: 'unpaid' | 'paid';
  payoutStatus: 'pending' | 'paid_to_provider';
  createdAt: any;
}
