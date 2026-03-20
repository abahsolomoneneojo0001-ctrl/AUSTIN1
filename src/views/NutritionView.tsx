import React, { useState, useRef, useEffect } from 'react';
import { Plus, Utensils, Droplet, Coffee, Camera, Loader2, Sparkles, Zap, X } from 'lucide-react';
import { cn } from '../lib/utils';
import { analyzeMealImage, getAIClient } from '../lib/gemini';
import { db, auth, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { format } from 'date-fns';
import Markdown from 'react-markdown';

export default function NutritionView() {
  const [meals, setMeals] = useState<any[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [scannedMealData, setScannedMealData] = useState<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // AI Diet Plan State
  const [aiDietPlan, setAiDietPlan] = useState<string | null>(null);
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);

  useEffect(() => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    const todayStr = format(new Date(), 'yyyy-MM-dd');
    const q = query(
      collection(db, 'meals'), 
      where('userId', '==', userId),
      where('date', '==', todayStr)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const mealDocs = snapshot.docs.map(doc => {
        const data = doc.data();
        let timeStr = '';
        if (data.timestamp) {
          // Handle Firestore timestamp
          const date = data.timestamp.toDate ? data.timestamp.toDate() : new Date(data.timestamp);
          timeStr = format(date, 'hh:mm a');
        } else {
          timeStr = format(new Date(), 'hh:mm a');
        }
        return {
          id: doc.id,
          time: timeStr,
          ...data
        };
      });
      setMeals(mealDocs);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'meals'));

    return () => unsubscribe();
  }, []);

  const generateAIDietPlan = async () => {
    const userId = auth.currentUser?.uid;
    if (!userId) return;

    setIsGeneratingPlan(true);
    try {
      const ai = getAIClient();
      if (!ai) throw new Error("AI client not initialized.");

      // Fetch user profile
      const userDoc = await getDoc(doc(db, 'users', userId));
      const userProfile = userDoc.exists() ? userDoc.data() : null;

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

      const recentMeals = meals.slice(0, 5);
      const mealContext = recentMeals.length > 0 
        ? `Recent meals today: ${recentMeals.map(m => `${m.name} (${m.calories} kcal)`).join(', ')}.`
        : "No meals logged today.";

      const prompt = `You are an expert AI nutritionist. Generate a personalized 1-day meal plan and general diet recommendations for the user.
      ${profileContext}
      ${mealContext}
      Consider their current goals, personal details, and strictly adhere to any dietary restrictions. Provide a balanced routine including breakfast, lunch, dinner, and snacks.
      Format the response in clean Markdown.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
      });

      setAiDietPlan(response.text || "Could not generate plan.");
    } catch (error) {
      console.error("Failed to generate AI diet plan:", error);
      alert("Failed to generate AI diet plan. Please try again.");
    } finally {
      setIsGeneratingPlan(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const userId = auth.currentUser?.uid;
    if (!userId) {
      alert("You must be logged in to save meals.");
      return;
    }

    setIsScanning(true);
    try {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const base64String = (reader.result as string).split(',')[1];
        const result = await analyzeMealImage(base64String, file.type);
        
        if (result) {
          setScannedMealData({
            name: result.name || 'Unknown Meal',
            type: 'Lunch', // Default type for scanned meals
            calories: result.calories || 0,
            protein: result.protein || 0,
            carbs: result.carbs || 0,
            fat: result.fat || 0,
          });
          setIsManualModalOpen(true);
        } else {
          alert("Could not analyze the meal. Please try again.");
        }
        setIsScanning(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error(error);
      setIsScanning(false);
      alert("An error occurred while scanning.");
    }
  };

  const handleManualSave = async (mealData: any) => {
    const userId = auth.currentUser?.uid;
    if (!userId) {
      alert("You must be logged in to save meals.");
      return;
    }

    try {
      const todayStr = format(new Date(), 'yyyy-MM-dd');
      await addDoc(collection(db, 'meals'), {
        userId,
        ...mealData,
        date: todayStr,
        timestamp: serverTimestamp()
      });
      setIsManualModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'meals');
    }
  };

  const totalCalories = meals.reduce((sum, meal) => sum + (meal.calories || 0), 0);
  const totalProtein = meals.reduce((sum, meal) => sum + (meal.protein || 0), 0);
  const totalCarbs = meals.reduce((sum, meal) => sum + (meal.carbs || 0), 0);
  const totalFat = meals.reduce((sum, meal) => sum + (meal.fat || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h2 className="text-xl font-display tracking-wide text-ff-text">TODAY — MAR 11</h2>
        <input 
          type="file" 
          accept="image/*" 
          capture="environment"
          className="hidden" 
          ref={fileInputRef}
          onChange={handleImageUpload}
        />
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => {
              setScannedMealData(null);
              setIsManualModalOpen(true);
            }}
            className="flex flex-1 sm:flex-none justify-center items-center gap-2 bg-ff-surface border border-ff-surface text-ff-text px-4 py-2 rounded-full font-bold text-sm hover:bg-ff-surface/80 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Log Meal</span>
            <span className="inline sm:hidden">Log</span>
          </button>
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isScanning}
            className="flex flex-1 sm:flex-none justify-center items-center gap-2 bg-ff-primary text-black px-4 py-2 rounded-full font-bold text-sm hover:bg-ff-primary/80 transition-colors disabled:opacity-50"
          >
            {isScanning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
            {isScanning ? 'Scanning...' : 'Scan Meal'}
          </button>
        </div>
      </div>
      
      {/* Macro Overview */}
      <div className="flex flex-col md:flex-row gap-8 items-center justify-center p-8 rounded-[20px] bg-ff-surface border border-ff-surface">
        <div className="relative w-48 h-48 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-ff-bg)" strokeWidth="10" />
            <circle cx="50" cy="50" r="45" fill="none" stroke="var(--color-ff-secondary)" strokeWidth="10" strokeDasharray="283" strokeDashoffset={Math.max(0, 283 - (totalCalories / 2400) * 283)} className="transition-all duration-1000" />
          </svg>
          <div className="absolute flex flex-col items-center justify-center text-center">
            <span className="text-3xl font-mono font-bold text-ff-text">{totalCalories}</span>
            <span className="text-xs text-ff-muted font-bold">of 2,400</span>
          </div>
        </div>

        <div className="flex md:flex-col gap-6 w-full md:w-auto overflow-x-auto pb-4 md:pb-0">
          {[
            { label: 'Protein', current: totalProtein, color: 'text-ff-quaternary', bg: 'bg-ff-quaternary', target: 180 },
            { label: 'Carbs', current: totalCarbs, color: 'text-ff-tertiary', bg: 'bg-ff-tertiary', target: 250 },
            { label: 'Fat', current: totalFat, color: 'text-ff-secondary', bg: 'bg-ff-secondary', target: 70 },
          ].map((macro) => (
            <div key={macro.label} className="min-w-[100px] flex flex-col items-center gap-2">
              <span className={cn("text-xl font-mono font-bold", macro.color)}>{macro.current}g</span>
              <span className="text-xs text-ff-muted font-bold">{macro.label}</span>
              <div className="h-1 w-full bg-ff-bg rounded-full overflow-hidden">
                <div className={cn("h-full rounded-full", macro.bg)} style={{ width: `${Math.min(100, (macro.current / macro.target) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Water Intake */}
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-sm bg-ff-text" />
          <h3 className="text-xl font-display tracking-wide text-ff-text uppercase">WATER INTAKE <span className="text-ff-muted ml-2">1.8 / 3.0 L</span></h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className={cn(
              "w-10 h-14 rounded-md transition-all cursor-pointer",
              i < 7 ? "bg-ff-tertiary shadow-[0_0_10px_rgba(0,229,255,0.3)]" : "bg-ff-surface"
            )} />
          ))}
        </div>
      </div>

      {/* AI Diet Plan Section */}
      <div className="p-6 rounded-[20px] bg-ff-surface border border-ff-surface">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-ff-tertiary" />
            <h3 className="text-xl font-display tracking-wide text-ff-text">AI DIET PLAN</h3>
          </div>
          <button
            onClick={generateAIDietPlan}
            disabled={isGeneratingPlan}
            className="px-4 py-2 bg-ff-tertiary/10 text-ff-tertiary font-bold rounded-full hover:bg-ff-tertiary/20 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isGeneratingPlan ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
            {isGeneratingPlan ? 'Generating...' : 'Generate Plan'}
          </button>
        </div>
        
        {aiDietPlan ? (
          <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-a:text-ff-tertiary bg-ff-bg p-6 rounded-xl border border-ff-surface">
            <Markdown>{aiDietPlan}</Markdown>
          </div>
        ) : (
          <div className="text-center p-8 bg-ff-bg rounded-xl border border-ff-surface">
            <p className="text-ff-muted">Click "Generate Plan" to get personalized diet recommendations based on your profile and logged meals.</p>
          </div>
        )}
      </div>

      {/* Meals */}
      <div className="space-y-4">
        <h3 className="text-xl font-display tracking-wide text-ff-text uppercase">MEALS</h3>

        <div className="space-y-4">
          {meals.map((meal) => (
            <div key={meal.id} className="rounded-[20px] bg-ff-surface overflow-hidden">
              <div className="p-4 flex justify-between items-center border-b border-ff-bg">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm bg-ff-text" />
                  <span className="font-bold text-ff-text">{meal.type}</span>
                  <span className="text-xs text-ff-muted ml-2">{meal.time}</span>
                </div>
                <span className="font-mono font-bold text-ff-secondary">{meal.calories} kcal</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-ff-muted">{meal.name}</span>
                  <div className="flex gap-3 text-xs font-mono">
                    <span className="text-ff-quaternary">{meal.protein}g P</span>
                    <span className="text-ff-tertiary">{meal.carbs}g C</span>
                    <span className="text-ff-secondary">{meal.fat}g F</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isManualModalOpen && (
        <ManualMealModal 
          initialData={scannedMealData}
          onClose={() => {
            setIsManualModalOpen(false);
            setScannedMealData(null);
          }} 
          onSave={(mealData) => {
            handleManualSave(mealData);
            setScannedMealData(null);
          }} 
        />
      )}
    </div>
  );
}

