import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Flame, Activity, Smartphone, CheckCircle2, Trophy, Star, Zap, Award, X } from 'lucide-react';
import { cn, calculateStrictStreak } from '../lib/utils';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { format, subDays } from 'date-fns';

const ACHIEVEMENTS = [
  { id: 'first_spark', title: 'First Spark', description: 'Started a 3-day streak', icon: Flame, color: 'text-ff-primary', bg: 'bg-ff-primary/20', border: 'border-ff-primary/30', condition: (data: any) => data.streak >= 3 },
  { id: 'century_club', title: 'Century Club', description: 'Burned 10,000 calories', icon: Zap, color: 'text-ff-secondary', bg: 'bg-ff-secondary/20', border: 'border-ff-secondary/30', condition: (data: any) => data.stats.caloriesBurned >= 10000 },
  { id: 'early_bird', title: 'Early Bird', description: 'Worked out before 6 AM', icon: Star, color: 'text-ff-tertiary', bg: 'bg-ff-tertiary/20', border: 'border-ff-tertiary/30', condition: (data: any) => data.logs.some((log: any) => {
    if (!log.timestamp) return false;
    const date = log.timestamp.toDate ? log.timestamp.toDate() : new Date(log.timestamp);
    return date.getHours() < 6;
  }) },
  { id: 'iron_will', title: 'Iron Will', description: 'Complete a 30-day streak', icon: Award, color: 'text-ff-quaternary', bg: 'bg-ff-quaternary/20', border: 'border-ff-quaternary/30', condition: (data: any) => data.streak >= 30 },
];

