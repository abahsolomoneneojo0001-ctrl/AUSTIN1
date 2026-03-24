import React, { useState, useEffect } from 'react';
import { Play, ArrowRight, Plus, Loader2 } from 'lucide-react';
import { signInWithGoogle } from '../lib/firebase';

const SparkleIcon = ({ className = "w-8 h-8" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M12 0C12 0 12 12 24 12C12 12 12 24 12 24C12 24 12 12 0 12C12 12 12 0 12 0Z" />
  </svg>
);

export default function LoginView() {
  const [loading, setLoading] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);

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

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      alert(`Failed to sign in with Google: ${err?.message || err}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[#F4F8FB] text-[#0A1629] font-sans selection:bg-[#00B4D8] selection:text-white">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 pt-6">
        
        {/* Navbar */}
        <nav className="flex items-center justify-between mb-20 lg:mb-28">
          <div className="flex items-center gap-2">
            <img src="/logo.jpeg" alt="AUSTIN FITNESS Logo" className="h-10 md:h-12 object-contain mix-blend-multiply" />
          </div>
          <div className="hidden md:flex items-center gap-10 text-[13px] font-semibold text-[#0A1629]/80">
            <a href="#" className="hover:text-[#00B4D8] transition-colors">About</a>
            <a href="#" className="hover:text-[#00B4D8] transition-colors">Trainings</a>
            <a href="#" className="hover:text-[#00B4D8] transition-colors">Testimonials</a>
            <a href="#" className="hover:text-[#00B4D8] transition-colors">Contacts</a>
          </div>
          <button 
            onClick={handleGoogleLogin} 
            disabled={loading}
            className="rounded-full px-6 py-2.5 text-[11px] font-bold uppercase tracking-widest text-[#0A1629] border-2 border-[#0A1629] hover:bg-gradient-to-r hover:from-[#00B4D8] hover:to-[#88D44A] hover:text-white hover:border-transparent transition-all flex items-center gap-2 shadow-[0_0_0_0_rgba(0,180,216,0)] hover:shadow-[0_4px_15px_rgba(0,180,216,0.3)]"
          >
            {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "JOIN TODAY"}
          </button>
        </nav>

        {/* Hero Text */}
        <div className="text-center mb-8 flex flex-col items-center">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] mb-4 text-[#0A1629]/70">Achieve Your Fitness Goals</p>
          <h1 className="text-[13vw] lg:text-[180px] leading-[0.85] font-impact uppercase flex flex-col items-center drop-shadow-sm">
            <span>FIND YOUR</span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B4D8] to-[#88D44A] mt-2 pb-4">STRENGTH</span>
          </h1>
        </div>

        {/* Hero Image Block */}
        <div className="mb-24 md:mb-32">
          <div className="relative w-full aspect-[4/3] sm:aspect-[2/1] lg:aspect-[21/9] rounded-[2rem] lg:rounded-[3rem] overflow-hidden bg-[#E2E8F0] shadow-2xl shadow-[#0A1629]/10">
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
            <div className="absolute inset-0 bg-gradient-to-t from-[#0A1629]/60 via-[#0A1629]/10 to-transparent"></div>
            
            {/* Duplicated text for blend effect */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <h2 className="text-[13vw] lg:text-[180px] leading-[0.85] font-impact text-white/90 text-center uppercase mix-blend-overlay">
                INSIDE<br />AND OUT.
              </h2>
            </div>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <h2 className="text-[13vw] lg:text-[180px] leading-[0.85] font-impact text-white/40 text-center uppercase drop-shadow-md">
                INSIDE<br />AND OUT.
              </h2>
            </div>

            <div className="absolute bottom-6 left-6 lg:bottom-10 lg:left-10 max-w-sm">
              <p className="text-white/90 text-[11px] lg:text-sm font-medium leading-relaxed max-w-[280px]">
                We are dedicated to helping you achieve your fitness goals and improve your overall health and well-being.
              </p>
            </div>

            <div className="absolute bottom-6 right-6 lg:bottom-10 lg:right-10 flex items-center gap-3">
              <span className="text-white font-medium text-sm drop-shadow-md">3 min</span>
              <button className="bg-white rounded-full w-10 h-10 lg:w-12 lg:h-12 flex items-center justify-center hover:scale-105 transition-transform hover:shadow-[0_0_20px_rgba(0,180,216,0.4)]">
                <Play className="w-4 h-4 lg:w-5 lg:h-5 text-[#0A1629] fill-[#0A1629] ml-0.5" />
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Lower Section (Centered Column structure) */}
      <div className="max-w-[700px] mx-auto px-4 w-full pb-32">
        {/* Center Sparkle */}
        <div className="flex justify-center mb-10">
          <SparkleIcon className="w-10 h-10 lg:w-12 lg:h-12 text-[#00B4D8]" />
        </div>

        {/* Info Content */}
        <div className="flex justify-center flex-col items-center mb-24">
          <h3 className="text-[2rem] lg:text-[2.5rem] font-impact tracking-wide text-center uppercase mb-5 leading-[1.05]">
            FITNESS SHOULD BE<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00B4D8] to-[#88D44A]">ACCESSIBLE TO EVERYONE.</span>
          </h3>
          <p className="text-sm text-center text-[#0A1629]/70 max-w-md mb-8 leading-relaxed font-medium">
            Whether you're a seasoned athlete or just starting out, we have a variety of equipment and classes to suit your needs. Our cardio machines, weight lifting equipment, and functional training areas provide a comprehensive workout experience.
          </p>
          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="rounded-full px-8 py-3.5 text-[11px] font-bold uppercase tracking-widest text-white shadow-xl shadow-[#00B4D8]/20 bg-[#0A1629] hover:bg-gradient-to-r hover:from-[#00B4D8] hover:to-[#88D44A] transition-all transform hover:-translate-y-1"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "JOIN TODAY"}
          </button>
        </div>

        {/* Trainings */}
        <section className="mb-24">
          <div className="flex items-center justify-between mb-8">
            <h4 className="text-xl font-impact uppercase tracking-wider text-[#0A1629]">TRAININGS</h4>
            <button className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest hover:text-[#00B4D8] group transition-colors">
              SEE ALL <span className="w-5 h-5 rounded-full bg-[#0A1629] text-white flex items-center justify-center group-hover:bg-gradient-to-r group-hover:from-[#00B4D8] group-hover:to-[#88D44A] transition-all shadow-md"><ArrowRight className="w-3 h-3" /></span>
            </button>
          </div>

          <div className="flex flex-col gap-4">
            {[
              { title: "PERSONAL TRAINING", img: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop" },
              { title: "GROUP FITNESS CLASSES", img: "https://images.unsplash.com/photo-1548690312-e3b507d8c110?q=80&w=1471&auto=format&fit=crop" },
              { title: "FUNCTIONAL TRAINING", img: "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?q=80&w=1470&auto=format&fit=crop" }
            ].map((item, i) => (
              <div key={i} className="group relative w-full h-[120px] lg:h-[130px] rounded-[1.5rem] lg:rounded-[2rem] overflow-hidden cursor-pointer shadow-lg">
                <img src={item.img} alt={item.title} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-[#0A1629]/40 group-hover:bg-[#0A1629]/50 transition-colors"></div>
                <div className="absolute inset-0 flex items-center justify-between px-6 lg:px-8">
                  <span className="text-white font-impact text-xl lg:text-2xl uppercase tracking-wide drop-shadow-lg">{item.title}</span>
                  <ArrowRight className="text-[#88D44A] w-5 h-5 lg:w-6 lg:h-6 group-hover:translate-x-2 group-hover:text-white transition-all drop-shadow-md" />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* The Club */}
        <section>
          <h4 className="text-xl font-impact uppercase tracking-wider mb-6 text-[#0A1629]">THE CLUB</h4>
          <div className="flex flex-col border-t-2 border-[#0A1629]/10">
            {['BASIC', 'PREMIUM', 'ELITE'].map((tier, i) => (
              <div key={tier} className="flex items-center justify-between py-6 lg:py-8 border-b-2 border-[#0A1629]/10 group cursor-pointer hover:bg-white transition-colors -mx-4 px-4 rounded-xl hover:shadow-sm">
                <span className="text-[2.5rem] lg:text-[4rem] leading-none font-impact uppercase tracking-normal text-[#0A1629]/80 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-[#00B4D8] group-hover:to-[#88D44A] transition-all">{tier}</span>
                <div className="flex items-center gap-10 lg:gap-16">
                  <SparkleIcon className="w-8 h-8 lg:w-10 lg:h-10 text-[#00B4D8]/0 group-hover:text-[#00B4D8]/80 transition-colors transform group-hover:scale-110" />
                  <Plus className="w-8 h-8 lg:w-10 lg:h-10 font-light stroke-1 text-[#0A1629]/30 group-hover:text-[#88D44A] transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </div>
  );
}
