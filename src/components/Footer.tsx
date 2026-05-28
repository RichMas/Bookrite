import { Link } from 'react-router-dom';
import { Mail, Shield, ExternalLink, Globe, Heart, ArrowUpRight, MessageCircle } from 'lucide-react';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-950 text-slate-400 py-20 px-4 mt-20 relative overflow-hidden">
      {/* Subtle background decoration */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl translate-y-1/2" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Section */}
          <div className="space-y-6">
            <Link to="/" className="text-2xl font-black text-white tracking-tighter inline-block">
              PinYourPro<span className="text-indigo-500">.co.za</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs font-medium">
              South Africa's most trusted marketplace for verified professional services. Secure payments, guaranteed quality.
            </p>
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-white hover:border-indigo-500 hover:text-indigo-500 transition-all cursor-pointer">
                <Globe size={18} />
              </div>
              <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-white hover:border-indigo-500 hover:text-indigo-500 transition-all cursor-pointer">
                <MessageCircle size={18} />
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-8">Platform</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li>
                <Link to="/browse" className="hover:text-white transition-colors flex items-center gap-2 group">
                  Browse Services
                  <ArrowUpRight size={14} className="opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                </Link>
              </li>
              <li>
                <Link to="/auth" className="hover:text-white transition-colors flex items-center gap-2 group">
                  Become a Provider
                  <ArrowUpRight size={14} className="opacity-0 -translate-y-1 translate-x-1 group-hover:opacity-100 group-hover:translate-y-0 group-hover:translate-x-0 transition-all" />
                </Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">Contact Us</Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-8">Support</h4>
            <ul className="space-y-4 text-sm font-bold">
              <li>
                <a href="mailto:support@pinyourpro.co.za" className="hover:text-white transition-colors flex items-center gap-2">
                  <Mail size={16} className="text-indigo-500" />
                  support@pinyourpro.co.za
                </a>
              </li>
              <li>
                <a href="mailto:help@pinyourpro.co.za" className="hover:text-white transition-colors flex items-center gap-2">
                  <Shield size={16} className="text-emerald-500" />
                  Trust & Safety
                </a>
              </li>
            </ul>
          </div>

          {/* Location */}
          <div>
            <h4 className="text-white font-black text-xs uppercase tracking-[0.2em] mb-8">Base</h4>
            <p className="text-sm font-medium mb-4">
              Proudly built for the Republic of South Africa. 🇿🇦
            </p>
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Status</p>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-xs font-black text-white">Systems Operational</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-12 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500">
            <span>© {currentYear} PinYourPro.co.za</span>
            <span className="w-1 h-1 bg-slate-800 rounded-full" />
            <span>All rights reserved</span>
          </div>

          <div className="flex items-center gap-6">
            <a 
              href="https://paragonconsult.online" 
              target="_blank" 
              rel="noopener noreferrer"
              className="group flex flex-col items-center md:items-end gap-1"
            >
              <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em]">Built with <Heart size={8} className="inline text-rose-500" /> by</span>
              <div className="flex items-center gap-2 text-indigo-400 group-hover:text-indigo-300 transition-colors">
                <span className="text-xs font-black uppercase tracking-widest">ParagonConsult</span>
                <ExternalLink size={12} />
              </div>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
