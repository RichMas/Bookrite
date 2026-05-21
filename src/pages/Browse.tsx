import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ProviderProfile } from '../types';
import { Search, MapPin, Star, Filter, SlidersHorizontal, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';

import { SERVICE_CATEGORIES } from '../constants';

const CATEGORIES = ['All', ...SERVICE_CATEGORIES.map(c => c.name)];

export default function Browse() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState('');
  const [minRating, setMinRating] = useState(0);
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      try {
        const q = category === 'All' 
          ? query(collection(db, 'providers'), limit(20))
          : query(collection(db, 'providers'), where('category', '==', category), limit(20));
        
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setProviders(data);
      } catch (error) {
        handleFirestoreError(error, OperationType.LIST, 'providers');
      } finally {
        setLoading(false);
      }
    };
    fetchProviders();
  }, [category]);

  const filteredProviders = providers.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || 
      p.description.toLowerCase().includes(search.toLowerCase()) ||
      p.location.toLowerCase().includes(search.toLowerCase());
    
    const matchesRating = p.rating >= minRating;

    return matchesSearch && matchesRating;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-12">
        <div>
          <h1 className="text-4xl font-black text-gray-900 mb-2">Service Providers</h1>
          <p className="text-gray-500">Find the right professional for your task.</p>
        </div>

        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input 
            type="text" 
            placeholder="Search by name, service or location..."
            className="w-full pl-12 pr-4 py-4 bg-gray-50 border-2 border-transparent focus:border-purple-600 focus:bg-white rounded-2xl outline-none transition-all font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-4">
          <select 
            value={minRating}
            onChange={(e) => setMinRating(Number(e.target.value))}
            className="px-4 py-3 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-600 outline-none focus:ring-2 focus:ring-purple-500 appearance-none min-w-[120px]"
          >
            <option value={0}>Any Rating</option>
            <option value={4}>4.0+ Stars</option>
            <option value={4.5}>4.5+ Stars</option>
          </select>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-4 mb-12 scrollbar-hide no-scrollbar">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => {
              setCategory(cat);
              setSearchParams(cat === 'All' ? {} : { category: cat });
            }}
            className={`px-6 py-2.5 rounded-full font-bold whitespace-nowrap transition-all ${
              category === cat 
                ? 'bg-purple-600 text-white shadow-lg shadow-purple-100' 
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-gray-50 h-[400px] rounded-[2.5rem] animate-pulse"></div>
          ))}
        </div>
      ) : (
        <>
          {filteredProviders.length === 0 ? (
            <div className="text-center py-24 bg-gray-50 rounded-[3rem]">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search size={32} className="text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No providers found</h3>
              <p className="text-gray-500">Try adjusting your search or category filter.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence>
                {filteredProviders.map((provider) => (
                  <motion.div
                    key={provider.uid}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="group"
                  >
                    <Link to={`/provider/${provider.uid}`}>
                      <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-md flex flex-col h-full hover:shadow-xl hover:border-indigo-100 transition-all group">
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-16 h-16 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-3xl shadow-inner group-hover:scale-105 transition-transform">
                            {SERVICE_CATEGORIES.find(c => c.name === provider.category)?.icon || '💼'}
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-full uppercase tracking-tighter">
                              Available
                            </span>
                            {provider.isVerified === 'verified' && (
                              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-[10px] font-bold rounded-full uppercase tracking-tighter flex items-center gap-1">
                                <ShieldCheck size={10} /> Verified
                              </span>
                            )}
                          </div>
                        </div>
                        
                        <h3 className="text-xl font-bold text-slate-800 mb-1">{provider.name}</h3>
                        <p className="text-sm text-indigo-600 font-semibold mb-3">{provider.category}</p>
                        
                        <p className="text-sm text-slate-500 mb-6 line-clamp-2 italic leading-relaxed h-10">
                          {provider.description || "Expert services tailored to your specific needs and schedule."}
                        </p>
                        
                        <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                          <div className="flex flex-col">
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                              <MapPin size={10} /> {provider.location.split(',')[0]}
                            </span>
                            <div className="flex items-center gap-1 text-orange-400 mt-0.5">
                              <Star size={10} fill="currentColor" />
                              <span className="text-[10px] font-bold">{provider.rating.toFixed(1)}</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">From</p>
                            <p className="text-lg font-black text-indigo-600">
                              {provider.services && provider.services.length > 0 
                                ? (provider.services.every(s => s.custom) 
                                    ? 'Quote' 
                                    : `R${Math.min(...provider.services.filter(s => !s.custom).map(s => s.price))}`)
                                : 'Rates Apply'}
                            </p>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  );
}

const ArrowRight = ({ size = 24 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
);
