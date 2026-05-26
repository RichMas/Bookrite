import { useState, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { doc, getDoc, addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ProviderProfile, ServiceItem } from '../types';
import { useAuth } from '../App';
import { format, addDays, startOfToday, isSameDay, parseISO } from 'date-fns';
import { Calendar as CalendarIcon, Clock, ArrowRight, CheckCircle2, ChevronRight, LayoutGrid } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { payFastGlobalConfig, generatePayFastSignature, getPayFastUrl } from '../utils/payfast';

const TIME_SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

export default function BookingPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [provider, setProvider] = useState<ProviderProfile | null>(null);
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  
  const paramDate = searchParams.get('date');
  const paramTime = searchParams.get('time');
  const paramServiceId = searchParams.get('serviceId');

  const [selectedDate, setSelectedDate] = useState<Date>(paramDate ? parseISO(paramDate) : startOfToday());
  const [selectedTime, setSelectedTime] = useState<string | null>(paramTime || null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Get available slots for the selected date
  const getAvailableSlots = () => {
    if (!provider?.availability) return [];
    const dayName = format(selectedDate, 'eeee').toLowerCase();
    const dayConfig = provider.availability[dayName];
    if (!dayConfig || !dayConfig.enabled) return [];
    return dayConfig.slots || [];
  };

  const availableSlots = getAvailableSlots();

  useEffect(() => {
    const fetchProvider = async () => {
      if (!id) return;
      try {
        const docSnap = await getDoc(doc(db, 'providers', id));
        if (docSnap.exists()) {
          const data = docSnap.data() as ProviderProfile;
          setProvider({ id: docSnap.id, ...data });
          
          // Pre-select service from URL or first available
          if (data.services && data.services.length > 0) {
            const preselected = data.services.find(s => s.id === paramServiceId);
            setSelectedService(preselected || data.services[0]);
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `providers/${id}`);
      } finally {
        setLoading(false);
      }
    };
    fetchProvider();
  }, [id, paramServiceId]);

  const handleBooking = async () => {
    if (!user || !provider || !selectedTime || !selectedService) return;
    setSubmitting(true);
    try {
      const bookingData = {
        customerId: user.uid,
        customerName: profile?.displayName || 'Unknown Customer',
        providerId: provider.uid,
        providerName: provider.name,
        category: provider.category,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        date: format(selectedDate, 'yyyy-MM-dd'),
        time: selectedTime,
        status: 'pending',
        totalAmount: selectedService.price,
        paymentStatus: 'unpaid',
        payoutStatus: 'pending',
        createdAt: serverTimestamp(),
      };

      const bookingRef = await addDoc(collection(db, 'bookings'), bookingData);
      const bookingId = bookingRef.id;

      // Extract details for PayFast fields
      const names = (profile?.displayName || 'Pro Customer').trim().split(/\s+/);
      const name_first = names[0] || 'Pro';
      const name_last = names.slice(1).join(' ') || 'Customer';

      const pfData = {
        merchant_id: payFastGlobalConfig.merchant_id,
        merchant_key: payFastGlobalConfig.merchant_key,
        return_url: `${window.location.origin}/dashboard?payment_success=true&booking_id=${bookingId}&tab=bookings`,
        cancel_url: `${window.location.origin}/booking/${provider.uid}?payment_cancelled=true`,
        name_first: name_first.substring(0, 100),
        name_last: name_last.substring(0, 100),
        email_address: user.email || 'customer@pinyourpro.co.za',
        m_payment_id: bookingId,
        amount: Number(selectedService.price).toFixed(2),
        item_name: selectedService.name.substring(0, 100),
        item_description: `PinYourPro Booking: ${selectedService.name} with ${provider.name}`.substring(0, 255),
        custom_str1: 'PinYourPro'
      };

      const signature = generatePayFastSignature(pfData, payFastGlobalConfig.passphrase);

      // Create and submit immediate form redirect
      const pfUrl = getPayFastUrl(payFastGlobalConfig.is_live);
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = pfUrl;

      const payload = { ...pfData, signature };
      Object.entries(payload).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== '') {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = key;
          input.value = String(val);
          form.appendChild(input);
        }
      });

      document.body.appendChild(form);
      form.submit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'bookings');
      setSubmitting(false);
    }
  };

  const next7Days = Array.from({ length: 7 }, (_, i) => addDays(startOfToday(), i));

  if (loading) return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  if (!provider) return <div className="text-center py-24">Provider not found</div>;

  if (success) {
    return (
      <div className="max-w-xl mx-auto px-4 py-24 text-center">
        <motion.div 
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white p-12 rounded-[3.5rem] shadow-2xl shadow-green-100 border border-green-50"
        >
          <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 size={48} />
          </div>
          <h1 className="text-3xl font-black text-gray-900 mb-4">Booking Requested!</h1>
          <p className="text-gray-500 mb-8">
            Your booking request for <span className="font-bold text-gray-900">{provider.name}</span> has been sent. 
            Redirecting to your dashboard...
          </p>
          <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: '0%' }}
              animate={{ width: '100%' }}
              transition={{ duration: 3 }}
              className="bg-green-500 h-full"
            />
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {searchParams.get('payment_cancelled') === 'true' && (
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 p-6 bg-amber-50 rounded-[2rem] border-2 border-amber-100 text-amber-900 flex items-center gap-4 shadow-lg shadow-amber-50"
        >
          <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center font-bold text-xl flex-shrink-0">
            !
          </div>
          <div>
            <p className="font-extrabold text-lg">Payment Cancelled</p>
            <p className="text-sm text-amber-700 font-medium">Your checkout process was cancelled. No charges were made, and you can try booking again whenever you are ready.</p>
          </div>
        </motion.div>
      )}
      <div className="flex flex-col lg:flex-row gap-12">
        <div className="flex-1 space-y-12">
          <section>
            <h1 className="text-5xl font-black text-gray-900 mb-4 tracking-tight">Book a Service</h1>
            <p className="text-gray-500 text-lg">Select exactly what you need and when.</p>
          </section>
          
          <section>
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
              <LayoutGrid size={24} className="text-indigo-600" />
              1. Choose a Service
            </h2>
            <div className="grid gap-4">
              {(provider.services || []).map((service) => (
                <button
                  key={service.id}
                  onClick={() => setSelectedService(service)}
                  className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all text-left ${
                    selectedService?.id === service.id
                      ? 'bg-indigo-50 border-indigo-600 text-indigo-900 shadow-xl shadow-indigo-100'
                      : 'bg-white border-gray-100 text-gray-600 hover:border-indigo-200'
                  }`}
                >
                  <div className="flex-1">
                    <p className="text-lg font-black">{service.name}</p>
                    <p className="text-sm opacity-60 line-clamp-1">{service.description}</p>
                  </div>
                  <div className="text-right ml-6">
                    <p className="text-xl font-black">
                      {service.custom ? 'Custom' : `R${service.price}${service.unit || ''}`}
                    </p>
                    <p className="text-xs font-bold uppercase tracking-widest">{service.duration}</p>
                  </div>
                </button>
              ))}
              {(!provider.services || provider.services.length === 0) && (
                <div className="p-8 bg-gray-50 rounded-[2rem] border border-dashed border-gray-200 text-center">
                  <p className="text-gray-400 font-bold">No services listed by this provider yet.</p>
                </div>
              )}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
              <CalendarIcon size={24} className="text-indigo-600" />
              2. Select Date
            </h2>
            <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
              {next7Days.map((date) => {
                const dayName = format(date, 'eeee').toLowerCase();
                const isAvailable = provider.availability?.[dayName]?.enabled && provider.availability?.[dayName]?.slots?.length > 0;
                
                return (
                  <button
                    key={date.toString()}
                    disabled={!isAvailable}
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedTime(null);
                    }}
                    className={`flex flex-col items-center justify-center min-w-[110px] h-28 rounded-[2rem] transition-all border-2 disabled:opacity-30 disabled:grayscale ${
                      isSameDay(selectedDate, date)
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-2xl shadow-indigo-200 -translate-y-1'
                        : 'bg-white border-gray-100 text-gray-500 hover:border-indigo-300'
                    }`}
                  >
                    <span className="text-[10px] font-bold uppercase tracking-widest mb-1">{format(date, 'EEE')}</span>
                    <span className="text-2xl font-black">{format(date, 'd')}</span>
                    <span className="text-[10px] uppercase font-bold">{format(date, 'MMM')}</span>
                  </button>
                );
              })}
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-black mb-8 flex items-center gap-3">
              <Clock size={24} className="text-indigo-600" />
              3. Select Time
            </h2>
            {availableSlots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-3">
                {availableSlots.map((time) => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`py-5 rounded-2xl font-black text-center transition-all border-2 ${
                      selectedTime === time
                        ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100'
                        : 'bg-white border-gray-100 text-gray-600 hover:border-indigo-200'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-12 bg-gray-50 rounded-[2.5rem] border border-dashed border-gray-200 text-center">
                <p className="text-gray-400 font-bold">No slots available for this day. Please choose another date.</p>
              </div>
            )}
          </section>
        </div>

        <div className="lg:w-[400px]">
          <div className="bg-white p-10 rounded-[3rem] border border-gray-100 sticky top-24 shadow-2xl shadow-gray-100">
            <h3 className="font-black text-gray-400 uppercase text-[10px] tracking-[0.2em] mb-10 text-center">Booking Confirmation</h3>
            <div className="flex items-center gap-5 mb-10 pb-10 border-b border-gray-50">
              <img 
                src={provider.photoURL || `https://picsum.photos/seed/${provider.uid}/100/100`}
                className="w-16 h-16 rounded-2xl object-cover shadow-lg shadow-purple-50"
                alt={provider.name}
                referrerPolicy="no-referrer"
              />
              <div>
                <p className="font-black text-gray-900 text-xl leading-tight">{provider.name}</p>
                <p className="text-sm font-bold text-gray-400 mt-1">{provider.category}</p>
              </div>
            </div>

            <div className="space-y-6 mb-10">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Service</span>
                <span className="font-bold text-gray-900 text-lg">{selectedService?.name || 'Not selected'}</span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Schedule</span>
                <span className="font-bold text-gray-900 text-lg">
                  {format(selectedDate, 'EEEE, d MMMM')} 
                  {selectedTime && <span className="text-indigo-600 ml-2">@ {selectedTime}</span>}
                </span>
              </div>
              
              <div className="pt-8 border-t border-gray-50">
                <div className="flex justify-between items-center bg-gray-50 p-6 rounded-2xl">
                  <span className="text-gray-900 font-black text-xl">Total</span>
                  <span className="text-3xl font-black text-indigo-600">
                    {selectedService?.custom 
                      ? 'Quote' 
                      : `R${selectedService?.price || 0}${selectedService?.unit || ''}`}
                  </span>
                </div>
              </div>
            </div>

            {!user && (
              <p className="text-sm text-center text-red-500 mb-6 font-bold bg-red-50 p-4 rounded-xl">Please log in to continue</p>
            )}

            <button 
              onClick={handleBooking}
              disabled={!selectedTime || !selectedService || !user || submitting}
              className="w-full py-6 bg-emerald-500 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all disabled:bg-gray-100 disabled:text-gray-300 disabled:shadow-none shadow-2xl shadow-emerald-100 hover:-translate-y-1 active:translate-y-0"
            >
              {submitting ? 'Authenticating...' : 'Secure Checkout'}
              {!submitting && <ArrowRight size={22} />}
            </button>
            
            <p className="mt-8 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest">
              Secured by PayFast • PinYourPro Protection
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
