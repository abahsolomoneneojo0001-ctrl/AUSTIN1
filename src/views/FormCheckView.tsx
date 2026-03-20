import React, { useEffect, useRef, useState } from 'react';
import { FilesetResolver, PoseLandmarker } from '@mediapipe/tasks-vision';
import { Camera, X, Activity } from 'lucide-react';
import { cn } from '../lib/utils';

export default function FormCheckView({ onClose }: { onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string>("Stand in frame to begin form check.");

  useEffect(() => {
    let poseLandmarker: PoseLandmarker | null = null;
    let animationFrameId: number;
    let stream: MediaStream | null = null;

    const initializeMediaPipe = async () => {
      try {
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numPoses: 1,
        });

        setIsLoaded(true);

        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play();
            predictWebcam();
          };
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to access camera or load model.");
      }
    };

    let lastVideoTime = -1;
    const predictWebcam = () => {
      if (!videoRef.current || !canvasRef.current || !poseLandmarker) return;

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext("2d");

      if (video.currentTime !== lastVideoTime) {
        lastVideoTime = video.currentTime;
        const results = poseLandmarker.detectForVideo(video, performance.now());
        
        if (ctx) {
          ctx.save();
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          
          if (results.landmarks && results.landmarks.length > 0) {
            // Very basic form feedback logic (e.g., checking if shoulders are level)
            const landmarks = results.landmarks[0];
            const leftShoulder = landmarks[11];
            const rightShoulder = landmarks[12];
            
            if (leftShoulder && rightShoulder) {
              const yDiff = Math.abs(leftShoulder.y - rightShoulder.y);
              if (yDiff > 0.05) {
                setFeedback("Keep your shoulders level.");
              } else {
                setFeedback("Good posture! Shoulders are level.");
              }
            }

            // Draw landmarks
            ctx.fillStyle = "#A4FF2A"; // ff-primary
            ctx.strokeStyle = "#00E5FF"; // ff-tertiary
            ctx.lineWidth = 2;

            for (const landmark of landmarks) {
              ctx.beginPath();
              ctx.arc(landmark.x * canvas.width, landmark.y * canvas.height, 3, 0, 2 * Math.PI);
              ctx.fill();
            }
          } else {
            setFeedback("No pose detected. Please stand in frame.");
          }
          ctx.restore();
        }
      }
      animationFrameId = requestAnimationFrame(predictWebcam);
    };

    initializeMediaPipe();

    return () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      if (poseLandmarker) poseLandmarker.close();
      if (stream) stream.getTracks().forEach(track => track.stop());
    };
  }, []);

  return (
    <div className="fixed inset-0 z-50 bg-ff-bg flex flex-col animate-in fade-in zoom-in-95 duration-300">
      <div className="p-4 md:p-6 border-b border-ff-surface flex items-center justify-between bg-ff-surface">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-ff-primary/10 flex items-center justify-center">
            <Activity className="w-5 h-5 text-ff-primary" />
          </div>
          <div>
            <h2 className="font-display text-xl tracking-wide">AI FORM CHECKER</h2>
            <p className="text-xs text-ff-muted">Powered by MediaPipe</p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 bg-ff-bg rounded-xl hover:bg-ff-surface/80 transition-colors">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 relative flex flex-col items-center justify-center p-4">
        {error ? (
          <div className="text-center space-y-4 max-w-md">
            <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <Camera className="w-8 h-8 text-red-500" />
            </div>
            <p className="text-ff-text font-bold">Camera Access Required</p>
            <p className="text-sm text-ff-muted">{error}</p>
          </div>
        ) : (
          <div className="relative w-full max-w-3xl aspect-video bg-black rounded-[24px] overflow-hidden border border-ff-surface shadow-2xl">
            {!isLoaded && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-ff-surface z-10">
                <div className="w-8 h-8 border-4 border-ff-primary border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-sm font-bold text-ff-muted uppercase tracking-widest">Loading AI Model...</p>
              </div>
            )}
            <video 
              ref={videoRef} 
              className="absolute inset-0 w-full h-full object-cover" 
              playsInline 
              muted 
            />
            <canvas 
              ref={canvasRef} 
              className="absolute inset-0 w-full h-full object-cover z-10"
              width={1280}
              height={720}
            />
            
            {/* Feedback Overlay */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 w-[90%] max-w-md">
              <div className="bg-black/60 backdrop-blur-md border border-ff-surface rounded-2xl p-4 text-center">
                <p className={cn(
                  "font-bold text-lg transition-colors",
                  feedback.includes("Good") ? "text-ff-primary" : "text-white"
                )}>
                  {feedback}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
