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
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-display tracking-wide" style={{ color: 'var(--color-ff-text)' }}>YOUR PROFILE</h2>
        <p className="text-ff-muted">Help us personalize your AI-generated plans.</p>
      </div>

      <div className="flex items-center justify-center gap-2 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className={cn(
            "h-2 rounded-full transition-all duration-300",
            i === step ? "w-12 bg-ff-primary" : i < step ? "w-8 bg-ff-primary/50" : "w-8 bg-ff-surface"
          )} />
        ))}
      </div>

      <div className="bg-ff-surface rounded-[24px] p-6 md:p-8 border" style={{ borderColor: 'var(--color-ff-input-border)' }}>
        {step === 1 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-3 mb-6">
              <User className="w-6 h-6" style={{ color: 'var(--color-ff-primary)' }} />
              <h3 className="text-xl font-bold" style={{ color: 'var(--color-ff-text)' }}>Personal Details</h3>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-bold text-ff-muted uppercase tracking-wider">Age</label>
                <input 
                  type="number" 
                  value={age} 
                  onChange={(e) => setAge(e.target.value)}
                  className="w-full rounded-xl p-4 focus:outline-none border"
                  style={{ backgroundColor: 'var(--color-ff-input-bg)', color: 'var(--color-ff-text)', borderColor: 'var(--color-ff-input-border)' }}
                  placeholder="e.g. 28"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-ff-muted uppercase tracking-wider">Gender</label>
                <select 
                  value={gender} 
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full rounded-xl p-4 focus:outline-none appearance-none border"
                  style={{ backgroundColor: 'var(--color-ff-input-bg)', color: 'var(--color-ff-text)', borderColor: 'var(--color-ff-input-border)' }}
                >
                  <option value="">Select...</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-ff-muted uppercase tracking-wider">Weight (kg)</label>
                <input 
                  type="number" 
                  value={weight} 
                  onChange={(e) => setWeight(e.target.value)}
                  className="w-full rounded-xl p-4 focus:outline-none border"
                  style={{ backgroundColor: 'var(--color-ff-input-bg)', color: 'var(--color-ff-text)', borderColor: 'var(--color-ff-input-border)' }}
                  placeholder="e.g. 75"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-ff-muted uppercase tracking-wider">Height (cm)</label>
                <input 
                  type="number" 
                  value={height} 
                  onChange={(e) => setHeight(e.target.value)}
                  className="w-full rounded-xl p-4 focus:outline-none border"
                  style={{ backgroundColor: 'var(--color-ff-input-bg)', color: 'var(--color-ff-text)', borderColor: 'var(--color-ff-input-border)' }}
                  placeholder="e.g. 180"
                />
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
            <div className="flex items-center gap-3 mb-6">
              <Target className="w-6 h-6" style={{ color: 'var(--color-ff-primary)' }} />
              <h3 className="text-xl font-bold" style={{ color: 'var(--color-ff-text)' }}>Fitness Goals</h3>
            </div>
            <p className="text-sm text-ff-muted mb-4">Select all that apply.</p>
            <div className="flex flex-wrap gap-3">
              {GOAL_OPTIONS.map(goal => (
                <button
                  key={goal}
                  onClick={() => toggleSelection(goal, goals, setGoals)}
                  className={cn(
                    "px-4 py-3 rounded-xl font-bold text-sm transition-all border",
                    goals.includes(goal) 
                      ? "border-ff-primary" 
                      : "bg-ff-surface text-ff-muted border-ff-input-border hover:border-ff-primary/50"
                  )}
                  style={goals.includes(goal) ? { backgroundColor: 'var(--color-ff-empty)', color: 'var(--color-ff-primary)' } : {}}
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
              <Activity className="w-6 h-6" style={{ color: 'var(--color-ff-primary)' }} />
              <h3 className="text-xl font-bold" style={{ color: 'var(--color-ff-text)' }}>Experience Level</h3>
            </div>
            <p className="text-sm text-ff-muted mb-4">Select one.</p>
            <div className="flex flex-col gap-3">
              {EXPERIENCE_OPTIONS.map(level => (
                <button
                  key={level}
                  onClick={() => toggleSelection(level, [experience], (val) => setExperience(val[0]), true)}
                  className={cn(
                    "p-4 rounded-xl font-bold text-left transition-all border flex justify-between items-center",
                    experience === level 
                      ? "border-ff-primary" 
                      : "bg-ff-surface text-ff-muted border-ff-input-border hover:border-ff-primary/50"
                  )}
                  style={experience === level ? { backgroundColor: 'var(--color-ff-empty)', color: 'var(--color-ff-primary)' } : {}}
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
              <Utensils className="w-6 h-6" style={{ color: 'var(--color-ff-primary)' }} />
              <h3 className="text-xl font-bold" style={{ color: 'var(--color-ff-text)' }}>Dietary Restrictions</h3>
            </div>
            <p className="text-sm text-ff-muted mb-4">Select all that apply.</p>
            <div className="flex flex-wrap gap-3">
              {DIET_OPTIONS.map(option => (
                <button
                  key={option}
                  onClick={() => toggleSelection(option, diet, setDiet)}
                  className={cn(
                    "px-4 py-3 rounded-xl font-bold text-sm transition-all border",
                    diet.includes(option) 
                      ? "border-ff-primary" 
                      : "bg-ff-surface text-ff-muted border-ff-input-border hover:border-ff-primary/50"
                  )}
                  style={diet.includes(option) ? { backgroundColor: 'var(--color-ff-empty)', color: 'var(--color-ff-primary)' } : {}}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex flex-col-reverse sm:flex-row justify-between mt-8 pt-6 gap-4 border-t" style={{ borderTopColor: 'var(--color-ff-input-border)' }}>
          <button
            onClick={() => setStep(Math.max(1, step - 1))}
            className={cn(
              "px-6 py-3 font-bold transition-colors w-full sm:w-auto",
              step === 1 && "hidden sm:block sm:invisible"
            )}
            style={{ color: 'var(--color-ff-text)' }}
          >
            Back
          </button>
          
          {step < 4 ? (
            <button
              onClick={() => setStep(step + 1)}
              className="px-8 py-3 font-bold rounded-full hover:opacity-80 transition-colors flex items-center justify-center gap-2 w-full sm:w-auto"
              style={{ backgroundColor: 'var(--color-ff-primary)', color: '#ffffff' }}
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-8 py-3 font-bold rounded-full flex items-center justify-center gap-2 disabled:opacity-50 w-full sm:w-auto transition-colors"
              style={{ backgroundColor: 'var(--color-ff-primary)', color: '#ffffff' }}
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
