import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, Send, Loader2, User, Bot } from 'lucide-react';
import { cn } from '../lib/utils';
import { getAIClient } from '../lib/gemini';
import Markdown from 'react-markdown';

export default function ChatbotView() {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([
    { role: 'model', text: "Hi! I'm your personal AI fitness trainer. Ask me anything about workouts, nutrition, or recovery." }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const chatRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const initChat = () => {
    if (!chatRef.current) {
      const ai = getAIClient();
      if (ai) {
        chatRef.current = ai.chats.create({
          model: 'gemini-3.1-pro-preview',
          config: {
            systemInstruction: "You are a highly knowledgeable, encouraging, and professional personal fitness trainer. Provide detailed, accurate, and safe advice on exercise, nutrition, and wellness.",
          }
        });
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setIsTyping(true);
    setError(null);

    try {
      initChat();
      if (!chatRef.current) throw new Error("AI client not initialized.");

      const response = await chatRef.current.sendMessage({ message: userMessage });
      
      setMessages(prev => [...prev, { role: 'model', text: response.text || "I'm not sure how to respond to that." }]);

    } catch (err: any) {
      console.error("Chat error:", err);
      setError(err.message || "Failed to send message.");
      // Remove the user message if it failed, or just show error
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-[600px]">
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <MessageSquare className="w-8 h-8 text-[#34A853]" />
        <div>
          <h3 className="text-2xl font-display tracking-wide text-white">AI Assistant</h3>
          <p className="text-ff-muted">Deep conversations about your fitness journey.</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pr-4 space-y-6 mb-6 custom-scrollbar">
        {messages.map((msg, idx) => (
          <div 
            key={idx} 
            className={cn(
              "flex gap-4 max-w-[85%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : ""
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
              msg.role === 'user' ? "bg-ff-surface" : "bg-[#34A853]/20 text-[#34A853]"
            )}>
              {msg.role === 'user' ? <User className="w-5 h-5 text-white" /> : <Bot className="w-5 h-5" />}
            </div>
            <div className={cn(
              "p-4 rounded-[20px]",
              msg.role === 'user' 
                ? "bg-ff-surface text-white rounded-tr-sm" 
                : "bg-[#34A853]/10 border border-[#34A853]/20 text-white rounded-tl-sm prose prose-invert max-w-none prose-p:leading-relaxed prose-a:text-[#34A853]"
            )}>
              {msg.role === 'user' ? (
                <p>{msg.text}</p>
              ) : (
                <Markdown>{msg.text}</Markdown>
              )}
            </div>
          </div>
        ))}
        
        {isTyping && (
          <div className="flex gap-4 max-w-[85%]">
            <div className="w-10 h-10 rounded-full bg-[#34A853]/20 text-[#34A853] flex items-center justify-center shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div className="p-4 rounded-[20px] bg-[#34A853]/10 border border-[#34A853]/20 text-white rounded-tl-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin text-[#34A853]" />
              <span className="text-sm text-ff-muted">Typing...</span>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {error && (
        <div className="bg-red-500/10 text-red-500 p-4 rounded-xl text-sm mb-4 shrink-0">
          {error}
        </div>
      )}

      <div className="flex gap-4 shrink-0">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          className="flex-1 bg-ff-bg border border-ff-surface rounded-xl p-4 text-white focus:outline-none focus:border-[#34A853]"
          placeholder="Ask your AI trainer anything..."
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className={cn(
            "px-6 rounded-xl font-bold transition-all flex items-center justify-center",
            input.trim() && !isTyping
              ? "bg-[#34A853] text-black hover:bg-[#34A853]/90"
              : "bg-ff-surface text-ff-muted cursor-not-allowed"
          )}
        >
          <Send className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
