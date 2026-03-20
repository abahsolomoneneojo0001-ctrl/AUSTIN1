import React, { useState } from 'react';
import { Image as ImageIcon, Loader2, Wand2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { GoogleGenAI } from '@google/genai';

export default function ImageGenView() {
  const [prompt, setPrompt] = useState('A highly motivated athlete crossing the finish line of a marathon, cinematic lighting, photorealistic.');
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateImage = async () => {
    if (!prompt) return;
    
    setIsGenerating(true);
    setError(null);
    setImageUrl(null);

    try {
      // Check if API key is selected
      if ((window as any).aistudio && !(await (window as any).aistudio.hasSelectedApiKey())) {
        await (window as any).aistudio.openSelectKey();
      }

      const apiKey = process.env.API_KEY || process.env.GEMINI_API_KEY;
      if (!apiKey) throw new Error("API key is missing.");
      
      const ai = new GoogleGenAI({ apiKey });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [{ text: prompt }],
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9"
          }
        },
      });

      let foundImage = false;
      for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
          const base64EncodeString = part.inlineData.data;
          setImageUrl(`data:image/png;base64,${base64EncodeString}`);
          foundImage = true;
          break;
        }
      }

      if (!foundImage) {
        throw new Error("No image was returned by the model.");
      }

    } catch (err: any) {
      console.error("Image generation failed:", err);
      const errorMessage = err.message || JSON.stringify(err);
      
      if (errorMessage.includes("403") || errorMessage.includes("PERMISSION_DENIED") || errorMessage.includes("permission")) {
        setError("Your API key does not have permission to use this image model. Please ensure you select a paid Google Cloud API key.");
        if ((window as any).aistudio) {
          (window as any).aistudio.openSelectKey();
        }
      } else if (errorMessage.includes("Requested entity was not found")) {
        setError("API key not found or invalid. Please select your API key again.");
        if ((window as any).aistudio) {
          (window as any).aistudio.openSelectKey();
        }
      } else {
        setError(err.message || "Failed to generate image.");
      }
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <ImageIcon className="w-8 h-8 text-ff-tertiary" />
        <div>
          <h3 className="text-2xl font-display tracking-wide text-white">Visualize Your Goal</h3>
          <p className="text-ff-muted">Generate inspiring fitness imagery to keep you motivated.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-ff-muted mb-2 uppercase tracking-wider">
              What is your fitness goal?
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full bg-ff-bg border border-ff-surface rounded-xl p-4 text-white focus:outline-none focus:border-ff-tertiary h-32 resize-none"
              placeholder="Describe your ideal fitness achievement..."
            />
          </div>

          <button
            onClick={generateImage}
            disabled={!prompt || isGenerating}
            className={cn(
              "w-full flex items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all",
              prompt && !isGenerating
                ? "bg-ff-tertiary text-white hover:bg-ff-tertiary/90"
                : "bg-ff-surface text-ff-muted cursor-not-allowed"
            )}
          >
            {isGenerating ? (
              <><Loader2 className="w-5 h-5 animate-spin" /> Generating...</>
            ) : (
              <><Wand2 className="w-5 h-5" /> Generate Image</>
            )}
          </button>

          {error && (
            <div className="bg-red-500/10 text-red-500 p-4 rounded-xl text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="bg-ff-bg rounded-[24px] border border-ff-surface flex items-center justify-center overflow-hidden min-h-[300px] relative">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt="Generated Goal" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="text-center p-8">
              <ImageIcon className="w-12 h-12 text-ff-surface mx-auto mb-4" />
              <p className="text-ff-muted">Your generated image will appear here.</p>
            </div>
          )}
          
          {isGenerating && (
            <div className="absolute inset-0 bg-ff-bg/80 backdrop-blur-sm flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-ff-tertiary animate-spin" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
