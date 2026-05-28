import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, createContext, useContext } from 'react';
import { onAuthStateChanged, User, sendEmailVerification } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, UserRole } from './types';
import { ShieldAlert, MailCheck, LogOut, RefreshCw, Sparkles } from 'lucide-react';

// Pages
import Home from './pages/Home';
import Browse from './pages/Browse';
import ProviderDetail from './pages/ProviderDetail';
import BookingPage from './pages/Booking';
import AuthPage from './pages/Auth';
import AdminPanel from './pages/Admin';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import UserDashboard from './pages/UserDashboard';
import Terms from './pages/Terms';
import About from './pages/About';
import Contact from './pages/Contact';

// Context
interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  refreshProfile: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const ADMIN_EMAILS = ['paragonbusinessconsult@gmail.com', 'sithembiledlaza8@gmail.com'];

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);
  const [sendingVerification, setSendingVerification] = useState(false);
  const [emailVerificationEnabled, setEmailVerificationEnabled] = useState(false);

  useEffect(() => {
    const settingsRef = doc(db, 'settings', 'emailVerification');
    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        setEmailVerificationEnabled(docSnap.data().enabled ?? false);
      } else {
        setEmailVerificationEnabled(false);
      }
    }, (error) => {
      console.warn("Error listening to settings, defaulting to false:", error);
      setEmailVerificationEnabled(false);
    });
    return () => unsubscribeSettings();
  }, []);

  const fetchProfile = async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const uProfile = docSnap.data() as UserProfile;
        setProfile(uProfile);
        return uProfile;
      } else {
        setProfile(null);
        return null;
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
      return null;
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (fbUser) => {
      if (fbUser) {
        const uProfile = await fetchProfile(fbUser.uid);
        if (!uProfile) {
          const pathname = window.location.pathname;
          if (pathname !== '/auth' && pathname !== '/') {
            await auth.signOut();
            setUser(null);
            setProfile(null);
          } else {
            setUser(fbUser);
          }
        } else {
          setUser(fbUser);
        }
      } else {
        setUser(fbUser);
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.uid);
  };

  const handleResendVerification = async () => {
    if (!user) return;
    setSendingVerification(true);
    setVerificationFeedback(null);
    try {
      await sendEmailVerification(user);
      setVerificationFeedback("Verification link successfully sent to your inbox. Please check your spam folder as well!");
    } catch (err: any) {
      console.error(err);
      setVerificationFeedback(`Error sending verification email: ${err.message || err}`);
    } finally {
      setSendingVerification(false);
    }
  };

  const handleManualCheckVerification = async () => {
    if (!user) return;
    setLoading(true);
    try {
      await user.reload();
      const updatedUser = auth.currentUser;
      if (updatedUser) {
        setUser(updatedUser);
        if (updatedUser.emailVerified) {
          await fetchProfile(updatedUser.uid);
        } else {
          setVerificationFeedback("Verification check completed: still pending. Please verify the email sent to your inbox first!");
        }
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Email verification gate (bypassed if they have no login, if email is verified, or if the setting is globally disabled)
  const isEmailVerified = !user || !emailVerificationEnabled || user.emailVerified || (user.email && ADMIN_EMAILS.includes(user.email.toLowerCase()));

  if (!isEmailVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fafafc] px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-2xl shadow-indigo-100/40 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full translate-x-12 -translate-y-12 shrink-0"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-650 rounded-2xl flex items-center justify-center mx-auto mb-8 border border-indigo-100/50">
              <MailCheck className="w-8 h-8" />
            </div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-black uppercase tracking-widest rounded-full mb-4">
              <Sparkles size={10} /> Account Anti-Bot Security Check
            </span>
            <h2 className="text-2xl font-black text-slate-900 leading-tight mb-4">Please Verify Your Email</h2>
            <p className="text-sm text-slate-500 font-sans leading-relaxed mb-6">
              To keep PinYourPro secure and filter out bots, please verify your email address. 
              We have sent a confirmation link to <strong className="text-indigo-600 font-bold">{user?.email}</strong>.
            </p>

            {verificationFeedback && (
              <div className="p-4 bg-indigo-50/70 border border-indigo-150 rounded-2xl text-xs font-semibold text-indigo-900 leading-relaxed mb-6 flex gap-2 text-left">
                <ShieldAlert className="shrink-0 text-indigo-600" size={16} />
                <p>{verificationFeedback}</p>
              </div>
            )}

            <div className="space-y-3">
              <button 
                onClick={handleManualCheckVerification}
                className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black hover:bg-slate-800 transition-all flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                I've Verified My Email
              </button>

              <button 
                onClick={handleResendVerification}
                disabled={sendingVerification}
                className="w-full py-4 bg-indigo-50 text-indigo-650 hover:bg-indigo-105 rounded-2xl font-bold text-sm transition-all border border-indigo-100 disabled:opacity-50"
              >
                {sendingVerification ? 'Sending...' : 'Resend Verification Link'}
              </button>

              <button 
                onClick={() => auth.signOut()}
                className="w-full py-4 bg-white hover:bg-slate-50 text-red-650 rounded-2xl font-bold text-sm transition-all border border-slate-100 flex items-center justify-center gap-2"
              >
                <LogOut size={16} />
                Log Out
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, refreshProfile }}>
      <Router>
        <div className="min-h-screen bg-white">
          <Navbar />
          <main className="pt-16">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/browse" element={user ? <Browse /> : <Navigate to="/auth" />} />
              <Route path="/provider/:id" element={user ? <ProviderDetail /> : <Navigate to="/auth" />} />
              <Route path="/book/:id" element={user ? <BookingPage /> : <Navigate to="/auth" />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={user ? <UserDashboard /> : <Navigate to="/auth" />} />
              <Route path="/admin" element={
                user ? (
                  (profile?.role === 'admin' || ADMIN_EMAILS.includes(user.email?.toLowerCase() || '')) 
                    ? <AdminPanel /> 
                    : <Navigate to="/" />
                ) : <Navigate to="/auth" />
              } />
              <Route path="/terms" element={<Terms />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