function ManualMealModal({ onClose, onSave, initialData }: { onClose: () => void, onSave: (meal: any) => void, initialData?: any }) {
  const [name, setName] = useState(initialData?.name || '');
  const [type, setType] = useState(initialData?.type || 'Breakfast');
  const [calories, setCalories] = useState(initialData?.calories?.toString() || '');
  const [protein, setProtein] = useState(initialData?.protein?.toString() || '');
  const [carbs, setCarbs] = useState(initialData?.carbs?.toString() || '');
  const [fat, setFat] = useState(initialData?.fat?.toString() || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      name,
      type,
      calories: Number(calories) || 0,
      protein: Number(protein) || 0,
      carbs: Number(carbs) || 0,
      fat: Number(fat) || 0,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="bg-ff-bg border border-ff-surface rounded-2xl p-6 w-full max-w-md animate-in zoom-in-95 duration-200">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-display tracking-wide text-white">LOG MEAL</h3>
          <button onClick={onClose} className="text-ff-muted hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-ff-muted mb-1">Meal Name</label>
            <input 
              required 
              type="text" 
              value={name} 
              onChange={e => setName(e.target.value)} 
              className="w-full bg-ff-surface border border-ff-surface rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ff-primary transition-colors" 
              placeholder="e.g., Chicken Salad" 
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-ff-muted mb-1">Type</label>
            <select 
              value={type} 
              onChange={e => setType(e.target.value)} 
              className="w-full bg-ff-surface border border-ff-surface rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ff-primary transition-colors appearance-none"
            >
              <option>Breakfast</option>
              <option>Lunch</option>
              <option>Dinner</option>
              <option>Snack</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-ff-muted mb-1">Calories</label>
              <input 
                required 
                type="number" 
                min="0"
                value={calories} 
                onChange={e => setCalories(e.target.value)} 
                className="w-full bg-ff-surface border border-ff-surface rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ff-primary transition-colors" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-ff-muted mb-1">Protein (g)</label>
              <input 
                required 
                type="number" 
                min="0"
                value={protein} 
                onChange={e => setProtein(e.target.value)} 
                className="w-full bg-ff-surface border border-ff-surface rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ff-primary transition-colors" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-ff-muted mb-1">Carbs (g)</label>
              <input 
                required 
                type="number" 
                min="0"
                value={carbs} 
                onChange={e => setCarbs(e.target.value)} 
                className="w-full bg-ff-surface border border-ff-surface rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ff-primary transition-colors" 
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-ff-muted mb-1">Fat (g)</label>
              <input 
                required 
                type="number" 
                min="0"
                value={fat} 
                onChange={e => setFat(e.target.value)} 
                className="w-full bg-ff-surface border border-ff-surface rounded-xl px-4 py-3 text-white focus:outline-none focus:border-ff-primary transition-colors" 
              />
            </div>
          </div>
          <div className="pt-2">
            <button 
              type="submit" 
              className="w-full bg-ff-primary text-black font-bold py-4 rounded-xl hover:bg-ff-primary/90 transition-colors"
            >
              Save Meal
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
