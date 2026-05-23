import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { LogIn, UserPlus, ArrowRight, ShieldCheck, Mail, Lock, Eye, EyeOff, AlertTriangle } from 'lucide-react';
import { 
  signInWithGoogle, 
  handleFirestoreError, 
  OperationType, 
  db, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendPasswordResetEmail,
  auth 
} from '../firebase';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useAuth } from '../App';
import { motion, AnimatePresence } from 'motion/react';
import { sendEmailVerification } from 'firebase/auth';

export default function AuthPage() {
  const [searchParams] = useSearchParams();
  const defaultRole = searchParams.get('role') === 'provider' ? 'provider' : (searchParams.get('role') === 'admin' ? 'admin' : 'customer');
  const [role, setRole] = useState<'customer' | 'provider' | 'admin'>(defaultRole as any);
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Password Change Modal for Admins
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  const navigate = useNavigate();
  const { user: currentUser, profile: currentProfile, refreshProfile } = useAuth();

  const ADMIN_EMAILS = ['paragonbusinessconsult@gmail.com', 'sithembiledlaza8@gmail.com'];

  // Auto-redirect if already logged in
  useEffect(() => {
    if (currentUser && currentProfile && !loading && !showChangePassword) {
      if (ADMIN_EMAILS.includes(currentUser.email?.toLowerCase() || '')) {
        navigate('/admin');
      } else {
        navigate(currentProfile.role === 'provider' ? '/dashboard' : '/browse');
      }
    }
  }, [currentUser, currentProfile, loading, showChangePassword, navigate]);

  const handleAuth = async () => {
    setLoading(true);
    setError(null);
    try {
      const user = await signInWithGoogle();
      if (user) {
        await finalizeLogin(user);
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      if (error.code === 'auth/unauthorized-domain') {
        setError('Domain not authorized. Please go to Firebase Console > Authentication > Settings > Authorized domains and add "pinyourpro.co.za" and "bookrte.co.za".');
      } else {
        setError(`Google Sign-In failed: ${error.code || error.message}. Please check if your domain is authorized in Firebase.`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEmailPasswordAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    setError(null);

    const trimmedEmail = email.toLowerCase().trim();
    const isAdminEmail = ADMIN_EMAILS.includes(trimmedEmail);
    const isTempPassword = password === '123456' || password === 'passkeys';

    try {
      let user;
      if (mode === 'signin') {
        try {
          const result = await signInWithEmailAndPassword(auth, trimmedEmail, password);
          user = result.user;
        } catch (err: any) {
          // Special case for admins with temp password - try sign up if not found
          if ((err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') && isAdminEmail && isTempPassword) {
            try {
              const result = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
              user = result.user;
            } catch (createErr: any) {
              if (createErr.code === 'auth/email-already-in-use') {
                setError('This admin email has already set a permanent custom password. Please enter your custom password, or click "Forgot Password" to set a new one. Remember, you do NOT need to be logged into Google or the browser to sign in!');
                setLoading(false);
                return;
              }
              throw createErr;
            }
          } else if (err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
            if (isAdminEmail) {
              throw new Error('Incorrect credentials. If you set a permanent custom password previously, please enter it. If you forgot or want to reset it, click "Forgot Password" to change it instantly via email. No Google browser login needed!');
            }
            throw new Error('Invalid credentials. Please check your email and password.');
          } else if (err.code === 'auth/user-not-found') {
            throw new Error('No account found with this email. Please Sign Up first.');
          } else {
            throw err;
          }
        }
      } else {
        // Sign Up Mode
        if (isAdminEmail && role !== 'admin') {
          throw new Error('This email is reserved for administration. Please select the Admin role.');
        }
        if (role === 'admin' && !isAdminEmail) {
          throw new Error('Administrative accounts can only be created by authorized emails.');
        }

        const result = await createUserWithEmailAndPassword(auth, trimmedEmail, password);
        user = result.user;
        try {
          await sendEmailVerification(user);
          console.log("Verification email sent successfully.");
        } catch (verifErr) {
          console.warn("Could not send verification email immediately:", verifErr);
        }
      }

      if (user) {
        // Check if it's the temp password for admin
        if (isAdminEmail && isTempPassword) {
          setShowChangePassword(true);
          setLoading(false);
          return;
        }
        await finalizeLogin(user);
      }
    } catch (err: any) {
      console.error('Email auth error:', err);
      if (err.code === 'auth/operation-not-allowed') {
        setError('Email/Password sign-in is not enabled in Firebase Console. Please go to Authentication -> Sign-in Method and enable "Email/Password".');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email already exists. We have switched you to "Sign In" mode below so you can sign in directly! If you forgot your password, please click "Forgot Password" to receive a reset link.');
        setMode('signin');
      } else if (err.code === 'auth/weak-password') {
        setError('Password is too weak. Please use a password with at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message || 'Authentication failed. Please check your credentials.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setChangingPassword(true);
    try {
      if (auth.currentUser) {
        await updatePassword(auth.currentUser, newPassword);
        await finalizeLogin(auth.currentUser);
      }
    } catch (err: any) {
      console.error('Password change error:', err);
      setError('Could not change password. You might need to re-log in.');
    } finally {
      setChangingPassword(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Please enter your email address first.');
      return;
    }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
      setError(null);
    } catch (err: any) {
      setError(`Failed to send reset email: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const finalizeLogin = async (user: any) => {
    if (!user) return;
    console.log('Finalizing login for:', user.email);
    const isAdminEmail = ADMIN_EMAILS.includes(user.email.toLowerCase());
    
    const docRef = doc(db, 'users', user.uid);
    try {
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        console.log('Profile exists, checking role...');
        // Ensure admin email always has admin role even if they signed in before as something else
        if (isAdminEmail && docSnap.data().role !== 'admin') {
          await updateDoc(docRef, { role: 'admin' });
        }
      } else {
        console.log('Creating new profile...');
        // Create profile
        const profileData = {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName || user.email?.split('@')[0] || 'User',
          photoURL: user.photoURL || '',
          role: (isAdminEmail || role === 'admin') ? 'admin' : role,
          createdAt: serverTimestamp(),
        };
        await setDoc(docRef, profileData);
        
        if (role === 'provider' && !isAdminEmail) {
          await setDoc(doc(db, 'providers', user.uid), {
            uid: user.uid,
            name: user.displayName || 'New Provider',
            category: 'Tutor',
            description: '',
            location: '',
            photoURL: user.photoURL || '',
            rating: 5,
            reviewCount: 0,
            isApproved: false,
            createdAt: serverTimestamp(),
          });
        }
      }
      
      console.log('Refreshing profile and navigating...');
      await refreshProfile();
      
      if (isAdminEmail) {
        navigate('/admin');
      } else {
        const updatedProfileSnap = await getDoc(docRef);
        const updatedProfile = updatedProfileSnap.data();
        if (updatedProfile?.role === 'admin') {
          navigate('/admin');
        } else {
          navigate(role === 'provider' ? `/dashboard` : '/browse');
        }
      }
    } catch (err: any) {
      console.error('Finalize login error:', err);
      setError(`Login finalized, but profile sync failed: ${err.message}. You may need to refresh the page.`);
    }
  };

  return (
    <div className="min-h-[calc(100vh-64px)] flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl shadow-purple-200/50 border border-gray-100">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black text-gray-900 mb-3">Welcome to PinYourPro</h1>
            <p className="text-gray-500">The easiest way to book local professionals.</p>
          </div>

          <div className="flex bg-gray-100 p-1.5 rounded-2xl mb-8">
            <button 
              onClick={() => setRole('customer')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${role === 'customer' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
            >
              Customer
            </button>
            <button 
              onClick={() => setRole('provider')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${role === 'provider' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
            >
              Provider
            </button>
            <button 
              onClick={() => setRole('admin')}
              className={`flex-1 py-3 text-xs font-black uppercase tracking-wider rounded-xl transition-all ${role === 'admin' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-500'}`}
            >
              Admin
            </button>
          </div>

          <motion.div 
            key={role}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-8 text-center text-sm text-gray-600"
          >
            {role === 'customer' ? (
              <p className="font-medium text-slate-500">Sign up to browse services, see provider profiles, and book appointments in seconds.</p>
            ) : role === 'provider' ? (
              <p className="font-medium text-slate-500">Join as a provider to list your services, manage bookings, and grow your local presence.</p>
            ) : (
              <p className="font-medium text-indigo-600">Administrative access for platform management and verification services.</p>
            )}
          </motion.div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm font-bold flex items-center gap-3 rounded-lg">
              <AlertTriangle size={18} />
              {error}
            </div>
          )}

          <form onSubmit={handleEmailPasswordAuth} className="space-y-4 mb-8">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type="email"
                  value={email}
                  onChange={(e) => {
                    const val = e.target.value;
                    setEmail(val);
                    if (ADMIN_EMAILS.includes(val.toLowerCase().trim())) {
                      setRole('admin');
                    }
                  }}
                  required
                  placeholder="name@example.com"
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-end ml-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Password</label>
                <button 
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline"
                >
                  Forgot Password?
                </button>
              </div>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input 
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full pl-12 pr-12 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                />
                <button 
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-slate-800 transition-all shadow-xl shadow-slate-100 disabled:opacity-50"
            >
              {loading ? (
                <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              ) : (
                <>
                  {mode === 'signin' ? 'Sign In' : 'Create Account'}
                  <ArrowRight size={20} />
                </>
              )}
            </button>
            {resetSent && (
              <div className="mt-4 p-5 bg-indigo-50/80 border border-indigo-100 rounded-2xl text-left font-sans text-xs">
                <div className="flex items-center gap-2 text-indigo-700 font-black uppercase tracking-wider mb-2">
                  <span>✉️</span>
                  <span>Reset Instruction Sent!</span>
                </div>
                <p className="text-slate-600 mb-3 leading-relaxed">
                  We've triggered a password reset request. Please check your email inbox to proceed. 
                </p>
                <div className="bg-white p-3.5 rounded-xl border border-indigo-100/60 font-mono text-[11px] text-slate-700 space-y-2">
                  <div className="text-slate-400 font-bold uppercase text-[9px] tracking-wider">Email Content Template:</div>
                  <p className="font-semibold text-slate-800">"Follow this link to reset your PinYourPro App"</p>
                  <p className="text-slate-500 pt-1 border-t border-slate-50">Thanks, Pin Your Pro Team</p>
                </div>
                <div className="mt-4 pt-3 border-t border-indigo-100 flex flex-col gap-2">
                  <p className="text-[10px] text-indigo-600 font-bold">
                    💡 Customize your Firebase template dynamically in the console:
                  </p>
                  <a 
                    href="https://console.firebase.google.com/project/gen-lang-client-0955914819/authentication/emails"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Open Firebase Console Emails
                  </a>
                </div>
              </div>
            )}
          </form>

          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-100"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-4 bg-white text-gray-400 font-bold uppercase tracking-widest">Or</span>
            </div>
          </div>

          <button 
            onClick={handleAuth}
            disabled={loading}
            className="w-full py-4 bg-white border-2 border-slate-100 text-slate-600 rounded-2xl font-bold flex items-center justify-center gap-3 hover:border-slate-300 transition-all mb-8 disabled:opacity-50"
          >
            <img src="https://www.google.com/favicon.ico" className="w-5 h-5" alt="Google" referrerPolicy="no-referrer" />
            Continue with Google
          </button>

          <div className="text-center">
            <button 
              onClick={() => {
                setMode(mode === 'signin' ? 'signup' : 'signin');
                setError(null);
              }}
              className="text-indigo-600 text-sm font-black hover:underline"
            >
              {mode === 'signin' ? "Don't have an account? Sign Up" : "Already have an account? Sign In"}
            </button>
          </div>

          <div className="flex items-center gap-2 justify-center text-xs text-gray-400">
            <ShieldCheck size={14} />
            Secure authentication by Firebase
          </div>
        </div>
      </div>

      {/* Forced Password Change Modal */}
      <AnimatePresence>
        {showChangePassword && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 backdrop-blur-md bg-slate-900/60">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="bg-white p-10 rounded-[3rem] w-full max-w-md shadow-2xl"
            >
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-amber-50 text-amber-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                  <Lock size={32} />
                </div>
                <h2 className="text-2xl font-black text-slate-900 mb-2">Security Update</h2>
                <p className="text-slate-500 font-medium">Please set a permanent password for your admin account.</p>
              </div>

              <form onSubmit={handleChangePassword} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">New Password</label>
                  <input 
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                    placeholder="At least 6 characters"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Confirm Password</label>
                  <input 
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-500 focus:bg-white rounded-2xl outline-none transition-all font-medium"
                    placeholder="Repeat new password"
                  />
                </div>

                <button 
                  type="submit"
                  disabled={changingPassword}
                  className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50"
                >
                  {changingPassword ? (
                    <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                  ) : (
                    <>
                      Update & Login
                      <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
