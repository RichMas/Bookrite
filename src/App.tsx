import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState, createContext, useContext } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from './firebase';
import { UserProfile, UserRole } from './types';

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

  const fetchProfile = async (uid: string) => {
    try {
      const docRef = doc(db, 'users', uid);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        setProfile(docSnap.data() as UserProfile);
      } else {
        // This might happen if registration check failed or wasn't finished
        setProfile(null);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, `users/${uid}`);
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        await fetchProfile(user.uid);
      } else {
        setProfile(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.uid);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600"></div>
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
              <Route path="/browse" element={<Browse />} />
              <Route path="/provider/:id" element={<ProviderDetail />} />
              <Route path="/book/:id" element={<BookingPage />} />
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
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthContext.Provider>
  );
}
