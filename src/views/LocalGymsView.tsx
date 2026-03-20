import React, { useState, useEffect } from 'react';
import { MapPin, Loader2, ExternalLink, Navigation, Search } from 'lucide-react';
import { cn } from '../lib/utils';
import { getAIClient } from '../lib/gemini';
import Markdown from 'react-markdown';

export default function LocalGymsView() {
  const [query, setQuery] = useState('Find good gyms or fitness centers near me.');
  const [isSearching, setIsSearching] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [places, setPlaces] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude
          });
        },
        (err) => {
          console.warn("Geolocation not available or denied:", err);
        }
      );
    }
  }, []);

  const handleSearch = async () => {
    if (!query) return;
    
    setIsSearching(true);
    setError(null);
    setResult(null);
    setPlaces([]);

    try {
      const ai = getAIClient();
      if (!ai) throw new Error("AI client not initialized.");

      const config: any = {
        tools: [{ googleMaps: {} }],
      };

      if (location) {
        config.toolConfig = {
          retrievalConfig: {
            latLng: location
          }
        };
      }

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: query,
        config
      });

      setResult(response.text || "No information found.");

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (chunks) {
        const extractedPlaces = chunks
          .filter((c: any) => c.maps?.uri && c.maps?.title)
          .map((c: any) => ({ uri: c.maps.uri, title: c.maps.title }));
        
        // Deduplicate
        const uniquePlaces = Array.from(new Set(extractedPlaces.map(p => p.uri)))
          .map(uri => extractedPlaces.find(p => p.uri === uri));
          
        setPlaces(uniquePlaces);
      }

    } catch (err: any) {
      console.error("Search failed:", err);
      setError(err.message || "Failed to find locations.");
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <MapPin className="w-8 h-8 text-[#FA114F]" />
        <div>
          <h3 className="text-2xl font-display tracking-wide text-white">Local Gyms & Studios</h3>
          <p className="text-ff-muted">Find the best workout spots around you using Google Maps.</p>
        </div>
      </div>

      <div className="flex gap-4">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          className="flex-1 bg-ff-bg border border-ff-surface rounded-xl p-4 text-white focus:outline-none focus:border-[#FA114F]"
          placeholder="e.g., Crossfit gyms near me, Yoga studios in downtown..."
        />
        <button
          onClick={handleSearch}
          disabled={!query || isSearching}
          className={cn(
            "px-8 rounded-xl font-bold transition-all flex items-center gap-2",
            query && !isSearching
              ? "bg-[#FA114F] text-white hover:bg-[#FA114F]/90"
              : "bg-ff-surface text-ff-muted cursor-not-allowed"
          )}
        >
          {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          Search
        </button>
      </div>

      {!location && (
        <p className="text-xs text-ff-muted flex items-center gap-1">
          <Navigation className="w-3 h-3" /> Location access is disabled. Results may not be perfectly localized.
        </p>
      )}

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-xl text-sm">
          {error}
        </div>
      )}

      {result && (
        <div className="bg-ff-bg rounded-[24px] border border-ff-surface p-8 space-y-6">
          <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-a:text-[#FA114F]">
            <Markdown>{result}</Markdown>
          </div>
          
          {places.length > 0 && (
            <div className="pt-6 border-t border-ff-surface">
              <h4 className="text-sm font-bold text-ff-muted uppercase tracking-wider mb-4">Locations Found</h4>
              <div className="flex flex-wrap gap-2">
                {places.map((place, idx) => (
                  <a 
                    key={idx}
                    href={place.uri}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-xs bg-ff-surface hover:bg-ff-surface/80 text-white px-3 py-2 rounded-lg transition-colors border border-ff-surface hover:border-[#FA114F]/50"
                  >
                    <MapPin className="w-3 h-3 text-[#FA114F]" />
                    <span className="truncate max-w-[200px]">{place.title}</span>
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
