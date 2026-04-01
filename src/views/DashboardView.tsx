import React, { useState, useEffect } from 'react';
import { Flame, Target, Zap, ChevronRight, Activity, Trophy, CheckCircle2, Calendar, ChevronDown, ChevronUp, Dumbbell, Utensils, Loader2, Sparkles } from 'lucide-react';
import { cn, calculateStrictStreak } from '../lib/utils';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { format, isWithinInterval, parseISO, startOfDay, endOfDay } from 'date-fns';
import { askFitnessCoach } from '../lib/gemini';
import Markdown from 'react-markdown';

export default function DashboardView({ onNavigate, userName = "Jacob", userId }: { onNavigate: (tab: any) => void, userName?: string, userId?: string }) {
  const [streak, setStreak] = useState<number | null>(null);
  const [stats, setStats] = useState<any>({ totalWorkouts: 0, totalMinutes: 0, caloriesBurned: 0 });
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isLogging, setIsLogging] = useState(false);

  const [aiPlan, setAiPlan] = useState<string | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [activities, setActivities] = useState<any[]>([]);

  useEffect(() => {
    if (!userId) return;

    const userUnsub = onSnapshot(doc(db, 'users', userId), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setUserProfile(data);
        if (data.stats) setStats(data.stats);
      }
    }, (error) => handleFirestoreError(error, OperationType.GET, `users/${userId}`));

    const qWorkouts = query(collection(db, 'workouts'), where('userId', '==', userId));
    const workoutsUnsub = onSnapshot(qWorkouts, (snapshot) => {
      const logs = snapshot.docs
        .map(doc => {
          const dateVal = doc.data().date;
          if (typeof dateVal === 'string') return dateVal;
          if (dateVal?.toDate && typeof dateVal.toDate === 'function') return format(dateVal.toDate(), 'yyyy-MM-dd');
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
        return {
          id: doc.id,
          type: 'workout',
          title: typeof data.title === 'string' ? data.title : 'Workout',
          date: typeof data.date === 'string' ? data.date : '',
          details: `${data.duration || ''} • ${data.calories || 0} kcal`,
          timestamp: normalizeTimestamp(data.timestamp)
        };
      });

      setActivities(prev => {
        const nonWorkouts = prev.filter(a => a.type !== 'workout');
        return [...nonWorkouts, ...workoutDocs].sort((a, b) => b.timestamp - a.timestamp);
      });
    }, (error) => console.warn('Could not fetch workouts:', error));

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
        return {
          id: doc.id,
          type: 'meal',
          title: data.name || data.type || 'Meal',
          date: typeof data.date === 'string' ? data.date : '',
          details: `${data.calories || 0} kcal • ${data.protein || 0}g P`,
          timestamp: normalizeTimestamp(data.timestamp)
        };
      });

      setActivities(prev => {
        const nonMeals = prev.filter(a => a.type !== 'meal');
        return [...nonMeals, ...mealDocs].sort((a, b) => b.timestamp - a.timestamp);
      });
    }, (error) => console.warn("Could not fetch meals:", error));

    return () => { userUnsub(); workoutsUnsub(); mealsUnsub(); };
  }, [userId]);

  const handleLogWorkout = async () => {
    if (!userId) return;
    setIsLogging(true);
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      await addDoc(collection(db, 'workouts'), {
        userId,
        title: 'Quick Workout',
        date: todayStr,
        duration: '45 Min',
        calories: 350,
        timestamp: serverTimestamp()
      });
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
      const recentWorkouts = activities.filter(a => a.type === 'workout').slice(0, 5);
      const workoutContext = recentWorkouts.length > 0
        ? `Recent workouts: ${recentWorkouts.map(w => w.title).join(', ')}.`
        : "No recent workouts logged.";

      let profileContext = '';
      if (userProfile) {
        const { personalDetails, fitnessGoals, experienceLevel, dietaryRestrictions } = userProfile;
        if (personalDetails) profileContext += `\nAge: ${personalDetails.age || 'N/A'}, Weight: ${personalDetails.weight || 'N/A'}kg, Height: ${personalDetails.height || 'N/A'}cm, Gender: ${personalDetails.gender || 'N/A'}.`;
        if (fitnessGoals) profileContext += `\nFitness Goals: ${fitnessGoals}.`;
        if (experienceLevel) profileContext += `\nExperience Level: ${experienceLevel}.`;
        if (dietaryRestrictions) profileContext += `\nDietary Restrictions: ${dietaryRestrictions}.`;
      }

      const prompt = `Generate a personalized 7-day workout plan. ${profileContext} ${workoutContext}. Consider their current activity level, goals, and any dietary restrictions to provide a balanced routine including strength, cardio, and active recovery. Format the response in clean Markdown.`;

      const response = await askFitnessCoach(prompt);
      setAiPlan(response || "Could not generate plan.");
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

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning,';
    if (h < 17) return 'Good afternoon,';
    return 'Good evening,';
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">

      {/* ── HERO ── */}
      <div
        className="relative overflow-hidden rounded-2xl p-7 md:p-10"
        style={{ background: 'linear-gradient(135deg, #1a2e4a 0%, #243d5c 60%, #1e3a5c 100%)' }}
      >
        {/* decorative blobs */}
        <div className="pointer-events-none absolute top-0 right-0 w-72 h-72 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(46,196,182,0.12) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="pointer-events-none absolute bottom-0 left-1/3 w-48 h-48 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(46,196,182,0.07) 0%, transparent 70%)', transform: 'translateY(40%)' }} />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            {/* streak badge */}
            {streak !== null && streak > 0 && (
              <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full text-xs font-bold"
                style={{ background: 'rgba(244,165,51,0.15)', border: '1px solid rgba(244,165,51,0.35)', color: '#ffc56a' }}>
                🔥 {streak}-Day Streak — Keep Going!
              </div>
            )}
            <p className="text-sm font-medium mb-1" style={{ color: 'rgba(255,255,255,0.5)' }}>{greeting()}</p>
            <h2 className="font-display tracking-wide leading-none mb-1" style={{ fontSize: 'clamp(36px,5vw,64px)', color: '#fff' }}>
              READY TO CRUSH IT,
            </h2>
            <h2 className="font-display tracking-wide leading-none mb-5" style={{ fontSize: 'clamp(36px,5vw,64px)', color: '#2ec4b6' }}>
              {userName.toUpperCase()}?
            </h2>
            <p className="text-sm mb-6 max-w-md" style={{ color: 'rgba(255,255,255,0.45)', lineHeight: '1.6' }}>
              Stay consistent, track your progress and hit your goals. Your AI coach is ready.
            </p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => onNavigate('workouts')}
                className="px-6 py-3 rounded-full font-bold text-sm text-white uppercase tracking-wide transition-all hover:-translate-y-0.5"
                style={{ background: 'linear-gradient(135deg, #1a9e92, #2ec4b6)', boxShadow: '0 8px 24px rgba(46,196,182,0.35)' }}
              >
                ▶ &nbsp;Start Workout
              </button>
              <button
                onClick={handleLogWorkout}
                disabled={isLogging}
                className="px-6 py-3 rounded-full font-bold text-sm transition-all flex items-center gap-2 disabled:opacity-50"
                style={{ background: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.15)' }}
              >
                <CheckCircle2 className="w-4 h-4" />
                {isLogging ? 'Logging...' : 'Log Workout'}
              </button>
            </div>
          </div>

          {/* hero stats */}
          <div className="flex flex-row md:flex-col gap-3 flex-wrap md:min-w-[180px]">
            {[
              { label: 'Workouts Done', value: stats.totalWorkouts || 0, unit: '' },
              { label: 'Active Minutes', value: stats.totalMinutes || 0, unit: 'min' },
              { label: 'Calories Burned', value: stats.caloriesBurned || 0, unit: 'kcal' },
            ].map((s, i) => (
              <div key={i} className="rounded-xl px-4 py-3 flex-1 md:flex-none"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(46,196,182,0.15)', backdropFilter: 'blur(8px)' }}>
                <p className="text-xs mb-1 uppercase tracking-widest" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.label}</p>
                <p className="font-mono font-bold text-xl text-white">
                  {s.value.toLocaleString()}
                  {s.unit && <span className="text-xs font-normal ml-1" style={{ color: 'rgba(255,255,255,0.4)' }}>{s.unit}</span>}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── QUICK STAT CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Workouts', value: stats.totalWorkouts || 0, icon: Activity, accent: '#2ec4b6', bg: 'rgba(46,196,182,0.1)' },
          { label: 'Minutes', value: stats.totalMinutes || 0, icon: Zap, accent: '#f4a533', bg: 'rgba(244,165,51,0.1)' },
          { label: 'Calories', value: stats.caloriesBurned || 0, icon: Target, accent: '#22c97a', bg: 'rgba(34,201,122,0.1)' },
          { label: 'Day Streak', value: streak ?? 0, icon: Trophy, accent: '#2ec4b6', bg: 'rgba(46,196,182,0.1)' },
        ].map((stat, i) => (
          <div key={i} className="rounded-2xl p-5 flex flex-col gap-3 bg-white"
            style={{ border: '1px solid rgba(26,46,74,0.08)', boxShadow: '0 2px 12px rgba(26,46,74,0.05)' }}>
            <div className="flex items-center justify-between">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: stat.bg }}>
                <stat.icon className="w-4 h-4" style={{ color: stat.accent }} />
              </div>
              <p className="font-mono font-bold text-2xl" style={{ color: '#1a2e4a' }}>{stat.value.toLocaleString()}</p>
            </div>
            <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: '#7a9aaa' }}>{stat.label}</p>
          </div>
        ))}
      </div>

      {/* ── STREAK TRACKER ── */}
      <div
        className="rounded-2xl p-5 flex items-center justify-between cursor-pointer transition-all hover:shadow-md bg-white"
        style={{ border: '1px solid rgba(46,196,182,0.2)', boxShadow: '0 2px 12px rgba(26,46,74,0.05)' }}
        onClick={() => onNavigate('progress')}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: streak && streak > 0 ? 'rgba(244,165,51,0.12)' : 'rgba(122,154,170,0.1)' }}>
            <Flame className="w-5 h-5" style={{ color: streak && streak > 0 ? '#f4a533' : '#7a9aaa' }} />
          </div>
          <div>
            <h3 className="font-display tracking-wide text-lg" style={{ color: '#1a2e4a' }}>
              {streak !== null ? `${streak} DAY STREAK` : 'LOADING STREAK...'}
            </h3>
            <p className="text-xs" style={{ color: '#7a9aaa' }}>Click to view detailed progress</p>
          </div>
        </div>
        <ChevronRight className="w-5 h-5" style={{ color: '#7a9aaa' }} />
      </div>

      {/* ── AI WORKOUT PLAN ── */}
      <div className="rounded-2xl p-6 bg-white"
        style={{ border: '1px solid rgba(26,46,74,0.08)', boxShadow: '0 2px 12px rgba(26,46,74,0.05)' }}>
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(46,196,182,0.1)' }}>
              <Sparkles className="w-4 h-4" style={{ color: '#2ec4b6' }} />
            </div>
            <h3 className="font-display tracking-wide text-lg" style={{ color: '#1a2e4a' }}>AI WORKOUT PLAN</h3>
          </div>
          <button
            onClick={generateAIPlan}
            disabled={isGeneratingPlan}
            className="px-5 py-2.5 rounded-full font-bold text-sm text-white flex items-center gap-2 disabled:opacity-50 transition-all hover:-translate-y-0.5"
            style={{ background: 'linear-gradient(135deg, #1a9e92, #2ec4b6)', boxShadow: '0 4px 16px rgba(46,196,182,0.3)' }}
          >
            {isGeneratingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {isGeneratingPlan ? 'Generating...' : 'Generate Plan'}
          </button>
        </div>

        {aiPlan ? (
          <div className="rounded-xl p-5 prose max-w-none prose-p:leading-relaxed"
            style={{ background: '#f0f7f7', border: '1px solid rgba(46,196,182,0.15)', color: '#1a2e4a' }}>
            <Markdown>{aiPlan}</Markdown>
          </div>
        ) : (
          <div className="rounded-xl p-8 text-center"
            style={{ background: '#f0f7f7', border: '1px solid rgba(46,196,182,0.15)' }}>
            <p className="text-sm" style={{ color: '#7a9aaa' }}>
              Click "Generate Plan" to get a personalized 7-day workout routine based on your goals and recent activity.
            </p>
          </div>
        )}
      </div>

      {/* ── ACTIVITY HISTORY ── */}
      <div className="rounded-2xl overflow-hidden bg-white"
        style={{ border: '1px solid rgba(26,46,74,0.08)', boxShadow: '0 2px 12px rgba(26,46,74,0.05)' }}>
        <button
          onClick={() => setIsHistoryOpen(!isHistoryOpen)}
          className="w-full p-5 flex items-center justify-between transition-colors hover:bg-gray-50"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(46,196,182,0.1)' }}>
              <Calendar className="w-4 h-4" style={{ color: '#2ec4b6' }} />
            </div>
            <h3 className="font-display tracking-wide text-lg" style={{ color: '#1a2e4a' }}>ACTIVITY HISTORY</h3>
          </div>
          {isHistoryOpen
            ? <ChevronUp className="w-5 h-5" style={{ color: '#7a9aaa' }} />
            : <ChevronDown className="w-5 h-5" style={{ color: '#7a9aaa' }} />}
        </button>

        {isHistoryOpen && (
          <div className="p-5 pt-0 border-t" style={{ borderColor: 'rgba(26,46,74,0.06)' }}>
            <div className="flex flex-col sm:flex-row gap-4 mb-5 mt-4">
              {[
                { label: 'Start Date', val: startDate, set: setStartDate },
                { label: 'End Date', val: endDate, set: setEndDate },
              ].map(({ label, val, set }) => (
                <div key={label} className="flex flex-col gap-1">
                  <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#7a9aaa' }}>{label}</label>
                  <input
                    type="date"
                    value={val}
                    onChange={e => set(e.target.value)}
                    className="rounded-xl px-3 py-2 text-sm focus:outline-none"
                    style={{ background: '#f0f7f7', border: '1px solid rgba(46,196,182,0.2)', color: '#1a2e4a' }}
                  />
                </div>
              ))}
              {(startDate || endDate) && (
                <div className="flex items-end pb-1">
                  <button onClick={() => { setStartDate(''); setEndDate(''); }}
                    className="text-xs underline" style={{ color: '#7a9aaa' }}>Clear Filters</button>
                </div>
              )}
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {filteredActivities.length > 0 ? filteredActivities.map(activity => (
                <div key={activity.id}
                  className="flex items-center justify-between p-4 rounded-xl"
                  style={{ background: '#f5fbfb', border: '1px solid rgba(46,196,182,0.1)' }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white shrink-0"
                      style={{ background: activity.type === 'workout' ? '#2ec4b6' : '#f4a533' }}>
                      {activity.type === 'workout'
                        ? <Dumbbell className="w-4 h-4" />
                        : <Utensils className="w-4 h-4" />}
                    </div>
                    <div>
                      <p className="text-sm font-semibold" style={{ color: '#1a2e4a' }}>{activity.title}</p>
                      <p className="text-xs" style={{ color: '#7a9aaa' }}>{activity.date}</p>
                    </div>
                  </div>
                  <span className="text-sm font-mono font-bold" style={{ color: '#1a2e4a' }}>{activity.details}</span>
                </div>
              )) : (
                <div className="text-center py-10 text-sm" style={{ color: '#7a9aaa' }}>
                  No activities found for this date range.
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── TODAY'S PLAN + AI COACH ── */}
      <div className="grid md:grid-cols-2 gap-5">

        {/* Today's Plan */}
        <div className="space-y-3">
          <h3 className="font-display tracking-wide text-lg" style={{ color: '#1a2e4a' }}>TODAY'S PLAN</h3>
          <div
            className="group relative overflow-hidden rounded-2xl cursor-pointer"
            style={{ border: '1px solid rgba(46,196,182,0.15)' }}
          >
            <div className="absolute inset-0 z-10" style={{ background: 'linear-gradient(to top, rgba(26,46,74,0.92), transparent)' }} />
            <img
              src="https://picsum.photos/seed/workout1/800/400"
              alt="Upper Body Strength"
              referrerPolicy="no-referrer"
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-500"
            />
            <div className="absolute bottom-0 left-0 right-0 p-5 z-20">
              <div className="flex items-center gap-2 mb-3">
                <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white uppercase tracking-wide"
                  style={{ background: '#2ec4b6' }}>Strength</span>
                <span className="text-sm font-semibold text-white">Upper Body · 45 min</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button className="px-4 py-2 rounded-full text-sm font-bold text-white"
                  style={{ background: 'linear-gradient(135deg,#1a9e92,#2ec4b6)' }}>START NOW</button>
                <button className="px-4 py-2 rounded-full text-sm font-bold"
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>Preview</button>
                <button className="px-4 py-2 rounded-full text-sm font-bold"
                  style={{ background: 'rgba(255,255,255,0.15)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }}>Swap</button>
              </div>
            </div>
          </div>
        </div>

        {/* AI Coach Says */}
        <div className="space-y-3">
          <h3 className="font-display tracking-wide text-lg" style={{ color: '#1a2e4a' }}>AI COACH SAYS</h3>
          <div className="rounded-2xl p-6 bg-white relative overflow-hidden"
            style={{ border: '1px solid rgba(46,196,182,0.15)', boxShadow: '0 2px 12px rgba(26,46,74,0.05)' }}>
            <div className="absolute top-0 left-0 w-1 h-full rounded-l-2xl" style={{ background: 'linear-gradient(to bottom, #1a9e92, #2ec4b6)' }} />
            <div className="flex items-start gap-3 pl-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                style={{ background: 'rgba(46,196,182,0.1)' }}>
                <Sparkles className="w-4 h-4" style={{ color: '#2ec4b6' }} />
              </div>
              <p className="text-sm font-medium leading-relaxed" style={{ color: '#1a2e4a' }}>
                "Your recovery looks great. Perfect day to push hard — let's make today count!"
              </p>
            </div>
          </div>

          {/* mini nav shortcuts */}
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Nutrition', icon: Utensils, tab: 'nutrition', accent: '#f4a533', bg: 'rgba(244,165,51,0.08)' },
              { label: 'Progress', icon: Activity, tab: 'progress', accent: '#2ec4b6', bg: 'rgba(46,196,182,0.08)' },
            ].map(({ label, icon: Icon, tab, accent, bg }) => (
              <button key={tab} onClick={() => onNavigate(tab)}
                className="flex items-center gap-3 p-4 rounded-2xl text-left transition-all hover:-translate-y-0.5 bg-white"
                style={{ border: '1px solid rgba(26,46,74,0.08)', boxShadow: '0 2px 8px rgba(26,46,74,0.04)' }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: bg }}>
                  <Icon className="w-4 h-4" style={{ color: accent }} />
                </div>
                <span className="text-sm font-bold" style={{ color: '#1a2e4a' }}>{label}</span>
                <ChevronRight className="w-4 h-4 ml-auto" style={{ color: '#7a9aaa' }} />
              </button>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
