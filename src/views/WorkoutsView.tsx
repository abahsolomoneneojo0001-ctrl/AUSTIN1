import React, { useState } from 'react';
import { Search, Filter, Play, Clock, Flame, Activity, Dumbbell, List } from 'lucide-react';
import { cn } from '../lib/utils';
import FormCheckView from './FormCheckView';
import LiveWorkoutView from './LiveWorkoutView';
import ExerciseTrackerView from './ExerciseTrackerView';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, doc, updateDoc, increment } from 'firebase/firestore';
import { format } from 'date-fns';

const WORKOUTS = [
  { id: 1, title: 'HIIT Cardio Blast', category: 'Cardio', duration: '30 Min', level: 'Intermediate', calories: 350, image: 'https://picsum.photos/seed/hiit/600/400', videoUrl: 'https://www.youtube.com/watch?v=AdqrTg_hpEQ' },
  { id: 2, title: 'Full Body Strength', category: 'Strength', duration: '60 Min', level: 'Advanced', calories: 450, image: 'https://picsum.photos/seed/strength/600/400', videoUrl: 'https://www.youtube.com/watch?v=4iy4yEKa7W8' },
  { id: 3, title: 'Morning Yoga Flow', category: 'Flexibility', duration: '20 Min', level: 'Beginner', calories: 120, image: 'https://picsum.photos/seed/yoga/600/400', videoUrl: 'https://www.youtube.com/watch?v=BPRE9o1cEgk' },
  { id: 4, title: 'Morning Crusher', category: 'Strength', duration: '15 Min', level: 'Intermediate', calories: 150, image: 'https://picsum.photos/seed/core/600/400', videoUrl: 'https://www.youtube.com/watch?v=dJlFmxiL11s' },
  { id: 5, title: 'Endurance Run', category: 'Cardio', duration: '45 Min', level: 'Advanced', calories: 500, image: 'https://picsum.photos/seed/run/600/400', videoUrl: 'https://www.youtube.com/shorts/-iYYEpFgeoE' },
  { id: 6, title: 'Mobility Routine', category: 'Flexibility', duration: '25 Min', level: 'Beginner', calories: 100, image: 'https://picsum.photos/seed/mobility/600/400', videoUrl: 'https://www.youtube.com/watch?v=P91Vegj3Qxg' },
];

const CATEGORIES = ['All', 'Strength', 'Cardio', 'Flexibility', 'HIIT'];

