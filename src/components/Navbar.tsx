import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Menu, X, Shield, LayoutDashboard, Bell, ChevronRight } from 'lucide-react';
import { useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signOut } from 'firebase/auth';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { useAuth } from '../App';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadChats, setUnreadChats] = useState<any[]>([]);
  const [unreadBookings, setUnreadBookings] = useState<any[]>([]);
  const [seenBookingKeys, setSeenBookingKeys] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('pinyourpro_seen_bookings');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  // Listen to Chats in Real-time
  useEffect(() => {
    if (!user) {
      setUnreadChats([]);
      return;
    }

    const chatsRef = collection(db, 'chats');
    const q = query(chatsRef, where('members', 'array-contains', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeUnread: any[] = [];
      snapshot.docs.forEach(docSnap => {
        const chatData = docSnap.data();
        const unread = chatData.unreadCount?.[user.uid] || 0;
        if (unread > 0) {
          const otherMemberId = chatData.members.find((m: string) => m !== user.uid);
          const otherMemberName = profile?.role === 'customer' ? chatData.providerName : chatData.customerName;
          activeUnread.push({
            id: docSnap.id,
            partnerId: otherMemberId,
            partnerName: otherMemberName,
            text: chatData.lastMessage || 'Sent a message',
            unread
          });
        }
      });
      setUnreadChats(activeUnread);
    }, (error) => {
      console.warn("Error listening to chats:", error);
    });

    return () => unsubscribe();
  }, [user, profile]);

  // Listen to Bookings in Real-time
  useEffect(() => {
    if (!user || !profile) {
      setUnreadBookings([]);
      return;
    }

    const bookingsRef = collection(db, 'bookings');
    const field = profile.role === 'provider' ? 'providerId' : 'customerId';
    const q = query(bookingsRef, where(field, '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const activeBookings: any[] = [];
      const hasStoredKeys = localStorage.getItem('pinyourpro_seen_bookings') !== null;
      const loadedKeys: string[] = [];

      snapshot.docs.forEach(docSnap => {
        const booking = docSnap.data();
        const bId = docSnap.id;
        const key = `${bId}_${booking.status}`;
        loadedKeys.push(key);

        if (hasStoredKeys) {
          if (!seenBookingKeys.includes(key)) {
            activeBookings.push({
              id: bId,
              key,
              serviceName: booking.serviceName,
              customerName: booking.customerName,
              providerName: booking.providerName,
              status: booking.status,
              date: booking.date,
              time: booking.time,
              createdAt: booking.createdAt
            });
          }
        }
      });

      // If localStorage is completely uninitialized, initialize with all current keys so they don't see history
      if (!hasStoredKeys) {
        localStorage.setItem('pinyourpro_seen_bookings', JSON.stringify(loadedKeys));
        setSeenBookingKeys(loadedKeys);
        setUnreadBookings([]);
      } else {
        setUnreadBookings(activeBookings);
      }
    }, (error) => {
      console.warn("Error listening to bookings:", error);
    });

    return () => unsubscribe();
  }, [user, profile, seenBookingKeys]);

  const handleMarkAllBookingsSeen = () => {
    // Collect all loaded keys
    const newKeys = [...seenBookingKeys];
    let changed = false;
    
    // To collect all unread keys currently loaded
    unreadBookings.forEach(ub => {
      if (!newKeys.includes(ub.key)) {
        newKeys.push(ub.key);
        changed = true;
      }
    });

    if (changed) {
      setSeenBookingKeys(newKeys);
      localStorage.setItem('pinyourpro_seen_bookings', JSON.stringify(newKeys));
      setUnreadBookings([]);
    }
  };

  const totalNotifications = unreadChats.length + unreadBookings.length;

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/');
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100 h-16">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <img src="/logo.png" alt="PinYourPro Logo" className="w-10 h-10 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            PinYourPro
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/browse" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
            Browse Services
          </Link>
          <Link to="/about" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
            About Us
          </Link>
          <Link to="/contact" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
            Contact Us
          </Link>
          {user ? (
            <div className="flex items-center gap-4">
              {(profile?.role === 'admin' || user.email === 'paragonbusinessconsult@gmail.com' || user.email === 'sithembiledlaza8@gmail.com') && (
                <Link 
                  to="/admin" 
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-full border border-red-100 transition-all"
                >
                  <Shield size={14} />
                  <span>Admin Panel</span>
                </Link>
              )}
              <Link 
                to="/dashboard" 
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-full border border-indigo-100 transition-all"
              >
                <LayoutDashboard size={14} />
                <span>My Dashboard</span>
              </Link>

              {/* Notification Bell Desktop */}
              <button
                onClick={() => setNotificationsOpen(!notificationsOpen)}
                className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-all shrink-0"
              >
                <Bell size={20} />
                {totalNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
                )}
              </button>

              <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
                <div className="text-right font-sans">
                  <p className="text-sm font-semibold text-slate-800 leading-none">{profile?.displayName || 'User'}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{profile?.role}</p>
                </div>
                <button 
                  onClick={handleSignOut}
                  className="p-2 text-slate-450 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/auth" className="text-sm font-medium text-slate-500 hover:text-indigo-600 px-5 py-2 rounded-full border border-slate-200 hover:bg-slate-50 transition-all">
                Login
              </Link>
              <Link 
                to="/auth?role=provider" 
                className="px-5 py-2 bg-emerald-500 text-white rounded-full font-semibold hover:bg-emerald-600 transition-all shadow-md shadow-emerald-100"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu and Bell button */}
        <div className="flex items-center gap-2 md:hidden">
          {user && (
            <button
              onClick={() => {
                setNotificationsOpen(!notificationsOpen);
                setIsOpen(false); // close mobile menu when opening notifications
              }}
              className="relative p-2 text-slate-500 hover:text-indigo-605 hover:bg-slate-50 rounded-full transition-all shrink-0"
            >
              <Bell size={22} />
              {totalNotifications > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white animate-pulse" />
              )}
            </button>
          )}
          <button 
            className="p-2 text-gray-650"
            onClick={() => {
              setIsOpen(!isOpen);
              setNotificationsOpen(false); // close notifications when opening mobile menu
            }}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Notifications Panel Dropdown */}
      <AnimatePresence>
        {notificationsOpen && (
          <>
            {/* Click outside backdrop */}
            <div 
              className="fixed inset-0 z-40 bg-transparent" 
              onClick={() => setNotificationsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute right-4 top-18 z-55 w-[calc(100vw-2rem)] sm:w-[24rem] bg-white rounded-[2rem] border border-slate-100 shadow-2xl overflow-hidden max-h-[32rem] flex flex-col"
            >
              {/* Header */}
              <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between shrink-0">
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    <Bell size={18} className="text-slate-500" />
                    Notifications
                    {totalNotifications > 0 && (
                      <span className="px-2 py-0.5 bg-rose-100 text-rose-600 text-[10px] font-black rounded-lg">
                        {totalNotifications} new
                      </span>
                    )}
                  </h3>
                  <p className="text-slate-400 text-[11px] font-medium mt-0.5 animate-pulse">Real-time alerts & updates</p>
                </div>
                {totalNotifications > 0 && (
                  <button
                    onClick={handleMarkAllBookingsSeen}
                    className="text-xs font-black text-indigo-600 hover:text-indigo-700 transition"
                  >
                    Mark read
                  </button>
                )}
              </div>

              {/* Scrollable list */}
              <div className="overflow-y-auto divide-y divide-slate-50/80 p-2 max-h-[24rem]">
                {totalNotifications === 0 ? (
                  <div className="py-12 text-center select-none">
                    <div className="w-12 h-12 bg-slate-50 text-slate-350 rounded-2xl flex items-center justify-center mx-auto mb-3">
                      <Bell size={24} />
                    </div>
                    <p className="text-slate-500 font-bold text-sm">All caught up! 🎉</p>
                    <p className="text-slate-400 text-xs mt-1">No unread alerts at the moment.</p>
                  </div>
                ) : (
                  <>
                    {/* Unread Chats */}
                    {unreadChats.map(chat => (
                      <button
                        key={`chat-${chat.id}`}
                        onClick={() => {
                          setNotificationsOpen(false);
                          navigate(`/dashboard?tab=chats&partnerId=${chat.partnerId}&partnerName=${encodeURIComponent(chat.partnerName)}`);
                        }}
                        className="w-full text-left p-4 hover:bg-slate-50/70 rounded-2xl transition flex gap-3.5 group border-none"
                      >
                        <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 font-black text-sm flex items-center justify-center shrink-0">
                          {chat.partnerName?.charAt(0) || 'M'}
                        </div>
                        <div className="space-y-1 min-w-0 flex-1">
                          <p className="text-xs text-slate-500 font-bold">
                            Message from <strong className="text-slate-800 font-black">{chat.partnerName}</strong>
                          </p>
                          <p className="text-xs text-slate-600 font-medium truncate group-hover:text-indigo-600 transition-colors">
                            {chat.text}
                          </p>
                        </div>
                        <div className="shrink-0 flex items-center">
                          <span className="w-2.5 h-2.5 bg-indigo-650 rounded-full" />
                        </div>
                      </button>
                    ))}

                    {/* Unread Bookings */}
                    {unreadBookings.map(booking => {
                      const isProv = profile?.role === 'provider';
                      return (
                        <button
                          key={`booking-${booking.id}-${booking.status}`}
                          onClick={() => {
                            // Mark this particular booking as read/seen in local state immediately so it disappears from count
                            const newKeys = [...seenBookingKeys, booking.key];
                            setSeenBookingKeys(newKeys);
                            localStorage.setItem('pinyourpro_seen_bookings', JSON.stringify(newKeys));
                            
                            setNotificationsOpen(false);
                            navigate(`/dashboard?tab=bookings`);
                          }}
                          className="w-full text-left p-4 hover:bg-slate-50/70 rounded-2xl transition flex gap-3.5 group border-none"
                        >
                          <div className={`w-10 h-10 rounded-xl font-black text-sm flex items-center justify-center shrink-0 ${
                            booking.status === 'pending' ? 'bg-amber-50 text-amber-600 font-bold' :
                            booking.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600 font-bold' :
                            booking.status === 'cancelled' ? 'bg-rose-50 text-rose-600 font-bold' : 'bg-slate-100 text-slate-600 font-bold'
                          }`}>
                            📅
                          </div>
                          <div className="space-y-1 min-w-0 flex-1">
                            {isProv ? (
                              <>
                                <p className="text-xs text-slate-500 font-bold">
                                  Appointment: <strong className="text-slate-800 font-black">{booking.serviceName}</strong>
                                </p>
                                <p className="text-xs text-slate-605 leading-relaxed font-semibold">
                                  Client: <strong className="text-slate-700">{booking.customerName}</strong> for {booking.date} at {booking.time} ({booking.status})
                                </p>
                              </>
                            ) : (
                              <>
                                <p className="text-xs text-slate-500 font-bold">
                                  Booking Update: <strong className="text-slate-800 font-black">{booking.serviceName}</strong>
                                </p>
                                <p className="text-xs text-slate-605 leading-relaxed font-semibold">
                                  Status: <strong className="text-indigo-600 font-black capitalize">{booking.status}</strong> with {booking.providerName}
                                </p>
                              </>
                            )}
                          </div>
                          <div className="shrink-0 flex items-center">
                            <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                          </div>
                        </button>
                      );
                    })}
                  </>
                )}
              </div>

              {/* View all dashboard button */}
              <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 text-center shrink-0">
                <button
                  onClick={() => {
                    setNotificationsOpen(false);
                    navigate('/dashboard');
                  }}
                  className="text-xs font-black text-slate-600 hover:text-slate-900 transition flex items-center justify-center gap-1 mx-auto"
                >
                  Go to Dashboard <ChevronRight size={14} />
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-100 p-4 flex flex-col gap-4 shadow-xl"
          >
            <Link to="/browse" onClick={() => setIsOpen(false)} className="text-lg font-medium text-gray-700 p-2">Browse Services</Link>
            <Link to="/about" onClick={() => setIsOpen(false)} className="text-lg font-medium text-gray-700 p-2">About Us</Link>
            <Link to="/contact" onClick={() => setIsOpen(false)} className="text-lg font-medium text-gray-700 p-2">Contact Us</Link>
            {user ? (
               <>
                <Link to="/dashboard" onClick={() => setIsOpen(false)} className="text-lg font-medium text-gray-700 p-2">Dashboard</Link>
                {(profile?.role === 'admin' || user.email === 'paragonbusinessconsult@gmail.com' || user.email === 'sithembiledlaza8@gmail.com') && (
                  <Link to="/admin" onClick={() => setIsOpen(false)} className="text-lg font-medium text-gray-700 p-2">Admin Panel</Link>
                )}
                <button 
                  onClick={handleSignOut}
                  className="text-left text-lg font-medium text-red-600 p-2 flex items-center gap-2 w-full border-none bg-transparent"
                >
                  <LogOut size={20} /> Sign Out
                </button>
              </>
            ) : (
              <Link 
                to="/auth" 
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-3 bg-purple-600 text-white rounded-xl font-semibold"
              >
                Log In / Register
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
