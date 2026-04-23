
import React, { useState, useRef, useEffect } from 'react';
import { Message } from './types';
import { geminiService } from './services/geminiService';
import { ChatMessage } from './components/ChatMessage';
import { PetQuickActions } from './components/PetQuickActions';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'assistant', content: "Hello! How can I help with your pet today?", timestamp: Date.now() }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => { scrollRef.current?.scrollTo(0, scrollRef.current.scrollHeight); }, [messages]);

  const onSend = async (textOverride?: string) => {
    const text = textOverride || input;
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);
    try {
      const reply = await geminiService.chat(messages, text);
      setMessages(prev => [...prev, reply]);
    } finally { setIsLoading(false); }
  };

  return (
    <div className="flex flex-col h-screen max-w-4xl mx-auto bg-white shadow-xl">
      <header className="p-6 border-b flex justify-between items-center bg-emerald-600 text-white">
        <h1 className="text-xl font-bold">🐾 PawPal AI Assistant</h1>
        <button onClick={() => window.close()} className="text-sm opacity-80 hover:opacity-100">Close</button>
      </header>
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 chat-container space-y-4">
        {messages.map(m => <ChatMessage key={m.id} message={m} />)}
        {isLoading && <div className="text-slate-400 text-sm animate-pulse">PawPal is thinking...</div>}
        {messages.length < 2 && <PetQuickActions onSelect={onSend} />}
      </div>
      <div className="p-6 border-t flex gap-4">
        <input 
          className="flex-1 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-emerald-500 outline-none" 
          value={input} 
          onChange={e => setInput(e.target.value)}
          placeholder="Ask about health, food, or training..."
          onKeyDown={e => e.key === 'Enter' && onSend()}
        />
        <button onClick={() => onSend()} className="bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold">Send</button>
      </div>
    </div>
  );
};
export default App;
