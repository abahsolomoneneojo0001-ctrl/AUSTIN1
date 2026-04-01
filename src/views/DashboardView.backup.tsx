import React, { useState, useEffect } from 'react';
import { Flame, Target, Zap, ChevronRight, Activity, Trophy, CheckCircle2, Calendar, ChevronDown, ChevronUp, Dumbbell, Utensils, Loader2, Sparkles } from 'lucide-react';
import { cn, calculateStrictStreak } from '../lib/utils';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import Markdown from 'react-markdown';

export default function DashboardView({ onNavigate, userName = "Jacob", userId }: { onNavigate: (tab: any) => void, userName?: string, userId?: string }) {
  const [streak, setStreak] = useState<number | null>(null);
  const [stats, setStats] = useState<any>({ totalWorkouts: 0, totalMinutes: 0, caloriesBurned: 0 });
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLogging, setIsLogging] = useState(false);

  // AI Plan State
  const [aiPlan, setAiPlan] = useState<string | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  // History State
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    // Listen to user stats and profile
    const userUnsub = onSnapshot(doc(db, 'users', userId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile(data);
        if (data.stats) {
          setStats(data.stats);
        }
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${userId}`));

    // Listen to workouts
    const qWorkouts = query(collection(db, 'workouts'), where('userId', '==', userId));
    const workoutsUnsub = onSnapshot(qWorkouts, (snapshot) => {
      const logs = snapshot.docs
        .map(doc => {
          const dateVal = doc.data().date;
          if (typeof dateVal === 'string') return dateVal;
          if (dateVal?.toDate && typeof dateVal.toDate === 'function') {
            return format(dateVal.toDate(), 'yyyy-MM-dd');
          }
          return '';
        })
        .filter(Boolean);

      setStreak(calculateStrictStreak(logs));

      const normalizeTimestamp = (ts: any) => {
        if (!ts) return Date.now();
        if (typeof ts.toMillis === 'function') return ts.toMillis();
        if (typeof ts.toDate === 'function') return ts.toDate().getTime();
        if (typeof ts === 'number') return ts;
        return Date.now();
      };

      const workoutDocs = snapshot.docs.map(doc => {
        const data = doc.data();
        const title = typeof data.title === 'string' ? data.title : 'Workout';
        const date = typeof data.date === 'string' ? data.date : '';
        const duration = typeof data.duration === 'string' ? data.duration : '';
        const calories = typeof data.calories === 'number' ? data.calories : 0;

        return {
          id: doc.id,
          type: 'workout',
          title,
          date,
          details: `${duration} • ${calories} kcal`,
          timestamp: normalizeTimestamp(data.timestamp)
        };
      });
      
      setActivities(prev => {
        const nonWorkouts = prev.filter(a => a.type !== 'workout');
        return [...nonWorkouts, ...workoutDocs].sort((a, b) => b.timestamp - a.timestamp);
      });
    }, (error) => {
      console.warn('Could not fetch workouts:', error);
    });

    // Listen to meals
    const qMeals = query(collection(db, 'meals'), where('userId', '==', userId));
    const mealsUnsub = onSnapshot(qMeals, (snapshot) => {
      const normalizeTimestamp = (ts: any) => {
        if (!ts) return Date.now();
        if (typeof ts.toMillis === 'function') return ts.toMillis();
        if (typeof ts.toDate === 'function') return ts.toDate().getTime();
        if (typeof ts === 'number') return ts;
        return Date.now();
      };

      const mealDocs = snapshot.docs.map(doc => {
        const data = doc.data();
        const name = typeof data.name === 'string' ? data.name : '';
        const type = typeof data.type === 'string' ? data.type : '';
        const date = typeof data.date === 'string' ? data.date : '';
        const calories = typeof data.calories === 'number' ? data.calories : 0;
        const protein = typeof data.protein === 'number' ? data.protein : 0;

        return {
          id: doc.id,
          type: 'meal',
          title: name || type,
          date,
          details: `${calories} kcal • ${protein}g P`,
          timestamp: normalizeTimestamp(data.timestamp)
        };
      });

      setActivities(prev => {
        const nonMeals = prev.filter(a => a.type !== 'meal');
        return [...nonMeals, ...mealDocs].sort((a, b) => b.timestamp - a.timestamp);
      });
    }, (error) => {
      // Ignore if meals collection doesn't exist or permission denied for now
      console.warn("Could not fetch meals:", error);
    });

    return () => {
      userUnsub();
      workoutsUnsub();
      mealsUnsub();
    };
  }, [userId]);

  const handleLogWorkout = async () => {
    if (!userId) return;
    setIsLogging(true);
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      
      // Add workout log
      await addDoc(collection(db, 'workouts'), {
        userId,
        title: 'Quick Workout',
        date: todayStr,
        duration: '45 Min',
        calories: 350,
        timestamp: serverTimestamp()
      });

      // Update user stats
      await updateDoc(doc(db, 'users', userId), {
        'stats.totalWorkouts': increment(1),
        'stats.totalMinutes': increment(45),
        'stats.caloriesBurned': increment(350)
      });
      
      alert('Workout logged! Streak updated.');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'workouts');
    }
    setIsLogging(false);
  };

  const generateAIPlan = async () => {
    setIsGeneratingPlan(true);
    try {
      const ai = getAIClient();
      if (!ai) throw new Error("AI client not initialized.");

      const recentWorkouts = activities.filter(a => a.type === 'workout').slice(0, 5);
      const workoutContext = recentWorkouts.length > 0 
        ? `Recent workouts: ${recentWorkouts.map(w => w.title).join(', ')}.`
        : "No recent workouts logged.";

      let profileContext = '';
      if (userProfile) {
        const { personalDetails, fitnessGoals, experienceLevel, dietaryRestrictions } = userProfile;
        if (personalDetails) {
          profileContext += `\nAge: ${personalDetails.age || 'N/A'}, Weight: ${personalDetails.weight || 'N/A'}kg, Height: ${personalDetails.height || 'N/A'}cm, Gender: ${personalDetails.gender || 'N/A'}.`;
        }
        if (fitnessGoals) profileContext += `\nFitness Goals: ${fitnessGoals}.`;
        if (experienceLevel) profileContext += `\nExperience Level: ${experienceLevel}.`;
        if (dietaryRestrictions) profileContext += `\nDietary Restrictions: ${dietaryRestrictions}.`;
      }

      const prompt = `You are an expert AI fitness coach. Generate a personalized 7-day workout plan for ${userName}. 
      ${profileContext}
      ${workoutContext}
      Consider their current activity level, goals, and any dietary restrictions to provide a balanced routine including strength, cardio, and active recovery.
      Format the response in clean Markdown.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
      });

      setAiPlan(response.text || "Could not generate plan.");
    } catch (error) {
      console.error("Failed to generate AI plan:", error);
      alert("Failed to generate AI plan. Please try again.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const filteredActivities = activities.filter(activity => {
    if (!startDate && !endDate) return true;
    const activityDate = parseISO(activity.date);
    const start = startDate ? startOfDay(parseISO(startDate)) : new Date(0);
    const end = endDate ? endOfDay(parseISO(endDate)) : new Date(8640000000000000);
    return isWithinInterval(activityDate, { start, end });
  });

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-[20px] bg-ff-surface border-2 border-ff-primary p-6 md:p-8">
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-ff-primary/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col items-start md:items-center justify-between gap-6 md:flex-row">
          <div className="w-full">
            <p className="text-ff-muted font-bold mb-1">Good morning,</p>
            <h2 className="text-4xl font-display tracking-wide text-ff-text mb-4">READY TO CRUSH IT,<br/><span className="text-ff-primary">{userName.toUpperCase()}?</span></h2>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
              <button onClick={() => onNavigate('workouts')} className="px-6 py-3 bg-ff-primary text-white font-bold rounded-full hover:bg-ff-primary/80 transition-colors">
                START WORKOUT
              </button>
              <button 
                onClick={handleLogWorkout} 
                disabled={isLogging}
                className="px-6 py-3 bg-ff-surface text-ff-text font-bold rounded-full hover:bg-ff-surface/80 transition-colors border border-ff-surface flex items-center gap-2 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" />
                {isLogging ? 'Logging...' : 'Log Workout (Test Streak)'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Workouts', value: stats.totalWorkouts || 0, icon: Activity, color: 'text-ff-primary', bg: 'bg-ff-primary' },
          { label: 'Minutes', value: stats.totalMinutes || 0, icon: Zap, color: 'text-ff-secondary', bg: 'bg-ff-secondary' },
          { label: 'Calories', value: stats.caloriesBurned || 0, icon: Target, color: 'text-ff-tertiary', bg: 'bg-ff-tertiary' },
          { label: 'Streak', value: streak || 0, icon: Trophy, color: 'text-ff-primary', bg: 'bg-ff-primary' },
        ].map((stat, i) => (
          <div key={i} className="p-5 rounded-[20px] bg-ff-surface border-2 border-ff-primary flex flex-col gap-3">
            <div className="flex items-center gap-2">
              <div className={cn("w-3 h-3 rounded-sm", stat.bg, stat.color.replace('text-', 'text-white'))} />
              <p className="text-2xl font-mono font-bold text-ff-text stat-number">{stat.value}</p>
            </div>
            <p className="text-sm text-ff-muted font-bold">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Streak Tracker */}
      <div className="p-6 rounded-[20px] bg-ff-surface cursor-pointer hover:border-ff-secondary border-2 border-ff-primary transition-colors" onClick={() => onNavigate('progress')}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <Flame className={cn("w-6 h-6", streak && streak > 0 ? "text-ff-secondary" : "text-ff-muted")} />
            <h3 className="text-xl font-display tracking-wide text-ff-text">
              {streak !== null ? `${streak} DAY STREAK` : 'LOADING STREAK...'}
            </h3>
          </div>
          <ChevronRight className="w-5 h-5 text-ff-muted" />
        </div>
        <p className="text-sm text-ff-muted">Click to view detailed progress and connect health apps.</p>
      </div>

      {/* AI Workout Plan Section */}
      <div className="p-6 rounded-[20px] bg-ff-surface border-2 border-ff-primary">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-ff-tertiary" />
            <h3 className="text-xl font-display tracking-wide text-ff-text">AI WORKOUT PLAN</h3>
          </div>
          <button
            onClick={generateAIPlan}
            disabled={isGeneratingPlan}
            className="px-4 py-2 bg-ff-primary text-white font-bold rounded-full hover:bg-ff-tertiary transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isGeneratingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {isGeneratingPlan ? 'Generating...' : 'Generate Plan'}
          </button>
        </div>
        
        {aiPlan ? (
          <div className="prose max-w-none prose-p:leading-relaxed prose-a:text-ff-primary bg-ff-bg p-6 rounded-xl border-2 border-ff-primary text-ff-text">
            <Markdown>{aiPlan}</Markdown>
          </div>
        ) : (
          <div className="text-center p-8 bg-ff-bg rounded-xl border-2 border-ff-primary">
            <p className="text-ff-muted">Click "Generate Plan" to get a personalized 7-day workout routine based on your goals and recent activity.</p>
          </div>
        )}
      </div>

      {/* Activity History Section */}
      <div className="rounded-[20px] bg-ff-surface border-2 border-ff-primary overflow-hidden">
        <button 
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          className="w-full p-6 flex items-center justify-between hover:bg-ff-surface/80 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Calendar className="w-6 h-6 text-ff-quaternary" />
            <h3 className="text-xl font-display tracking-wide text-ff-text">ACTIVITY HISTORY</h3>
          </div>
          {isHistoryOpen ? <ChevronUp className="w-5 h-5 text-ff-muted" /> : <ChevronDown className="w-5 h-5 text-ff-muted" />}
        </button>
        
        {isHistoryOpen && (
          <div className="p-6 pt-0 border-t border-ff-surface">
            <div className="flex flex-col sm:flex-row gap-4 mb-6 mt-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ff-muted font-bold uppercase">Start Date</label>
                <input 
                  type="date" 
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-ff-bg border-2 border-ff-primary rounded-lg px-3 py-2 text-ff-text focus:outline-none focus:border-ff-secondary"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-ff-muted font-bold uppercase">End Date</label>
                <input 
                  type="date" 
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="bg-ff-bg border-2 border-ff-primary rounded-lg px-3 py-2 text-ff-text focus:outline-none focus:border-ff-secondary"
                />
              </div>
              <div className="flex items-end pb-1">
                {(startDate || endDate) && (
                  <button 
                    onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="text-xs text-ff-muted hover:text-ff-text underline"
                  >
                    Clear Filters
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
              {filteredActivities.length > 0 ? (
                filteredActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-4 bg-ff-surface rounded-xl border-2 border-ff-empty">
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white",
                        activity.type === 'workout' ? "bg-ff-primary" : "bg-ff-secondary"
                      )}>
                        {activity.type === 'workout' ? <Dumbbell className="w-5 h-5" /> : <Utensils className="w-5 h-5" />}
                      </div>
                      <div>
                        <h4 className="font-bold text-ff-text">{activity.title}</h4>
                        <p className="text-xs text-ff-muted">{activity.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-mono font-bold text-ff-text">{activity.details}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center p-8 text-ff-muted">
                  No activities found for this date range.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Today's Plan */}
        <div className="space-y-4">
          <h3 className="text-xl font-display tracking-wide text-ff-text">TODAY'S PLAN</h3>
          
          <div className="group relative overflow-hidden rounded-[20px] bg-ff-surface border-2 border-ff-primary hover:border-ff-secondary transition-all cursor-pointer">
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 to-transparent z-10" />
            <img 
              src="https://picsum.photos/seed/workout1/800/400" 
              alt="Upper Body Strength" 
              referrerPolicy="no-referrer"
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
              <div className="flex items-center gap-2 mb-2">
                <span className="px-2.5 py-1 rounded-full bg-ff-secondary text-white text-xs font-bold tracking-wide uppercase">Strength</span>
                <span className="text-ff-text text-sm font-bold">Upper Body Strength · 45 min</span>
              </div>
              <div className="flex flex-wrap items-center gap-3 mt-4">
                <button className="px-4 py-2 bg-ff-primary text-white font-bold rounded-full text-sm">START NOW</button>
                <button className="px-4 py-2 bg-ff-surface text-ff-text font-bold rounded-full text-sm hover:bg-ff-surface/80 transition-colors">Preview</button>
                <button className="px-4 py-2 bg-ff-surface text-ff-text font-bold rounded-full text-sm hover:bg-ff-surface/80 transition-colors">Swap</button>
              </div>
            </div>
          </div>
        </div>

        {/* AI Coach Says */}
        <div className="space-y-4">
          <h3 className="text-xl font-display tracking-wide text-ff-text">AI COACH SAYS</h3>
          <div className="p-6 rounded-[20px] bg-ff-surface border border-ff-quaternary/30 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-ff-quaternary" />
            <p className="text-ff-text font-medium leading-relaxed">
              "Your recovery looks great. Perfect day to push!"
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
