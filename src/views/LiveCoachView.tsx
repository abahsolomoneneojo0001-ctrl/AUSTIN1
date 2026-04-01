import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Loader2, StopCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

export default function LiveCoachView() {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const audioWorkletNodeRef = useRef<AudioWorkletNode | null>(null);
  const nextPlayTimeRef = useRef<number>(0);

  const startSession = async () => {
    setIsConnecting(true);
    setError(null);

    try {
      const apiKey = (import.meta.env as any).VITE_GEMINI_API_KEY;
      if (!apiKey) throw new Error("Gemini API key is missing. Please check your .env file.");

      const ai = new GoogleGenAI({ apiKey });

      // 1. Setup Audio Context for Playback
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      nextPlayTimeRef.current = audioContextRef.current.currentTime;

      // 2. Setup Microphone Capture
      mediaStreamRef.current = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = audioContextRef.current.createMediaStreamSource(mediaStreamRef.current);
      
      // We need a ScriptProcessor or AudioWorklet to get raw PCM data. 
      // For simplicity in this environment, we'll use ScriptProcessor (though deprecated, it's easier to inline without external files).
      const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1);
      
      source.connect(processor);
      processor.connect(audioContextRef.current.destination);

      // 3. Connect to Live API
      const sessionPromise = ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are Austin, an energetic and motivating personal fitness coach. Keep your responses concise, encouraging, and focused on fitness, form, and motivation. You are talking to the user during their workout.",
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            setIsConnecting(false);
            
            // Start sending audio
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              // Convert Float32Array to Int16Array (PCM 16-bit)
              const pcm16 = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                let s = Math.max(-1, Math.min(1, inputData[i]));
                pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
              }
              
              // Base64 encode
              const buffer = new ArrayBuffer(pcm16.length * 2);
              const view = new DataView(buffer);
              for (let i = 0; i < pcm16.length; i++) {
                view.setInt16(i * 2, pcm16[i], true); // true for little-endian
              }
              
              let binary = '';
              const bytes = new Uint8Array(buffer);
              for (let i = 0; i < bytes.byteLength; i++) {
                binary += String.fromCharCode(bytes[i]);
              }
              const base64Data = btoa(binary);

              sessionPromise.then(session => {
                session.sendRealtimeInput({
                  media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
                });
              });
            };
          },
          onmessage: (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio && audioContextRef.current) {
              // Decode base64 to PCM 16-bit
              const binaryStr = atob(base64Audio);
              const len = binaryStr.length;
              const bytes = new Uint8Array(len);
              for (let i = 0; i < len; i++) {
                bytes[i] = binaryStr.charCodeAt(i);
              }
              
              const pcm16 = new Int16Array(bytes.buffer);
              const float32 = new Float32Array(pcm16.length);
              for (let i = 0; i < pcm16.length; i++) {
                float32[i] = pcm16[i] / 32768.0;
              }

              const audioBuffer = audioContextRef.current.createBuffer(1, float32.length, 24000);
              audioBuffer.copyToChannel(float32, 0);

              const sourceNode = audioContextRef.current.createBufferSource();
              sourceNode.buffer = audioBuffer;
              sourceNode.connect(audioContextRef.current.destination);
              
              const playTime = Math.max(audioContextRef.current.currentTime, nextPlayTimeRef.current);
              sourceNode.start(playTime);
              nextPlayTimeRef.current = playTime + audioBuffer.duration;
            }

            if (message.serverContent?.interrupted) {
              nextPlayTimeRef.current = audioContextRef.current?.currentTime || 0;
            }
          },
          onerror: (err) => {
            console.error("Live API Error:", err);
            setError("Connection error occurred.");
            stopSession();
          },
          onclose: () => {
            stopSession();
          }
        }
      });

      sessionRef.current = await sessionPromise;

    } catch (err: any) {
      console.error("Failed to start session:", err);
      if (err.name === 'NotAllowedError' || err.message === 'Permission denied') {
        setError("Microphone access was denied. Please allow microphone permissions in your browser settings and try again.");
      } else {
        setError(err.message || "Failed to start voice coach.");
      }
      setIsConnecting(false);
      stopSession();
    }
  };

  const stopSession = () => {
    if (sessionRef.current) {
      sessionRef.current.close();
      sessionRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(t => t.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
  };

  useEffect(() => {
    return () => {
      stopSession();
    };
  }, []);

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-8">
      <div className="w-32 h-32 rounded-full bg-ff-surface border-4 border-ff-primary/20 flex items-center justify-center relative">
        {isConnected && (
          <div className="absolute inset-0 rounded-full border-4 border-ff-primary animate-ping opacity-20" />
        )}
        <Mic className={cn("w-12 h-12", isConnected ? "text-ff-primary" : "text-ff-muted")} />
      </div>

      <div>
        <h3 className="text-2xl font-display tracking-wide text-white mb-2">
          {isConnected ? "Coach Austin is listening..." : "Ready to train?"}
        </h3>
        <p className="text-ff-muted max-w-md mx-auto">
          {isConnected 
            ? "Speak naturally. Ask for form tips, motivation, or what exercise to do next." 
            : "Start a live voice session with your AI coach for real-time guidance during your workout."}
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 px-4 py-2 rounded-lg text-sm">
          {error}
        </div>
      )}

      <button
        onClick={isConnected ? stopSession : startSession}
        disabled={isConnecting}
        className={cn(
          "flex items-center gap-2 px-8 py-4 rounded-full font-bold text-lg transition-all",
          isConnected 
            ? "bg-red-500/10 text-red-500 hover:bg-red-500/20" 
            : "bg-ff-primary text-black hover:bg-ff-primary/90",
          isConnecting && "opacity-50 cursor-not-allowed"
        )}
      >
        {isConnecting ? (
          <><Loader2 className="w-5 h-5 animate-spin" /> Connecting...</>
        ) : isConnected ? (
          <><StopCircle className="w-5 h-5" /> End Session</>
        ) : (
          <><Mic className="w-5 h-5" /> Start Voice Coach</>
        )}
      </button>
    </div>
  );
}
