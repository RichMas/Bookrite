import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Phone, MapPin, Send, CheckCircle2, MessageSquare, Shield, Clock, HelpCircle } from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../App';

export default function Contact() {
  const { user, profile } = useAuth();
  
  // Form state
  const [name, setName] = useState(profile?.displayName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(profile?.phone || '');
  const [subject, setSubject] = useState('general');
  const [userRole, setUserRole] = useState(profile?.role || 'visitor');
  const [message, setMessage] = useState('');
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      setError('Please fill in all required fields (Name, Email, and Message).');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await addDoc(collection(db, 'inquiries'), {
        name,
        email,
        phone,
        subject,
        userRole,
        message,
        userId: user?.uid || null,
        createdAt: serverTimestamp(),
        status: 'new'
      });

      setIsSuccess(true);
      // Reset non-auth fields
      setMessage('');
    } catch (err: any) {
      console.error('Error submitting inquiry to Firestore:', err);
      setError('Something went wrong. Please check your internet connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const contactCategories = [
    { value: 'general', label: 'General Inquiry' },
    { value: 'payout', label: 'Payout & Wallet assistance' },
    { value: 'provider', label: 'Merchant / Provider application' },
    { value: 'dispute', label: 'Booking or Escrow dispute' },
    { value: 'report', label: 'Report suspicious behavior' },
    { value: 'other', label: 'Other support request' }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50 py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/50 text-indigo-700 text-xs font-black uppercase tracking-widest mb-4"
          >
            <HelpCircle size={14} /> Feel Free to reach out
          </motion.span>
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight leading-none mb-6"
          >
            Contact PinYourPro support
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-slate-500 font-sans leading-relaxed"
          >
            Have a question about our escrow payouts, service provider verification, or booking process? Our local South African team is ready to assist you.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Detailed Info Column */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-100/40 space-y-8">
              <h3 className="text-2xl font-black text-slate-900">Get in Touch</h3>
              <p className="text-sm font-sans text-slate-500 leading-relaxed">
                Whether you are a certified home professional offering services or a client looking to get high-quality labor done safely, we guarantee 100% security with PinYourPro protection.
              </p>

              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-indigo-50 border border-indigo-100/30 text-indigo-600 rounded-2xl flex items-center justify-center shrink-0">
                    <Mail size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Email support</h4>
                    <p className="font-bold text-slate-800">support@pinyourpro.co.za</p>
                    <p className="text-xs text-slate-505 mt-0.5">Response within 2-4 hours</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-emerald-50 border border-emerald-100/30 text-emerald-600 rounded-2xl flex items-center justify-center shrink-0">
                    <Phone size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Call us</h4>
                    <p className="font-bold text-slate-800">+27 62 937 7066</p>
                    <p className="text-xs text-slate-500 mt-0.5">Mon - Fri • 08:30 to 16:30 CAT</p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-purple-50 border border-purple-100/30 text-purple-600 rounded-2xl flex items-center justify-center shrink-0">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h4 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Corporate Base</h4>
                    <p className="font-bold text-slate-800">Johannesburg, South Africa</p>
                    <p className="text-xs text-slate-500 mt-0.5">Gauteng, South Africa</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick trust advisory box */}
            <div className="bg-slate-900 text-white p-8 rounded-[2.5rem] relative overflow-hidden shadow-xl">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl translate-x-12 -translate-y-12"></div>
              <div className="relative z-10 flex gap-4 items-start">
                <div className="w-10 h-10 bg-indigo-500/20 text-indigo-400 rounded-xl flex items-center justify-center shrink-0 border border-indigo-400/20">
                  <Shield size={18} />
                </div>
                <div>
                  <h4 className="font-black text-lg mb-2 text-white">Escrow Support Notice</h4>
                  <p className="text-xs text-slate-300 font-sans leading-relaxed">
                    Never send money directly to provider bank accounts. PinYourPro escrow protects you perfectly when payments are made online using our secure PayFast integration. 
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Form Column */}
          <div className="lg:col-span-7">
            <div className="bg-white p-8 sm:p-10 rounded-[3rem] border border-slate-100 shadow-xl shadow-slate-100/40 relative overflow-hidden">
              <AnimatePresence mode="wait">
                {!isSuccess ? (
                  <motion.form 
                    key="contact-form"
                    onSubmit={handleSubmit}
                    className="space-y-6"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                  >
                    <div className="flex items-center gap-3 pb-4 border-b border-slate-50">
                      <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-slate-700">
                        <MessageSquare size={20} />
                      </div>
                      <div>
                        <h3 className="font-black text-xl text-slate-900">Send an Enquiry Message</h3>
                        <p className="text-xs text-slate-405 font-medium mt-0.5">Please fill details truthfully, and we will contact you immediately.</p>
                      </div>
                    </div>

                    {error && (
                      <div className="p-4 bg-rose-50 border border-rose-100 rounded-2xl text-xs font-semibold text-rose-800 leading-relaxed">
                        {error}
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-[#2e2e3a] mb-2">
                          Your Full Name <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Sithembile Dlaza"
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-600/20 text-slate-800 placeholder-slate-400 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-[#2e2e3a] mb-2">
                          Email Address <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="client@example.co.za"
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-600/20 text-slate-800 placeholder-slate-400 font-medium"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-[#2e2e3a] mb-2">
                          Phone Number (Optional)
                        </label>
                        <input
                          type="tel"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          placeholder="+27 82 123 4567"
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-600/20 text-slate-800 placeholder-slate-400 font-medium"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-[#2e2e3a] mb-2">
                          Who are you?
                        </label>
                        <select
                          value={userRole}
                          onChange={(e) => setUserRole(e.target.value)}
                          className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-600/20 text-slate-800 font-bold"
                        >
                          <option value="visitor">Visitor / General Public</option>
                          <option value="customer">Registered Client</option>
                          <option value="provider">Service Provider / Contractor</option>
                          <option value="partner">Business Partner</option>
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-[#2e2e3a] mb-2">
                        Help Category <span className="text-rose-500">*</span>
                      </label>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-600/20 text-slate-800 font-extrabold"
                      >
                        {contactCategories.map((cat) => (
                          <option key={cat.value} value={cat.value}>
                            {cat.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-black uppercase tracking-widest text-[#2e2e3a] mb-2">
                        Your Message <span className="text-rose-500">*</span>
                      </label>
                      <textarea
                        required
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        placeholder="Explain your situation in detail. Our support agents usually get back to you with extreme clarity..."
                        className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl text-sm font-sans focus:outline-none focus:ring-2 focus:ring-indigo-600/20 text-slate-800 placeholder-slate-400 font-medium resize-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-4 bg-indigo-600 text-white font-black text-sm uppercase tracking-widest hover:bg-indigo-700 rounded-2xl transition-all shadow-lg shadow-indigo-100 flex items-center justify-center gap-2 group disabled:opacity-50 cursor-pointer"
                    >
                      <span>{isSubmitting ? 'Sending inquiry...' : 'Submit Message'}</span>
                      <Send size={16} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </button>
                  </motion.form>
                ) : (
                  <motion.div 
                    key="success-card"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 bg-emerald-50 text-emerald-600 rounded-3xl flex items-center justify-center mx-auto mb-8 border border-emerald-100/50">
                      <CheckCircle2 size={40} className="stroke-[1.5]" />
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 text-[10px] font-black uppercase tracking-widest rounded-full mb-4">
                      Thank You!
                    </span>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-4">Message Received</h2>
                    <p className="text-sm font-medium text-slate-500 font-sans max-w-md mx-auto leading-relaxed mb-8">
                      Your enquiry has been successfully compiled and stored in our database. 
                      A certified PinYourPro support representative will research your account status and respond back to you via <strong className="text-slate-800">{email}</strong> within few hours.
                    </p>
                    <button
                      onClick={() => setIsSuccess(false)}
                      className="px-8 py-3.5 bg-slate-900 text-white rounded-2xl text-xs font-black uppercase tracking-wider hover:bg-slate-800 transition-all cursor-pointer"
                    >
                      Send Another Message
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

        </div>

        {/* Operational timings section */}
        <div className="mt-16 bg-white p-8 rounded-[2.5rem] border border-slate-100 text-center max-w-3xl mx-auto shadow-sm">
          <div className="flex flex-col sm:flex-row items-center justify-around gap-6">
            <div className="flex items-center gap-3">
              <Clock className="text-indigo-600 shrink-0" size={20} />
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Office Hours</p>
                <p className="text-sm font-bold text-slate-800">08:30 - 16:30 CAT (Mon - Fri)</p>
              </div>
            </div>
            <div className="h-px sm:h-8 w-16 sm:w-px bg-slate-100"></div>
            <div className="flex items-center gap-3">
              <HelpCircle className="text-purple-600 shrink-0" size={20} />
              <div className="text-left">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Average Reply</p>
                <p className="text-sm font-bold text-slate-800">Under 4 hours response</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
