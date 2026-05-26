import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ProviderProfile, Review } from '../types';
import { 
  MapPin, 
  Star, 
  Clock, 
  ShieldCheck, 
  Mail, 
  ArrowLeft, 
  CalendarDays, 
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Plus,
  Briefcase,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays, startOfToday, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, addMonths, subMonths, isPast, isToday } from 'date-fns';
import ChatWindow from '../components/ChatWindow';
import { useAuth } from '../App';

export default function ProviderDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [chatOpen, setChatOpen] = useState(false);
  const navigate = useNavigate();

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;
      try {
        const docSnap = await getDoc(doc(db, 'providers', id));
        if (docSnap.exists()) {
          setProvider({ id: docSnap.id, ...docSnap.data() } as any);
        }

        // Fetch reviews
        const q = query(
          collection(db, 'reviews'), 
          where('providerId', '==', id),
          orderBy('createdAt', 'desc')
        );
        const reviewSnap = await getDocs(q);
        setReviews(reviewSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any)));
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `providers/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const daysInMonth = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getAvailableSlotsForDate = (date: Date) => {
    if (!provider?.availability) return [];
    const dayName = format(date, 'eeee').toLowerCase();
    const dayConfig = provider.availability[dayName];
    if (!dayConfig || !dayConfig.enabled) return [];
    return dayConfig.slots || [];
  };

  const isDayAvailable = (date: Date) => {
    if (isPast(date) && !isToday(date)) return false;
    const slots = getAvailableSlotsForDate(date);
    return slots.length > 0;
  };

  const averageRating = reviews.length > 0 
    ? reviews.reduce((acc, curr) => acc + curr.rating, 0) / reviews.length 
    : provider?.rating || 0;

  const reviewCount = reviews.length > 0 ? reviews.length : provider?.reviewCount || 0;

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 animate-pulse">
        <div className="h-8 w-24 bg-gray-100 rounded mb-8"></div>
        <div className="flex flex-col md:flex-row gap-12">
          <div className="flex-1 h-[400px] bg-gray-100 rounded-[3rem]"></div>
          <div className="w-full md:w-[400px] h-[500px] bg-gray-100 rounded-[3rem]"></div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return <div className="text-center py-24">Provider not found</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button 
        onClick={() => navigate('/browse')}
        className="flex items-center gap-2 text-gray-500 hover:text-purple-600 transition-colors mb-8 font-medium"
      >
        <ArrowLeft size={20} />
        Back to browse
      </button>

      <div className="flex flex-col lg:flex-row gap-12">
        {/* Main Content */}
        <div className="flex-1">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[3rem] p-8 md:p-12 shadow-sm border border-gray-100 mb-12"
          >
            <div className="flex flex-col md:flex-row gap-8 items-start mb-10">
              <img 
                src={provider.photoURL || `https://picsum.photos/seed/${provider.uid}/400/400`}
                className="w-32 h-32 md:w-48 md:h-48 rounded-[2.5rem] object-cover shadow-xl shadow-purple-100"
                alt={provider.name}
                referrerPolicy="no-referrer"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  {provider.categories && provider.categories.length > 0 ? (
                    provider.categories.map((cat) => (
                      <span key={cat} className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-bold uppercase tracking-wider">
                        {cat}
                      </span>
                    ))
                  ) : (
                    <span className="px-3 py-1 bg-purple-50 text-purple-600 rounded-full text-xs font-bold uppercase tracking-wider">
                      {provider.category}
                    </span>
                  )}
                  <div className="flex items-center gap-1 text-orange-500 font-bold ml-2">
                    <Star size={18} fill="currentColor" />
                    <span>{averageRating.toFixed(1)}</span>
                    <span className="text-gray-400 font-medium text-sm">({reviewCount} reviews)</span>
                  </div>
                </div>
                <h1 className="text-4xl md:text-5xl font-black text-gray-900 mb-4">{provider.name}</h1>
                <div className="flex items-center gap-2 text-gray-500">
                  <MapPin size={20} />
                  <span className="text-lg font-medium">{provider.location}</span>
                </div>
              </div>
            </div>

            <div className="space-y-8">
              {/* Availability Calendar Section */}
              <section className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-100 scroll-mt-24" id="availability">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                  <div>
                    <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                      <CalendarDays size={24} className="text-indigo-600" />
                      Check Availability
                    </h2>
                    <p className="text-slate-500 font-medium text-sm mt-1">Select a service and date to view open time slots</p>
                  </div>
                  
                  <div className="flex items-center gap-4 bg-white p-1 rounded-xl shadow-sm border border-slate-100">
                    <button 
                      onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                      className="p-2 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-all"
                    >
                      <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-black text-slate-700 min-w-[100px] text-center uppercase tracking-widest">
                      {format(currentMonth, 'MMM yyyy')}
                    </span>
                    <button 
                      onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                      className="p-2 hover:bg-slate-50 hover:text-indigo-600 rounded-lg transition-all"
                    >
                      <ChevronRight size={16} />
                    </button>
                  </div>
                </div>

                <div className="mb-10">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Step 1: Select Service</h4>
                  <div className="flex flex-wrap gap-2">
                    {provider.services?.map((service) => (
                        <button
                          key={service.id}
                          onClick={() => {
                            setSelectedServiceId(service.id);
                            setSelectedSlot(null);
                          }}
                          className={`px-6 py-3 rounded-2xl font-bold text-sm transition-all border-2 ${
                            selectedServiceId === service.id
                              ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100'
                              : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'
                          }`}
                        >
                          {service.name} • {service.custom ? 'Custom Quote' : `R${service.price}${service.unit || ''}`}
                        </button>
                    ))}
                    {(!provider.services || provider.services.length === 0) && (
                      <p className="text-slate-400 text-sm font-medium">No specific services listed. General booking applies.</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  {/* Calendar Grid */}
                  <div className="space-y-4">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Step 2: Select Date</h4>
                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => (
                        <span key={d} className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d}</span>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-1.5">
                      {Array.from({ length: startOfMonth(currentMonth).getDay() }).map((_, i) => (
                        <div key={`empty-${i}`} />
                      ))}
                      {daysInMonth.map((day) => {
                        const isAvailable = isDayAvailable(day);
                        const isSelected = isSameDay(day, selectedDate);
                        
                        return (
                          <button
                            key={day.toString()}
                            disabled={!isAvailable}
                            onClick={() => {
                              setSelectedDate(day);
                              setSelectedSlot(null);
                            }}
                            className={`
                              relative aspect-square flex items-center justify-center rounded-xl font-bold text-xs transition-all
                              ${isSelected ? 'bg-indigo-600 text-white shadow-lg z-10 scale-105' : 
                                isAvailable ? 'bg-white text-slate-700 hover:border-indigo-200 border border-slate-100' : 'text-slate-300 opacity-50 cursor-not-allowed'}
                            `}
                          >
                            {format(day, 'd')}
                            {isAvailable && !isSelected && (
                              <div className="absolute bottom-1 w-1 h-1 bg-indigo-400 rounded-full" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Slots Selection */}
                  <div className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm flex flex-col">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Step 3: Select Time</h4>
                    <h4 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2">
                      <Clock size={16} className="text-indigo-600" />
                      {format(selectedDate, 'EEE, d MMM')}
                    </h4>
                    
                    {!selectedServiceId && provider.services && provider.services.length > 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                        <Briefcase className="text-slate-300 mb-3" size={32} />
                        <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">Please select a service first</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[160px] pr-1 custom-scrollbar">
                        {getAvailableSlotsForDate(selectedDate).map((slot) => (
                          <button
                            key={slot}
                            onClick={() => setSelectedSlot(slot)}
                            className={`
                              py-3 rounded-xl font-bold text-xs transition-all border-2
                              ${selectedSlot === slot 
                                ? 'bg-indigo-50 border-indigo-600 text-indigo-700' 
                                : 'bg-slate-50 border-transparent text-slate-600 hover:border-indigo-100'}
                            `}
                          >
                            {slot}
                          </button>
                        ))}
                        {getAvailableSlotsForDate(selectedDate).length === 0 && (
                          <div className="col-span-2 py-8 text-center bg-slate-50 rounded-2xl">
                            <p className="text-slate-400 text-xs font-bold">No slots available</p>
                          </div>
                        )}
                      </div>
                    )}

                    <AnimatePresence>
                      {selectedSlot && (
                        <motion.div 
                          initial={{ opacity: 0, scale: 0.95 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="mt-6 pt-6 border-t border-slate-100"
                        >
                          <Link
                            to={`/book/${provider.uid}?date=${format(selectedDate, 'yyyy-MM-dd')}&time=${selectedSlot}${selectedServiceId ? `&serviceId=${selectedServiceId}` : ''}`}
                            className="w-full py-4 bg-slate-900 text-white rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-100"
                          >
                            Book at {selectedSlot}
                            <ArrowRight size={16} />
                          </Link>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </section>

              {provider.services && provider.services.length > 0 && (
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">Services Offered</h2>
                  <div className="grid gap-4">
                    {provider.services.map((service) => (
                      <div key={service.id} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-gray-50 rounded-[2rem] border border-transparent hover:border-indigo-200 transition-all gap-4">
                        <div>
                          <h4 className="text-lg font-black text-gray-900">{service.name}</h4>
                          <p className="text-gray-500 text-sm mt-1">{service.description}</p>
                        </div>
                        <div className="mt-4 md:mt-0 flex items-center gap-6 self-stretch justify-between md:justify-end shrink-0">
                          <div className="text-right md:min-w-[100px]">
                            <p className="text-xl font-black text-purple-600">
                              {service.custom ? 'Custom Quote' : `R${service.price}${service.unit || ''}`}
                            </p>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{service.duration}</p>
                          </div>
                          <button
                            onClick={() => {
                              setSelectedServiceId(service.id);
                              setSelectedSlot(null);
                              document.getElementById('availability')?.scrollIntoView({ behavior: 'smooth' });
                            }}
                            className={`px-5 py-3 rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all ${
                              selectedServiceId === service.id
                                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100 font-sans'
                                : 'bg-white border-2 border-slate-100 text-slate-700 hover:border-indigo-300 font-sans'
                            }`}
                          >
                            {selectedServiceId === service.id ? 'Selected' : 'Pick Service'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">About the Service</h2>
                <p className="text-gray-600 text-lg leading-relaxed whitespace-pre-wrap italic">
                  {provider.description || "No description provided yet. This professional is ready to deliver high-quality services to meet your specific requirements."}
                </p>
              </div>

              {/* Reviews Section */}
              <div className="pt-8 border-t border-gray-100">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <MessageSquare size={24} className="text-indigo-600" />
                    Client Feedback
                  </h2>
                  <div className="text-right">
                    <div className="flex items-center gap-1 text-orange-500 font-black text-xl justify-end">
                      <Star size={20} fill="currentColor" />
                      {averageRating.toFixed(1)}
                    </div>
                    <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">{reviewCount} Verified Reviews</p>
                  </div>
                </div>

                <div className="grid gap-6">
                  {reviews.length > 0 ? reviews.map((review) => (
                    <div key={review.id} className="p-8 bg-gray-50 rounded-[2.5rem] border border-transparent hover:border-indigo-100 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="flex gap-1 mb-2">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star 
                                key={s} 
                                size={14} 
                                className={review.rating >= s ? 'text-yellow-400' : 'text-gray-200'} 
                                fill={review.rating >= s ? 'currentColor' : 'none'}
                              />
                            ))}
                          </div>
                          <p className="font-black text-gray-900">{review.customerName}</p>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                          {review.createdAt?.seconds ? format(new Date(review.createdAt.seconds * 1000), 'MMM d, yyyy') : 'Just now'}
                        </span>
                      </div>
                      <p className="text-gray-600 italic leading-relaxed">"{review.comment}"</p>
                    </div>
                  )) : (
                    <div className="p-12 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200 text-center">
                      <p className="text-gray-400 font-bold">No reviews yet. Be the first to book and rate!</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {[
                  { icon: <ShieldCheck className="text-green-600" />, label: 'Verified Pro' },
                  { icon: <Clock className="text-blue-600" />, label: 'Punctual' },
                  { icon: <CalendarDays className="text-purple-600" />, label: 'Easy Booking' },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl">
                    {item.icon}
                    <span className="font-bold text-sm text-gray-700">{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Sidebar / Booking Card */}
        <div className="lg:w-[400px]">
          <div className="bg-white rounded-[3rem] p-8 shadow-2xl shadow-purple-100 border border-purple-50 sticky top-24">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Ready to Book?</h3>
            
            <div className="space-y-4 mb-8">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <span className="text-gray-500 font-medium">Starting from</span>
                <span className="text-2xl font-black text-purple-600">
                  {provider.services && provider.services.length > 0 
                    ? (provider.services.every(s => s.custom) 
                        ? 'Custom Detail' 
                        : `R${Math.min(...provider.services.filter(s => !s.custom).map(s => s.price))}`)
                    : 'Standard Rates'}
                </span>
              </div>
              <div className="p-4 bg-purple-50 rounded-2xl text-purple-700 text-sm font-medium">
                <p>Select a date and time that works best for you. Secure your booking at PinYourPro.</p>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  const el = document.getElementById('availability');
                  el?.scrollIntoView({ behavior: 'smooth' });
                }}
                className="w-full py-5 bg-emerald-500 text-white rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-100"
              >
                <CalendarDays size={20} />
                Select a Slot
              </button>
              <button 
                className="w-full py-5 bg-white border-2 border-slate-100 text-slate-900 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 hover:border-indigo-600 hover:text-indigo-600 transition-all"
                onClick={() => {
                  if (!user) {
                    navigate('/auth');
                    return;
                  }
                  setChatOpen(true);
                }}
              >
                <MessageSquare size={20} />
                Message Provider
              </button>
            </div>

            <p className="mt-6 text-center text-xs text-gray-400">
              Payments are secured by PayFast • PinYourPro Protection
            </p>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {chatOpen && provider && (
          <ChatWindow 
            recipientId={provider.uid}
            recipientName={provider.name}
            onClose={() => setChatOpen(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
