import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Search, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  Users, 
  Star, 
  Filter, 
  MousePointerClick 
} from 'lucide-react';
import { motion } from 'motion/react';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { ProviderProfile } from '../types';
import { SERVICE_CATEGORIES } from '../constants';

const CATEGORIES = SERVICE_CATEGORIES.map(cat => ({
  name: cat.name,
  icon: cat.icon,
  color: 'bg-indigo-50 text-indigo-600'
}));

export default function Home() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedHomeCat, setSelectedHomeCat] = useState('All');
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProviders = async () => {
      try {
        const q = query(collection(db, 'providers'), limit(150));
        const querySnapshot = await getDocs(q);
        const data = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        setProviders(data);
      } catch (error) {
        console.error("Error fetching providers on Home page:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProviders();
  }, []);

  // Flatten and derive services
  const allServices = providers
    .filter(p => p.services && p.services.length > 0)
    .flatMap(p => p.services.map(s => ({
      ...s,
      providerId: p.uid,
      providerName: p.name,
      providerLocation: p.location,
      providerCity: p.city || p.location.split(',')[0].trim(),
      providerRating: p.rating || 5,
      providerReviewCount: p.reviewCount || 0,
      providerPhoto: p.photoURL,
      providerCategory: p.category,
      providerCategories: p.categories || [p.category],
      isVerified: p.isVerified === 'verified'
    })));

  // Filter services on the landing page
  const filteredHomeServices = allServices.filter(s => {
    const matchesCategory = selectedHomeCat === 'All' || s.providerCategories.includes(selectedHomeCat as any);
    const matchesSearch = searchQuery.trim() === '' || 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      s.providerName.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const getCategoryIcon = (catName: string): string => {
    return SERVICE_CATEGORIES.find(c => c.name === catName)?.icon || '💼';
  };

  const handleSearchSubmit = (e: FormEvent) => {
    e.preventDefault();
    navigate(`/browse?search=${encodeURIComponent(searchQuery)}`);
  };

  return (
    <div className="flex flex-col gap-24 pb-24">
      
      {/* Hero Section */}
      <section className="relative px-4 py-32 flex flex-col items-center text-center bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-950 overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl relative z-10"
        >
          <span className="inline-flex items-center gap-1.5 px-4.5 py-1.5 bg-white/10 backdrop-blur-md rounded-full text-xs font-black uppercase tracking-widest text-indigo-100 mb-6 border border-white/5">
            <Sparkles size={12} className="text-amber-400 animate-spin" /> South Africa's Premium Service Marketplace
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight leading-tight font-sans">
            Find & Book Trusted Professionals Near You
          </h1>
          <p className="text-lg md:text-xl text-indigo-100 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
            Skip the back-and-forth. Instantly browse, compare, and book top-rated plumbers, designers, or homework tutors.
          </p>

          <form onSubmit={handleSearchSubmit} className="flex w-full max-w-xl mx-auto bg-white p-2 rounded-2xl shadow-2xl">
            <input 
              type="text" 
              placeholder="What service do you need today?" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="flex-1 px-6 py-3 outline-none text-slate-700 bg-transparent text-base font-medium font-sans"
            />
            <button 
              type="submit"
              className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 active:scale-95 transition-all flex items-center gap-2"
            >
              <Search size={18} />
              Search
            </button>
          </form>
        </motion.div>
      </section>

      {/* Categories Toolbar Filter */}
      <section className="py-2 px-8 bg-white border-b border-slate-100 -mt-12 relative z-20">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-3">
            <button
              onClick={() => setSelectedHomeCat('All')}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full border text-xs font-black transition-all ${
                selectedHomeCat === 'All'
                  ? 'bg-slate-900 border-slate-900 text-white shadow-md'
                  : 'bg-slate-55 border-slate-200 text-slate-700 hover:border-slate-350 hover:bg-slate-100'
              }`}
            >
              💼 All Categories
            </button>
            {CATEGORIES.map((cat) => (
              <button 
                key={cat.name}
                onClick={() => setSelectedHomeCat(cat.name)}
                className={`flex items-center gap-2.5 px-5 py-2.5 rounded-full border text-xs font-black transition-all ${
                  selectedHomeCat === cat.name
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-350 hover:bg-slate-50'
                }`}
              >
                <span className="text-base">{cat.icon}</span>
                <span>{cat.name}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Professionals */}
      {providers.some(p => p.isFeatured) && (
        <section className="max-w-7xl mx-auto w-full px-4 -mt-10 mb-2 scroll-mt-24">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50/30 rounded-[2.5rem] p-8 border border-amber-200/40 relative overflow-hidden shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 border-b border-amber-200/20 pb-4">
              <div className="text-left w-full">
                <span className="text-amber-600 text-xs font-black uppercase tracking-widest flex items-center gap-1.5 mb-1">
                  <Sparkles size={14} className="fill-amber-500 text-amber-500 animate-pulse" /> Certified Partners
                </span>
                <h3 className="text-2xl font-black text-slate-900 leading-tight">Featured Service Professionals</h3>
                <p className="text-xs text-slate-500 font-semibold mt-0.5">Top-rated team players and audited specialists vetted by our quality board for outstanding diligence.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {providers.filter(p => p.isFeatured).slice(0, 4).map((p) => (
                <Link
                  key={p.uid}
                  to={`/provider/${p.uid}`}
                  className="bg-white/80 backdrop-blur-sm p-5 rounded-[2rem] border border-amber-200/20 shadow-md hover:shadow-xl hover:border-amber-300 hover:scale-[1.01] transition-all flex items-center gap-4 text-left group"
                >
                  <img
                    src={p.photoURL || `https://picsum.photos/seed/${p.uid}/80/80`}
                    alt=""
                    className="w-12 h-12 rounded-2xl object-cover shrink-0 border-2 border-amber-200"
                    referrerPolicy="no-referrer"
                  />
                  <div className="min-w-0 font-sans">
                    <h4 className="font-extrabold text-slate-900 text-sm truncate group-hover:text-indigo-600 transition-colors">{p.name}</h4>
                    <p className="text-[10px] text-indigo-650 font-black uppercase tracking-wider mt-0.5">{p.category}</p>
                    <div className="flex items-center gap-1 mt-1">
                      <Star size={10} fill="currentColor" className="text-amber-500" />
                      <span className="text-xs font-bold text-slate-705 text-slate-750 text-slate-700">{(p.rating || 5).toFixed(1)}</span>
                      <span className="text-[10px] text-slate-400">({p.reviewCount || 0})</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Dynamic All Services Listing Grid */}
      <section className="max-w-7xl mx-auto w-full px-4 scroll-mt-24" id="services-section">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-slate-100">
          <div>
            <span className="text-indigo-600 text-xs font-black uppercase tracking-widest flex items-center gap-1.5 mb-1">
              <MousePointerClick size={14} /> Book Instantly
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 leading-tight">
              {selectedHomeCat === 'All' ? 'All Listed Services' : `${selectedHomeCat} Services`}
            </h2>
            <p className="text-sm text-slate-505 font-medium mt-1">
              Currently displaying {filteredHomeServices.length} direct bookable services matched in your area.
            </p>
          </div>
          {selectedHomeCat !== 'All' && (
            <button
              onClick={() => setSelectedHomeCat('All')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Clear Filter <Filter size={12} />
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-slate-50 h-[280px] rounded-[2.5rem] animate-pulse"></div>
            ))}
          </div>
        ) : filteredHomeServices.length === 0 ? (
          <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-150">
            <span className="text-4xl">💼</span>
            <h3 className="text-xl font-bold text-slate-800 mt-3">No Services Listed yet</h3>
            <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">Selected service category doesn't have active slots or providers cataloged. Be the first to list below!</p>
            <Link 
              to="/auth?role=provider" 
              className="inline-flex items-center gap-2 mt-6 px-6 py-3 bg-indigo-650 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-100"
            >
              List Your Business Services
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredHomeServices.map((service, index) => (
              <motion.div
                key={`${service.providerId}-${service.id}-${index}`}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-lg hover:shadow-2xl hover:border-indigo-200 transition-all flex flex-col justify-between group"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-3xl bg-indigo-50 w-12 h-12 rounded-2xl flex items-center justify-center border border-indigo-100/30">
                      {getCategoryIcon(service.providerCategory)}
                    </span>
                    <span className="px-3 py-1 bg-slate-50 text-slate-700 text-[10px] font-black uppercase tracking-wider rounded-lg border border-slate-100">
                      {service.providerCategory}
                    </span>
                  </div>

                  <h3 className="text-xl font-black text-slate-950 mb-1 leading-snug group-hover:text-indigo-600 transition-colors">
                    {service.name}
                  </h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-4">
                    <Clock size={12} /> {service.duration || '60 min'}
                  </p>
                  <p className="text-sm text-slate-500 font-sans leading-relaxed line-clamp-2 italic mb-6">
                    {service.description || "Fully customizable tailored package offered directly by verified local expert."}
                  </p>
                </div>

                <div className="pt-5 border-t border-slate-50 mt-auto">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Instant Booking Rate</p>
                      <p className="text-2xl font-black text-indigo-600">
                        {service.custom ? 'Quote' : `R${service.price}${service.unit || ''}`}
                      </p>
                    </div>

                    <Link to={`/provider/${service.providerId}?serviceId=${service.id}`} className="flex items-center gap-2 bg-slate-50/50 hover:bg-indigo-50/30 p-2 rounded-2xl border border-slate-100 transition-colors">
                      <img 
                        src={service.providerPhoto || `https://picsum.photos/seed/${service.providerId}/80/80`} 
                        alt="" 
                        className="w-8 h-8 rounded-xl object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="text-left font-sans max-w-[120px]">
                        <p className="text-xs font-black text-slate-800 truncate">{service.providerName}</p>
                        <div className="flex items-center gap-0.5 text-orange-400">
                          <Star size={10} fill="currentColor" />
                          <span className="text-[10px] font-bold">{service.providerRating.toFixed(1)}</span>
                        </div>
                      </div>
                    </Link>
                  </div>

                  <Link
                    to={`/provider/${service.providerId}?serviceId=${service.id}`}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 rounded-2xl shadow-xl shadow-emerald-50 active:scale-95 transition-all text-center"
                  >
                    Book Instantly
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Complete Predefined Services Directory / Catalog */}
      <section className="max-w-7xl mx-auto w-full px-4 scroll-mt-24">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-10 pb-4 border-b border-slate-100">
          <div>
            <span className="text-indigo-650 text-xs font-black uppercase tracking-widest flex items-center gap-1.5 mb-1">
              <Sparkles size={14} className="text-amber-500 animate-pulse" /> Complete Services Catalog
            </span>
            <h2 className="text-3xl font-extrabold text-slate-900 leading-tight">
              Predefined Services Registry
            </h2>
            <p className="text-sm text-slate-500 font-medium mt-1">
              Browse standard pricing templates. Type or search a service to match instantly with verified service crews.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {SERVICE_CATEGORIES.filter(cat => selectedHomeCat === 'All' || cat.name === selectedHomeCat).map((category) => (
            <div key={category.name} className="bg-slate-50/70 rounded-[2.5rem] p-8 border border-slate-200/50 flex flex-col justify-between shadow-sm">
              <div>
                <div className="flex items-center gap-3 border-b border-indigo-150/10 pb-4 mb-6">
                  <span className="text-4xl bg-white w-12 h-12 flex items-center justify-center rounded-xl shadow-sm border border-slate-100">{category.icon}</span>
                  <div>
                    <h3 className="text-lg font-black text-slate-900 leading-tight">{category.name}</h3>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-0.5">Catalog Services</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {category.services.slice(0, 6).map((svc, idx) => (
                    <div 
                      key={idx}
                      className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between hover:border-indigo-200 hover:shadow-md transition-all group"
                    >
                      <div className="min-w-0 pr-2 font-sans">
                        <p className="font-extrabold text-xs text-slate-800 truncate leading-tight mb-1 group-hover:text-indigo-600 transition-colors">
                          {svc.name}
                        </p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1">
                          <Clock size={10} /> Lock Pricing
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-mono text-xs font-black text-slate-900 leading-tight mb-1.5">
                          {svc.custom ? 'Quote required' : `R${svc.price}`}
                        </p>
                        <Link 
                          to={`/browse?search=${encodeURIComponent(svc.name)}`}
                          className="inline-flex items-center gap-0.5 text-[9px] font-black text-indigo-600 uppercase tracking-widest hover:text-indigo-800"
                        >
                          Find Pros <ArrowRight size={8} strokeWidth={3} />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-indigo-100/20">
                <Link
                  to={`/browse?search=${encodeURIComponent(category.name)}`}
                  className="w-full py-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-1.5 rounded-2xl shadow-sm transition-all"
                >
                  Browse all {category.name} pros
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Why Us Section */}
      <section className="bg-gray-50 py-24 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4 font-sans">Why PinYourPro?</h2>
            <p className="text-gray-500 max-w-xl mx-auto font-medium font-sans">We streamline the process of finding and booking professional services so you can focus on what matters.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: <ShieldCheck className="text-green-600" />, title: 'Verified Pros', desc: 'All service providers go through a vetting process to ensure quality and safety.' },
              { icon: <Clock className="text-purple-600" />, title: 'Instant Booking', desc: 'Forget phone tag. Book your preferred time slot immediately through our calendar.' },
              { icon: <Users className="text-blue-600" />, title: 'Local Expertise', desc: 'Find specialized professionals within 10 miles of your current location.' },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-start gap-4 transition-all hover:translate-y-[-4px]">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 font-sans">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed font-medium font-mono text-xs">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto w-full px-4">
        <div className="bg-gradient-to-r from-purple-700 to-indigo-800 rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to expand your business?</h2>
            <p className="text-purple-100 text-lg mb-12 max-w-2xl mx-auto font-light">Join hundreds of professional providers who are growing their client base with PinYourPro.</p>
            <Link 
              to="/auth?role=provider" 
              className="inline-flex items-center gap-2 px-10 py-5 bg-white text-purple-700 rounded-2xl font-black text-xl hover:bg-gray-50 transition-all shadow-xl shadow-black/10 hover:scale-[1.02]"
            >
              List your services
              <ArrowRight />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}