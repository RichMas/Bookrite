import { useState, useEffect } from 'react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, getDocs, deleteDoc, doc, updateDoc, query, limit } from 'firebase/firestore';
import { UserProfile, ProviderProfile, Booking } from '../types';
import { Users, Briefcase, Calendar, Trash2, CheckCircle, ShieldAlert, Star, Search } from 'lucide-react';
import { motion } from 'motion/react';

export default function AdminPanel() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'providers' | 'bookings' | 'verifications' | 'finances'>('users');
  const [search, setSearch] = useState('');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [uSnap, pSnap, bSnap] = await Promise.all([
        getDocs(query(collection(db, 'users'), limit(50))),
        getDocs(query(collection(db, 'providers'), limit(50))),
        getDocs(query(collection(db, 'bookings'), limit(50)))
      ]);
      
      setUsers(uSnap.docs.map(d => ({ ...d.data() } as UserProfile)));
      setProviders(pSnap.docs.map(d => ({ ...d.data() } as ProviderProfile)));
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

  const handleUpdateVerification = async (providerId: string, status: 'verified' | 'rejected') => {
    try {
      await updateDoc(doc(db, 'providers', providerId), { isVerified: status });
      fetchData();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `providers/${providerId}`);
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
          <p className="text-gray-500">Monitor and moderate PinYourPro users and services.</p>
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
                            onClick={() => handleUpdateVerification(p.uid, 'verified')}
                            className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-xl transition-all"
                            title="Approve Listing"
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

                {activeTab === 'verifications' && providers.filter(p => (p.isVerified === 'pending' || p.ficaDocUrl)).map((p) => (
                  <tr key={p.uid} className="border-b border-gray-50 hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <p className="font-bold text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">{p.category}</p>
                    </td>
                    <td className="px-8 py-6">
                      <a 
                        href={p.ficaDocUrl} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-xs font-bold text-indigo-600 hover:underline flex items-center gap-1"
                      >
                         View FICA Document
                      </a>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${
                        p.isVerified === 'verified' ? 'bg-green-50 text-green-700' : 
                        p.isVerified === 'rejected' ? 'bg-red-50 text-red-700' : 
                        'bg-orange-50 text-orange-700'
                      }`}>
                        {p.isVerified || 'pending'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleUpdateVerification(p.uid, 'verified')}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-100"
                        >
                          Verify
                        </button>
                        <button 
                          onClick={() => handleUpdateVerification(p.uid, 'rejected')}
                          className="px-4 py-2 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-100"
                        >
                          Reject
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
    </div>
  );
}
