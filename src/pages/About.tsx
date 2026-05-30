import React from 'react';
import { motion } from 'motion/react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Award, Users, DollarSign, ArrowRight, Sparkles, Heart, Star, Compass } from 'lucide-react';

export default function About() {
  const stats = [
    { value: '100%', label: 'Vetted Contractors' },
    { value: 'R0 RISK', label: 'Escrow Guarantee' },
    { value: '24/7', label: 'Trust & Safety' },
    { value: '🇿🇦 SA', label: 'Proudly Local' }
  ];

  const values = [
    {
      icon: <ShieldCheck className="w-6 h-6 text-indigo-600" />,
      title: 'Rigorous Verification',
      description: 'We individually verify physical addresses, identity cards, skill backgrounds, and historical customer feedback for every service professional before they receive verification badges.'
    },
    {
      icon: <DollarSign className="w-6 h-6 text-emerald-600" />,
      title: 'PayPal Escrow System',
      description: 'Funds are securely deposited and held by PinYourPro during execution. Providers are guaranteed payment on quality completion, and clients are fully protected against incomplete work.'
    },
    {
      icon: <Award className="w-6 h-6 text-purple-600" />,
      title: 'Vetted Quality standards',
      description: 'We filter out poor performance immediately. If a contractor falls below high review thresholds, they lose booking eligibility to protect our South African marketplace integrity.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50/50">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 px-4 sm:px-6 lg:px-8 bg-white border-b border-slate-100">
        <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-indigo-50/30 rounded-full blur-3xl -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-1/4 w-[500px] h-[500px] bg-purple-50/20 rounded-full blur-3xl translate-y-1/2"></div>

        <div className="max-w-7xl mx-auto relative z-10 text-center space-y-8">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100/50 text-indigo-700 text-xs font-black uppercase tracking-widest"
          >
            <Sparkles size={14} /> Shaping trust in South Africa
          </motion.span>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-none"
          >
            Vetted Professional Trade <br className="hidden md:inline" /> 
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
              Secured with Escrow
            </span>
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-slate-550 font-sans max-w-3xl mx-auto leading-relaxed"
          >
            PinYourPro was founded to solve the core trust breakdown between South African property owners and professional contractors. We combine rigorous background vetting with robust escrow protection.
          </motion.p>

          {/* Stats Bar */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 p-8 bg-[#fafafc] rounded-[2.5rem] border border-slate-100/70 max-w-4xl mx-auto shadow-sm"
          >
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center space-y-1">
                <p className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                <p className="text-xs md:text-xs font-black uppercase tracking-widest text-slate-400">{stat.label}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Story section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          <div className="space-y-6">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-600">The Problem & The Solution</span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-tight">
              Why we built PinYourPro
            </h2>
            <div className="space-y-4 text-slate-550 font-sans leading-relaxed text-sm md:text-base">
              <p>
                In South Africa, millions of Rands are lost annually to home repair scams, unverified handymen who disappear midway through jobs, or poor trade work. Conversely, honest artisans face unpaid invoices from untrustworthy customers.
              </p>
              <p>
                We realized that modern technology could resolve this. By designing an digital ecosystem with <strong>secure digital identification</strong>, <strong>professional trade portfolio verifications</strong>, and <strong>PayPal escrow guarantees</strong>, we eliminate the risk for everyone.
              </p>
              <p>
                Our customers only release service payments when they inspect and confirm that the work is fully executed. Our providers carry out repairs knowing their full fees are secured in our safe storage. It represents the perfect win-win for our community.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-tr from-indigo-950 to-slate-900 text-white p-8 md:p-12 rounded-[3.5rem] shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl"></div>
            <div className="relative z-10 space-y-8">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-indigo-300 text-[10px] font-black uppercase tracking-widest">
                <Compass size={12} /> Our core philosophy
              </span>
              <p className="text-xl md:text-2xl font-black tracking-tight leading-relaxed italic text-indigo-50">
                "We empower South African builders, technicians, and local homeowners to connect with profound respect, complete transparency, and zero direct cash liability."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-indigo-500/20 text-indigo-300 rounded-xl flex items-center justify-center font-bold">🇿🇦</div>
                <div>
                  <h4 className="font-extrabold text-sm text-white">PinYourPro SA Trust</h4>
                  <p className="text-xs text-slate-400">Pristine trades, secured perfectly</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Corporate Values */}
      <section className="bg-white py-24 px-4 sm:px-6 lg:px-8 border-y border-slate-100">
        <div className="max-w-7xl mx-auto space-y-16">
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <span className="text-xs font-black uppercase tracking-widest text-indigo-600">The standards we live by</span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tight leading-none">
              Aligned with absolute integrity
            </h2>
            <p className="text-sm md:text-base text-slate-500 font-sans leading-relaxed">
              We stand against average shortcuts. These key principles are built securely into every aspect of our code and user interactions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {values.map((v, idx) => (
              <div key={idx} className="p-8 bg-slate-50/50 rounded-[2rem] border border-slate-100/80 hover:bg-white hover:border-indigo-150 transition-all duration-300 group">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-md shadow-slate-100/50 mb-6 group-hover:scale-105 transition-transform duration-300">
                  {v.icon}
                </div>
                <h3 className="font-black text-lg text-slate-900 mb-3">{v.title}</h3>
                <p className="text-xs font-medium text-slate-500 font-sans leading-relaxed">{v.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA section */}
      <section className="py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-5xl mx-auto bg-indigo-950 text-white rounded-[3rem] p-8 md:p-16 relative overflow-hidden shadow-2xl">
          {/* Visual gradient element */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-900 to-purple-950 opacity-90"></div>
          <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>

          <div className="relative z-10 text-center space-y-8 max-w-3xl mx-auto">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 rounded-full text-indigo-200 text-[10px] font-black uppercase tracking-widest">
              Join PinYourPro 🇸🇦
            </span>
            <h2 className="text-4xl md:text-5xl font-black tracking-tight leading-none text-white">
              Ready to construct with total peace of mind?
            </h2>
            <p className="text-sm md:text-base text-indigo-150 leading-relaxed font-sans max-w-xl mx-auto">
              Find fully evaluated experts or present your corporate trade services in Cape Town, Johannesburg, Durban, and across South Africa today.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link 
                to="/browse" 
                className="px-8 py-4 bg-white text-indigo-950 font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-indigo-50 transition-all shadow-xl flex items-center justify-center gap-2 group cursor-pointer"
              >
                <span>Browse Local Pros</span>
                <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <Link 
                to="/auth" 
                className="px-8 py-4 bg-white/10 border border-white/20 text-white font-black text-xs uppercase tracking-wider rounded-2xl hover:bg-white/15 transition-all text-center cursor-pointer"
              >
                Become Vetted Provider
              </Link>
            </div>
          </div>
        </div>
      </section>

    </div>
  );
}
