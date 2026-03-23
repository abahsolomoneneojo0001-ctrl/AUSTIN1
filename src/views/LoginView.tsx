import React, { useState, useEffect } from 'react';
import { Flame, Lock, Mail, ArrowRight, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { getAIClient } from '../lib/gemini';
import { signInWithGoogle } from '../lib/firebase';

export default function LoginView() {
  const [quote, setQuote] = useState('');
  const [loading, setLoading] = useState(false);
  const [quoteLoading, setQuoteLoading] = useState(true);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const ai = getAIClient();
        if (!ai) {
          throw new Error("AI client not available");
        }
        const response = await ai.models.generateContent({
          model: "gemini-3-flash-preview",
          contents: "Write a short, 1-2 sentence motivational message about the benefits of daily fitness. Make it punchy and different every time.",
        });
        setQuote(response.text || "Consistency is the key to unlocking your true potential. Keep pushing forward!");
      } catch (err) {
        setQuote("Consistency is the key to unlocking your true potential. Keep pushing forward!");
      } finally {
        setQuoteLoading(false);
      }
    };
    
    fetchQuote();
  }, []);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
      // If using popup, this will complete here.
      // If using redirect, the page will navigate away before this line.
    } catch (err: any) {
      console.error("Google sign-in error:", err);
      alert(`Failed to sign in with Google: ${err?.message || err}`);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-ff-bg flex flex-col md:flex-row">
      {/* Left Side - Branding & AI Quote */}
      <div className="flex-1 bg-gradient-to-br from-ff-surface to-black p-8 md:p-16 flex flex-col justify-between relative overflow-hidden">
        <div className="absolute inset-0 opacity-20 bg-[url('https://picsum.photos/seed/gym/1200/800')] bg-cover bg-center mix-blend-overlay" />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-12 h-12 rounded-xl bg-ff-primary flex items-center justify-center">
              <Flame className="w-6 h-6 text-black" />
            </div>
            <span className="text-3xl font-display tracking-wider text-ff-text">FITWITHAUSTIN</span>
          </div>
        </div>

        <div className="relative z-10 max-w-lg">
          <h2 className="text-4xl md:text-5xl font-display tracking-wide text-ff-text mb-6 leading-tight">
            YOUR DAILY DOSE OF <span className="text-ff-primary">GREATNESS.</span>
          </h2>
          
          <div className="bg-ff-surface/40 backdrop-blur-md border border-ff-text/10 p-6 rounded-2xl">
            <p className="text-sm text-ff-primary font-bold uppercase tracking-widest mb-3 flex items-center gap-2">
              <Flame className="w-4 h-4" /> AI Coach Says
            </p>
            {quoteLoading ? (
              <div className="flex items-center gap-3 text-ff-text/60">
                <Loader2 className="w-5 h-5 animate-spin" />
                <p>Generating your daily motivation...</p>
              </div>
            ) : (
              <p className="text-lg text-ff-text leading-relaxed font-medium">"{quote}"</p>
            )}
          </div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 p-8 md:p-16 flex flex-col justify-center bg-ff-bg relative">
        <div className="max-w-md w-full mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-display tracking-wide text-ff-text mb-2">Welcome Back</h1>
            <p className="text-ff-muted">Sign in to access your dashboard.</p>
          </div>

          <button 
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full py-4 bg-ff-surface text-ff-text border border-ff-text/10 font-bold rounded-xl hover:bg-ff-surface/80 transition-colors flex items-center justify-center gap-3 disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
              <>
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