export default function ProgressView() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newAchievements, setNewAchievements] = useState<any[]>([]);
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    let userUnsub: () => void;
    let workoutsUnsub: () => void;

    const fetchData = async () => {
      try {
        // Listen to user stats and connected apps
        userUnsub = onSnapshot(doc(db, 'users', userId), (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            
            // Listen to workouts
            const q = query(collection(db, 'workouts'), where('userId', '==', userId));
            workoutsUnsub = onSnapshot(q, (snapshot) => {
              const logs = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
              const logDates = logs.map((l: any) => l.date);
              const streak = calculateStrictStreak(logDates);

              // Generate chart data
              const chartData = Array.from({ length: 7 }).map((_, i) => {
                const d = subDays(new Date(), 6 - i);
                const dateStr = format(d, 'yyyy-MM-dd');
                const dayLogs = logs.filter((l: any) => l.date === dateStr);
                const didWorkout = dayLogs.length > 0;
                
                return {
                  day: format(d, 'EEE'),
                  date: dateStr,
                  calories: didWorkout ? dayLogs.reduce((acc: number, curr: any) => acc + (curr.calories || 0), 0) : 0,
                  minutes: didWorkout ? dayLogs.reduce((acc: number, curr: any) => acc + (parseInt(curr.duration) || 0), 0) : 0,
                };
              });

              const currentData = {
                streak,
                stats: userData.stats || { totalWorkouts: 0, totalMinutes: 0, caloriesBurned: 0 },
                connectedApps: userData.connectedApps || { appleHealth: false, googleFit: false },
                chartData,
                logs: logs.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()),
                unlockedAchievements: userData.unlockedAchievements || []
              };

              // Check for newly unlocked achievements
              const newlyUnlocked = ACHIEVEMENTS.filter(ach => 
                !currentData.unlockedAchievements.includes(ach.id) && ach.condition(currentData)
              );

              if (newlyUnlocked.length > 0) {
                const updatedUnlocked = [...currentData.unlockedAchievements, ...newlyUnlocked.map(a => a.id)];
                
                // Update Firestore
                updateDoc(doc(db, 'users', userId), {
                  unlockedAchievements: updatedUnlocked
                }).catch(err => console.error("Failed to update achievements", err));

                currentData.unlockedAchievements = updatedUnlocked;
                setNewAchievements(newlyUnlocked);
                setShowToast(true);
                setTimeout(() => setShowToast(false), 5000);
              }

              setData(currentData);
              setLoading(false);
            }, (error) => handleFirestoreError(error, OperationType.LIST, 'workouts'));
          }
        }, (error) => handleFirestoreError(error, OperationType.GET, `users/${userId}`));
      } catch (err) {
        console.error(err);
        setLoading(false);
      }
    };

    fetchData();

    return () => {
      if (userUnsub) userUnsub();
      if (workoutsUnsub) workoutsUnsub();
    };
  }, []);

  const handleConnectApp = async (app: string) => {
    const userId = auth.currentUser?.uid;
    if (!userId || !data) return;
    
    try {
      const newStatus = !data.connectedApps[app];
      await updateDoc(doc(db, 'users', userId), {
        [`connectedApps.${app}`]: newStatus
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  if (loading || !data) {
    return <div className="flex items-center justify-center h-full text-ff-muted font-mono animate-pulse">Loading progress...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-12 relative">
      {/* Toast Notification */}
      {showToast && newAchievements.length > 0 && (
        <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="bg-ff-surface border-2 border-ff-primary rounded-2xl p-4 shadow-2xl flex items-start gap-4 max-w-sm">
            <div className="w-10 h-10 rounded-full bg-ff-primary flex items-center justify-center shrink-0">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-ff-text mb-1">Achievement Unlocked!</h4>
              <p className="text-sm text-ff-muted">
                You earned the <span className="text-ff-primary font-bold">{newAchievements[0].title}</span> badge.
              </p>
            </div>
            <button onClick={() => setShowToast(false)} className="text-ff-muted hover:text-ff-text transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* Strict Streak Banner */}
      <div className={cn(
        "relative overflow-hidden rounded-[32px] p-8 md:p-12 flex flex-col md:flex-row items-center justify-between gap-8 border-2",
        data.streak > 0 
          ? "bg-ff-surface border-ff-secondary" 
          : "bg-ff-surface border-ff-empty"
      )}>
        {data.streak > 0 && (
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-ff-secondary/10 rounded-full blur-3xl pointer-events-none" />
        )}
        
        <div className="flex flex-col sm:flex-row items-center text-center sm:text-left gap-6 z-10">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center shrink-0 shadow-2xl font-bold",
            data.streak > 0 ? "bg-ff-secondary text-white" : "bg-ff-empty border-2 border-dashed border-ff-primary text-ff-primary"
          )}>
            <Flame className="w-10 h-10" />
          </div>
          <div>
            <h2 className="font-display text-4xl tracking-wide mb-1 text-ff-text">
              {data.streak > 0 ? `${data.streak} DAY STREAK` : 'STREAK BROKEN'}
            </h2>
            <p className={cn("text-sm font-medium", data.streak > 0 ? "text-ff-secondary" : "text-ff-muted")}>
              {data.streak > 0 
                ? "You're on fire! Don't miss tomorrow to keep it alive." 
                : "You missed a day. The algorithm has reset your streak to 0. Time to rebuild!"}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center sm:justify-end gap-2 z-10 w-full sm:w-auto mt-4 md:mt-0">
          {data.chartData.map((day: any, i: number) => {
            const isCompleted = day.calories > 0;
            return (
              <div key={i} className="flex flex-col items-center gap-2">
                <div className={cn(
                "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm transition-all text-white",
                isCompleted ? "bg-ff-primary" : "bg-ff-empty border-2 border-ff-empty text-ff-text"
                )}>
                  {isCompleted ? <CheckCircle2 className="w-5 h-5" /> : '-'}
                </div>
                <span className="text-[10px] font-bold text-ff-muted uppercase tracking-wider">{day.day}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Stats Overview */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-6 rounded-[24px] bg-ff-surface border-2 border-ff-primary hover:border-ff-secondary transition-colors">
              <p className="text-xs text-ff-muted font-bold tracking-wider mb-2">TOTAL WORKOUTS</p>
              <p className="text-5xl font-mono font-bold text-ff-text stat-number">{data.stats.totalWorkouts}</p>
            </div>
            <div className="p-6 rounded-[24px] bg-ff-surface border-2 border-ff-primary hover:border-ff-secondary transition-colors">
              <p className="text-xs text-ff-muted font-bold tracking-wider mb-2">CALORIES BURNED</p>
              <p className="text-5xl font-mono font-bold text-ff-text stat-number">{data.stats.caloriesBurned.toLocaleString()}</p>
            </div>
          </div>

          {/* Activity Chart */}
          <div className="p-6 rounded-[24px] bg-ff-surface border-2 border-ff-primary">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
              <h3 className="text-xl font-display tracking-wide text-ff-text uppercase">Activity (Last 7 Days)</h3>
              <div className="flex items-center gap-4 text-xs font-bold">
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-ff-secondary" /> Calories</span>
                <span className="flex items-center gap-2"><div className="w-3 h-3 rounded-full bg-ff-primary" /> Minutes</span>
              </div>
            </div>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <Tooltip 
                    cursor={{ fill: 'var(--color-ff-empty)' }}
                    contentStyle={{ backgroundColor: 'var(--color-ff-surface)', border: '2px solid var(--color-ff-primary)', borderRadius: '12px', color: 'var(--color-ff-text)' }}
                  />
                  <Bar dataKey="calories" fill="var(--color-ff-secondary)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="minutes" fill="var(--color-ff-primary)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Badges & Achievements */}
        <div className="space-y-4 md:col-span-3 mt-4">
          <h3 className="text-xl font-display tracking-wide text-ff-text uppercase">Achievements</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {ACHIEVEMENTS.map((ach) => {
              const isUnlocked = data.unlockedAchievements.includes(ach.id);
              const Icon = ach.icon;
              
              return (
                <div 
                  key={ach.id} 
                  className={cn(
                    "p-6 rounded-[24px] flex flex-col items-center text-center gap-3 relative overflow-hidden group transition-all border-2",
                    isUnlocked 
                      ? "bg-ff-surface border-ff-primary" 
                      : "bg-ff-surface border-ff-empty opacity-50 grayscale"
                  )}
                >
                  {isUnlocked && <div className={cn("absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-ff-primary")} />}
                  <div className={cn(
                    "w-16 h-16 rounded-full flex items-center justify-center",
                    isUnlocked ? "bg-ff-primary text-white" : "bg-ff-empty"
                  )}>
                    <Icon className={cn("w-8 h-8", isUnlocked ? "text-white" : "text-ff-primary")} />
                  </div>
                  <div>
                    <h4 className="font-bold text-ff-text">{ach.title}</h4>
                    <p className="text-xs text-ff-muted mt-1">{ach.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Connected Apps */}
        <div className="space-y-4">
          <h3 className="text-xl font-display tracking-wide text-ff-text uppercase">Connected Apps</h3>
          <p className="text-sm text-ff-muted mb-4">Sync your health data automatically to keep your streak alive.</p>
          
          <div className="space-y-3">
            <div className="p-5 rounded-[20px] bg-ff-surface border-2 border-ff-primary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
                  <Activity className="w-6 h-6 text-[#FA114F]" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-ff-text">Apple Health</h4>
                  <p className="text-xs text-ff-muted">Sync workouts & vitals</p>
                </div>
              </div>
              <button 
                onClick={() => handleConnectApp('appleHealth')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-colors w-full sm:w-auto",
                  data.connectedApps.appleHealth ? "bg-ff-empty text-ff-text" : "bg-ff-primary text-white hover:bg-ff-tertiary"
                )}
              >
                {data.connectedApps.appleHealth ? 'Disconnect' : 'Connect'}
              </button>
            </div>

            <div className="p-5 rounded-[20px] bg-ff-surface border-2 border-ff-primary flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shrink-0">
                  <Smartphone className="w-6 h-6 text-[#4285F4]" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-ff-text">Google Fit</h4>
                  <p className="text-xs text-ff-muted">Sync activity data</p>
                </div>
              </div>
              <button 
                onClick={() => handleConnectApp('googleFit')}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold transition-colors w-full sm:w-auto",
                  data.connectedApps.googleFit ? "bg-ff-empty text-ff-text" : "bg-ff-primary text-white hover:bg-ff-tertiary"
                )}
              >
                {data.connectedApps.googleFit ? 'Disconnect' : 'Connect'}
              </button>
            </div>
          </div>
        </div>
        {/* Workout History */}
        <div className="space-y-4 md:col-span-3 mt-4">
          <h3 className="text-xl font-display tracking-wide text-ff-text uppercase">Workout History</h3>
          <div className="bg-ff-surface border-2 border-ff-primary rounded-[24px] overflow-hidden">
            {data.logs && data.logs.length > 0 ? (
              <div className="divide-y-2 divide-ff-empty">
                {[...data.logs].reverse().map((log: any, i: number) => (
                  <div key={log.id || i} className="p-5 flex items-center justify-between hover:bg-ff-empty/30 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-ff-primary flex items-center justify-center">
                        <Activity className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h4 className="font-bold text-ff-text">{log.title || 'Workout'}</h4>
                        <p className="text-xs text-ff-muted">{log.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-ff-text stat-number">{log.duration}</p>
                      <p className="text-xs text-ff-primary font-bold">{log.calories} kcal</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center text-ff-muted">
                <p>No workouts logged yet. Time to get moving!</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
