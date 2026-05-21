import { Link, useNavigate } from 'react-router-dom';
import { LogOut, User, Menu, X, Shield, LayoutDashboard } from 'lucide-react';
import { useState } from 'react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import { useAuth } from '../App';
import { motion, AnimatePresence } from 'motion/react';

export default function Navbar() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut(auth);
    navigate('/');
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-slate-100 h-16">
      <div className="max-w-7xl mx-auto px-4 h-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <img src="/logo.png" alt="PinYourPro Logo" className="w-10 h-10 object-contain" onError={(e) => (e.currentTarget.style.display = 'none')} />
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            PinYourPro
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link to="/browse" className="text-sm font-medium text-slate-500 hover:text-indigo-600 transition-colors">
            Browse Services
          </Link>
          {user ? (
            <div className="flex items-center gap-4">
              {(profile?.role === 'admin' || user.email === 'paragonbusinessconsult@gmail.com' || user.email === 'sithembiledlaza8@gmail.com') && (
                <Link to="/admin" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-all">
                  <Shield size={20} />
                </Link>
              )}
              <Link to="/dashboard" className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-slate-50 rounded-full transition-all">
                <LayoutDashboard size={20} />
              </Link>
              <div className="flex items-center gap-3 pl-4 border-l border-slate-100">
                <div className="text-right">
                  <p className="text-sm font-semibold text-slate-800 leading-none">{profile?.displayName || 'User'}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">{profile?.role}</p>
                </div>
                <button 
                  onClick={handleSignOut}
                  className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                >
                  <LogOut size={20} />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link to="/auth" className="text-sm font-medium text-slate-500 hover:text-indigo-600 px-5 py-2 rounded-full border border-slate-200 hover:bg-slate-50 transition-all">
                Login
              </Link>
              <Link 
                to="/auth?role=provider" 
                className="px-5 py-2 bg-emerald-500 text-white rounded-full font-semibold hover:bg-emerald-600 transition-all shadow-md shadow-emerald-100"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button 
          className="md:hidden p-2 text-gray-600"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Nav */}
      <AnimatePresence>
        {isOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="md:hidden absolute top-16 left-0 right-0 bg-white border-b border-gray-100 p-4 flex flex-col gap-4 shadow-xl"
          >
            <Link to="/browse" onClick={() => setIsOpen(false)} className="text-lg font-medium text-gray-700 p-2">Browse Services</Link>
            {user ? (
              <>
                <Link to="/dashboard" onClick={() => setIsOpen(false)} className="text-lg font-medium text-gray-700 p-2">Dashboard</Link>
                {(profile?.role === 'admin' || user.email === 'paragonbusinessconsult@gmail.com' || user.email === 'sithembiledlaza8@gmail.com') && (
                  <Link to="/admin" onClick={() => setIsOpen(false)} className="text-lg font-medium text-gray-700 p-2">Admin Panel</Link>
                )}
                <button 
                  onClick={handleSignOut}
                  className="text-left text-lg font-medium text-red-600 p-2 flex items-center gap-2"
                >
                  <LogOut size={20} /> Sign Out
                </button>
              </>
            ) : (
              <Link 
                to="/auth" 
                onClick={() => setIsOpen(false)}
                className="w-full text-center py-3 bg-purple-600 text-white rounded-xl font-semibold"
              >
                Log In / Register
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}
