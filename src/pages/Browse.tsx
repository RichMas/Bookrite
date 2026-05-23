import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { collection, query, getDocs, limit } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { ProviderProfile } from '../types';
import { useAuth } from '../App';
import { 
  Search, 
  MapPin, 
  Star, 
  ShieldCheck, 
  Sparkles, 
  Clock, 
  Flame, 
  ThumbsUp, 
  Grid,
  TrendingUp,
  Award
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SERVICE_CATEGORIES } from '../constants';

export default function Browse() {
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const initialSearch = searchParams.get('search') || '';

  // Filters state
  const [selectedLocation, setSelectedLocation] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [selectedSpecificService, setSelectedSpecificService] = useState('All');
  const [search, setSearch] = useState(initialSearch);
  
  const [providers, setProviders] = useState<ProviderProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'providers'), limit(150));
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
  }, []);

  // Sync category & search state with search parameters if changed from exterior link
  useEffect(() => {
    const catParam = searchParams.get('category');
    if (catParam) {
      setSelectedCategory(catParam);
    }
    const searchParam = searchParams.get('search');
    if (searchParam) {
      setSearch(searchParam);
    }
  }, [searchParams]);

  // Derive flat individual services from all providers who have listed services
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

  // Extract dynamic location choices based on all active providers
  const locations = ['All', ...Array.from(new Set(
    providers
      .filter(p => p.services && p.services.length > 0)
      .map(p => p.city || p.location.split(',')[0].trim())
      .filter(Boolean)
  ))];

  // Derive specific services available in current selected category
  const specificServiceOptions = ['All', ...Array.from(new Set(
    allServices
      .filter(s => selectedCategory === 'All' || s.providerCategories.includes(selectedCategory as any))
      .map(s => s.name)
  ))];

  // Filtering engine checks location, category, specific service and prompt text
  const filteredServices = allServices.filter(s => {
    const matchesLocation = selectedLocation === 'All' || 
      s.providerLocation.toLowerCase().includes(selectedLocation.toLowerCase()) ||
      (s.providerCity && s.providerCity.toLowerCase() === selectedLocation.toLowerCase());
      
    const matchesCategory = selectedCategory === 'All' || 
      s.providerCategory === selectedCategory ||
      s.providerCategories.includes(selectedCategory as any);
      
    const matchesSpecificService = selectedSpecificService === 'All' || 
      s.name.toLowerCase() === selectedSpecificService.toLowerCase();
      
    const matchesSearch = search.trim() === '' || 
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(search.toLowerCase())) ||
      s.providerName.toLowerCase().includes(search.toLowerCase());
      
    return matchesLocation && matchesCategory && matchesSpecificService && matchesSearch;
  });

  // Check if any filter is active so we switch dynamically to search view vs landing view
  const isFilteringActive = selectedLocation !== 'All' || selectedCategory !== 'All' || selectedSpecificService !== 'All' || search.trim() !== '';

  // Compartmentalisation helper lists
  // 1. Most Booked Services (handpicked high-intent typical high volume services)
  const mostBooked = allServices.filter(s => 
    s.name === 'Blocked Drain' || 
    s.name === 'High School (Maths/Science)' || 
    s.name === 'Standard House Clean' ||
    s.name === 'Single Session (1 hour)' ||
    s.name === 'Local Delivery' ||
    s.name === 'Haircut & Style'
  ).slice(0, 4);

  // Fallback to top rating if handpicked are unpopulated in raw dev database
  const mostBookedList = mostBooked.length >= 2 ? mostBooked : allServices.slice(0, 4);

  // 2. Recommended Services (random premium services)
  const recommendedList = allServices
    .filter(s => s.providerRating >= 4.5)
    .sort(() => 0.5 - Math.random())
    .slice(0, 4);

  // 3. Highly Rated Service Providers (unique providers filtering)
  const highlyRatedProviders = providers
    .filter(p => p.services && p.services.length > 0 && p.rating >= 4.5)
    .slice(0, 3);

  const getCategoryIcon = (catName: string): string => {
    return SERVICE_CATEGORIES.find(c => c.name === catName)?.icon || '💼';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      
      {/* Hero Welcome Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-indigo-700 via-purple-700 to-indigo-900 rounded-[3rem] p-8 md:p-16 mb-16 text-white shadow-2xl">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full animate-pulse" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
        </div>
        <div className="relative z-10 max-w-4xl">
          <span className="inline-flex items-center gap-1.5 px-4.5 py-1.5 bg-white/15 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest text-indigo-100 mb-6">
            <Sparkles size={12} className="text-amber-300 animate-spin" /> Vetted Professionals Only
          </span>
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight mb-4">
            Welcome back, {profile?.displayName || 'Client'}! 👋
          </h1>
          <p className="text-lg md:text-xl text-indigo-100 mb-10 max-w-2xl font-light leading-relaxed">
            What are we getting done today? Search based on specific location, class, and service requirements below.
          </p>

          {/* Search filter at top */}
          <div className="bg-white text-slate-800 p-4 md:p-6 rounded-[2.5rem] shadow-2xl grid grid-cols-1 md:grid-cols-4 gap-4 items-end mt-4">
            
            {/* Input query search */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-2">Text Search</label>
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input 
                  type="text"
                  placeholder="e.g. Maths, Plumber..."
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 focus:bg-white border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-sans font-bold text-sm transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Select Location Dropdown */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-2">Select Location</label>
              <div className="relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <select
                  value={selectedLocation}
                  onChange={(e) => setSelectedLocation(e.target.value)}
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 focus:bg-white border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-sans font-bold text-sm transition-all appearance-none"
                >
                  <option value="All">All Locations</option>
                  {locations.filter(loc => loc !== 'All').map(loc => (
                    <option key={loc} value={loc}>{loc}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Select Category Dropdown */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-2">Choose Category</label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setSelectedSpecificService('All'); // Reset specific service
                  setSearchParams(e.target.value === 'All' ? {} : { category: e.target.value });
                }}
                className="w-full px-5 py-3.5 bg-slate-50 focus:bg-white border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-sans font-bold text-sm transition-all appearance-none"
              >
                <option value="All">All Categories</option>
                {SERVICE_CATEGORIES.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>

            {/* Select Specific Service Dropdown */}
            <div className="flex flex-col gap-2">
              <label className="text-[10px] uppercase font-black tracking-widest text-slate-400 ml-2">Specific Service</label>
              <select
                value={selectedSpecificService}
                onChange={(e) => setSelectedSpecificService(e.target.value)}
                className="w-full px-5 py-3.5 bg-slate-50 focus:bg-white border-2 border-transparent focus:border-indigo-500 rounded-2xl outline-none font-sans font-bold text-sm transition-all appearance-none"
              >
                <option value="All">All Services</option>
                {specificServiceOptions.filter(opt => opt !== 'All').map(opt => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Main UI Toggle: Active Filtered Results VS Dashboard Highlight Sections */}
      {isFilteringActive ? (
        <section className="space-y-8">
          <div className="flex justify-between items-center border-b border-slate-100 pb-4">
            <div>
              <h2 className="text-2xl font-black text-slate-900">Found {filteredServices.length} Matching {filteredServices.length === 1 ? 'Service' : 'Services'}</h2>
              <p className="text-sm text-slate-500">Showing services provided by fully verified local experts.</p>
            </div>
            {isFilteringActive && (
              <button 
                onClick={() => {
                  setSelectedLocation('All');
                  setSelectedCategory('All');
                  setSelectedSpecificService('All');
                  setSearch('');
                  setSearchParams({});
                }}
                className="px-4.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl"
              >
                Clear All Filter
              </button>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-slate-50 h-[300px] rounded-[2.5rem] animate-pulse"></div>
              ))}
            </div>
          ) : filteredServices.length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-[2.5rem] border-2 border-dashed border-slate-150">
              <Grid className="text-slate-300 mx-auto mb-4" size={48} />
              <h3 className="text-xl font-bold text-slate-800">No Services Found</h3>
              <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">Try selecting a different category or choosing another nearby location.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredServices.map((service, index) => (
                <motion.div
                  key={`${service.providerId}-${service.id}-${index}`}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-white rounded-[2.5rem] p-6 border border-slate-100 shadow-lg hover:shadow-2xl hover:border-indigo-200 hover:-translate-y-1 transition-all flex flex-col justify-between"
                >
                  <div>
                    {/* Header service category */}
                    <div className="flex justify-between items-start mb-4">
                      <span className="text-3xl bg-indigo-50 w-12 h-12 rounded-2xl flex items-center justify-center border border-indigo-100/50">
                        {getCategoryIcon(service.providerCategory)}
                      </span>
                      <span className="px-3.5 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-wider rounded-lg">
                        {service.providerCategory}
                      </span>
                    </div>

                    {/* Service detail */}
                    <h3 className="text-xl font-black text-slate-900 mb-1 leading-snug">{service.name}</h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-widest flex items-center gap-1.5 mb-4">
                      <Clock size={12} /> {service.duration || '60 Min'}
                    </p>
                    <p className="text-sm text-slate-500 font-sans leading-relaxed line-clamp-2 italic mb-6">
                      {service.description || "Top performance standard local service offered by fully certified professional."}
                    </p>
                  </div>

                  {/* Pricing and Provider badge */}
                  <div className="pt-5 border-t border-slate-50 mt-auto">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Rate</p>
                        <p className="text-2xl font-black text-indigo-600">
                          {service.custom ? 'Quote' : `R${service.price}${service.unit || ''}`}
                        </p>
                      </div>

                      {/* Display Provider profile mini */}
                      <Link to={`/provider/${service.providerId}?serviceId=${service.id}`} className="group/prov flex items-center gap-2.5 bg-slate-50/50 hover:bg-slate-50 p-2 rounded-2xl border border-slate-100 transition-colors">
                        <img 
                          src={service.providerPhoto || `https://picsum.photos/seed/${service.providerId}/80/80`} 
                          alt="" 
                          className="w-8 h-8 rounded-xl object-cover"
                          referrerPolicy="no-referrer"
                        />
                        <div className="text-left max-w-[120px]">
                          <p className="text-xs font-black text-slate-800 truncate group-hover/prov:text-indigo-600 transition-colors">{service.providerName}</p>
                          <div className="flex items-center gap-1 text-orange-400">
                            <Star size={10} fill="currentColor" />
                            <span className="text-[10px] font-black">{service.providerRating.toFixed(1)}</span>
                          </div>
                        </div>
                      </Link>
                    </div>

                    {/* Action navigation button */}
                    <Link
                      to={`/provider/${service.providerId}?serviceId=${service.id}`}
                      className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-1.5 rounded-2xl shadow-xl shadow-emerald-50 active:scale-95 transition-all text-center"
                    >
                      Book This Service
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </section>
      ) : (
        /* Landing View Dashboard highlight sections */
        <div className="space-y-20">
          
          {/* Section 1: 🔥 Most Booked Services */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center">
                <Flame size={20} className="animate-pulse" />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Most Booked Services</h2>
                <p className="text-sm text-slate-400">The most demanded services in your local neighborhood this week.</p>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-56 bg-slate-50 rounded-[2rem] animate-pulse"></div>)}
              </div>
            ) : mostBookedList.length === 0 ? (
              <p className="text-slate-400 italic text-sm">Services are setting up</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {mostBookedList.map((service, idx) => (
                  <Link 
                    key={`${service.id}-booked-${idx}`} 
                    to={`/provider/${service.providerId}?serviceId=${service.id}`}
                    className="group bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">{getCategoryIcon(service.providerCategory)}</span>
                        <span className="text-[10px] font-black uppercase text-indigo-500 tracking-wider">Top Booked</span>
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-base leading-snug group-hover:text-indigo-600 transition-colors">{service.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold font-mono">📍 {service.providerCity}</p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                      <span className="text-base font-black text-slate-800">
                        {service.custom ? 'Quote' : `R${service.price}${service.unit || ''}`}
                      </span>
                      <span className="text-xs font-black text-indigo-600 bg-indigo-50 py-1.5 px-3 rounded-xl uppercase tracking-widest flex items-center gap-1 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        Book
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Section 2: ✨ Recommended for You */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center">
                <ThumbsUp size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Recommended Services</h2>
                <p className="text-sm text-slate-400">Handpicked services based on premium feedback and pristine ratings.</p>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-56 bg-slate-50 rounded-[2rem] animate-pulse"></div>)}
              </div>
            ) : recommendedList.length === 0 ? (
              <p className="text-slate-400 italic text-sm">Recommended services pending activation</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {recommendedList.map((service, idx) => (
                  <Link 
                    key={`${service.id}-rec-${idx}`} 
                    to={`/provider/${service.providerId}?serviceId=${service.id}`}
                    className="group bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all flex flex-col justify-between animate-fade-in"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl">{getCategoryIcon(service.providerCategory)}</span>
                        <div className="flex items-center gap-1 text-orange-400">
                          <Star size={11} fill="currentColor" />
                          <span className="text-[10px] font-black">{service.providerRating.toFixed(1)}</span>
                        </div>
                      </div>
                      <h4 className="font-extrabold text-slate-800 text-base leading-snug group-hover:text-indigo-600 transition-colors">{service.name}</h4>
                      <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-bold">BY {service.providerName}</p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between">
                      <span className="text-base font-black text-indigo-600">
                        {service.custom ? 'Quote' : `R${service.price}${service.unit || ''}`}
                      </span>
                      <span className="text-xs font-black text-emerald-600 bg-emerald-50 py-1.5 px-3 rounded-xl uppercase tracking-widest flex items-center gap-1 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                        Pick
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Section 3: 🏆 Highly Rated Service Providers */}
          <section className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center">
                <Award size={20} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Highly Rated Providers</h2>
                <p className="text-sm text-slate-400">Prisinte service providers who consistently deliver 5-star quality.</p>
              </div>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => <div key={i} className="h-64 bg-slate-50 rounded-[2.5rem] animate-pulse"></div>)}
              </div>
            ) : highlyRatedProviders.length === 0 ? (
              <p className="text-slate-400 italic text-sm">Highly rated providers set up is ongoing</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {highlyRatedProviders.map((provider) => (
                  <Link 
                    key={provider.uid} 
                    to={`/provider/${provider.uid}`}
                    className="group bg-slate-50/50 hover:bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all flex flex-col justify-between"
                  >
                    <div className="flex items-start gap-5">
                      <img 
                        src={provider.photoURL || `https://picsum.photos/seed/${provider.uid}/100/100`} 
                        alt="" 
                        className="w-16 h-16 rounded-2xl object-cover border border-slate-150 transition-transform group-hover:scale-105"
                        referrerPolicy="no-referrer"
                      />
                      <div>
                        <div className="flex items-center gap-1.5 mb-1 bg-white border border-slate-100/50 py-0.5 px-2 rounded-lg w-fit">
                          <Star size={11} fill="currentColor" className="text-orange-400" />
                          <span className="text-xs font-black text-slate-800">{provider.rating.toFixed(1)}</span>
                        </div>
                        <h4 className="font-extrabold text-slate-900 text-lg leading-tight group-hover:text-indigo-600 transition-colors">{provider.name}</h4>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-widest mt-1">📍 {provider.location.split(',')[0].trim()}</p>
                      </div>
                    </div>

                    <div className="mt-8 pt-6 border-t border-slate-100/80 flex items-center justify-between">
                      <span className="text-xs font-black uppercase text-indigo-600 tracking-wider">
                        {provider.services?.length || 0} {provider.services?.length === 1 ? 'Service' : 'Services'} Offered
                      </span>
                      <span className="text-xs font-black text-slate-500 flex items-center gap-1">
                        View Profile →
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

        </div>
      )}
    </div>
  );
}
