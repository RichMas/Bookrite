import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../App';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { 
  collection, 
  query, 
  orderBy, 
  onSnapshot, 
  addDoc, 
  serverTimestamp, 
  doc, 
  updateDoc,
  where,
  getDocs,
  limit,
  setDoc,
  increment,
  getDoc
} from 'firebase/firestore';
import { Message, Chat } from '../types';
import { Send, X, User, ArrowLeft, Loader2, Calendar, Info, Mail, Phone, ShieldCheck, Tag, Star, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

interface ChatWindowProps {
  recipientId: string;
  recipientName: string;
  onClose: () => void;
}

export default function ChatWindow({ recipientId, recipientName, onClose }: ChatWindowProps) {
  const { user, profile } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatId, setChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Profile Details & Bookings State
  const [showProfile, setShowProfile] = useState(false);
  const [recipientProfile, setRecipientProfile] = useState<any>(null);
  const [relatedBookings, setRelatedBookings] = useState<any[]>([]);
  const [loadingProfile, setLoadingProfile] = useState(false);

  useEffect(() => {
    if (!recipientId || !showProfile) return;

    const fetchRecipientDetailsAndBookings = async () => {
      setLoadingProfile(true);
      try {
        // Fetch recipient's base profile details
        const userDocRef = doc(db, 'users', recipientId);
        const userSnap = await getDoc(userDocRef);
        let recipientRole = 'customer';
        let mainDetails = null;

        if (userSnap.exists()) {
          mainDetails = userSnap.data();
          recipientRole = mainDetails.role || 'customer';
        }

        // If recipient is a provider, fetch from providers collection for services list
        if (recipientRole === 'provider') {
          const providerDocRef = doc(db, 'providers', recipientId);
          const providerSnap = await getDoc(providerDocRef);
          if (providerSnap.exists()) {
            setRecipientProfile({
              role: 'provider',
              ...mainDetails,
              ...providerSnap.data()
            });
          } else {
            setRecipientProfile({
              role: 'provider',
              ...mainDetails
            });
          }
        } else {
          setRecipientProfile({
            role: 'customer',
            ...mainDetails
          });
        }

        // Fetch bookings between the two
        const bookingsRef = collection(db, 'bookings');
        const customerId = profile?.role === 'customer' ? user?.uid : recipientId;
        const providerId = profile?.role === 'provider' ? user?.uid : recipientId;

        if (customerId && providerId) {
          const q = query(
            bookingsRef,
            where('customerId', '==', customerId),
            where('providerId', '==', providerId)
          );
          const snap = await getDocs(q);
          const bookingList = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Sort client side to prevent potential index mismatch failures
          bookingList.sort((a: any, b: any) => {
            const dateA = a.createdAt?.seconds || 0;
            const dateB = b.createdAt?.seconds || 0;
            return dateB - dateA;
          });
          setRelatedBookings(bookingList);
        }
      } catch (error) {
        console.error("Error fetching recipient details/bookings:", error);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchRecipientDetailsAndBookings();
  }, [recipientId, showProfile, user, profile]);

  useEffect(() => {
    if (!user) return;

    const findOrCreateChat = async () => {
      try {
        // Look for existing chat between these two members
        const chatsRef = collection(db, 'chats');
        const q = query(
          chatsRef, 
          where('members', 'array-contains', user.uid)
        );
        
        const querySnapshot = await getDocs(q);
        let existingChat = querySnapshot.docs.find(doc => {
          const members = doc.data().members as string[];
          return members.includes(recipientId);
        });

        if (existingChat) {
          setChatId(existingChat.id);
        } else {
          // Create new chat
          const newChatRef = doc(collection(db, 'chats'));
          const chatData = {
            members: [user.uid, recipientId],
            customerName: profile?.role === 'customer' ? (profile?.displayName || 'Customer') : recipientName,
            providerName: profile?.role === 'provider' ? (profile?.displayName || 'Provider') : recipientName,
            unreadCount: {
              [user.uid]: 0,
              [recipientId]: 0
            },
            updatedAt: serverTimestamp()
          };
          await setDoc(newChatRef, chatData);
          setChatId(newChatRef.id);
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, 'chats');
      }
    };

    findOrCreateChat();
  }, [user, recipientId]);

  useEffect(() => {
    if (!chatId) return;

    const messagesRef = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesRef, orderBy('createdAt', 'asc'));

    const resetUnread = async () => {
      try {
        await updateDoc(doc(db, 'chats', chatId), {
          [`unreadCount.${user.uid}`]: 0
        });
      } catch (err) {
        console.error("Error resetting unread:", err);
      }
    };

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Message[];
      setMessages(msgs);
      setLoading(false);
      resetUnread();
      
      // Auto scroll
      setTimeout(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `chats/${chatId}/messages`);
    });

    return () => unsubscribe();
  }, [chatId]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user || !chatId) return;

    const text = newMessage;
    setNewMessage('');

    try {
      // Add message
      await addDoc(collection(db, 'chats', chatId, 'messages'), {
        senderId: user.uid,
        text: text,
        createdAt: serverTimestamp()
      });

      // Update chat last message and increment recipient unread count
      await updateDoc(doc(db, 'chats', chatId), {
        lastMessage: text,
        lastMessageAt: serverTimestamp(),
        [`unreadCount.${recipientId}`]: increment(1),
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `chats/${chatId}/messages`);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className={`fixed bottom-6 right-6 w-full ${
        showProfile ? 'max-w-[800px]' : 'max-w-[420px]'
      } h-[600px] bg-white rounded-[2.5rem] shadow-2xl flex flex-row overflow-hidden z-[60] border border-slate-100 transition-all duration-300`}
    >
      {/* LEFT SIDE: Chat Stream Column */}
      <div className="flex flex-col flex-1 h-full min-w-0">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center shrink-0">
              <User size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-sm leading-tight truncate">{recipientName}</h3>
              <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Active Now</span>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={() => setShowProfile(!showProfile)}
              title="View Profile & Booking Details"
              className={`p-2 rounded-full transition-all border-none bg-transparent flex items-center justify-center cursor-pointer ${
                showProfile ? 'text-indigo-400 bg-white/10' : 'text-slate-350 hover:text-white hover:bg-white/5'
              }`}
            >
              <Info size={20} />
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="p-2 hover:bg-white/10 text-slate-350 hover:text-white rounded-full transition-all border-none bg-transparent cursor-pointer"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-slate-50/50 custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 gap-2">
              <Loader2 className="animate-spin" />
              <span className="text-xs font-bold uppercase">Loading messages...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 mb-4 shadow-sm mx-auto">
                <ArrowLeft className="rotate-45" />
              </div>
              <p className="text-slate-500 font-medium">No messages yet. Say hi and start the conversation!</p>
            </div>
          ) : (
            messages.map((msg, idx) => {
              const isMe = msg.senderId === user?.uid;
              return (
                <div 
                  key={msg.id || idx} 
                  className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                >
                  <div 
                    className={`max-w-[80%] p-4 rounded-2xl text-sm font-medium ${
                      isMe 
                        ? 'bg-indigo-600 text-white rounded-tr-none' 
                        : 'bg-white text-slate-700 rounded-tl-none border border-slate-100 shadow-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 px-1 font-bold">
                    {msg.createdAt?.seconds ? format(new Date(msg.createdAt.seconds * 1000), 'HH:mm') : 'Sending...'}
                  </span>
                </div>
              );
            })
          )}
          <div ref={scrollRef} />
        </div>

        {/* Input Area */}
        <form 
          onSubmit={handleSendMessage}
          className="p-6 bg-white border-t border-slate-100 flex gap-2 shrink-0"
        >
          <input 
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 bg-slate-50 border-none outline-none px-6 py-4 rounded-2xl text-sm font-medium focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-slate-400"
          />
          <button 
            type="submit"
            disabled={!newMessage.trim()}
            className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:shadow-none shrink-0"
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      {/* RIGHT SIDE / SLIDE-OVER: Profile & Enquiry Details Panel */}
      <AnimatePresence>
        {showProfile && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className={`
              absolute inset-0 bg-white z-[70] flex flex-col h-full
              md:relative md:flex md:w-[380px] md:shrink-0 md:border-l md:border-slate-100 md:z-[50]
            `}
          >
            {/* Context Header */}
            <div className="p-6 border-b border-slate-100 bg-slate-50 flex items-center justify-between shrink-0">
              <div>
                <h4 className="font-extrabold text-slate-800 text-sm flex items-center gap-2">
                  <ShieldCheck size={18} className="text-indigo-600" />
                  Inquiry Details
                </h4>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Profile & Service History</p>
              </div>
              
              {/* Mobile Back / Close button */}
              <button
                type="button"
                onClick={() => setShowProfile(false)}
                className="p-2 hover:bg-slate-100 text-slate-400 hover:text-slate-700 rounded-full transition-all border-none bg-transparent cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable details container */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
              {loadingProfile ? (
                <div className="py-24 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                  <Loader2 className="animate-spin text-indigo-605" />
                  <p className="text-xs font-black uppercase tracking-widest">Retrieving details...</p>
                </div>
              ) : recipientProfile ? (
                <>
                  {/* Basic user description card */}
                  <div className="text-center bg-slate-50/50 p-6 rounded-[2rem] border border-slate-100">
                    <div className="w-16 h-16 rounded-3xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-2xl font-black mx-auto mb-3 border border-indigo-100/55 shadow-sm">
                      {recipientProfile.displayName?.charAt(0) || recipientProfile.name?.charAt(0) || recipientName.charAt(0)}
                    </div>
                    <h5 className="font-black text-slate-900 text-base leading-tight">
                      {recipientProfile.displayName || recipientProfile.name || recipientName}
                    </h5>
                    <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-650 text-[10px] font-black uppercase tracking-wider rounded-lg mt-1.5 capitalize">
                      {recipientProfile.role || 'customer'}
                    </span>
                    
                    {recipientProfile.role === 'provider' && (
                      <div className="flex items-center justify-center gap-1.5 mt-2.5">
                        <div className="flex text-amber-400">
                          <Star size={14} fill="currentColor" />
                        </div>
                        <span className="text-xs font-black text-slate-700">{recipientProfile.rating?.toFixed(1) || '5.0'}</span>
                        <span className="text-[10px] text-slate-400 font-bold">({recipientProfile.reviewCount || 0} reviews)</span>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-slate-100 flex flex-col gap-2 text-left">
                      {recipientProfile.email && (
                        <div className="flex items-center gap-2.5 text-xs text-slate-650 font-semibold subtitle">
                          <Mail size={14} className="text-slate-400 shrink-0" />
                          <span className="truncate">{recipientProfile.email}</span>
                        </div>
                      )}
                      {recipientProfile.phone && (
                        <div className="flex items-center gap-2.5 text-xs text-slate-650 font-semibold subtitle">
                          <Phone size={14} className="text-slate-400 shrink-0" />
                          <span>{recipientProfile.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Booking / Service Enquiry Segment */}
                  <div className="space-y-3">
                    <h6 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                      <Calendar size={13} />
                      Appointments & SERVICE INQUIRIES
                    </h6>

                    {relatedBookings.length === 0 ? (
                      <div className="p-4 bg-slate-50/45 rounded-2xl border border-dashed border-slate-200 text-center select-none">
                        <p className="text-xs font-bold text-slate-500">No official schedules found</p>
                        <p className="text-[10px] text-slate-400 mt-1 font-semibold">This chat is currently for a general enquiry.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[190px] overflow-y-auto pr-1 custom-scrollbar">
                        {relatedBookings.map((b) => (
                          <div 
                            key={b.id} 
                            className="p-3 bg-white border border-slate-110 rounded-2xl shadow-sm flex items-start justify-between gap-2.5 border border-slate-100"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-800 truncate leading-tight">{b.serviceName}</p>
                              <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold mt-1">
                                <Clock size={10} />
                                <span>{b.date} • {b.time}</span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 flex flex-col items-end gap-1">
                              <span className="text-xs font-black text-slate-900 leading-none">R{b.totalAmount}</span>
                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                                b.status === 'confirmed' ? 'bg-emerald-50 text-emerald-600' :
                                b.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                                b.status === 'cancelled' ? 'bg-rose-50 text-rose-600' : 'bg-slate-100 text-slate-500'
                              }`}>
                                {b.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Custom Provider Predefined Services Offered List */}
                  {recipientProfile.role === 'provider' && recipientProfile.services?.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h6 className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
                        <Tag size={13} />
                        Services Offered by Provider
                      </h6>
                      <div className="space-y-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar">
                        {recipientProfile.services.map((svc: any, sIdx: number) => (
                          <div 
                            key={svc.id || sIdx} 
                            className="p-3 bg-slate-50 hover:bg-slate-100/50 rounded-2xl border border-transparent transition flex justify-between items-center gap-2"
                          >
                            <div className="min-w-0">
                              <p className="text-xs font-black text-slate-800 truncate leading-none">{svc.name}</p>
                              <p className="text-[10px] text-slate-500 mt-1 truncate font-semibold">{svc.duration || 'Flexible'}</p>
                            </div>
                            <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg shrink-0">
                              R{svc.price}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center p-8 select-none">
                  <p className="text-xs font-bold text-slate-450">Unable to load details.</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
