import React, { useState, useRef } from 'react';
import { Video, Upload, Loader2, Play, Image as ImageIcon } from 'lucide-react';
import { cn } from '../lib/utils';
import { GoogleGenAI } from '@google/genai';

export default function VeoVideoView() {
  const [image, setImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('A cinematic, high-energy workout video of this person exercising.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let width = img.width;
          let height = img.height;
          const maxDim = 512;
          
          if (width > height && width > maxDim) {
            height *= maxDim / width;
            width = maxDim;
          } else if (height > maxDim) {
            width *= maxDim / height;
            height = maxDim;
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          
          const resizedImage = canvas.toDataURL('image/jpeg', 0.7);
          setImage(resizedImage);
          setVideoUrl(null);
          setError(null);
        };
        img.src = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  };

  const generateVideo = async () => {
    if (!image) return;
    
    setIsGenerating(true);
    setError(null);
    setVideoUrl(null);
    setProgress('Initializing Veo model...');

    try {
      // Check if API key is selected (for Veo, users need their own key)
      if ((window as any).aistudio && !(await (window as any).aistudio.hasSelectedApiKey())) {
        await (window as any).aistudio.openSelectKey();
        // Assume success and continue
      }

      // Create a new client right before the call to get the latest key
      const apiKey = (import.meta.env as any).VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("API key is missing. Please check your .env file.");
      
      const ai = new GoogleGenAI({ apiKey });
      
      // Extract base64 data
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];

      setProgress('Submitting generation request...');
      
      let operation = await ai.models.generateVideos({
        model: 'veo-3.1-fast-generate-preview',
        prompt: prompt,
        image: {
          imageBytes: base64Data,
          mimeType: mimeType,
        },
        config: {
          numberOfVideos: 1,
          resolution: '720p',
          aspectRatio: '16:9'
        }
      });

      setProgress('Generating video... This may take a few minutes.');

      while (!operation.done) {
        await new Promise(resolve => setTimeout(resolve, 10000));
        operation = await ai.operations.getVideosOperation({operation: operation});
        setProgress('Still generating... Veo is working its magic.');
      }

      const downloadLink = operation.response?.generatedVideos?.[0]?.video?.uri;
      
      if (downloadLink) {
        setProgress('Fetching generated video...');
        const response = await fetch(downloadLink, {
          method: 'GET',
          headers: {
            'x-goog-api-key': apiKey,
          },
        });
        
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          setVideoUrl(url);
        } else {
          throw new Error("Failed to fetch the generated video file.");
        }
      } else {
        throw new Error("No video URL returned from the operation.");
      }

    } catch (err: any) {
      console.error("Video generation failed:", err);
      const errorMessage = err.message || JSON.stringify(err);
      
      if (errorMessage.includes("403") || errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("permission")) {
        setError("Your API key does not have permission to use the Veo model. Please ensure you select a paid Google Cloud API key with access to Veo.");
        if ((window as any).aistudio) {
          (window as any).aistudio.openSelectKey();
        }
      } else if (errorMessage.includes("Requested entity was not found")) {
        setError("API key not found or invalid. Please select your API key again.");
        if ((window as any).aistudio) {
          (window as any).aistudio.openSelectKey();
        }
      } else {
        setError(err.message || "Failed to generate video.");
      }
    } finally {
      setIsGenerating(false);
      setProgress('');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Video className="w-8 h-8 text-ff-secondary" />
        <div>
          <h3 className="text-2xl font-display tracking-wide text-white">Animate Workout</h3>
          <p className="text-ff-muted">Turn a static photo into a dynamic workout video using Veo.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div 
            className="border-2 border-dashed border-ff-surface rounded-[24px] p-8 flex flex-col items-center justify-center text-center hover:border-ff-secondary/50 transition-colors cursor-pointer min-h-[300px] relative overflow-hidden"
            onClick={() => fileInputRef.current?.click()}
          >
            {image ? (
              <img src={image} alt="Upload" className="absolute inset-0 w-full h-full object-cover opacity-50" />
            ) : (
              <>
                <ImageIcon className="w-12 h-12 text-ff-muted mb-4" />
                <p className="text-white font-bold mb-2">Upload a photo</p>
                <p className="text-sm text-ff-muted">Click to browse</p>
              </>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept="image/*"
              onChange={handleImageUpload}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-ff-muted mb-2 uppercase tracking-wider">
              Animation Prompt
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-ff-bg border border-ff-surface rounded-xl p-4 text-white focus:outline-none focus:border-ff-secondary h-24 resize-none"
              placeholder="Describe how the person should move..."
            />
          </div>

          <button
            onClick={generateVideo}
            disabled={!image || isGenerating}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all",
              image && !isGenerating
                ? "bg-ff-secondary text-white hover:bg-ff-secondary/90"
                : "bg-ff-surface text-ff-muted cursor-not-allowed"
            )}
          >
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> {progress || 'Generating...'}</>
            ) : (
              <><Play className="w-5 h-5" /> Generate Video</>
            )}
          </button>

          {error && (
            <div className="bg-red-500/10 text-red-500 p-4 rounded-xl text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="bg-ff-bg rounded-[24px] border border-ff-surface flex items-center justify-center overflow-hidden min-h-[300px]">
          {videoUrl ? (
            <video 
              src={videoUrl} 
              controls 
              autoPlay 
              loop 
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-8">
              <Video className="w-12 h-12 text-ff-surface mx-auto mb-4" />
              <p className="text-ff-muted">Your generated video will appear here.</p>
              <p className="text-xs text-ff-surface mt-2">Powered by Veo</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
