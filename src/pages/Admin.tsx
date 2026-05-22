import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, auth, updatePassword } from '../firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, limit } from 'firebase/firestore';
import { UserProfile, ProviderProfile, Booking } from '../types';
import { Users, Briefcase, Calendar, Trash2, CheckCircle, ShieldAlert, Star, Search, Lock, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'providers' | 'bookings' | 'verifications' | 'finances'>('users');
  const [search, setSearch] = useState('');

  // Password reset/management state
  const [showPwdModal, setShowPwdModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSuccess, setPwdSuccess] = useState<string | null>(null);

  // Verification Moderation Modal State
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ProviderProfile | null>(null);
  const [verificationFeedback, setVerificationFeedback] = useState('');
  const [vStatus, setVStatus] = useState<'verified' | 'rejected' | 'requirements'>('verified');
  const [vSubmitting, setVSubmitting] = useState(false);

  const handleOpenVerification = (provider: ProviderProfile) => {
    setSelectedProvider(provider);
    setVerificationFeedback(provider.verificationFeedback || '');
    setVStatus(provider.isVerified === 'requirements' || provider.isVerified === 'rejected' ? provider.isVerified : 'verified');
    setVerificationModalOpen(true);
  };

  const handleSaveVerification = async () => {
    if (!selectedProvider) return;
    setVSubmitting(true);
    try {
      await updateDoc(doc(db, 'providers', selectedProvider.uid), {
        isVerified: vStatus,
        verificationFeedback: vStatus === 'verified' ? '' : verificationFeedback,
        isApproved: vStatus === 'verified' // Automatically approve primary active listing if verified
      });
      await fetchData();
      setVerificationModalOpen(false);
      setSelectedProvider(null);
      setVerificationFeedback('');
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `providers/${selectedProvider.uid}`);
    } finally {
      setVSubmitting(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwdError(null);
    setPwdSuccess(null);

    if (newPassword !== confirmPassword) {
      setPwdError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setPwdError('Password must be at least 6 characters long');
      return;
    }

    setPwdLoading(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        setPwdSuccess('Your password has been changed successfully!');
        setNewPassword('');
        setConfirmPassword('');
        setTimeout(() => {
          setShowPwdModal(false);
          setPwdSuccess(null);
        }, 2000);
      } else {
        setPwdError('No authenticated session found.');
      }
    } catch (error: any) {
      console.error(error);
      setPwdError(error.message || 'Failed to update password. You may need to sign out and log back in.');
    } finally {
      setPwdLoading(false);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uSnap, pSnap, bSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), limit(50))),
        getDocs(query(collection(db, 'providers'), limit(50))),
        getDocs(query(collection(db, 'bookings'), limit(50)))
      ]);
      
      setUsers(uSnap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
      setProviders(pSnap.docs.map(d => ({ uid: d.id, ...d.data() } as ProviderProfile)));
      setBookings(bSnap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (coll: string, id: string) => {
    if (!window.confirm('Are you sure? This action is irreversible.')) return;
    try {
      await deleteDoc(doc(db, coll, id));
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${coll}/${id}`);
    }
  };

  const handleUpdatePayout = async (bookingId: string) => {
    try {
      await updateDoc(doc(db, 'bookings', bookingId), { payoutStatus: 'paid_to_provider' });
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `bookings/${bookingId}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Admin Control</h1>
          <p className="text-gray-500 text-sm mb-4">Monitor and moderate PinYourPro users and services.</p>
          <button
            onClick={() => {
              setPwdError(null);
              setPwdSuccess(null);
              setNewPassword('');
              setConfirmPassword('');
              setShowPwdModal(true);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all"
          >
            <Lock size={12} /> Change Admin Password
          </button>
        </div>

        <div className="flex bg-gray-100 p-1.5 rounded-2xl">
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'users' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'}`}
          >
            <Users size={18} /> Users
          </button>
          <button 
            onClick={() => setActiveTab('providers')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'providers' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'}`}
          >
            <Briefcase size={18} /> Providers
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'bookings' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'}`}
          >
            <Calendar size={18} /> Bookings
          </button>
          <button 
            onClick={() => setActiveTab('verifications')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'verifications' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'}`}
          >
            <ShieldAlert size={18} /> Verifications
          </button>
          <button 
            onClick={() => setActiveTab('finances')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'finances' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500'}`}
          >
            <Star size={18} /> Finances
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-24 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto"></div>
            <p className="mt-4 text-gray-500 font-medium">Crunching data...</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  {activeTab === 'users' && (
                    <>
                      <th className="px-8 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider">User</th>
                      <th className="px-8 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Role</th>
                      <th className="px-8 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Created</th>
                      <th className="px-8 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </>
                  )}
                  {activeTab === 'providers' && (
                    <>
                      <th className="px-8 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Provider</th>
                      <th className="px-8 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Category</th>
                      <th className="px-8 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Location</th>
                      <th className="px-8 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </>
                  )}
                  {activeTab === 'bookings' && (
                    <>
                      <th className="px-8 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Details</th>
                      <th className="px-8 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Provider</th>
                      <th className="px-8 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-8 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </>
                  )}
                  {activeTab === 'verifications' && (
                    <>
                      <th className="px-8 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Provider</th>
                      <th className="px-8 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Document</th>
                      <th className="px-8 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-8 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </>
                  )}
                  {activeTab === 'finances' && (
                    <>
                      <th className="px-8 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Booking Info</th>
                      <th className="px-8 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-8 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider">Payout Status</th>
                      <th className="px-8 py-5 text-sm font-bold text-gray-500 uppercase tracking-wider text-right">Actions</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {activeTab === 'users' && users.map((u) => (
                  <tr key={u.uid} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-4">
                        <img src={u.photoURL} className="w-10 h-10 rounded-full border" alt="" referrerPolicy="no-referrer" />
                        <div>
                          <p className="font-bold text-gray-900">{u.displayName}</p>
                          <p className="text-xs text-gray-500">{u.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        u.role === 'admin' ? 'bg-red-50 text-red-600' : 
                        u.role === 'provider' ? 'bg-purple-50 text-purple-600' : 
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-sm text-gray-500 font-medium">
                      {u.createdAt ? new Date(u.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handleDelete('users', u.uid)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
                
                {activeTab === 'providers' && providers.map((p) => (
                  <tr key={p.uid} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <p className="font-bold text-gray-900">{p.name}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-sm font-bold text-gray-700">{p.category}</span>
                    </td>
                    <td className="px-8 py-6 text-sm text-gray-500 font-medium">{p.location}</td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        {p.isVerified !== 'verified' && (
                          <button 
                            onClick={() => handleOpenVerification(p)}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                            title="Review & Verify"
                          >
                            <CheckCircle size={18} />
                          </button>
                        )}
                        <button 
                          onClick={() => handleDelete('providers', p.uid)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {activeTab === 'bookings' && bookings.map((b) => (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <p className="font-bold text-gray-900">{b.date}</p>
                      <p className="text-xs text-gray-500">{b.time}</p>
                    </td>
                    <td className="px-8 py-6 font-medium text-gray-700">{b.providerName}</td>
                    <td className="px-8 py-6">
                      <span className="px-4 py-1.5 bg-gray-100 rounded-full text-[10px] font-black uppercase tracking-widest text-gray-600">
                        {b.status}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <button 
                        onClick={() => handleDelete('bookings', b.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}

                {activeTab === 'verifications' && providers.filter(p => (p.isVerified === 'pending' || p.isVerified === 'requirements' || p.isVerified === 'rejected' || p.ficaDocUrl)).map((p) => (
                  <tr key={p.uid} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <p className="font-bold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.category}</p>
                    </td>
                    <td className="px-8 py-6">
                      {p.ficaDocUrl ? (
                        <a 
                          href={p.ficaDocUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                        >
                           View FICA Document
                        </a>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No document uploaded</span>
                      )}
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        p.isVerified === 'verified' ? 'bg-green-50 text-green-700' : 
                        p.isVerified === 'rejected' ? 'bg-red-50 text-red-700' : 
                        p.isVerified === 'requirements' ? 'bg-amber-50 text-amber-700 font-bold' :
                        'bg-orange-50 text-orange-700'
                      }`}>
                        {p.isVerified === 'requirements' ? 'Requirements Sent' : (p.isVerified || 'pending')}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenVerification(p)}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-150"
                        >
                          Review & Decide
                        </button>
                        <button 
                          onClick={() => handleDelete('providers', p.uid)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all"
                          title="Delete Account"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {activeTab === 'finances' && bookings.map((b) => (
                  <tr key={b.id} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <p className="font-bold text-gray-900">{b.providerName}</p>
                      <p className="text-xs text-gray-500">{b.date} • {b.serviceName}</p>
                    </td>
                    <td className="px-8 py-6">
                      <p className="font-black text-gray-900">R{b.totalAmount}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Fee: R{(b.totalAmount * 0.1).toFixed(2)}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        b.payoutStatus === 'paid_to_provider' ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        Payout: {b.payoutStatus === 'paid_to_provider' ? 'Sent' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      {b.payoutStatus !== 'paid_to_provider' && b.status === 'completed' && (
                        <button 
                          onClick={() => handleUpdatePayout(b.id)}
                          className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-slate-100"
                        >
                          Pay Provider
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Change Password Modal */}
      <AnimatePresence>
        {showPwdModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 font-sans">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white p-8 rounded-[2.5rem] w-full max-w-md shadow-2xl relative border border-slate-100"
            >
              <button 
                onClick={() => setShowPwdModal(false)}
                className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 opacity-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Lock size={28} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-1">Update Password</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">Superuser Security Control</p>
              </div>

              {pwdError && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2">
                  <span>⚠️</span>
                  <p>{pwdError}</p>
                </div>
              )}

              {pwdSuccess && (
                <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-100 flex items-center gap-2">
                  <span>✅</span>
                  <p>{pwdSuccess}</p>
                </div>
              )}

              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">New Password</label>
                  <input 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-medium text-sm"
                    placeholder="Min 6 characters"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Confirm Password</label>
                  <input 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-medium text-sm"
                    placeholder="Type again to confirm"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={pwdLoading}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 disabled:opacity-50 mt-2"
                >
                  {pwdLoading ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    'Save Permanent Password'
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Verification Moderation Modal */}
      <AnimatePresence>
        {verificationModalOpen && selectedProvider && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60 font-sans">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="bg-white p-8 rounded-[2.5rem] w-full max-w-lg shadow-2xl relative border border-slate-100"
            >
              <button 
                onClick={() => {
                  setVerificationModalOpen(false);
                  setSelectedProvider(null);
                }}
                className="absolute right-6 top-6 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 opacity-100 rounded-xl transition-all"
              >
                <X size={20} />
              </button>

              <div className="text-center mb-6">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <CheckCircle size={28} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-1">Verify Business Profile</h2>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{selectedProvider.name}</p>
              </div>

              {selectedProvider.ficaDocUrl && (
                <div className="mb-6 p-4 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-600">Submitted Document:</span>
                  <a 
                    href={selectedProvider.ficaDocUrl} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition-colors"
                  >
                    Open Document
                  </a>
                </div>
              )}

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Choose Verification Decision</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button 
                      onClick={() => setVStatus('verified')}
                      className={`py-3 rounded-xl text-xs font-bold transition-all border ${
                        vStatus === 'verified' 
                          ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-100' 
                          : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Approve & Verify
                    </button>
                    <button 
                      onClick={() => setVStatus('requirements')}
                      className={`py-3 rounded-xl text-xs font-bold transition-all border ${
                        vStatus === 'requirements' 
                          ? 'bg-amber-500 border-amber-500 text-white shadow-lg shadow-amber-100' 
                          : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Ask Requirements
                    </button>
                    <button 
                      onClick={() => setVStatus('rejected')}
                      className={`py-3 rounded-xl text-xs font-bold transition-all border ${
                        vStatus === 'rejected' 
                          ? 'bg-red-500 border-red-500 text-white shadow-lg shadow-red-100' 
                          : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      Decline & Reject
                    </button>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                    Feedback / Further Requirements Notes {vStatus !== 'verified' && <span className="text-red-500">*</span>}
                  </label>
                  <textarea 
                    value={verificationFeedback}
                    onChange={(e) => setVerificationFeedback(e.target.value)}
                    rows={4}
                    required={vStatus !== 'verified'}
                    className="w-full px-5 py-3.5 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-medium text-sm resize-none"
                    placeholder={
                      vStatus === 'verified' 
                        ? 'Optional congratulatory notes for the provider...' 
                        : vStatus === 'requirements' 
                          ? 'Specify exactly what further documents or fields are needed (e.g. Utility Bill dated in the past 3 months)...' 
                          : 'Provide clear reasons why this provider profile is declined...'
                    }
                  />
                </div>

                <button 
                  onClick={handleSaveVerification}
                  disabled={vSubmitting || (vStatus !== 'verified' && !verificationFeedback.trim())}
                  className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 disabled:opacity-50"
                >
                  {vSubmitting ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    'Publish Decision'
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
