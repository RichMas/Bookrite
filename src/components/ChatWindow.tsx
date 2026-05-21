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
  increment
} from 'firebase/firestore';
import { Message, Chat } from '../types';
import { Send, X, User, ArrowLeft, Loader2 } from 'lucide-react';
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
      className="fixed bottom-6 right-6 w-full max-w-[400px] h-[600px] bg-white rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden z-[60] border border-slate-100"
    >
      {/* Header */}
      <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500 flex items-center justify-center">
            <User size={20} />
          </div>
          <div>
            <h3 className="font-bold text-sm leading-tight">{recipientName}</h3>
            <span className="text-[10px] text-indigo-300 font-bold uppercase tracking-widest">Active Now</span>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="p-2 hover:bg-white/10 rounded-full transition-all"
        >
          <X size={20} />
        </button>
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
            <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 mb-4 shadow-sm">
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
        className="p-6 bg-white border-t border-slate-100 flex gap-2"
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
          className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:shadow-none"
        >
          <Send size={18} />
        </button>
      </form>
    </motion.div>
  );
}
