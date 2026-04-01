import React, { useState } from 'react';
import { Mic, Video, Image as ImageIcon, Search, MapPin, MessageSquare, Zap, Play } from 'lucide-react';
import { cn } from '../lib/utils';
import LiveCoachView from './LiveCoachView';
import VeoVideoView from './VeoVideoView';
import ImageGenView from './ImageGenView';
import FitnessNewsView from './FitnessNewsView';
import LocalGymsView from './LocalGymsView';
import VideoAnalysisView from './VideoAnalysisView';
import FastTipsView from './FastTipsView';
import ChatbotView from './ChatbotView';

export default function AIHubView() {
  const [activeFeature, setActiveFeature] = useState<string | null>(null);

  const features = [
    { id: 'live-coach', title: 'Live Voice Coach', icon: Mic, desc: 'Real-time conversational fitness coaching.', color: 'text-ff-primary' },
    { id: 'veo-video', title: 'Animate Workout', icon: Video, desc: 'Turn a photo into a workout video.', color: 'text-ff-secondary' },
    { id: 'image-gen', title: 'Visualize Goal', icon: ImageIcon, desc: 'Generate fitness inspiration images.', color: 'text-ff-tertiary' },
    { id: 'search', title: 'Fitness News', icon: Search, desc: 'Get the latest fitness trends.', color: 'text-ff-quaternary' },
    { id: 'maps', title: 'Local Gyms', icon: MapPin, desc: 'Find workout spots near you.', color: 'text-[#FA114F]' },
    { id: 'video-analysis', title: 'Form Check Pro', icon: Play, desc: 'Upload a video for deep form analysis.', color: 'text-[#4285F4]' },
    { id: 'fast-tips', title: 'Quick Tips', icon: Zap, desc: 'Instant fitness advice.', color: 'text-[#FBBC05]' },
    { id: 'chatbot', title: 'AI Assistant', icon: MessageSquare, desc: 'Chat with your personal AI trainer.', color: 'text-[#34A853]' },
  ];

  const renderActiveFeature = () => {
    switch (activeFeature) {
      case 'live-coach':
        return <LiveCoachView />;
      case 'veo-video':
        return <VeoVideoView />;
      case 'image-gen':
        return <ImageGenView />;
      case 'search':
        return <FitnessNewsView />;
      case 'maps':
        return <LocalGymsView />;
      case 'video-analysis':
        return <VideoAnalysisView />;
      case 'fast-tips':
        return <FastTipsView />;
      case 'chatbot':
        return <ChatbotView />;
      default:
        return (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <h3 className="text-2xl font-display tracking-wide text-white mb-4">
              {features.find(f => f.id === activeFeature)?.title}
            </h3>
            <p className="text-ff-muted">This feature is currently being implemented...</p>
          </div>
        );
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto pb-12">
      <div className="bg-ff-surface rounded-[32px] p-8 border border-ff-surface">
        <h2 className="text-3xl font-display tracking-wide text-white mb-2">AI Innovation Hub</h2>
        <p className="text-ff-muted mb-8">Explore the next generation of fitness technology powered by Gemini.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map(f => (
            <button
              key={f.id}
              onClick={() => setActiveFeature(f.id)}
              className={cn(
                "p-6 rounded-[24px] border text-left transition-all group",
                activeFeature === f.id 
                  ? "bg-ff-bg border-ff-primary" 
                  : "bg-ff-bg/50 border-ff-surface hover:border-ff-primary/50"
              )}
            >
              <div className="w-12 h-12 rounded-full bg-ff-surface flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon className={cn("w-6 h-6", f.color)} />
              </div>
              <h3 className="font-bold text-white mb-1">{f.title}</h3>
              <p className="text-xs text-ff-muted">{f.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {activeFeature && (
        <div className="bg-ff-surface rounded-[32px] p-8 border border-ff-surface min-h-[400px]">
          {renderActiveFeature()}
        </div>
      )}
    </div>
  );
}
