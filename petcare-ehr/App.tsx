
import React, { useState, useRef, useEffect } from 'react';
import { Message, PetCategory } from './types';
import { geminiService } from './services/geminiService';
import { ChatMessage } from './components/ChatMessage';
import { PetQuickActions } from './components/PetQuickActions';

const App: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Hello! I'm PawPal, your AI pet care assistant. Whether you're a new pet parent or a seasoned one, I'm here to help with health, nutrition, and training tips. What's on your mind today?",
      timestamp: Date.now()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  const handleSendMessage = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() && !previewImage) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: textToSend,
      timestamp: Date.now(),
      image: previewImage || undefined
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setPreviewImage(null);
    setIsLoading(true);

    try {
      const assistantMessage = await geminiService.chat(messages, textToSend, previewImage || undefined);
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePreview = () => setPreviewImage(null);

  return (
    <div className="flex flex-col h-screen max-w-5xl mx-auto shadow-2xl bg-slate-50 overflow-hidden md:my-4 md:rounded-3xl md:h-[calc(100vh-2rem)] border border-slate-200">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between z-10">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
            <span className="text-2xl">🐕</span>
          </div>
          <div>
            <h1 className="font-bold text-slate-800 text-lg">PawPal AI Assistant</h1>
            <div className="flex items-center text-xs text-emerald-600 font-medium">
              <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2 animate-pulse"></span>
              Secure & Professional Guidance
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
           <button 
            onClick={() => window.close()}
            className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors text-sm font-medium"
          >
            <span>Close Chat</span>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-4 py-6 md:px-12 chat-container"
      >
        <div className="max-w-3xl mx-auto">
          {messages.map((msg) => (
            <ChatMessage key={msg.id} message={msg} />
          ))}
          {isLoading && (
            <div className="flex justify-start mb-6">
              <div className="flex items-center space-x-3">
                <div className="flex-shrink-0 h-9 w-9 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm">🐾</div>
                <div className="bg-white border border-slate-100 rounded-2xl px-4 py-3 shadow-sm">
                  <div className="flex space-x-1.5">
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-100"></div>
                    <div className="w-2 h-2 bg-slate-300 rounded-full animate-bounce delay-200"></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {messages.length < 3 && !isLoading && (
            <div className="max-w-lg mx-auto mt-8 animate-fade-in bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
              <p className="text-center text-sm text-slate-500 mb-6 font-medium">How can I help you today?</p>
              <PetQuickActions onSelect={(prompt) => handleSendMessage(prompt)} />
            </div>
          )}
        </div>
      </div>

      {/* Input Area */}
      <div className="bg-white border-t border-slate-200 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          {previewImage && (
            <div className="relative inline-block mb-3 animate-in fade-in zoom-in duration-200">
              <img src={previewImage} alt="Preview" className="h-24 w-24 object-cover rounded-xl border-2 border-emerald-500 shadow-lg" />
              <button 
                onClick={removePreview}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:bg-red-600 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          )}
          
          <div className="flex items-end space-x-2 md:space-x-4">
            <div className="flex-1 relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Type your question here (e.g., 'Is chocolate safe for dogs?')..."
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-4 pr-12 py-4 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all resize-none min-h-[60px] max-h-[200px] text-slate-700 shadow-inner"
                rows={1}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute right-3 bottom-3.5 p-1 text-slate-400 hover:text-emerald-500 transition-colors"
                title="Analyze Image"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
              />
            </div>
            <button
              onClick={() => handleSendMessage()}
              disabled={isLoading || (!input.trim() && !previewImage)}
              className={`h-[60px] w-[60px] md:h-[60px] md:w-auto md:px-8 rounded-2xl flex items-center justify-center font-bold text-white transition-all shadow-lg ${
                isLoading || (!input.trim() && !previewImage)
                  ? 'bg-slate-300 cursor-not-allowed shadow-none'
                  : 'bg-emerald-500 hover:bg-emerald-600 shadow-emerald-200 active:scale-95'
              }`}
            >
              <span className="hidden md:inline mr-2">Send Message</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
            </button>
          </div>
          <p className="mt-4 text-[11px] text-center text-slate-400 font-medium tracking-wide">
             PAWPAL AI PROVIDES EDUCATIONAL CONTENT. NOT A SUBSTITUTE FOR PROFESSIONAL VETERINARY DIAGNOSIS.
          </p>
        </div>
      </div>
    </div>
  );
};

export default App;
