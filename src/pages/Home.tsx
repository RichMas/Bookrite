import { Link } from 'react-router-dom';
import { Search, Dumbbell, Wrench, GraduationCap, Sparkles, ArrowRight, ShieldCheck, Clock, Users } from 'lucide-react';
import { motion } from 'motion/react';

import { SERVICE_CATEGORIES } from '../constants';

const CATEGORIES = SERVICE_CATEGORIES.map(cat => ({
  name: cat.name,
  icon: cat.icon,
  color: 'bg-indigo-50 text-indigo-600' // Default color
}));

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 }
};

export default function Home() {
  return (
    <div className="flex flex-col gap-24 pb-24">
      {/* Hero Section */}
      <section className="relative px-4 py-32 flex flex-col items-center text-center bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 overflow-hidden shrink-0">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }}></div>
        </div>

        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl relative z-10"
        >
          <h1 className="text-4xl md:text-6xl font-extrabold text-white mb-6 tracking-tight leading-tight">
            Find & Book Trusted Professionals Near You
          </h1>
          <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto leading-relaxed font-light">
            Skip the back-and-forth. Instantly book top-rated plumbers, trainers, and tutors in your neighborhood.
          </p>

          <div className="flex w-full max-w-xl mx-auto bg-white p-2 rounded-2xl shadow-2xl">
            <input 
              type="text" 
              placeholder="What service do you need?" 
              className="flex-1 px-6 py-3 outline-none text-slate-700 bg-transparent text-lg"
            />
            <Link 
              to="/browse"
              className="bg-emerald-500 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all flex items-center gap-2"
            >
              Search
            </Link>
          </div>
        </motion.div>
      </section>

      {/* Categories */}
      <section className="py-12 px-8 bg-slate-50 border-b border-slate-100">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap justify-center gap-4">
            {CATEGORIES.map((cat) => (
              <Link 
                key={cat.name}
                to={`/browse?category=${encodeURIComponent(cat.name)}`}
                className="flex items-center gap-3 px-6 py-3 bg-white rounded-full shadow-sm border border-slate-200 hover:border-indigo-400 hover:shadow-md transition-all group"
              >
                <span className="text-xl group-hover:scale-125 transition-transform">{cat.icon}</span>
                <span className="text-sm font-semibold text-slate-700">{cat.name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why Us */}
      <section className="bg-gray-50 py-24">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why PinYourPro?</h2>
            <p className="text-gray-500 max-w-xl mx-auto">We streamline the process of finding and booking professional services so you can focus on what matters.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { icon: <ShieldCheck className="text-green-600" />, title: 'Verified Pros', desc: 'All service providers go through a vetting process to ensure quality and safety.' },
              { icon: <Clock className="text-purple-600" />, title: 'Instant Booking', desc: 'Forget phone tag. Book your preferred time slot immediately through our calendar.' },
              { icon: <Users className="text-blue-600" />, title: 'Local Expertise', desc: 'Find specialized professionals within 10 miles of your current location.' },
            ].map((feature, idx) => (
              <div key={idx} className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center bg-gray-50">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto w-full px-4">
        <div className="bg-gradient-to-r from-purple-600 to-indigo-700 rounded-[3rem] p-12 md:p-24 text-center text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
          <div className="relative z-10">
            <h2 className="text-4xl md:text-5xl font-black mb-6">Ready to expand your business?</h2>
            <p className="text-purple-100 text-lg mb-12 max-w-2xl mx-auto">Join hundreds of professionals who are growing their client base with PinYourPro.</p>
            <Link 
              to="/auth?role=provider" 
              className="inline-flex items-center gap-2 px-10 py-5 bg-white text-purple-600 rounded-2xl font-bold text-xl hover:bg-gray-50 transition-all shadow-xl shadow-black/10"
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
