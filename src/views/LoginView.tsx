import React, { useState, useEffect } from 'react';
import { Play, ArrowRight, Plus, Loader2, Eye, EyeOff, Mail } from 'lucide-react';
import { signInWithGoogle, signInWithEmailPassword, signUpWithEmailPassword } from '../lib/firebase';

const SparkleIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C12 0 12 12 24 12C12 12 12 24 12 24C12 24 12 12 0 12C12 12 12 0 12 0Z" />
  </svg>
);

export default function LoginView() {
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showLoginModal, setShowLoginModal] = useState(false);

  const heroImages = [
    "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?q=80&w=2940&auto=format&fit=crop", // Weight lifting couple
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=2940&auto=format&fit=crop", // Focused DB lifting 
    "https://images.unsplash.com/photo-1554244933-d876deb6b2ea?q=80&w=2940&auto=format&fit=crop", // Woman lifting
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=2940&auto=format&fit=crop", // Group fitness/rowing
    "https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?q=80&w=2940&auto=format&fit=crop", // Outdoor running
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length);
    }, 4000);
    return () => clearInterval(timer);
  }, [heroImages.length]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      await signInWithEmailPassword(email, password);
    } catch (err: any) {
      const errorMessages: { [key: string]: string } = {
        'auth/user-not-found': 'No account found with this email',
        'auth/wrong-password': 'Incorrect password',
        'auth/invalid-email': 'Invalid email address',
        'auth/user-disabled': 'This account has been disabled',
        'auth/too-many-requests': 'Too many failed login attempts. Please try again later.',
      };
      setError(errorMessages[err?.code] || err?.message || 'Failed to sign in');
      setLoading(false);
    }
  };

  const handleEmailPasswordSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password || !displayName) {
      setError('Please fill in all fields');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await signUpWithEmailPassword(email, password, displayName);
    } catch (err: any) {
      const errorMessages: { [key: string]: string } = {
        'auth/email-already-in-use': 'Email already in use. Please login instead.',
        'auth/weak-password': 'Password is too weak. Please use a stronger password.',
        'auth/invalid-email': 'Invalid email address',
      };
      setError(errorMessages[err?.code] || err?.message || 'Failed to sign up');
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      const errorMessages: { [key: string]: string } = {
        'auth/popup-blocked': 'Popup was blocked. Please allow popups and try again.',
        'auth/cancelled-popup-request': 'Login cancelled',
      };
      setError(errorMessages[err?.code] || err?.message || 'Failed to sign in with Google');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-transparent text-ff-text font-sans selection:bg-ff-primary selection:text-white">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-6">
        
        {/* Navbar */}
        <nav aria-label="Main Navigation" className="flex items-center justify-between mb-20 lg:mb-28">
          <div className="flex items-center gap-2">
            <a href="/" className="rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ff-primary focus-visible:ring-offset-2 focus-visible:ring-offset-transparent">
              <img src="/logo.jpeg" alt="AUSTIN FITNESS - Return to Homepage" className="h-10 md:h-12 object-contain" />
            </a>
          </div>
          <ul className="hidden md:flex items-center gap-10 text-[13px] font-semibold text-ff-text/80">
            <li><a href="#about" className="hover:text-ff-primary rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ff-primary focus-visible:ring-offset-4 focus-visible:ring-offset-transparent transition-colors">About</a></li>
            <li><a href="#trainings" className="hover:text-ff-primary rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ff-primary focus-visible:ring-offset-4 focus-visible:ring-offset-transparent transition-colors">Trainings</a></li>
            <li><a href="#testimonials" className="hover:text-ff-primary rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ff-primary focus-visible:ring-offset-4 focus-visible:ring-offset-transparent transition-colors">Testimonials</a></li>
            <li><a href="#contacts" className="hover:text-ff-primary rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ff-primary focus-visible:ring-offset-4 focus-visible:ring-offset-transparent transition-colors">Contacts</a></li>
          </ul>
          <button 
            onClick={() => setShowLoginModal(true)} 
            disabled={loading}
            aria-busy={loading}
            className="border border-ff-primary text-ff-primary rounded-full px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest hover:bg-ff-primary hover:text-white transition-colors flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ff-primary focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" aria-hidden="true" /> : "LOGIN"}
          </button>
        </nav>

        {/* Hero Text */}
        <div className="text-center mb-8 flex flex-col items-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Achieve Your Fitness Goals</p>
          <h1 className="text-[13vw] lg:text-[180px] leading-[0.8] font-impact uppercase">
            FIND YOUR<br />STRENGTH
          </h1>
        </div>

        {/* Hero Image Block */}
        <div className="mb-24 md:mb-32">
          <div className="relative w-full aspect-[4/3] sm:aspect-[2/1] lg:aspect-[21/9] rounded-[2rem] lg:rounded-[3rem] overflow-hidden bg-zinc-300">
            {heroImages.map((src, idx) => (
              <img 
                key={src}
                src={src} 
                alt={`Fitness slide ${idx + 1}`} 
                className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
                  idx === currentSlide ? "opacity-100" : "opacity-0"
                }`} 
              />
            ))}
            {/* Slight dark gradient for readability */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent"></div>
            
            {/* Duplicated text for blend effect */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <h2 className="text-[13vw] lg:text-[180px] leading-[0.85] font-impact text-white/90 text-center uppercase mix-blend-overlay">
                INSIDE<br />AND OUT.
              </h2>
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <h2 className="text-[13vw] lg:text-[180px] leading-[0.85] font-impact text-white/50 text-center uppercase">
                INSIDE<br />AND OUT.
              </h2>
            </div>

            <div className="absolute bottom-6 left-6 lg:bottom-10 lg:left-10 max-w-sm">
              <p className="text-white/90 text-[11px] lg:text-sm font-medium leading-relaxed max-w-[280px]">
                We are dedicated to helping you achieve your fitness goals and improve your overall health and well-being.
              </p>
            </div>

            <div className="absolute bottom-6 right-6 lg:bottom-10 lg:right-10 flex items-center gap-3">
              <span className="text-white font-medium text-sm">3 min</span>
              <button aria-label="Play promotional video" className="bg-white rounded-full w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center hover:scale-105 transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ff-primary focus-visible:ring-offset-2">
                <Play aria-hidden="true" className="w-4 h-4 lg:w-5 lg:h-5 text-ff-primary fill-ff-primary ml-0.5" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Lower Section (Centered Column structure) */}
      <div className="max-w-[700px] mx-auto px-4 w-full pb-32">
        {/* Center Sparkle */}
        <div className="flex justify-center mb-10">
          <SparkleIcon className="w-10 h-10 lg:w-12 lg:h-12" />
        </div>

        {/* Info Content */}
        <div className="flex justify-center flex-col items-center mb-24">
          <h3 className="text-[2rem] lg:text-[2.5rem] font-impact tracking-wide text-center uppercase mb-5 leading-[1.05]">
            FITNESS SHOULD BE<br />ACCESSIBLE TO EVERYONE.
          </h3>
          <p className="text-sm text-center text-ff-text/70 max-w-md mb-8 leading-relaxed">
            Whether you're a seasoned athlete or just starting out, we have a variety of equipment and classes to suit your needs. Our cardio machines, weight lifting equipment, and functional training areas provide a comprehensive workout experience.
          </p>
          <button 
            onClick={() => setShowLoginModal(true)}
            disabled={loading}
            aria-busy={loading}
            className="border border-ff-primary text-ff-primary bg-transparent rounded-full px-8 py-3.5 text-[11px] font-bold uppercase tracking-widest hover:bg-ff-primary hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ff-primary focus-visible:ring-offset-4 focus-visible:ring-offset-transparent"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" aria-hidden="true" /> : "JOIN TODAY"}
          </button>
        </div>

        {/* Trainings */}
        <section className="mb-24">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-xl font-impact uppercase tracking-wider">TRAININGS</h4>
            <button aria-label="See all trainings" className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:opacity-70 group text-ff-primary rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ff-primary focus-visible:ring-offset-4 transition-colors">
              SEE ALL <span className="w-5 h-5 rounded-full bg-ff-primary text-white flex items-center justify-center group-hover:bg-ff-primary/80 transition-colors"><ArrowRight aria-hidden="true" className="w-3 h-3" /></span>
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {[
              { title: "PERSONAL TRAINING", img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop" },
              { title: "GROUP FITNESS CLASSES", img: "https://images.unsplash.com/photo-1548690312-e3b507d8c110?q=80&w=1471&auto=format&fit=crop" },
              { title: "FUNCTIONAL TRAINING", img: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1470&auto=format&fit=crop" }
            ].map((item, i) => (
              <a href={`#training-${i}`} key={i} className="group relative w-full h-[120px] lg:h-[130px] rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden cursor-pointer block focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ff-primary focus-visible:ring-offset-2">
                <img src={item.img} alt="" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/40 transition-colors"></div>
                <div className="absolute inset-0 flex items-center justify-between px-6 lg:px-8">
                  <span className="text-white font-impact text-xl lg:text-2xl uppercase tracking-wide">{item.title}</span>
                  <ArrowRight aria-hidden="true" className="text-white/60 w-5 h-5 lg:w-6 lg:h-6 group-hover:translate-x-1 group-hover:text-white transition-all" />
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* The Club */}
        <section aria-labelledby="the-club-heading">
          <h4 id="the-club-heading" className="text-xl font-impact uppercase tracking-wider mb-6">THE CLUB</h4>
          <ul className="flex flex-col">
            {['BASIC', 'PREMIUM', 'ELITE'].map((tier, i) => (
              <li key={tier} className="list-none w-full">
                <button 
                  aria-expanded="false" 
                  aria-controls={`tier-details-${tier.toLowerCase()}`}
                  aria-label={`Select ${tier} membership tier`}
                  className="w-full flex items-center justify-between py-6 lg:py-8 border-t-[1.5px] border-ff-primary/20 group cursor-pointer hover:bg-ff-primary/5 transition-colors -mx-4 px-4 rounded-xl focus-visible:outline-none focus-visible:bg-ff-primary/10 focus-visible:ring-2 focus-visible:ring-ff-primary focus-visible:ring-offset-4"
                >
                  <span className="text-[2.5rem] lg:text-[4rem] leading-none font-impact uppercase tracking-normal text-ff-primary">{tier}</span>
                  <div className="flex items-center gap-10 lg:gap-16">
                    <SparkleIcon aria-hidden="true" className="w-8 h-8 lg:w-10 lg:h-10 text-ff-primary/20 group-hover:text-ff-primary/40 transition-colors" />
                    <Plus aria-hidden="true" className="w-8 h-8 lg:w-10 lg:h-10 font-light stroke-1 text-ff-primary/40 group-hover:text-ff-primary transition-colors" />
                  </div>
                </button>
              </li>
            ))}
            <li role="presentation" className="border-t-[1.5px] border-ff-primary/20" aria-hidden="true"></li>
          </ul>
        </section>

      </div>

      {/* Login Modal */}
      {showLoginModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => !loading && setShowLoginModal(false)}>
          <div 
            className="bg-white rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">
                {isSignUp ? 'Create Account' : 'Sign In'}
              </h2>
              <button
                onClick={() => {
                  setShowLoginModal(false);
                  setError('');
                  setEmail('');
                  setPassword('');
                  setDisplayName('');
                }}
                disabled={loading}
                className="text-gray-500 hover:text-gray-700 disabled:opacity-50"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="p-6">
              {/* Error Message */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg" role="alert">
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Email/Password Form */}
              <form onSubmit={isSignUp ? handleEmailPasswordSignUp : handleEmailPasswordLogin} className="space-y-4 mb-6">
                {isSignUp && (
                  <div>
                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name
                    </label>
                    <input
                      id="displayName"
                      type="text"
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      disabled={loading}
                      placeholder="Enter your full name"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ff-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                  </div>
                )}
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    placeholder="Enter your email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ff-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      disabled={loading}
                      placeholder="Enter your password"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-ff-primary disabled:bg-gray-100 disabled:cursor-not-allowed"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={loading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 disabled:opacity-50"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {isSignUp && (
                    <p className="text-xs text-gray-500 mt-1">Minimum 6 characters</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-ff-primary text-white py-2.5 rounded-lg font-semibold uppercase tracking-wide hover:bg-ff-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading && <Loader2 size={16} className="animate-spin" />}
                  {isSignUp ? 'Create Account' : 'Sign In'}
                </button>
              </form>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-gray-200"></div>
                <span className="text-xs text-gray-500">OR</span>
                <div className="flex-1 h-px bg-gray-200"></div>
              </div>

              {/* Google Sign-In */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full border-2 border-gray-300 text-gray-700 py-2.5 rounded-lg font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Continue with Google
              </button>

              {/* Toggle Sign Up/Sign In */}
              <p className="text-center text-sm text-gray-600 mt-6">
                {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
                <button
                  type="button"
                  onClick={() => {
                    setIsSignUp(!isSignUp);
                    setError('');
                    setEmail('');
                    setPassword('');
                    setDisplayName('');
                  }}
                  disabled={loading}
                  className="text-ff-primary font-semibold hover:underline disabled:opacity-50"
                >
                  {isSignUp ? 'Sign In' : 'Sign Up'}
                </button>
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
