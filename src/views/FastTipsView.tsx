import React, { useState } from 'react';
import { Zap, Loader2, Send } from 'lucide-react';
import { cn } from '../lib/utils';
import { askFitnessCoach } from '../lib/gemini';
import Markdown from 'react-markdown';

export default function FastTipsView() {
  const [query, setQuery] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getTip = async (prompt?: string) => {
    const promptToUse = prompt || query;
    if (!promptToUse) return;

    setQuery(promptToUse);
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await askFitnessCoach(`Provide a quick, actionable fitness tip or answer regarding: ${promptToUse}. Keep it under 3 sentences.`);
      setResult(response);
    } catch (err: any) {
      console.error("Tip generation failed:", err);
      setError(err.message || "Failed to get tip.");
    } finally {
      setIsGenerating(false);
    }
  };

  const quickPrompts = [
    "How to fix lower back pain from deadlifts?",
    "Best pre-workout snack?",
    "How to breathe during squats?",
    "Quick stretch for tight hamstrings"
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Zap className="w-8 h-8 text-[#FBBC05]" />
        <div>
          <h3 className="text-2xl font-display tracking-wide text-white">Quick Tips</h3>
          <p className="text-ff-muted">Lightning-fast fitness advice using Gemini Flash Lite.</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        <div className="flex-1 space-y-4">
          <div className="flex gap-4">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && getTip()}
              className="flex-1 bg-ff-bg border border-ff-surface rounded-xl p-4 text-white focus:outline-none focus:border-[#FBBC05]"
              placeholder="Ask a quick fitness question..."
            />
            <button
              onClick={getTip}
              disabled={!query || isGenerating}
              className={cn(
                "px-6 rounded-xl font-bold transition-all flex items-center justify-center",
                query && !isGenerating
                  ? "bg-[#FBBC05] text-black hover:bg-[#FBBC05]/90"
                  : "bg-ff-surface text-ff-muted cursor-not-allowed"
              )}
            >
              {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((p, i) => (
              <button
                key={i}
                onClick={() => getTip(p)}
                className="text-xs bg-ff-surface hover:bg-ff-surface/80 text-ff-muted hover:text-white px-3 py-2 rounded-full transition-colors border border-ff-surface hover:border-[#FBBC05]/50"
              >
                {p}
              </button>
            ))}
          </div>

          {error && (
            <div className="bg-red-500/10 text-red-500 p-4 rounded-xl text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex-1 bg-ff-bg rounded-[24px] border border-ff-surface p-8 min-h-[200px] flex items-center justify-center">
          {result ? (
            <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-strong:text-[#FBBC05] text-lg text-center">
              <Markdown>{result}</Markdown>
            </div>
          ) : (
            <div className="text-center">
              <Zap className="w-12 h-12 text-ff-surface mx-auto mb-4" />
              <p className="text-ff-muted">Ask a question to get a lightning-fast response.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