export default function WorkoutsView() {
  const [activeTab, setActiveTab] = useState<'workouts' | 'tracker'>('workouts');
  const [activeCategory, setActiveCategory] = useState('All');
  const [showFormCheck, setShowFormCheck] = useState(false);
  const [activeWorkout, setActiveWorkout] = useState<any>(null);

  const filteredWorkouts = WORKOUTS.filter(w => activeCategory === 'All' || w.category === activeCategory);

  const handleWorkoutComplete = async (totalSeconds: number) => {
    if (!activeWorkout) return;
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      
      const minutes = Math.round(totalSeconds / 60);
      const durationStr = `${minutes} Min`;
      
      const originalMinutes = parseInt(activeWorkout.duration) || 1;
      const caloriesBurned = Math.round((activeWorkout.calories / originalMinutes) * minutes);

      await addDoc(collection(db, 'workouts'), {
        userId,
        title: activeWorkout.title,
        date: todayStr,
        duration: durationStr,
        calories: caloriesBurned,
        timestamp: serverTimestamp()
      });

      await updateDoc(doc(db, 'users', userId), {
        'stats.totalWorkouts': increment(1),
        'stats.totalMinutes': increment(minutes),
        'stats.caloriesBurned': increment(caloriesBurned)
      });
      
      // Optionally show a toast or notification
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'workouts');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {showFormCheck && <FormCheckView onClose={() => setShowFormCheck(false)} />}
      {activeWorkout && (
        <LiveWorkoutView 
          workout={activeWorkout} 
          onClose={() => setActiveWorkout(null)} 
          onComplete={handleWorkoutComplete}
        />
      )}
      
      {/* Tabs */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-4 bg-ff-surface p-2 rounded-2xl w-full sm:w-fit mb-8 border-2 border-ff-primary">
        <button
          onClick={() => setActiveTab('workouts')}
          className={cn(
            "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all w-full sm:w-auto",
            activeTab === 'workouts' ? "bg-ff-primary text-white shadow-lg" : "text-ff-muted hover:text-ff-text"
          )}
        >
          <List className="w-5 h-5" />
          Workouts
        </button>
        <button
          onClick={() => setActiveTab('tracker')}
          className={cn(
            "flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-bold transition-all w-full sm:w-auto",
            activeTab === 'tracker' ? "bg-ff-secondary text-white shadow-lg" : "text-ff-muted hover:text-ff-text"
          )}
        >
          <Dumbbell className="w-5 h-5" />
          Exercise Tracker
        </button>
      </div>

      {activeTab === 'tracker' ? (
        <ExerciseTrackerView />
      ) : (
        <>
          <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center">
            <div className="relative flex-1 max-w-md w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-ff-muted" />
              <input 
                type="text" 
                placeholder="Search workouts, exercises..." 
                className="w-full bg-ff-bg border-2 border-ff-primary rounded-xl py-2.5 pl-10 pr-4 text-ff-text placeholder:text-ff-muted focus:outline-none focus:border-ff-secondary focus:ring-0 transition-all"
              />
            </div>
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <button 
                onClick={() => setShowFormCheck(true)}
                className="flex flex-1 sm:flex-none justify-center items-center gap-2 px-4 py-2.5 bg-ff-primary text-white font-bold rounded-xl hover:bg-ff-tertiary transition-colors"
              >
                <Activity className="w-4 h-4" />
                AI Form Check
              </button>
              <button className="flex flex-1 sm:flex-none justify-center items-center gap-2 px-4 py-2.5 bg-ff-surface border-2 border-ff-primary rounded-xl text-ff-text hover:border-ff-secondary transition-colors">
                <Filter className="w-4 h-4" />
                Filters
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {CATEGORIES.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-5 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all border-2",
                  activeCategory === cat 
                    ? "bg-ff-primary text-white border-ff-primary" 
                    : "bg-ff-surface text-ff-text border-ff-primary hover:bg-ff-empty"
                )}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkouts.map(workout => (
              <div 
                key={workout.id} 
                onClick={() => setActiveWorkout(workout)}
                className="group rounded-2xl bg-ff-surface border border-ff-surface overflow-hidden hover:border-ff-primary/50 transition-all cursor-pointer flex flex-col"
              >
                <div className="relative h-48 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                  <img 
                    src={workout.image} 
                    alt={workout.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 z-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/20">
                    <div className="w-12 h-12 rounded-full bg-ff-primary flex items-center justify-center text-white transform translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      <Play className="w-5 h-5 ml-1" />
                    </div>
                  </div>
                  <div className="absolute top-3 left-3 z-20">
                    <span className="px-2.5 py-1 rounded-md bg-black/80 backdrop-blur-md text-ff-text text-xs font-bold uppercase tracking-wider">
                      {workout.category}
                    </span>
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <h3 className="text-lg font-bold text-ff-text mb-2">{workout.title}</h3>
                  <div className="flex items-center gap-4 text-sm text-ff-muted mb-4">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-ff-primary" />
                      {workout.duration}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Flame className="w-4 h-4 text-ff-secondary" />
                      {workout.calories} kcal
                    </div>
                    <div className="flex items-center gap-1.5 ml-auto text-ff-primary font-bold">
                      {workout.level}
                    </div>
                  </div>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      setActiveWorkout(workout);
                    }}
                    className="w-full py-2.5 bg-ff-primary text-white font-bold rounded-xl hover:bg-ff-tertiary transition-colors flex items-center justify-center gap-2"
                  >
                    <Play className="w-4 h-4 fill-current" />
                    Start Workout
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
