import React, { useState } from 'react';
import { Search, Loader2, ExternalLink } from 'lucide-react';
import { cn } from '../lib/utils';
import { askFitnessCoach } from '../lib/gemini';
import Markdown from 'react-markdown';

export default function FitnessNewsView() {
  const [query, setQuery] = useState('What are the latest trends in high-intensity interval training?');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [sources, setSources] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async () => {
    if (!query) return;

    setIsSearching(true);
    setError(null);
    setResult(null);
    setSources([]);

    try {
      const response = await askFitnessCoach(query);
      setResult(response || "No information found.");
    } catch (err: any) {
      console.error("Search failed:", err);
      setError(err.message || "Failed to fetch news.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Search className="w-8 h-8 text-ff-quaternary" />
        <div>
          <h3 className="text-2xl font-display tracking-wide text-white">Fitness News & Trends</h3>
          <p className="text-ff-muted">Get up-to-date information grounded by Google Search.</p>
        </div>
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 bg-ff-bg border border-ff-surface rounded-xl p-4 text-white focus:outline-none focus:border-ff-quaternary"
          placeholder="Ask about fitness news, research, or trends..."
        />
        <button
          onClick={handleSearch}
          disabled={!query || isSearching}
          className={cn(
            "px-8 rounded-xl font-bold transition-all flex items-center gap-2",
            query && !isSearching
              ? "bg-ff-quaternary text-black hover:bg-ff-quaternary/90"
              : "bg-ff-surface text-ff-muted cursor-not-allowed"
          )}
        >
          {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          Search
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-ff-bg rounded-[24px] border border-ff-surface p-8 space-y-6">
          <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-a:text-ff-quaternary">
            <Markdown>{result}</Markdown>
          </div>
          
          {sources.length > 0 && (
            <div className="pt-6 border-t border-ff-surface">
              <h4 className="text-sm font-bold text-ff-muted uppercase tracking-wider mb-4">Sources</h4>
              <div className="flex flex-wrap gap-2">
                {sources.map((source, idx) => (
                  <a 
                    key={idx}
                    href={source.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs bg-ff-surface hover:bg-ff-surface/80 text-white px-3 py-2 rounded-lg transition-colors border border-ff-surface hover:border-ff-quaternary/50"
                  >
                    <ExternalLink className="w-3 h-3 text-ff-quaternary" />
                    <span className="truncate max-w-[200px]">{source.title}</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
