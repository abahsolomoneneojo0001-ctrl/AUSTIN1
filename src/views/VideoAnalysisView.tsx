import React, { useState, useRef } from 'react';
import { Play, Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import Markdown from 'react-markdown';

export default function VideoAnalysisView() {
  const [video, setVideo] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setVideo(reader.result as string);
        setResult(null);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const analyzeVideo = async () => {
    if (!video) return;
    
    setIsAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      const ai = getAIClient();
      if (!ai) throw new Error("AI client not initialized.");
      
      const base64Data = video.split(',')[1];
      const mimeType = video.split(';')[0].split(':')[1];

      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: {
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType: mimeType,
              },
            },
            {
              text: "Analyze this workout video. Identify the exercise being performed. Provide a detailed form check, pointing out what the person is doing right and what they need to improve to avoid injury and maximize gains. Be specific and constructive.",
            },
          ],
        },
      });

      setResult(response.text || "Could not analyze the video.");

    } catch (err: any) {
      console.error("Video analysis failed:", err);
      setError(err.message || "Failed to analyze video.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Play className="w-8 h-8 text-[#4285F4]" />
        <div>
          <h3 className="text-2xl font-display tracking-wide text-white">Form Check Pro</h3>
          <p className="text-ff-muted">Upload a video of your lift for deep AI form analysis.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div 
            className="border-2 border-dashed border-ff-surface rounded-[24px] p-8 flex flex-col items-center justify-center text-center hover:border-[#4285F4]/50 transition-colors cursor-pointer min-h-[300px] relative overflow-hidden"
            onClick={() => fileInputRef.current?.click()}
          >
            {video ? (
              <video src={video} controls className="absolute inset-0 w-full h-full object-cover" />
            ) : (
              <>
                <Upload className="w-12 h-12 text-ff-muted mb-4" />
                <p className="text-white font-bold mb-2">Upload a video</p>
                <p className="text-sm text-ff-muted">Click to browse (mp4, webm)</p>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="video/*"
              onChange={handleVideoUpload}
            />
          </div>

          <button
            onClick={analyzeVideo}
            disabled={!video || isAnalyzing}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all",
              video && !isAnalyzing
                ? "bg-[#4285F4] text-white hover:bg-[#4285F4]/90"
                : "bg-ff-surface text-ff-muted cursor-not-allowed"
            )}
          >
            {isAnalyzing ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing Form...</>
            ) : (
              <><Play className="w-5 h-5" /> Analyze Video</>
            )}
          </button>

          {error && (
            <div className="bg-red-500/10 text-red-500 p-4 rounded-xl text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="bg-ff-bg rounded-[24px] border border-ff-surface p-8 min-h-[300px]">
          {result ? (
            <div className="prose prose-invert max-w-none prose-p:leading-relaxed prose-strong:text-[#4285F4]">
              <Markdown>{result}</Markdown>
            </div>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center">
              <CheckCircle2 className="w-12 h-12 text-ff-surface mb-4" />
              <p className="text-ff-muted">Upload a video and click analyze to get detailed feedback on your form.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
