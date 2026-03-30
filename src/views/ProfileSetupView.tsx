import React, { useState, useEffect } from 'react';
import { User, Target, Activity, Utensils, ChevronRight, Loader2, CheckCircle2 } from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';

export default function ProfileSetupView({ onComplete }: { onComplete: () => void }) {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Form State
  const [age, setAge] = useState('');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [gender, setGender] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [experience, setExperience] = useState('');
  const [diet, setDiet] = useState<string[]>([]);

  const GOAL_OPTIONS = ['Lose Weight', 'Build Muscle', 'Improve Endurance', 'Flexibility', 'General Fitness'];
  const EXPERIENCE_OPTIONS = ['Beginner', 'Intermediate', 'Advanced'];
  const DIET_OPTIONS = ['None', 'Vegetarian', 'Vegan', 'Keto', 'Paleo', 'Gluten-Free', 'Dairy-Free'];

  useEffect(() => {
    const fetchProfile = async () => {
      const userId = auth.currentUser?.uid;
      if (!userId) return;

      setIsLoading(true);
      try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.personalDetails) {
            setAge(data.personalDetails.age?.toString() || '');
            setWeight(data.personalDetails.weight?.toString() || '');
            setHeight(data.personalDetails.height?.toString() || '');
            setGender(data.personalDetails.gender || '');
          }
          if (data.fitnessGoals) {
            setGoals(data.fitnessGoals.split(', ').filter(Boolean));
          }
          if (data.experienceLevel) {
            setExperience(data.experienceLevel);
          }
          if (data.dietaryRestrictions) {
            setDiet(data.dietaryRestrictions.split(', ').filter(Boolean));
          }
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${userId}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const toggleSelection = (item: string, list: string[], setList: (val: string[]) => void, single = false) => {
    if (single) {
      setList([item]);
    } else {
      if (list.includes(item)) {
        setList(list.filter(i => i !== item));
      } else {
        setList([...list, item]);
      }
    }
  };

  const handleSave = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        personalDetails: {
          age: parseInt(age) || 0,
          weight: parseFloat(weight) || 0,
          height: parseFloat(height) || 0,
          gender
        },
        fitnessGoals: goals.join(', '),
        experienceLevel: experience,
        dietaryRestrictions: diet.join(', ')
      });
      onComplete();
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `users/${userId}`);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-ff-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Hero Section */}
      <div
        className="relative overflow-hidden rounded-2xl p-7 md:p-10"
        style={{ background: 'linear-gradient(135deg, #1a2e4a 0%, #243d5c 60%, #1e3a5c 100%)' }}
      >
        <div className="pointer-events-none absolute top-0 right-0 w-72 h-72 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(46,196,182,0.12) 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
        <div className="pointer-events-none absolute bottom-0 left-1/3 w-48 h-48 rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(46,196,182,0.07) 0%, transparent 70%)', transform: 'translateY(40%)' }} />

        <div className="relative z-10">
          <p className="text-sm font-medium mb-2" style={{ color: 'rgba(255,255,255,0.5)' }}>Step {step} of 4</p>
          <h2 className="font-display tracking-wide mb-3" style={{ fontSize: 'clamp(32px,4vw,48px)', color: '#fff' }}>
            COMPLETE YOUR PROFILE
          </h2>
          <p className="text-sm mb-6 max-w-md" style={{ color: 'rgba(255,255,255,0.6)', lineHeight: '1.6' }}>
            Help us personalize your AI-generated plans with your fitness goals and preferences.
          </p>

          {/* Progress Indicator */}
          <div className="flex gap-2">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: i === step ? '32px' : '16px',
                  background: i <= step ? '#2ec4b6' : 'rgba(255,255,255,0.2)'
                }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-2xl p-6 md:p-8 bg-white" style={{ border: '1px solid rgba(26,46,74,0.08)', boxShadow: '0 2px 12px rgba(26,46,74,0.05)' }}>
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(46,196,182,0.1)' }}>
                <User className="w-4 h-4" style={{ color: '#2ec4b6' }} />
              </div>
              <h3 className="font-display tracking-wide text-lg" style={{ color: '#1a2e4a' }}>Personal Details</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#7a9aaa' }}>Age</label>
                <input 
                  type="number" 
                  value={age} 
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full rounded-xl p-3 text-sm focus:outline-none"
                  style={{ background: '#f0f7f7', border: '1px solid rgba(46,196,182,0.2)', color: '#1a2e4a' }}
                  placeholder="e.g. 28"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#7a9aaa' }}>Gender</label>
                <select 
                  value={gender} 
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-xl p-3 text-sm focus:outline-none appearance-none"
                  style={{ background: '#f0f7f7', border: '1px solid rgba(46,196,182,0.2)', color: '#1a2e4a' }}
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#7a9aaa' }}>Weight (kg)</label>
                <input 
                  type="number" 
                  value={weight} 
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full rounded-xl p-3 text-sm focus:outline-none"
                  style={{ background: '#f0f7f7', border: '1px solid rgba(46,196,182,0.2)', color: '#1a2e4a' }}
                  placeholder="e.g. 75"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider" style={{ color: '#7a9aaa' }}>Height (cm)</label>
                <input 
                  type="number" 
                  value={height} 
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full rounded-xl p-3 text-sm focus:outline-none"
                  style={{ background: '#f0f7f7', border: '1px solid rgba(46,196,182,0.2)', color: '#1a2e4a' }}
                  placeholder="e.g. 180"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(46,196,182,0.1)' }}>
                <Target className="w-4 h-4" style={{ color: '#2ec4b6' }} />
              </div>
              <h3 className="font-display tracking-wide text-lg" style={{ color: '#1a2e4a' }}>Fitness Goals</h3>
            </div>
            <p className="text-sm mb-4" style={{ color: '#7a9aaa', fontWeight: 500 }}>Select all that apply.</p>
            <div className="flex flex-wrap gap-3">
              {GOAL_OPTIONS.map(goal => (
                <button
                  key={goal}
                  onClick={() => toggleSelection(goal, goals, setGoals)}
                  className={cn("px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border")}
                  style={goals.includes(goal) 
                    ? { background: 'linear-gradient(135deg, #1a9e92, #2ec4b6)', color: '#fff', border: 'none' }
                    : { background: '#f0f7f7', color: '#1a2e4a', border: '1px solid rgba(46,196,182,0.15)' }}
                >
                  {goal}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(46,196,182,0.1)' }}>
                <Activity className="w-4 h-4" style={{ color: '#2ec4b6' }} />
              </div>
              <h3 className="font-display tracking-wide text-lg" style={{ color: '#1a2e4a' }}>Experience Level</h3>
            </div>
            <p className="text-sm mb-4" style={{ color: '#7a9aaa', fontWeight: 500 }}>Select one.</p>
            <div className="flex flex-col gap-3">
              {EXPERIENCE_OPTIONS.map(level => (
                <button
                  key={level}
                  onClick={() => toggleSelection(level, [experience], (val) => setExperience(val[0]), true)}
                  className={cn("p-3 rounded-xl font-semibold text-left transition-all border flex justify-between items-center")}
                  style={experience === level 
                    ? { background: 'linear-gradient(135deg, #1a9e92, #2ec4b6)', color: '#fff', border: 'none' }
                    : { background: '#f0f7f7', color: '#1a2e4a', border: '1px solid rgba(46,196,182,0.15)' }}
                >
                  {level}
                  {experience === level && <CheckCircle2 className="w-5 h-5" />}
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(46,196,182,0.1)' }}>
                <Utensils className="w-4 h-4" style={{ color: '#2ec4b6' }} />
              </div>
              <h3 className="font-display tracking-wide text-lg" style={{ color: '#1a2e4a' }}>Dietary Restrictions</h3>
            </div>
            <p className="text-sm mb-4" style={{ color: '#7a9aaa', fontWeight: 500 }}>Select all that apply.</p>
            <div className="flex flex-wrap gap-3">
              {DIET_OPTIONS.map(option => (
                <button
                  key={option}
                  onClick={() => toggleSelection(option, diet, setDiet)}
                  className={cn("px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border")}
                  style={diet.includes(option) 
                    ? { background: 'linear-gradient(135deg, #1a9e92, #2ec4b6)', color: '#fff', border: 'none' }
                    : { background: '#f0f7f7', color: '#1a2e4a', border: '1px solid rgba(46,196,182,0.15)' }}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row justify-between mt-8 pt-6 gap-4" style={{ borderTop: '1px solid rgba(26,46,74,0.1)' }}>
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            className={cn(
              "px-6 py-3 font-semibold text-sm rounded-full transition-all w-full sm:w-auto",
              step === 1 && "hidden sm:block sm:invisible"
            )}
            style={{ color: '#7a9aaa' }}
          >
            Back
          </button>
          
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-8 py-3 font-bold rounded-full text-sm text-white flex items-center justify-center gap-2 w-full sm:w-auto transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #1a9e92, #2ec4b6)', boxShadow: '0 4px 16px rgba(46,196,182,0.3)' }}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-3 font-bold rounded-full text-sm text-white flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto transition-all hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(135deg, #1a9e92, #2ec4b6)', boxShadow: '0 4px 16px rgba(46,196,182,0.3)' }}
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
              {isSaving ? 'Saving...' : 'Complete Setup'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
