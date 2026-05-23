import React, { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType, auth, updatePassword } from '../firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, limit, addDoc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile, ProviderProfile, Booking } from '../types';
import { Users, Briefcase, Calendar, Trash2, CheckCircle, ShieldAlert, Star, Search, Lock, X, Tag, MessageSquare, Plus, Award, ShieldCheck, Settings } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SERVICE_CATEGORIES } from '../constants';

const ADMIN_EMAILS = ['paragonbusinessconsult@gmail.com', 'sithembiledlaza8@gmail.com'];

export default function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'providers' | 'bookings' | 'verifications' | 'finances' | 'categories' | 'reviews' | 'settings'>('users');
  const [search, setSearch] = useState('');

  // Reviews dynamic state
  const [reviews, setReviews] = useState<any[]>([]);
  // Dynamic Categories and Services Management State
  const [dbCategories, setDbCategories] = useState<any[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('💼');
  const [newServiceName, setNewServiceName] = useState('');
  const [newServicePrice, setNewServicePrice] = useState('');
  const [selectedCatForService, setSelectedCatForService] = useState('');
  const [submittingCat, setSubmittingCat] = useState(false);
  const [submittingService, setSubmittingService] = useState(false);

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

  // System Settings State
  const [emailVerificationEnabled, setEmailVerificationEnabled] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSettings(true);
    try {
      await setDoc(doc(db, 'settings', 'emailVerification'), {
        enabled: emailVerificationEnabled,
        updatedAt: new Date()
      });
      alert('System security configurations updated successfully!');
    } catch (error) {
      console.error(error);
      alert('Error updating system configurations. Please try again.');
    } finally {
      setSavingSettings(false);
    }
  };

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
      const [uSnap, pSnap, bSnap, rSnap, cSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), limit(50))),
        getDocs(query(collection(db, 'providers'), limit(50))),
        getDocs(query(collection(db, 'bookings'), limit(50))),
        getDocs(query(collection(db, 'reviews'), limit(100))),
        getDocs(query(collection(db, 'categories'), limit(100)))
      ]);
      
      setUsers(uSnap.docs.map(d => ({ uid: d.id, ...d.data() } as UserProfile)));
      setProviders(pSnap.docs.map(d => ({ uid: d.id, ...d.data() } as ProviderProfile)));
      setBookings(bSnap.docs.map(d => ({ id: d.id, ...d.data() } as Booking)));
      setReviews(rSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
      setDbCategories(cSnap.docs.map(d => ({ id: d.id, ...d.data() } as any)));
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const fetchSettings = async () => {
      try {
        const docRef = doc(db, 'settings', 'emailVerification');
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setEmailVerificationEnabled(docSnap.data().enabled ?? false);
        } else {
          setEmailVerificationEnabled(false);
        }
      } catch (err) {
        console.error("Error fetching system configurations:", err);
      }
    };
    fetchSettings();
  }, []);

  const handleDelete = async (coll: string, id: string) => {
    if (coll === 'users' || coll === 'providers') {
      const targetUser = users.find(u => u.uid === id);
      const targetProvider = providers.find(p => p.uid === id);
      const targetEmail = targetUser?.email || targetProvider?.email;
      if (
        (targetEmail && ADMIN_EMAILS.includes(targetEmail.toLowerCase())) ||
        (auth.currentUser?.uid === id)
      ) {
        alert("Security Block: Administrative accounts cannot be deleted to ensure platform stability and prevent lockout.");
        return;
      }
    }

    if (!window.confirm('Are you sure? This action is irreversible. This will remove their profile and database accessibility immediately.')) return;
    try {
      if (coll === 'providers') {
        // Remove the provider profile listing
        await deleteDoc(doc(db, 'providers', id));
        // Demote user role back to customer
        try {
          await updateDoc(doc(db, 'users', id), { role: 'customer' });
        } catch (e) {
          console.warn("Could not demote user (perhaps already deleted):", e);
        }
      } else if (coll === 'users') {
        // Remove user document
        await deleteDoc(doc(db, 'users', id));
        // Also clear out provider profile if existing
        try {
          await deleteDoc(doc(db, 'providers', id));
        } catch (e) {
          console.warn("Could not cascading-delete provider profile:", e);
        }
      } else {
        await deleteDoc(doc(db, coll, id));
      }
      await fetchData();
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

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setSubmittingCat(true);
    try {
      await addDoc(collection(db, 'categories'), {
        name: newCatName.trim(),
        icon: newCatIcon,
        services: []
      });
      setNewCatName('');
      await fetchData();
    } catch (error) {
      console.error(error);
    } finally {
      setSubmittingCat(false);
    }
  };

  const handleAddServiceTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newServiceName.trim() || !selectedCatForService) return;
    setSubmittingService(true);
    try {
      const selectedCatDoc = dbCategories.find(c => c.name === selectedCatForService || c.id === selectedCatForService);
      if (selectedCatDoc) {
        const updatedServices = [
          ...(selectedCatDoc.services || []),
          { 
            name: newServiceName.trim(), 
            price: Number(newServicePrice) || 0,
            duration: '60 min'
          }
        ];
        await updateDoc(doc(db, 'categories', selectedCatDoc.id), {
          services: updatedServices
        });
        setNewServiceName('');
        setNewServicePrice('');
        await fetchData();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setSubmittingService(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      await deleteDoc(doc(db, 'categories', id));
      await fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleToggleFeatureProvider = async (providerId: string, currentVal: boolean) => {
    try {
      await updateDoc(doc(db, 'providers', providerId), {
        isFeatured: !currentVal
      });
      await fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleDeleteReview = async (reviewId: string) => {
    if (!window.confirm('Are you sure you want to permanently delete this review? This is useful for moderating fake reviews and settling disputes.')) return;
    try {
      await deleteDoc(doc(db, 'reviews', reviewId));
      await fetchData();
    } catch (error) {
      console.error(error);
    }
  };

  const handleSeedCategories = async () => {
    if (!window.confirm('Would you like to seed the initial standard categories into the Firestore database? This makes it easy to manage templates dynamically.')) return;
    setLoading(true);
    try {
      for (const cat of SERVICE_CATEGORIES) {
        await addDoc(collection(db, 'categories'), {
          name: cat.name,
          icon: cat.icon,
          services: cat.services
        });
      }
      await fetchData();
    } catch (err) {
      console.error("Error seeding categories:", err);
    } finally {
      setLoading(false);
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

        <div className="flex flex-wrap bg-gray-100 p-1.5 rounded-2xl gap-1">
          <button 
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'users' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <Users size={18} /> Users
          </button>
          <button 
            onClick={() => setActiveTab('providers')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'providers' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <Briefcase size={18} /> Providers
          </button>
          <button 
            onClick={() => setActiveTab('bookings')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'bookings' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <Calendar size={18} /> Bookings
          </button>
          <button 
            onClick={() => setActiveTab('verifications')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'verifications' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <ShieldAlert size={18} /> Verifications
          </button>
          <button 
            onClick={() => setActiveTab('finances')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'finances' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <Star size={18} /> Finances
          </button>
          <button 
            onClick={() => {
              setActiveTab('categories');
              if (dbCategories.length > 0 && !selectedCatForService) {
                setSelectedCatForService(dbCategories[0].name || dbCategories[0].id);
              }
            }}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'categories' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <Tag size={18} /> Categories & Services
          </button>
          <button 
            onClick={() => setActiveTab('reviews')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'reviews' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <MessageSquare size={18} /> Reviews Moderation
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold transition-all ${activeTab === 'settings' ? 'bg-white text-purple-600 shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
          >
            <Settings size={18} /> Settings
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
          ['users', 'providers', 'bookings', 'verifications', 'finances'].includes(activeTab) ? (
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
          ) : activeTab === 'categories' ? (
            <div className="p-8 font-sans">
              <div className="flex flex-col lg:flex-row justify-between items-start gap-8 mb-8 border-b border-gray-100 pb-6">
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Category & Service Template Management</h3>
                  <p className="text-sm text-gray-500 mt-1">Configure predefined service categories, templates, and highlight custom providers.</p>
                </div>
                {dbCategories.length === 0 && (
                  <button
                    onClick={handleSeedCategories}
                    className="px-6 py-3 bg-indigo-600 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl hover:bg-indigo-700 transition"
                  >
                    Seed Standard Categories
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left Side: Categories management (Span 4) */}
                <div className="lg:col-span-4 space-y-6">
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <h4 className="text-sm font-black uppercase text-slate-700 tracking-wider mb-4">Add Custom Category</h4>
                    <form onSubmit={handleAddCategory} className="space-y-4">
                      <div>
                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">Category Name</label>
                        <input
                          type="text"
                          required
                          value={newCatName}
                          onChange={(e) => setNewCatName(e.target.value)}
                          placeholder="e.g. Roof Painters"
                          className="w-full px-4 py-2.5 bg-white border border-slate-150 focus:border-indigo-500 rounded-xl outline-none font-bold text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">Emoji Icon</label>
                        <select
                          value={newCatIcon}
                          onChange={(e) => setNewCatIcon(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-150 focus:border-indigo-500 rounded-xl outline-none font-bold text-sm"
                        >
                          <option value="💼">💼 Handyman</option>
                          <option value="🚰">🚰 Plumbing</option>
                          <option value="⚡">⚡ Electrical</option>
                          <option value="🧼">🧼 Cleaning</option>
                          <option value="🚗">🚗 Mechanical</option>
                          <option value="📚">📚 Tutoring</option>
                          <option value="💇">💇 Salon & Hair</option>
                          <option value="📸">📸 Photography</option>
                          <option value="🏠">🏠 Rentals</option>
                        </select>
                      </div>
                      <button
                        type="submit"
                        disabled={submittingCat}
                        className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition disabled:opacity-50"
                      >
                        {submittingCat ? 'Adding...' : 'Add Category'}
                      </button>
                    </form>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Active Categories ({dbCategories.length})</h4>
                    {dbCategories.length === 0 ? (
                      <p className="text-xs text-slate-400 italic">No custom categories added. Consider bulk-seeding them!</p>
                    ) : (
                      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                        {dbCategories.map((cat) => (
                          <div key={cat.id} className="flex items-center justify-between p-3.5 bg-white border border-gray-100 rounded-2xl">
                            <div className="flex items-center gap-2.5">
                              <span className="text-xl">{cat.icon || '💼'}</span>
                              <span className="text-sm font-bold text-gray-800">{cat.name}</span>
                            </div>
                            <button
                              onClick={() => handleDeleteCategory(cat.id)}
                              className="text-red-500 hover:bg-red-50 p-1.5 rounded-lg transition"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Middle Side: Template Services list (Span 4) */}
                <div className="lg:col-span-4 space-y-6 border-t lg:border-t-0 lg:border-l lg:border-r border-gray-150 lg:px-6">
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <h4 className="text-sm font-black uppercase text-slate-700 tracking-wider mb-4">Add Service Template</h4>
                    <form onSubmit={handleAddServiceTemplate} className="space-y-4">
                      <div>
                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">Target Category</label>
                        <select
                          value={selectedCatForService}
                          onChange={(e) => setSelectedCatForService(e.target.value)}
                          className="w-full px-4 py-2.5 bg-white border border-slate-150 focus:border-indigo-500 rounded-xl outline-none font-bold text-sm"
                        >
                          <option value="">Select Category</option>
                          {dbCategories.map((c) => (
                            <option key={c.id} value={c.name}>{c.name}</option>
                          ))}
                          {dbCategories.length === 0 && (
                            <option value="">(Seed categories first)</option>
                          )}
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">Service Template Name</label>
                        <input
                          type="text"
                          required
                          value={newServiceName}
                          onChange={(e) => setNewServiceName(e.target.value)}
                          placeholder="e.g. Standard Geyser Repair"
                          className="w-full px-4 py-2.5 bg-white border border-slate-150 focus:border-indigo-500 rounded-xl outline-none font-bold text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 block mb-1">Estimate Base Price (R)</label>
                        <input
                          type="number"
                          required
                          value={newServicePrice}
                          onChange={(e) => setNewServicePrice(e.target.value)}
                          placeholder="e.g. 500"
                          className="w-full px-4 py-2.5 bg-white border border-slate-150 focus:border-indigo-500 rounded-xl outline-none font-bold text-sm"
                        />
                      </div>
                      <button
                        type="submit"
                        disabled={submittingService || !selectedCatForService}
                        className="w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-black uppercase tracking-widest rounded-xl transition disabled:opacity-50"
                      >
                        {submittingService ? 'Saving...' : 'Add Template Service'}
                      </button>
                    </form>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">Template Previews</h4>
                    <div className="max-h-[250px] overflow-y-auto space-y-2 pr-1 custom-scrollbar">
                      {dbCategories.map((cat) => (
                        <div key={cat.id} className="p-3 bg-gray-50/50 rounded-2xl border border-gray-100">
                          <p className="text-xs font-black text-indigo-600 mb-1.5 uppercase tracking-wider">{cat.icon} {cat.name}</p>
                          {(cat.services || []).length === 0 ? (
                            <p className="text-[11px] text-gray-400 italic">No service templates defined yet.</p>
                          ) : (
                            <div className="space-y-1">
                              {cat.services.map((ser: any, sIdx: number) => (
                                <div key={sIdx} className="flex justify-between items-center text-xs text-gray-600 bg-white p-1.5 rounded-lg border border-gray-50">
                                  <span>{ser.name}</span>
                                  <span className="font-bold text-gray-900">R{ser.price}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Side: Feature Provider */}
                <div className="lg:col-span-4 space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl mb-4 text-amber-800 text-xs font-medium leading-relaxed">
                    🌟 <strong>Featured Providers Control:</strong> Use this panel to feature trusted professionals directly onto client portals for premium performance highlight!
                  </div>
                  
                  <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider mb-2">Available Professionals ({providers.length})</h4>
                  <div className="max-h-[500px] overflow-y-auto space-y-3 pr-1 custom-scrollbar">
                    {providers.map((prov) => {
                      const isFeatured = prov.isFeatured || false;
                      return (
                        <div key={prov.uid} className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-2xl hover:border-indigo-100 transition shadow-sm">
                          <div className="flex items-center gap-3">
                            <img
                              src={prov.photoURL || `https://picsum.photos/seed/${prov.uid}/80/80`}
                              alt=""
                              className="w-10 h-10 rounded-xl object-cover"
                              referrerPolicy="no-referrer"
                            />
                            <div className="text-left">
                              <p className="text-xs font-black text-slate-800 leading-tight">{prov.name}</p>
                              <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-wider mt-0.5">{prov.category}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleToggleFeatureProvider(prov.uid, isFeatured)}
                            className={`p-2.5 rounded-xl border flex items-center justify-center transition-all ${
                              isFeatured 
                                ? 'bg-amber-100 border-amber-300 text-amber-600 scale-105 shadow-md shadow-amber-50' 
                                : 'bg-slate-50 border-slate-150 text-slate-400 hover:text-amber-500'
                            }`}
                            title={isFeatured ? 'Feature Enabled' : 'Click to Feature'}
                          >
                            <Award size={16} fill={isFeatured ? 'currentColor' : 'none'} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : activeTab === 'reviews' ? (
            <div className="p-8 font-sans">
              <div className="border-b border-gray-100 pb-6 mb-6">
                <h3 className="text-xl font-bold text-gray-900">System Feedback & Moderation</h3>
                <p className="text-sm text-gray-500 mt-1">Review feedback, monitor quality standards, flag abuses, and safely remove disputed or fake items.</p>
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-150">
                  <MessageSquare className="text-slate-300 mx-auto mb-4" size={40} />
                  <p className="text-slate-500 font-bold">No Feedback Documents Found</p>
                  <p className="text-slate-400 text-xs mt-1">Clients & registered providers will trigger feedback reports after completing jobs.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {reviews.map((rev) => (
                    <div key={rev.id} className="bg-white rounded-[2rem] p-6 border border-slate-100 hover:border-indigo-150 transition shadow-lg flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-4 mb-4">
                          <div>
                            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Client Feedback</span>
                            <h4 className="font-extrabold text-slate-900 text-base leading-tight mt-0.5">{rev.customerName || 'Anonymous Client'}</h4>
                          </div>
                          <div className="flex items-center gap-1 bg-amber-50 text-amber-700 py-1 px-2.5 rounded-lg border border-amber-100/50">
                            <Star size={12} fill="currentColor" className="text-amber-500" />
                            <span className="text-xs font-black">{rev.rating}</span>
                          </div>
                        </div>

                        <p className="text-sm text-slate-600 font-sans italic my-4 leading-relaxed bg-slate-50 p-4 rounded-xl border border-slate-100 font-normal">
                          "{rev.comment || 'No comment provided.'}"
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-100/50 flex justify-between items-center mt-4">
                        <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                          Provider ID: <span className="font-mono text-xs">{rev.providerId?.slice(0, 8)}...</span>
                        </span>
                        <button
                          onClick={() => handleDeleteReview(rev.id)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-650 hover:text-red-700 text-xs font-black uppercase tracking-wider rounded-xl transition"
                        >
                          <Trash2 size={12} /> Remove Fake Review
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="p-8 font-sans max-w-2xl">
              <div className="border-b border-gray-100 pb-6 mb-8">
                <h3 className="text-2xl font-black text-gray-900">System & Security Settings</h3>
                <p className="text-sm text-gray-500 mt-1">Configure global application variables, security gates, and testing toggles.</p>
              </div>

              <form onSubmit={handleSaveSettings} className="space-y-8">
                <div className="bg-slate-50 p-6 md:p-8 rounded-[2rem] border border-slate-100 space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="font-extrabold text-slate-900 text-sm uppercase tracking-wider">Email Bot Protection Check</h4>
                      <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                        When active, newly registered users must complete an email verification check before exploring categories or registering provider credentials of the platform.
                      </p>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={emailVerificationEnabled}
                        onChange={(e) => setEmailVerificationEnabled(e.target.checked)}
                        className="sr-only peer" 
                      />
                      <div className="w-14 h-7.5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5.5 after:w-5.5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>
                  </div>

                  <div className="bg-white p-4 rounded-xl border border-slate-200/60 text-xs flex gap-2.5 items-start text-indigo-700 leading-relaxed">
                    <span className="text-xl">💡</span>
                    <div>
                      <strong className="block font-black mb-0.5">Testing Mode Recommendation:</strong>
                      Turn this toggle <strong className="underline">OFF</strong> during development or testing cycles to bypass verification block screens and test signup flows instantly. Enable it in production to screen bots.
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-slate-105">
                  <button
                    type="submit"
                    disabled={savingSettings}
                    className="px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest rounded-2xl shadow-xl shadow-indigo-100 transition disabled:opacity-50"
                  >
                    {savingSettings ? 'Saving Configurations...' : 'Save Global Settings'}
                  </button>
                </div>
              </form>
            </div>
          )
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
