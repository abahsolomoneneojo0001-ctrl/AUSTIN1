import React, { useState, useEffect } from 'react';
import { X, Play, Pause, SkipForward, CheckCircle2, Clock } from 'lucide-react';
import { cn } from '../lib/utils';

interface LiveWorkoutViewProps {
  workout: any;
  onClose: () => void;
  onComplete: (totalSeconds: number) => void;
}

const EXERCISES = [
  { name: 'Jumping Jacks', duration: 30 },
  { name: 'Rest', duration: 10 },
  { name: 'Push-ups', duration: 45 },
  { name: 'Rest', duration: 15 },
  { name: 'Squats', duration: 45 },
  { name: 'Rest', duration: 15 },
  { name: 'Plank', duration: 60 },
];

export default function LiveWorkoutView({ workout, onClose, onComplete }: LiveWorkoutViewProps) {
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EXERCISES[0].duration);
  const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const currentExercise = EXERCISES[currentExerciseIndex];
  const nextExercise = EXERCISES[currentExerciseIndex + 1];
  const isRest = currentExercise.name === 'Rest';

  useEffect(() => {
    if (isPaused || isFinished) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
      setTotalTimeElapsed((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [isPaused, isFinished]);

  useEffect(() => {
    if (timeLeft <= 0 && !isFinished) {
      handleNext();
    }
  }, [timeLeft, isFinished]);

  const handleNext = () => {
    if (currentExerciseIndex < EXERCISES.length - 1) {
      const nextIdx = currentExerciseIndex + 1;
      setCurrentExerciseIndex(nextIdx);
      setTimeLeft(EXERCISES[nextIdx].duration);
      
      // Optional: Text-to-Speech
      if ('speechSynthesis' in window) {
        const msg = new SpeechSynthesisUtterance(
          EXERCISES[nextIdx].name === 'Rest' 
            ? `Rest for ${EXERCISES[nextIdx].duration} seconds`
            : `Next up: ${EXERCISES[nextIdx].name}`
        );
        window.speechSynthesis.speak(msg);
      }
    } else {
      setIsFinished(true);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const progress = ((currentExercise.duration - timeLeft) / currentExercise.duration) * 100;
  
  const originalMinutes = parseInt(workout.duration) || 1;
  const caloriesBurned = Math.round((workout.calories / originalMinutes) * (totalTimeElapsed / 60));

  if (isFinished) {
    return (
      <div className="fixed inset-0 z-50 bg-ff-bg flex flex-col items-center justify-center p-6 animate-in fade-in zoom-in duration-300">
        <div className="w-24 h-24 rounded-full bg-ff-primary/20 flex items-center justify-center mb-8">
          <CheckCircle2 className="w-12 h-12 text-ff-primary" />
        </div>
        <h1 className="text-4xl font-display tracking-wide text-white mb-2 text-center">WORKOUT COMPLETE</h1>
        <p className="text-ff-muted mb-6 text-center">Great job crushing {workout.title}!</p>
        
        <div className="bg-ff-surface rounded-2xl p-6 mb-12 flex items-center gap-8">
          <div className="flex flex-col items-center">
            <span className="text-ff-muted text-sm uppercase tracking-wider mb-1">Total Time</span>
            <span className="text-2xl font-bold text-white">{formatTime(totalTimeElapsed)}</span>
          </div>
          <div className="w-px h-12 bg-ff-bg"></div>
          <div className="flex flex-col items-center">
            <span className="text-ff-muted text-sm uppercase tracking-wider mb-1">Calories</span>
            <span className="text-2xl font-bold text-ff-secondary">{caloriesBurned}</span>
          </div>
        </div>
        
        <div className="flex gap-4">
          <button 
            onClick={onClose}
            className="px-8 py-4 rounded-full bg-ff-surface text-white font-bold hover:bg-ff-surface/80 transition-colors"
          >
            Close
          </button>
          <button 
            onClick={() => {
              onComplete(totalTimeElapsed);
              onClose();
            }}
            className="px-8 py-4 rounded-full bg-ff-primary text-black font-bold hover:bg-ff-primary/80 transition-colors"
          >
            Log Workout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-ff-bg flex flex-col animate-in slide-in-from-bottom-full duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <div className="flex flex-col">
          <span className="text-sm text-ff-muted font-bold uppercase tracking-wider">{workout.title}</span>
          <span className="text-xs text-ff-primary font-bold">
            {currentExerciseIndex + 1} / {EXERCISES.length}
          </span>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-ff-surface px-4 py-2 rounded-full">
            <Clock className="w-4 h-4 text-ff-muted" />
            <span className="text-white font-mono font-bold">{formatTime(totalTimeElapsed)}</span>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-ff-surface flex items-center justify-center text-ff-muted hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Main Timer Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 relative">
        <h2 className={cn(
          "text-5xl md:text-7xl font-display tracking-wide mb-12 text-center transition-colors duration-300",
          isRest ? "text-ff-tertiary" : "text-white"
        )}>
          {currentExercise.name}
        </h2>

        <div className="relative w-64 h-64 md:w-80 md:h-80 flex items-center justify-center mb-12">
          <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-ff-surface)" strokeWidth="4" />
            <circle 
              cx="50" cy="50" r="45" 
              fill="none" 
              stroke={isRest ? "var(--color-ff-tertiary)" : "var(--color-ff-primary)"} 
              strokeWidth="4" 
              strokeDasharray="283" 
              strokeDashoffset={283 - (progress / 100) * 283} 
              className="transition-all duration-1000 ease-linear" 
            />
          </svg>
          <span className="text-7xl md:text-8xl font-mono font-bold text-white tracking-tighter">
            {formatTime(timeLeft)}
          </span>
        </div>

        {nextExercise && (
          <div className="flex flex-col items-center text-ff-muted">
            <span className="text-xs font-bold uppercase tracking-widest mb-1">Up Next</span>
            <span className="text-xl font-medium">{nextExercise.name}</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="p-8 flex items-center justify-center gap-6 pb-safe">
        <button 
          onClick={() => setIsFinished(true)}
          className="w-16 h-16 rounded-full bg-ff-surface flex items-center justify-center text-ff-muted hover:text-red-500 hover:bg-ff-surface/80 transition-colors"
          title="Finish Workout Early"
        >
          <div className="w-5 h-5 bg-current rounded-sm" />
        </button>
        <button 
          onClick={() => setIsPaused(!isPaused)}
          className="w-20 h-20 rounded-full bg-ff-surface flex items-center justify-center text-white hover:bg-ff-surface/80 transition-colors"
        >
          {isPaused ? <Play className="w-8 h-8 ml-1" /> : <Pause className="w-8 h-8" />}
        </button>
        <button 
          onClick={handleNext}
          className="w-16 h-16 rounded-full bg-ff-surface flex items-center justify-center text-ff-muted hover:text-white hover:bg-ff-surface/80 transition-colors"
        >
          <SkipForward className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
