import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Loader2 } from 'lucide-react';
import { askFitnessCoach } from '../lib/gemini';
import { cn } from '../lib/utils';
import { db, auth } from '../lib/firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

export default function AICoachView() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: "Hi Jacob! I'm your FitWithAustin AI Coach. I can help you generate personalized workout plans, suggest meals based on your macros, or answer any fitness questions. What's on your mind today?"
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: userMessage }]);
    setIsLoading(true);

    let context = "User profile context not available.";
    const userId = auth.currentUser?.uid;
    
    if (userId) {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        const userProfile = userDoc.exists() ? userDoc.data() : null;
        
        let profileContext = '';
        if (userProfile) {
          const { personalDetails, fitnessGoals, experienceLevel, dietaryRestrictions, stats } = userProfile;
          if (personalDetails) {
            profileContext += `\nAge: ${personalDetails.age || 'N/A'}, Weight: ${personalDetails.weight || 'N/A'}kg, Height: ${personalDetails.height || 'N/A'}cm, Gender: ${personalDetails.gender || 'N/A'}.`;
          }
          if (fitnessGoals) profileContext += `\nFitness Goals: ${fitnessGoals}.`;
          if (experienceLevel) profileContext += `\nExperience Level: ${experienceLevel}.`;
          if (dietaryRestrictions) profileContext += `\nDietary Restrictions: ${dietaryRestrictions}.`;
          if (stats) {
            profileContext += `\nTotal Workouts: ${stats.totalWorkouts || 0}, Total Minutes: ${stats.totalMinutes || 0}, Calories Burned: ${stats.caloriesBurned || 0}.`;
          }
        }

        // Fetch recent workouts
        const qWorkouts = query(collection(db, 'workouts'), where('userId', '==', userId));
        const workoutsSnap = await getDocs(qWorkouts);
        const recentWorkouts = workoutsSnap.docs
          .map(doc => doc.data())
          .sort((a, b) => (b.timestamp?.toMillis() || 0) - (a.timestamp?.toMillis() || 0))
          .slice(0, 5);
          
        let activityContext = '';
        if (recentWorkouts.length > 0) {
          activityContext = `\nRecent Workouts: ${recentWorkouts.map(w => `${w.title} (${w.duration}, ${w.calories} kcal)`).join(', ')}.`;
        } else {
          activityContext = `\nNo recent workouts logged.`;
        }

        context = `User Profile:${profileContext}\nActivity:${activityContext}`;
      } catch (error) {
        console.error("Error fetching context:", error);
      }
    }
    
    const response = await askFitnessCoach(userMessage, context);
    
    setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'assistant', content: response }]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[calc(100vh-8rem)] bg-ff-surface rounded-3xl border border-ff-surface overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Chat Header */}
      <div className="p-4 border-b border-ff-bg bg-ff-surface flex items-center gap-4">
        <div className="relative">
          <div className="w-12 h-12 rounded-full bg-ff-primary/20 flex items-center justify-center border border-ff-primary/30">
            <Bot className="w-6 h-6 text-ff-primary" />
          </div>
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-ff-primary border-2 border-ff-surface rounded-full" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-ff-text">FWA AI Coach</h3>
          <p className="text-sm text-ff-primary font-medium">Online & Ready</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={cn(
              "flex gap-4 max-w-[85%] md:max-w-[75%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-1",
              msg.role === 'user' ? "bg-ff-bg" : "bg-ff-primary/20 text-ff-primary"
            )}>
              {msg.role === 'user' ? <User className="w-4 h-4 text-ff-muted" /> : <Bot className="w-4 h-4" />}
            </div>
            
            <div className={cn(
              "p-4 rounded-2xl text-sm md:text-base leading-relaxed whitespace-pre-wrap",
              msg.role === 'user' 
                ? "bg-ff-primary text-black font-medium rounded-tr-sm" 
                : "bg-ff-bg text-ff-text rounded-tl-sm"
            )}>
              {msg.content}
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-4 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-ff-primary/20 text-ff-primary flex items-center justify-center flex-shrink-0 mt-1">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-4 rounded-2xl bg-ff-bg text-ff-muted rounded-tl-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Thinking...
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 bg-ff-surface border-t border-ff-bg">
        <form onSubmit={handleSend} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about workouts, nutrition, or recovery..."
            className="w-full bg-ff-bg border border-ff-bg rounded-full py-3 pl-5 pr-14 text-ff-text placeholder:text-ff-muted focus:outline-none focus:border-ff-primary focus:ring-1 focus:ring-ff-primary transition-all"
            disabled={isLoading}
          />
          <button 
            type="submit"
            disabled={!input.trim() || isLoading}
            className="absolute right-2 p-2 bg-ff-primary hover:bg-ff-primary/80 disabled:bg-ff-bg disabled:text-ff-muted text-black rounded-full transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
