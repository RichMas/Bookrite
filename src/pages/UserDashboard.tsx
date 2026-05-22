import React, { useState, useEffect } from 'react';
import { useAuth } from '../App';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs, updateDoc, doc, getDoc, serverTimestamp, setDoc, addDoc, onSnapshot, orderBy } from 'firebase/firestore';
import { Booking, ProviderProfile, ServiceItem, Review, Chat } from '../types';
import { 
  User, 
  Calendar, 
  Settings, 
  ChevronRight, 
  Check, 
  X, 
  MapPin, 
  Briefcase, 
  Star, 
  Clock, 
  Plus, 
  Trash2, 
  Save, 
  ShieldCheck, 
  FileText, 
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  MessageCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ChatWindow from '../components/ChatWindow';
import { format } from 'date-fns';

import { SERVICE_CATEGORIES } from '../constants';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const SLOTS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30', 
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', 
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', 
  '18:00', '18:30', '19:00', '19:30', '20:00', '20:30', '21:00'
];

export default function UserDashboard() {
  const { user, profile, refreshProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'bookings' | 'profile' | 'provider-settings' | 'availability' | 'services' | 'verification' | 'chats' | 'become-provider' | 'my-customers'>('bookings');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChatUser, setSelectedChatUser] = useState<{ id: string, name: string } | null>(null);
  const [providerProfile, setProviderProfile] = useState<ProviderProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 4500);
  };

  // Review State
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedBookingForReview, setSelectedBookingForReview] = useState<Booking | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  // Profile Form
  const [displayName, setDisplayName] = useState(profile?.displayName || '');
  
  // Provider Settings Form
  const [pName, setPName] = useState('');
  const [pCategory, setPCategory] = useState<any>('Tutors');
  const [pCategories, setPCategories] = useState<string[]>([]);
  const [pDescription, setPDescription] = useState('');
  const [pLocation, setPLocation] = useState('');

  useEffect(() => {
    if (!user) return;
    
    const chatsRef = collection(db, 'chats');
    const q = query(
      chatsRef, 
      where('members', 'array-contains', user.uid),
      orderBy('updatedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setChats(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
    }, (error) => {
      console.error("Chats error:", error);
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      try {
        // Fetch Bookings
        const field = profile?.role === 'provider' ? 'providerId' : 'customerId';
        const q = query(collection(db, 'bookings'), where(field, '==', user.uid));
        const bookingSnap = await getDocs(q);
        setBookings(bookingSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));

        // Fetch Provider Details if applicable
        if (profile?.role === 'provider') {
          const pSnap = await getDoc(doc(db, 'providers', user.uid));
          if (pSnap.exists()) {
            const data = pSnap.data() as ProviderProfile;
            setProviderProfile(data);
            setPName(data.name || '');
            setPCategory(data.category || 'Tutors');
            setPCategories(data.categories || (data.category ? [data.category] : ['Tutors']));
            setPDescription(data.description || '');
            setPLocation(data.location || '');
          } else {
            // New provider, create dummy / empty profile in state so they can use "Manage Services" and "Availability" tabs!
            const newObj: ProviderProfile = {
              uid: user.uid,
              name: profile.displayName || '',
              category: 'Tutors',
              categories: ['Tutors'],
              description: '',
              location: '',
              rating: 5,
              reviewCount: 0,
              isApproved: true,
              isVerified: 'none',
              services: [],
              availability: {
                monday: { enabled: true, slots: ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'] },
                tuesday: { enabled: true, slots: ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'] },
                wednesday: { enabled: true, slots: ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'] },
                thursday: { enabled: true, slots: ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'] },
                friday: { enabled: true, slots: ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'] },
                saturday: { enabled: false, slots: [] },
                sunday: { enabled: false, slots: [] },
              },
              createdAt: new Date(),
            };
            setProviderProfile(newObj);
            setPName(newObj.name);
            setPCategory(newObj.category);
            setPCategories(newObj.categories || ['Tutors']);
          }
        }
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user, profile]);

  const handleUpdateStatus = async (bookingId: string, status: string) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { status });
      setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: status as any } : b));
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${bookingId}`);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'users', user.uid), { displayName });
      await refreshProfile();
      showToast('Profile updated successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${user.uid}`);
      showToast('Failed to update profile.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const toggleCategory = (catName: string) => {
    setPCategories((prev) => {
      let next;
      if (prev.includes(catName)) {
        if (prev.length <= 1) {
          showToast('You must keep at least one category selected.', 'error');
          return prev;
        }
        next = prev.filter(c => c !== catName);
      } else {
        next = [...prev, catName];
      }
      if (next.length > 0) {
        setPCategory(next[0]);
      }
      return next;
    });
  };

  const handleUpdateProvider = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (pCategories.length === 0) {
      showToast('Please select at least one service category.', 'error');
      return;
    }
    setUpdating(true);
    try {
      // Main category for backwards compatibility
      const mainCategory = pCategories[0] || pCategory || 'Tutor';
      
      const updatedFields = {
        uid: user.uid,
        name: pName,
        category: mainCategory,
        categories: pCategories,
        description: pDescription,
        location: pLocation,
        photoURL: profile?.photoURL || '',
        updatedAt: serverTimestamp(),
      };
      
      await setDoc(doc(db, 'providers', user.uid), updatedFields, { merge: true });
      
      // Update local state so it flows instantly to active tabs like "Manage Services"
      setProviderProfile(prev => prev ? {
        ...prev,
        ...updatedFields,
        category: mainCategory,
        categories: pCategories as any
      } : null);
      
      showToast('Provider profile updated successfully!');
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `providers/${user.uid}`);
      showToast('Failed to update provider settings.', 'error');
    } finally {
      setUpdating(false);
    }
  };

  const handleSubmitReview = async () => {
    if (!user || !selectedBookingForReview || !comment.trim()) return;
    setSubmittingReview(true);
    try {
      await addDoc(collection(db, 'reviews'), {
        bookingId: selectedBookingForReview.id,
        customerId: user.uid,
        customerName: profile?.displayName || 'Anonymous User',
        providerId: selectedBookingForReview.providerId,
        rating,
        comment,
        createdAt: serverTimestamp(),
      });

      // Mark booking as reviewed
      await updateDoc(doc(db, 'bookings', selectedBookingForReview.id), {
        isReviewed: true
      });

      setBookings(prev => prev.map(b => b.id === selectedBookingForReview.id ? { ...b, isReviewed: true } : b));
      showToast('Review submitted successfully!');
      setReviewModalOpen(false);
      setComment('');
      setRating(5);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'reviews');
      showToast('Failed to submit review.', 'error');
    } finally {
      setSubmittingReview(false);
    }
  };

  const totalUnread = chats.reduce((acc, chat) => {
    return acc + (chat.unreadCount?.[user?.uid || ''] || 0);
  }, 0);

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 relative">
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.9 }}
            className={`fixed top-8 left-1/2 -translate-x-1/2 z-[999] px-6 py-4 rounded-2xl shadow-xl flex items-center gap-3 border text-sm font-bold ${
              toast.type === 'success' 
                ? 'bg-emerald-50 border-emerald-100 text-emerald-800 shadow-emerald-100/50' 
                : 'bg-rose-50 border-rose-100 text-rose-800 shadow-rose-100/50'
            }`}
          >
            {toast.type === 'success' ? <CheckCircle2 className="text-emerald-600" size={18} /> : <AlertCircle className="text-rose-500 animate-pulse" size={18} />}
            <span>{toast.message}</span>
            <button onClick={() => setToast(null)} className="ml-2 hover:opacity-75 text-slate-400">
              <X size={16} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Sidebar */}
        <div className="lg:w-64 flex flex-col gap-2">
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'bookings' ? 'bg-slate-900 text-white shadow-xl shadow-slate-100' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <Calendar size={20} />
            Bookings
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'profile' ? 'bg-slate-900 text-white shadow-xl shadow-slate-100' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <User size={20} />
            My Profile
          </button>
          <button 
            onClick={() => setActiveTab('chats')}
            className={`flex items-center justify-between gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'chats' ? 'bg-slate-900 text-white shadow-xl shadow-slate-100' : 'text-slate-500 hover:bg-slate-50'}`}
          >
            <div className="flex items-center gap-3">
              <MessageCircle size={20} />
              Messages
            </div>
            {totalUnread > 0 && (
              <span className="bg-indigo-500 text-white text-[10px] px-2 py-0.5 rounded-full ring-2 ring-white">
                {totalUnread}
              </span>
            )}
          </button>
          {profile?.role === 'customer' && (
            <button 
              onClick={() => setActiveTab('become-provider')}
              className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'become-provider' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <Plus size={20} />
              Become a Provider
            </button>
          )}
          {profile?.role === 'provider' && (
            <>
              <button 
                onClick={() => setActiveTab('services')}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'services' ? 'bg-slate-900 text-white shadow-xl shadow-slate-100' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Briefcase size={20} />
                Services
              </button>
              <button 
                onClick={() => setActiveTab('my-customers')}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'my-customers' ? 'bg-slate-900 text-white shadow-xl shadow-slate-100' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <User size={20} />
                My Customers
              </button>
              <button 
                onClick={() => setActiveTab('availability')}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'availability' ? 'bg-slate-900 text-white shadow-xl shadow-slate-100' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Clock size={20} />
                Availability
              </button>
              <button 
                onClick={() => setActiveTab('verification')}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'verification' ? 'bg-slate-900 text-white shadow-xl shadow-slate-100' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <ShieldCheck size={20} />
                Verification
              </button>
              <button 
                onClick={() => setActiveTab('provider-settings')}
                className={`flex items-center gap-3 px-6 py-4 rounded-2xl font-bold transition-all ${activeTab === 'provider-settings' ? 'bg-slate-900 text-white shadow-xl shadow-slate-100' : 'text-slate-500 hover:bg-slate-50'}`}
              >
                <Settings size={20} />
                Settings
              </button>
            </>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'bookings' && (
              <motion.div 
                key="bookings" 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-black text-gray-900 mb-8">
                  {profile?.role === 'provider' ? 'Manage Incoming Bookings' : 'My Service Bookings'}
                </h2>
                {loading ? (
                  <div className="space-y-4">
                    {[1,2,3].map(i => <div key={i} className="h-24 bg-gray-50 rounded-3xl animate-pulse" />)}
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="text-center py-24 bg-gray-50 rounded-[3rem]">
                    <p className="text-gray-500 font-medium">No bookings found.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {bookings.sort((a,b) => b.createdAt?.seconds - a.createdAt?.seconds).map(booking => (
                      <div key={booking.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-6">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
                            booking.status === 'confirmed' ? 'bg-green-100 text-green-600' : 
                            booking.status === 'cancelled' ? 'bg-red-100 text-red-600' : 
                            'bg-orange-100 text-orange-600'
                          }`}>
                            {booking.status === 'confirmed' ? <Check /> : booking.status === 'cancelled' ? <X /> : <Calendar />}
                          </div>
                          <div>
                            <p className="font-bold text-gray-900 text-lg">
                              {profile?.role === 'provider' ? booking.customerName : booking.providerName}
                            </p>
                            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">{booking.serviceName}</p>
                            <div className="flex items-center gap-4 text-sm text-gray-500 mt-1">
                              <span className="flex items-center gap-1"><Calendar size={14} />{booking.date}</span>
                              <span className="flex items-center gap-1"><Clock size={14} />{booking.time}</span>
                              <span className="font-bold text-purple-600">
                                {booking.totalAmount === 0 ? 'Custom Quote' : `R${booking.totalAmount}`}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3">
                          {profile?.role === 'provider' && booking.status === 'pending' && (
                            <>
                              <button 
                                onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                                className="px-6 py-2 bg-green-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-green-100"
                              >
                                Accept
                              </button>
                              <button 
                                onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                                className="px-6 py-2 bg-gray-100 text-gray-600 rounded-xl text-sm font-bold"
                              >
                                Decline
                              </button>
                            </>
                          )}
                          {profile?.role === 'provider' && booking.status === 'confirmed' && (
                            <button 
                              onClick={() => handleUpdateStatus(booking.id, 'completed')}
                              className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100"
                            >
                              Mark Completed
                            </button>
                          )}
                          {profile?.role === 'provider' && booking.status === 'completed' && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-50 px-3 py-1 rounded-lg">
                              {booking.payoutStatus === 'paid_to_provider' ? 'Paid to you' : 'Processing Payout'}
                            </span>
                          )}
                          {profile?.role === 'customer' && booking.status === 'completed' && !booking.isReviewed && (
                            <button 
                              onClick={() => {
                                setSelectedBookingForReview(booking);
                                setReviewModalOpen(true);
                              }}
                              className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-100 flex items-center gap-2"
                            >
                              <MessageSquare size={16} />
                              Leave Review
                            </button>
                          )}
                          {profile?.role === 'customer' && booking.isReviewed && (
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg flex items-center gap-1">
                              <Star size={12} fill="currentColor" /> Reviewed
                            </span>
                          )}
                          {profile?.role === 'customer' && booking.status === 'pending' && (
                            <button 
                              onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                              className="px-6 py-2 text-red-600 border border-red-100 rounded-xl text-sm font-bold hover:bg-red-50"
                            >
                              Cancel
                            </button>
                          )}
                          <div className={`px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest ${
                             booking.status === 'confirmed' ? 'bg-green-50 text-green-700' : 
                             booking.status === 'cancelled' ? 'bg-red-50 text-red-700' : 
                             'bg-orange-50 text-orange-700'
                          }`}>
                            {booking.status}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'services' && profile?.role === 'provider' && providerProfile && (
              <motion.div 
                key="services"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
                  <div>
                    <h2 className="text-3xl font-black text-gray-900">Manage Services</h2>
                    <p className="text-gray-500 font-medium font-sans">Select the services you offer from each section. Pricing is locked to platform standards.</p>
                  </div>
                  <div className="bg-indigo-50 px-4 py-2 rounded-2xl border border-indigo-100 flex items-center gap-2">
                    <span className="text-indigo-600 font-black tracking-widest text-[10px] uppercase">Categories Selected:</span>
                    <span className="text-indigo-900 font-bold text-sm">
                      {providerProfile.categories && providerProfile.categories.length > 0
                        ? providerProfile.categories.length
                        : 1}
                    </span>
                  </div>
                </div>

                <div className="grid gap-12">
                  {(() => {
                    const activeCategories = providerProfile.categories && providerProfile.categories.length > 0
                      ? providerProfile.categories
                      : [providerProfile.category || 'Tutor'];

                    const categoriesData = SERVICE_CATEGORIES.filter(c => activeCategories.includes(c.name as any));
                    if (categoriesData.length === 0) return <div className="p-12 text-center bg-gray-50 rounded-[3rem]">Please select a valid category in Settings first.</div>;

                    return (
                      <div className="space-y-12">
                        {categoriesData.map((categoryData) => (
                          <div key={categoryData.name} className="space-y-6">
                            <div className="flex items-center gap-3 border-b border-gray-150 pb-3">
                              <span className="text-3xl">{categoryData.icon}</span>
                              <h3 className="text-xl font-extrabold text-gray-900">{categoryData.name}</h3>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                              {categoryData.services.map((service, idx) => {
                                const isSelected = providerProfile.services?.some(s => s.name === service.name);
                                
                                return (
                                  <button 
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      let newServices = [...(providerProfile.services || [])];
                                      if (isSelected) {
                                        newServices = newServices.filter(s => s.name !== service.name);
                                      } else {
                                        newServices.push({
                                          id: Math.random().toString(36).substr(2, 9),
                                          name: service.name,
                                          description: categoryData.name + ' Service',
                                          price: service.price,
                                          duration: '60 min',
                                          unit: (service as any).unit,
                                          custom: service.custom
                                        });
                                      }
                                      setProviderProfile({...providerProfile, services: newServices});
                                    }}
                                    className={`p-6 rounded-[2rem] border-2 text-left transition-all relative group ${
                                      isSelected 
                                      ? 'border-indigo-500 bg-indigo-50/50 shadow-lg shadow-indigo-100' 
                                      : 'border-gray-100 bg-white hover:border-gray-300'
                                    }`}
                                  >
                                    <div className="flex justify-between items-start mb-4">
                                      <span className="text-2xl">{categoryData.icon}</span>
                                      {isSelected && (
                                        <div className="w-6 h-6 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                                          <Check size={14} />
                                        </div>
                                      )}
                                    </div>
                                    <h3 className="font-black text-slate-900 mb-2 leading-tight">{service.name}</h3>
                                    <p className="text-lg font-black text-indigo-600">
                                      {service.custom ? 'Custom Quote' : `R${service.price.toLocaleString()}${ (service as any).unit || '' }`}
                                    </p>
                                    <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <span className={`text-[10px] font-black uppercase tracking-widest ${isSelected ? 'text-indigo-400' : 'text-slate-300'}`}>
                                        {isSelected ? 'Click to remove' : 'Click to add'}
                                      </span>
                                    </div>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}

                  <button 
                    onClick={async () => {
                      setUpdating(true);
                      try {
                        await setDoc(doc(db, 'providers', user!.uid), {
                          services: providerProfile.services || []
                        }, { merge: true });
                        showToast('Selected services have been saved successfully!');
                      } catch (e) {
                        handleFirestoreError(e, OperationType.UPDATE, 'providers');
                        showToast('Failed to save selected services.', 'error');
                      } finally {
                        setUpdating(false);
                      }
                    }}
                    disabled={updating}
                    className="w-full py-5 bg-emerald-500 text-white rounded-[2rem] font-black text-xl hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-3 mt-8 disabled:opacity-50"
                  >
                    <Save size={24} />
                    {updating ? 'Saving...' : 'Save Selected Services'}
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'my-customers' && profile?.role === 'provider' && (
              <motion.div 
                key="my-customers"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-black text-gray-900 mb-8">My Customers</h2>
                {bookings.length === 0 ? (
                  <div className="text-center py-24 bg-gray-50 rounded-[3rem]">
                    <p className="text-gray-500 font-medium">No customers found yet. Your clients will appear here after they book with you.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {Array.from(new Map<string, { id: string, name: string }>(bookings.map(b => [b.customerId, { id: b.customerId, name: b.customerName }])).values()).map(customer => (
                      <div key={customer.id} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center justify-between hover:border-indigo-100 transition-all group">
                        <div className="flex items-center gap-6">
                          <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 font-black text-xl group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                            {customer.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-black text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">{customer.name}</p>
                            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                              {bookings.filter(b => b.customerId === customer.id).length} {bookings.filter(b => b.customerId === customer.id).length === 1 ? 'Booking' : 'Bookings'}
                            </p>
                          </div>
                        </div>
                        <button 
                          onClick={() => setSelectedChatUser({ id: customer.id, name: customer.name })}
                          className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                        >
                          <MessageCircle size={18} />
                          Message
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'availability' && profile?.role === 'provider' && providerProfile && (
              <motion.div 
                key="availability"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-black text-gray-900 mb-4">Set Your Working Hours</h2>
                <p className="text-gray-500 mb-8">Choose which days and times you are available for bookings.</p>

                <div className="grid gap-6">
                  {DAYS.map((day) => {
                    const dayConfig = providerProfile.availability?.[day] || { enabled: false, slots: [] };
                    return (
                      <div key={day} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm hover:border-indigo-100 transition-all">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center gap-4">
                            <div className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all cursor-pointer ${dayConfig.enabled ? 'bg-indigo-600 border-indigo-600' : 'border-gray-200'}`}
                              onClick={() => {
                                const newAvailability = { ...providerProfile.availability };
                                newAvailability[day] = { ...dayConfig, enabled: !dayConfig.enabled };
                                setProviderProfile({ ...providerProfile, availability: newAvailability });
                              }}
                            >
                              {dayConfig.enabled && <Check size={14} className="text-white" />}
                            </div>
                            <h4 className="font-black text-xl text-gray-800 capitalize">{day}</h4>
                          </div>
                          <span className="px-4 py-1 bg-gray-50 text-gray-400 text-xs font-bold rounded-full uppercase tracking-widest">{dayConfig.slots.length} slots</span>
                        </div>
                        
                        {dayConfig.enabled && (
                          <div className="space-y-4">
                            <div className="flex gap-2">
                              <button 
                                onClick={() => {
                                  const newAvailability = { ...providerProfile.availability };
                                  newAvailability[day] = { ...dayConfig, slots: SLOTS.filter(s => s >= '08:00' && s <= '17:00') };
                                  setProviderProfile({ ...providerProfile, availability: newAvailability });
                                }}
                                className="text-[10px] font-black uppercase tracking-widest text-indigo-600 bg-indigo-50 px-3 py-1 rounded-lg hover:bg-indigo-100 transition-colors"
                              >
                                8am - 5pm
                              </button>
                              <button 
                                onClick={() => {
                                  const newAvailability = { ...providerProfile.availability };
                                  newAvailability[day] = { ...dayConfig, slots: [] };
                                  setProviderProfile({ ...providerProfile, availability: newAvailability });
                                }}
                                className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-3 py-1 rounded-lg hover:bg-slate-100 transition-colors"
                              >
                                Clear All
                              </button>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {SLOTS.map((slot) => (
                                <button
                                  key={slot}
                                  onClick={() => {
                                    const newSlots = dayConfig.slots.includes(slot)
                                      ? dayConfig.slots.filter(s => s !== slot)
                                      : [...dayConfig.slots, slot].sort();
                                    
                                    const newAvailability = { ...providerProfile.availability };
                                    newAvailability[day] = { ...dayConfig, slots: newSlots };
                                    setProviderProfile({ ...providerProfile, availability: newAvailability });
                                  }}
                                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    dayConfig.slots.includes(slot) 
                                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' 
                                    : 'bg-gray-50 text-gray-500 hover:bg-gray-100'
                                  }`}
                                >
                                  {slot}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <button 
                    onClick={async () => {
                      setUpdating(true);
                      try {
                        await updateDoc(doc(db, 'providers', user!.uid), {
                          availability: providerProfile.availability
                        });
                        showToast('Availability schedule saved successfully!');
                      } catch (e) {
                        handleFirestoreError(e, OperationType.UPDATE, 'providers');
                        showToast('Failed to save schedule.', 'error');
                      } finally {
                        setUpdating(false);
                      }
                    }}
                    disabled={updating}
                    className="w-full py-5 bg-emerald-500 text-white rounded-3xl font-bold hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-2 text-lg"
                  >
                    <Save size={24} />
                    {updating ? 'Updating Schedule...' : 'Save Weekly Availability'}
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'verification' && profile?.role === 'provider' && providerProfile && (
              <motion.div 
                key="verification"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-black text-gray-900 mb-4">Identity Verification</h2>
                <p className="text-gray-500 mb-10">Upload FICA documents to gain client trust and unlock higher rankings.</p>
                
                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-10">
                  <div className={`flex items-center gap-8 p-8 rounded-[2rem] ${
                    providerProfile.isVerified === 'verified' ? 'bg-emerald-50 text-emerald-700' :
                    providerProfile.isVerified === 'pending' ? 'bg-orange-50 text-orange-700' :
                    providerProfile.isVerified === 'rejected' ? 'bg-rose-50 text-rose-700' :
                    providerProfile.isVerified === 'requirements' ? 'bg-amber-50 text-amber-700' :
                    'bg-gray-50 text-gray-500'
                  }`}>
                    <ShieldCheck size={48} className="shrink-0" />
                    <div>
                      <h3 className="text-2xl font-black capitalize">
                        {providerProfile.isVerified === 'requirements' ? 'Further Requirements' : (providerProfile.isVerified || 'Not Verified')}
                      </h3>
                      <p className="text-sm font-medium opacity-80">
                        {providerProfile.isVerified === 'verified' ? 'Your business is fully verified and trusted.' : 
                         providerProfile.isVerified === 'pending' ? 'Our admins are currently reviewing your documents.' :
                         providerProfile.isVerified === 'rejected' ? 'Verification was declined.' :
                         providerProfile.isVerified === 'requirements' ? 'Further documents/information are requested to process verification.' :
                         'Please upload clear copies of your ID and proof of residence.'}
                      </p>
                    </div>
                  </div>

                  {providerProfile.verificationFeedback && (
                    <div className="p-6 bg-amber-50/60 border border-amber-100 rounded-2xl text-amber-900 space-y-1">
                      <p className="text-[10px] uppercase tracking-widest font-black text-amber-600">Admin Notes / Feedback:</p>
                      <p className="text-sm font-medium leading-relaxed">{providerProfile.verificationFeedback}</p>
                    </div>
                  )}

                  <div className="space-y-4">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-2">Proof of Identity & Address (PDF/Image)</label>
                    <div className="relative border-4 border-dashed border-gray-50 rounded-[2.5rem] p-16 text-center hover:border-indigo-400 hover:bg-indigo-50/10 transition-all group">
                      <input 
                        type="file" 
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            setProviderProfile({...providerProfile, ficaDocUrl: 'https://example.com/mock-upload.pdf'});
                          }
                        }}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                      />
                      <div className="flex flex-col items-center">
                        <FileText className="text-gray-200 group-hover:text-indigo-400 transition-colors mb-6" size={64} />
                        <p className="text-xl font-black text-gray-800">Choose your FICA documents</p>
                        <p className="text-gray-400 font-medium mt-2">Maximum file size: 15MB</p>
                      </div>
                    </div>
                    {providerProfile.ficaDocUrl && (
                      <div className="flex items-center gap-3 text-emerald-600 font-bold p-6 bg-emerald-50 rounded-2xl">
                        <CheckCircle2 size={24} />
                        Document ready for submission: fica_v3_combined.pdf
                      </div>
                    )}
                  </div>

                  <button 
                    onClick={async () => {
                      if (!providerProfile.ficaDocUrl) return showToast('Please upload a document first', 'error');
                      setUpdating(true);
                      try {
                        await updateDoc(doc(db, 'providers', user!.uid), {
                          ficaDocUrl: providerProfile.ficaDocUrl,
                          isVerified: 'pending'
                        });
                        showToast('Documents submitted successfully for review!');
                      } catch (e) {
                        handleFirestoreError(e, OperationType.UPDATE, 'providers');
                        showToast('Failed to submit documents.', 'error');
                      } finally {
                        setUpdating(false);
                      }
                    }}
                    disabled={updating || providerProfile.isVerified === 'pending' || providerProfile.isVerified === 'verified'}
                    className="w-full py-5 bg-slate-900 text-white rounded-3xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 flex items-center justify-center gap-3 text-lg disabled:opacity-30"
                  >
                    <ShieldCheck size={24} />
                    {providerProfile.isVerified === 'pending' ? 'Review in Progress' : 'Submit for Verification'}
                  </button>
                </div>
              </motion.div>
            )}

            {activeTab === 'provider-settings' && (
              <motion.div 
                key="provider-settings"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="max-w-xl"
              >
                <h2 className="text-3xl font-black text-gray-900 mb-8">Service Listing Settings</h2>
                <form onSubmit={handleUpdateProvider} className="space-y-8">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-2">Business Name</label>
                      <input 
                        type="text" 
                        value={pName} 
                        onChange={(e) => setPName(e.target.value)}
                        className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-purple-600 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                        placeholder="e.g. Peak Performance Training"
                        required
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex flex-col ml-2">
                        <label className="text-sm font-bold text-gray-700">Service Categories</label>
                        <span className="text-xs text-slate-400 font-medium font-sans">Select all categories that apply to your business. You can choose more than one!</span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-72 overflow-y-auto p-2 border border-inset border-gray-100 rounded-3xl bg-gray-50/50">
                        {SERVICE_CATEGORIES.map(cat => {
                          const isSelected = pCategories.includes(cat.name);
                          return (
                            <button
                              key={cat.name}
                              type="button"
                              onClick={() => toggleCategory(cat.name)}
                              className={`flex items-center justify-between p-4 rounded-2xl border-2 text-left transition-all font-sans font-bold text-sm ${
                                isSelected
                                  ? 'border-purple-600 bg-purple-50 text-purple-900 shadow-md shadow-purple-50/50'
                                  : 'border-transparent bg-white text-slate-700 hover:border-slate-200 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <span className="text-xl shrink-0">{cat.icon}</span>
                                <span className="leading-tight">{cat.name}</span>
                              </div>
                              {isSelected && (
                                <div className="w-5 h-5 bg-purple-600 text-white rounded-md flex items-center justify-center shrink-0">
                                  <Check size={12} strokeWidth={3} />
                                </div>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-2">Location</label>
                      <div className="relative">
                        <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        <input 
                          type="text" 
                          value={pLocation} 
                          onChange={(e) => setPLocation(e.target.value)}
                          className="w-full pl-12 pr-6 py-4 bg-gray-50 border-2 border-transparent focus:border-purple-600 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                          placeholder="e.g. Downtown Los Angeles"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-bold text-gray-700 ml-2">Service Description</label>
                      <textarea 
                        value={pDescription} 
                        onChange={(e) => setPDescription(e.target.value)}
                        rows={4}
                        className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-purple-600 focus:bg-white rounded-2xl outline-none transition-all font-medium resize-none"
                        placeholder="Tell clients about your services, experience, and pricing..."
                      />
                    </div>
                  </div>

                  <button 
                    type="submit"
                    disabled={updating}
                    className="w-full py-4 bg-emerald-500 text-white rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-xl shadow-emerald-100 flex items-center justify-center gap-2"
                  >
                    {updating ? 'Updating Listing...' : 'Update Service Listing'}
                  </button>

                  <div className="p-6 bg-purple-50 rounded-3xl text-purple-700 text-sm flex gap-4">
                    <Star className="shrink-0" />
                    <p>Your listing is currently <strong>public</strong>. Make sure your profile looks great to attract more clients!</p>
                  </div>
                </form>
              </motion.div>
            )}
            {activeTab === 'chats' && (
              <motion.div 
                key="chats"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <h2 className="text-3xl font-black text-gray-900 mb-8">Messages</h2>
                {chats.length === 0 ? (
                  <div className="text-center py-24 bg-gray-50 rounded-[3rem]">
                    <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-slate-200 mx-auto mb-6 shadow-sm">
                      <MessageCircle size={40} />
                    </div>
                    <p className="text-gray-500 font-medium">No messages found. Start a conversation from a provider's profile.</p>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    {chats.map(chat => {
                      const otherMemberId = chat.members.find(m => m !== user!.uid);
                      const otherMemberName = profile?.role === 'customer' ? chat.providerName : chat.customerName;
                      const unread = chat.unreadCount?.[user?.uid || ''] || 0;
                      
                      return (
                        <button 
                          key={chat.id}
                          onClick={() => setSelectedChatUser({ id: otherMemberId!, name: otherMemberName })}
                          className={`bg-white p-8 rounded-[2.5rem] border shadow-sm flex items-center justify-between hover:border-indigo-100 hover:shadow-xl transition-all w-full text-left group ${unread > 0 ? 'border-indigo-200 bg-indigo-50/5' : 'border-gray-100'}`}
                        >
                          <div className="flex items-center gap-6">
                            <div className="relative">
                              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black text-xl">
                                {otherMemberName.charAt(0)}
                              </div>
                              {unread > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-[10px] font-black flex items-center justify-center rounded-lg border-2 border-white shadow-sm animate-bounce">
                                  {unread}
                                </span>
                              )}
                            </div>
                            <div>
                              <p className={`font-black text-lg transition-colors ${unread > 0 ? 'text-indigo-600' : 'text-gray-900 group-hover:text-indigo-600'}`}>
                                {otherMemberName}
                                {unread > 0 && <span className="ml-2 w-2 h-2 bg-indigo-500 rounded-full inline-block mb-1" />}
                              </p>
                              <p className={`text-sm line-clamp-1 font-medium ${unread > 0 ? 'text-slate-600 font-bold' : 'text-gray-400'}`}>
                                {chat.lastMessage || 'No messages yet'}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 mb-2">
                              {chat.lastMessageAt?.seconds ? format(new Date(chat.lastMessageAt.seconds * 1000), 'MMM d, HH:mm') : ''}
                            </p>
                            <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                              <ChevronRight size={16} />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="max-w-xl"
              >
                <h2 className="text-3xl font-black text-gray-900 mb-8">My Profile</h2>
                <form onSubmit={handleUpdateProfile} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-gray-700 ml-2">Display Name</label>
                    <input 
                      type="text" 
                      value={displayName} 
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 border-2 border-transparent focus:border-purple-600 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                      placeholder="Your name"
                      required
                    />
                  </div>
                  <button 
                    type="submit"
                    disabled={updating}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 flex items-center justify-center gap-2"
                  >
                    <Save size={20} />
                    {updating ? 'Saving...' : 'Save Profile'}
                  </button>
                </form>

                {profile?.role === 'customer' && (
                  <div className="mt-12 p-8 bg-indigo-50 rounded-[2.5rem] border border-indigo-100">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                        <Plus size={24} />
                      </div>
                      <h3 className="text-xl font-black text-indigo-900">Want to earn with PinYourPro?</h3>
                    </div>
                    <p className="text-indigo-700/70 font-medium mb-6">List your services and start reaching thousands of clients in your area. Set your own prices and working hours.</p>
                    <button 
                      onClick={() => setActiveTab('become-provider')}
                      className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 flex items-center justify-center gap-2"
                    >
                      Apply to be a Provider
                      <ChevronRight size={20} />
                    </button>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === 'become-provider' && profile?.role === 'customer' && (
              <motion.div 
                key="become-provider"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="max-w-2xl"
              >
                <div className="flex items-center gap-4 mb-8">
                  <button 
                    onClick={() => setActiveTab('profile')}
                    className="p-3 bg-slate-50 text-slate-400 hover:text-slate-900 rounded-2xl transition-all"
                  >
                    <X size={20} />
                  </button>
                  <h2 className="text-3xl font-black text-gray-900">Start Your Business</h2>
                </div>

                <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm space-y-8">
                  <p className="text-gray-500 text-lg font-medium leading-relaxed">Join our network of professional service providers and grow your business today.</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 bg-slate-50 rounded-3xl text-center">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-4 shadow-sm">
                        <Briefcase size={24} />
                      </div>
                      <p className="font-bold text-gray-900 text-sm">Add Services</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl text-center">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-4 shadow-sm">
                        <Clock size={24} />
                      </div>
                      <p className="font-bold text-gray-900 text-sm">Set Hours</p>
                    </div>
                    <div className="p-6 bg-slate-50 rounded-3xl text-center">
                      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 mx-auto mb-4 shadow-sm">
                        <Star size={24} />
                      </div>
                      <p className="font-bold text-gray-900 text-sm">Get Bookings</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                      <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" />
                      <div>
                        <p className="font-bold text-gray-900">Zero Monthly Fees</p>
                        <p className="text-sm text-gray-500 font-medium">Only pay a small commission on successful bookings.</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-4 p-4 hover:bg-slate-50 rounded-2xl transition-colors">
                      <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" />
                      <div>
                        <p className="font-bold text-gray-900">Secure Payments</p>
                        <p className="text-sm text-gray-500 font-medium">Funds are held securely until the job is completed.</p>
                      </div>
                    </div>
                  </div>

                  <button 
                    onClick={async () => {
                      if (!user) return;
                      setUpdating(true);
                      try {
                        await updateDoc(doc(db, 'users', user.uid), {
                          role: 'provider'
                        });
                        
                        await setDoc(doc(db, 'providers', user.uid), {
                          uid: user.uid,
                          name: profile.displayName || 'New Provider',
                          category: 'Tutor',
                          description: '',
                          location: '',
                          photoURL: profile.photoURL || '',
                          rating: 5,
                          reviewCount: 0,
                          isApproved: false,
                          isVerified: 'none',
                          services: [],
                          availability: {},
                          createdAt: serverTimestamp(),
                        });

                        await refreshProfile();
                        setActiveTab('provider-settings');
                        alert('Congratulations! You are now a provider. Please set up your business details.');
                      } catch (e) {
                        handleFirestoreError(e, OperationType.WRITE, 'providers');
                      } finally {
                        setUpdating(false);
                      }
                    }}
                    disabled={updating}
                    className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black text-xl hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 mt-4"
                  >
                    {updating ? 'Processing...' : 'Complete Provider Setup'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Review Modal */}
      <AnimatePresence>
        {selectedChatUser && (
          <ChatWindow 
            recipientId={selectedChatUser.id}
            recipientName={selectedChatUser.name}
            onClose={() => setSelectedChatUser(null)}
          />
        )}
      </AnimatePresence>

      {/* Review Modal */}
      <AnimatePresence>
        {reviewModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm bg-slate-900/40">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden p-10"
            >
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-slate-900">Rate your experience</h3>
                <button 
                  onClick={() => setReviewModalOpen(false)}
                  className="p-2 hover:bg-slate-50 rounded-full text-slate-400"
                >
                  <X />
                </button>
              </div>

              <div className="space-y-8">
                <div className="text-center">
                  <div className="flex justify-center gap-2 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className={`transition-all ${rating >= star ? 'text-yellow-400 scale-110' : 'text-slate-200 hover:text-yellow-200'}`}
                      >
                        <Star size={40} fill={rating >= star ? 'currentColor' : 'none'} />
                      </button>
                    ))}
                  </div>
                  <p className="text-slate-500 font-bold">How was your session with {selectedBookingForReview?.providerName}?</p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-2">Your Feedback</label>
                  <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={4}
                    placeholder="Tell others what you liked or how they can improve..."
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-medium resize-none"
                  />
                </div>

                <button 
                  onClick={handleSubmitReview}
                  disabled={submittingReview || !comment.trim()}
                  className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                  {!submittingReview && <ChevronRight size={20} />}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
