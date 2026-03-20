import React, { useState, useEffect } from 'react';
import { Plus, Dumbbell, Activity, TrendingUp } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { format } from 'date-fns';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { cn } from '../lib/utils';

interface ExerciseLog {
  id: string;
  exerciseName: string;
  weight: number;
  reps: number;
  date: string;
}

const COMMON_EXERCISES = [
  'Bench Press', 'Squat', 'Deadlift', 'Overhead Press', 'Barbell Row', 'Pull-up', 'Dumbbell Curl'
];

export default function ExerciseTrackerView() {
  const [logs, setLogs] = useState<ExerciseLog[]>([]);
  const [selectedExercise, setSelectedExercise] = useState(COMMON_EXERCISES[0]);
  const [weight, setWeight] = useState('');
  const [reps, setReps] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const q = query(
      collection(db, 'exercises'),
      where('userId', '==', userId),
      orderBy('timestamp', 'asc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedLogs: ExerciseLog[] = [];
      snapshot.forEach((doc) => {
        fetchedLogs.push({ id: doc.id, ...doc.data() } as ExerciseLog);
      });
      setLogs(fetchedLogs);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'exercises');
    });

    return () => unsubscribe();
  }, []);

  const handleLogExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    const userId = auth.currentUser?.uid;
    if (!userId || !weight || !reps) return;

    setIsSubmitting(true);
    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      await addDoc(collection(db, 'exercises'), {
        userId,
        exerciseName: selectedExercise,
        weight: Number(weight),
        reps: Number(reps),
        date: todayStr,
        timestamp: serverTimestamp()
      });
      setWeight('');
      setReps('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'exercises');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Prepare chart data for the selected exercise
  const chartData = logs
    .filter(log => log.exerciseName === selectedExercise)
    .reduce((acc: any[], log) => {
      // Group by date, taking the max weight for that date
      const existing = acc.find(item => item.date === log.date);
      if (existing) {
        if (log.weight > existing.weight) existing.weight = log.weight;
      } else {
        acc.push({ date: log.date, weight: log.weight, reps: log.reps });
      }
      return acc;
    }, []);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Log Form */}
        <div className="bg-ff-surface border border-ff-surface rounded-[32px] p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-full bg-ff-primary/20 flex items-center justify-center">
              <Dumbbell className="w-6 h-6 text-ff-primary" />
            </div>
            <h3 className="text-2xl font-display tracking-wide text-white">Log Exercise</h3>
          </div>

          <form onSubmit={handleLogExercise} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-ff-muted mb-2">Exercise</label>
              <select 
                value={selectedExercise}
                onChange={(e) => setSelectedExercise(e.target.value)}
                className="w-full bg-ff-bg border border-ff-surface rounded-xl p-3 text-white focus:outline-none focus:border-ff-primary"
              >
                {COMMON_EXERCISES.map(ex => (
                  <option key={ex} value={ex}>{ex}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-ff-muted mb-2">Weight (lbs)</label>
                <input 
                  type="number" 
                  min="0"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full bg-ff-bg border border-ff-surface rounded-xl p-3 text-white focus:outline-none focus:border-ff-primary"
                  placeholder="e.g. 135"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-ff-muted mb-2">Reps</label>
                <input 
                  type="number" 
                  min="1"
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  className="w-full bg-ff-bg border border-ff-surface rounded-xl p-3 text-white focus:outline-none focus:border-ff-primary"
                  placeholder="e.g. 10"
                  required
                />
              </div>
            </div>
            <button 
              type="submit"
              disabled={isSubmitting || !weight || !reps}
              className="w-full py-4 bg-ff-primary text-black font-bold rounded-xl hover:bg-ff-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-4"
            >
              <Plus className="w-5 h-5" />
              {isSubmitting ? 'Logging...' : 'Log Set'}
            </button>
          </form>
        </div>

        {/* Progress Chart */}
        <div className="lg:col-span-2 bg-ff-surface border border-ff-surface rounded-[32px] p-8">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-ff-secondary/20 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-ff-secondary" />
              </div>
              <div>
                <h3 className="text-2xl font-display tracking-wide text-white">Progress</h3>
                <p className="text-ff-muted text-sm">Max weight over time for {selectedExercise}</p>
              </div>
            </div>
          </div>

          <div className="h-[300px] w-full">
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#888" 
                    tickFormatter={(val) => format(new Date(val), 'MMM d')}
                  />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1A1A1A', border: '1px solid #333', borderRadius: '12px' }}
                    itemStyle={{ color: '#CCFF00' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="weight" 
                    stroke="#CCFF00" 
                    strokeWidth={3}
                    dot={{ fill: '#CCFF00', strokeWidth: 2 }}
                    activeDot={{ r: 8 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-ff-muted">
                <Activity className="w-12 h-12 mb-4 opacity-20" />
                <p>No data logged for {selectedExercise} yet.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
