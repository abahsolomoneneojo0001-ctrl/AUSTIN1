import React, { useState, useEffect, useRef } from 'react';
import { Send, Loader2, MessageCircle } from 'lucide-react';
import { cn } from '../lib/utils';
import { db, auth } from '../lib/firebase';
import { collection, query, where, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';

interface Message {
  id: string;
  from: string;
  to: string;
  content: string;
  timestamp: any;
  read: boolean;
}

export default function SupportChatView() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    if (!userId) return;

    setLoading(true);
    const unsubscribers: Array<() => void> = [];

    // Listen to messages where user is receiver
    const q = query(
      collection(db, 'messages'),
      where('to', '==', userId)
    );

    const unsubscribe1 = onSnapshot(q, (snapshot) => {
      const msgData: Message[] = [];
      snapshot.forEach((doc) => {
        msgData.push({
          id: doc.id,
          ...doc.data()
        } as Message);
      });

      // Also get messages sent by user to admin
      const q2 = query(
        collection(db, 'messages'),
        where('from', '==', userId)
      );

      const unsubscribe2 = onSnapshot(q2, (snapshot2) => {
        snapshot2.forEach((doc) => {
          msgData.push({
            id: doc.id,
            ...doc.data()
          } as Message);
        });

        // Sort by timestamp
        msgData.sort((a, b) => (a.timestamp?.toMillis?.() || 0) - (b.timestamp?.toMillis?.() || 0));
        setMessages(msgData);
        setLoading(false);
      }, (error) => {
        console.error("Error fetching sent messages:", error);
        setLoading(false);
      });

      unsubscribers.push(unsubscribe2);
    }, (error) => {
      console.error("Error fetching received messages:", error);
      setLoading(false);
    });

    unsubscribers.push(unsubscribe1);

    // Cleanup: unsubscribe from all listeners
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [userId]);

  useEffect(() => {
    // Auto-scroll to bottom
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !userId) return;

    setIsSending(true);
    try {
      await addDoc(collection(db, 'messages'), {
        from: userId,
        to: 'admin',
        content: input,
        timestamp: serverTimestamp(),
        read: false
      });
      setInput('');
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-ff-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="bg-ff-surface rounded-[24px] p-6 border border-ff-surface">
        <div className="flex items-center gap-3 mb-2">
          <MessageCircle className="w-8 h-8 text-ff-primary" />
          <h2 className="text-2xl font-display tracking-wide text-ff-text">Support Chat</h2>
        </div>
        <p className="text-ff-muted">Message our admin team for questions or support</p>
      </div>

      {/* Chat Container */}
      <div className="bg-ff-surface rounded-[24px] border border-ff-surface overflow-hidden flex flex-col h-[600px]">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-ff-bg/50">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-center">
              <div>
                <MessageCircle className="w-12 h-12 text-ff-muted/30 mx-auto mb-4" />
                <p className="text-ff-muted">No messages yet. Start a conversation!</p>
              </div>
            </div>
          ) : (
            <>
              {messages.map((msg) => {
                const isUser = msg.from === userId;
                return (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3",
                      isUser ? "flex-row-reverse justify-start" : ""
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 text-white",
                      isUser ? "bg-ff-primary" : "bg-ff-surface"
                    )}>
                      {isUser ? "You" : "Admin"}.substring(0, 1)
                    </div>
                    <div className={cn(
                      "max-w-xs px-4 py-3 rounded-[16px] break-words",
                      isUser
                        ? "bg-ff-primary text-white rounded-tr-sm"
                        : "bg-ff-surface text-ff-text border border-ff-primary/20 rounded-tl-sm"
                    )}>
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                      <p className={cn(
                        "text-xs mt-1 opacity-70",
                        isUser ? "text-white/70" : "text-ff-muted"
                      )}>
                        {msg.timestamp?.toDate?.()?.toLocaleTimeString?.([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        }) || '...'}
                      </p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input Area */}
        <form onSubmit={sendMessage} className="border-t border-ff-surface p-4 flex gap-3 bg-ff-surface">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            disabled={isSending}
            className="flex-1 bg-ff-bg border border-ff-surface rounded-xl px-4 py-3 text-ff-text placeholder:text-ff-muted focus:outline-none focus:border-ff-primary focus:ring-1 focus:ring-ff-primary transition-all disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isSending}
            className="px-6 py-3 bg-ff-primary text-white rounded-xl font-bold hover:bg-ff-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
          >
            {isSending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
