import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Dumbbell, 
  Apple, 
  LineChart, 
  BotMessageSquare,
  User,
  Settings,
  Bell,
  Users,
  Crown,
  LogOut,
  Sparkles,
  Loader2,
  Sun,
  Moon
} from 'lucide-react';
import { cn } from '../lib/utils';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import DashboardView from '../views/DashboardView';
import WorkoutsView from '../views/WorkoutsView';
import NutritionView from '../views/NutritionView';
import ProgressView from '../views/ProgressView';
import AICoachView from '../views/AICoachView';
import CoachAustinView from '../views/CoachAustinView';
import AIHubView from '../views/AIHubView';
import ProfileSetupView from '../views/ProfileSetupView';

type Tab = 'dashboard' | 'workouts' | 'nutrition' | 'progress' | 'coaches' | 'coach' | 'ai-hub' | 'premium' | 'profile';

export default function AppLayout({ onLogout, userName, userId }: { onLogout: () => void, userName: string, userId?: string }) {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [isProfileChecked, setIsProfileChecked] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved === 'light' || saved === 'dark') return saved;
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'light') {
      root.classList.add('light');
    } else {
      root.classList.remove('light');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  useEffect(() => {
    const checkProfile = async () => {
      console.log('Checking profile for userId:', userId);
      if (!userId) {
        console.log('No userId, setting isProfileChecked to true');
        setIsProfileChecked(true);
        return;
      }
      try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        console.log('Profile doc exists:', docSnap.exists());
        if (docSnap.exists()) {
          const data = docSnap.data();
          console.log('Profile data:', data);
          // If personalDetails is missing, redirect to profile setup
          if (!data.personalDetails || !data.personalDetails.age) {
            console.log('Redirecting to profile setup');
            setActiveTab('profile');
          } else {
            console.log('Profile complete, staying on dashboard');
          }
        } else {
          console.log('No profile doc, redirecting to profile setup');
          setActiveTab('profile');
        }
      } catch (error) {
        console.log('Error checking profile:', error);
        handleFirestoreError(error, OperationType.GET, `users/${userId}`);
      } finally {
        setIsProfileChecked(true);
      }
    };

    checkProfile();
  }, [userId]);

  const tabs = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'workouts', label: 'Workouts', icon: Dumbbell },
    { id: 'nutrition', label: 'Nutrition', icon: Apple },
    { id: 'progress', label: 'Progress', icon: LineChart },
    { id: 'coaches', label: '1-on-1 Coaching', icon: Users },
    { id: 'ai-hub', label: 'AI Innovation Hub', icon: Sparkles },
  ] as const;

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardView onNavigate={setActiveTab} userName={userName} userId={userId} />;
      case 'workouts': return <WorkoutsView />;
      case 'nutrition': return <NutritionView />;
      case 'progress': return <ProgressView />;
      case 'coaches': return <CoachAustinView />;
      case 'ai-hub': return <AIHubView />;
      case 'profile': return <ProfileSetupView onComplete={() => setActiveTab('dashboard')} />;
      default: return <DashboardView onNavigate={setActiveTab} userName={userName} userId={userId} />;
    }
  };

  if (!isProfileChecked) {
    console.log('AppLayout: showing profile check loading spinner');
    return (
      <div className="flex items-center justify-center min-h-[100dvh] w-full bg-ff-bg">
        <Loader2 className="w-8 h-8 animate-spin text-ff-primary" />
      </div>
    );
  }

  console.log('AppLayout: rendering main layout, activeTab:', activeTab);
  return (
    <div className="flex min-h-[100dvh] w-full bg-ff-bg text-ff-text overflow-hidden font-sans">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col w-64 border-r border-ff-surface bg-ff-bg">
        <div className="px-4 pt-6 pb-2 flex items-center gap-3 cursor-pointer" onClick={() => setActiveTab('dashboard')}>
          <img src="/logo.jpeg" alt="Austin Fitness" className="h-[40px] md:h-[50px] object-contain drop-shadow-md" />
        </div>
        
        <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 rounded-[20px] transition-all duration-200 font-bold",
                  isActive 
                    ? "bg-ff-surface text-ff-primary" 
                    : "text-ff-muted hover:text-ff-text hover:bg-ff-surface"
                )}
              >
                <Icon className={cn("w-5 h-5", isActive ? "text-ff-primary" : "text-ff-muted")} />
                {tab.label}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-ff-surface space-y-2">
          <button 
            onClick={() => setActiveTab('premium')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-[20px] font-bold transition-all",
              activeTab === 'premium' ? "bg-ff-surface text-ff-primary" : "text-ff-primary hover:bg-ff-surface"
            )}
          >
            <Crown className="w-5 h-5" />
            Premium
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-[20px] font-bold transition-all",
              activeTab === 'profile' ? "bg-ff-surface text-ff-primary" : "text-ff-muted hover:text-ff-text hover:bg-ff-surface"
            )}
          >
            <User className="w-5 h-5" />
            Profile
          </button>
          <button 
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-[20px] font-bold text-red-500 hover:bg-red-500/10 transition-all"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-h-0 relative overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden flex items-center justify-between p-4 border-b border-ff-surface bg-ff-bg z-10">
          <button onClick={() => setActiveTab('dashboard')} className="outline-none pt-1">
            <img src="/logo.jpeg" alt="Austin Fitness" className="h-8 object-contain drop-shadow-md" />
          </button>
          <div className="flex items-center gap-3">
            <button 
              onClick={toggleTheme}
              className="p-2 text-ff-muted hover:text-ff-text rounded-full bg-ff-surface transition-colors"
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <button className="p-2 text-ff-muted hover:text-ff-text rounded-full bg-ff-surface">
              <Bell className="w-5 h-5" />
            </button>
            <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-500/10 rounded-full bg-ff-surface">
              <LogOut className="w-5 h-5" />
            </button>
            <button onClick={() => setActiveTab('profile')} className="w-8 h-8 rounded-full bg-ff-surface flex items-center justify-center overflow-hidden border border-ff-surface">
              <div className="w-full h-full bg-gradient-to-br from-ff-primary to-ff-quaternary flex items-center justify-center text-white font-bold text-xs">
                {userName.substring(0, 2).toUpperCase()}
              </div>
            </button>
          </div>
        </header>

        {/* Desktop Header */}
        <header className="hidden md:flex items-center justify-between px-8 py-4 border-b border-ff-surface bg-ff-bg z-10">
          <h1 className="text-3xl font-display tracking-wide text-ff-text uppercase">
            {activeTab}
          </h1>
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleTheme}
              className="p-2 text-ff-muted hover:text-ff-text rounded-full bg-ff-surface transition-colors"
              title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
            </button>
            <button className="p-2 text-ff-muted hover:text-ff-text rounded-full bg-ff-surface transition-colors">
              <Bell className="w-5 h-5" />
            </button>
            <button onClick={() => setActiveTab('profile')} className="flex items-center gap-3 pl-2 pr-4 py-1.5 rounded-full bg-ff-surface hover:bg-ff-surface/80 border border-ff-surface transition-colors">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-ff-primary to-ff-quaternary flex items-center justify-center text-white font-bold text-sm">
                {userName.substring(0, 2).toUpperCase()}
              </div>
              <span className="text-sm font-bold text-ff-text">{userName}</span>
            </button>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0">
          <div className="p-4 md:p-8 max-w-7xl mx-auto w-full">
            {renderContent()}
          </div>
        </div>

        {/* Mobile Bottom Nav */}
        <nav className="md:hidden absolute bottom-0 left-0 right-0 bg-ff-surface border-t border-ff-surface pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-2 px-2 z-50 overflow-x-auto scrollbar-none">
          <div className="flex justify-between items-center min-w-max px-2 gap-2">
            {[...tabs, { id: 'profile', label: 'Profile', icon: User }].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as Tab)}
                  className={cn(
                    "flex flex-col items-center justify-center w-16 h-14 gap-1 rounded-[16px] transition-all",
                    isActive ? "text-ff-primary" : "text-ff-muted hover:text-ff-text"
                  )}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-bold">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>
      </main>
    </div>
  );
}
