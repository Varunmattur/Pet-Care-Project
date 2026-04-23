
import React from 'react';
import { Message } from '../types';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`flex-shrink-0 h-9 w-9 rounded-full flex items-center justify-center text-white font-bold text-sm ${isUser ? 'ml-3 bg-indigo-500' : 'mr-3 bg-emerald-500'}`}>
          {isUser ? 'U' : '🐾'}
        </div>
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed ${
            isUser 
              ? 'bg-indigo-600 text-white rounded-tr-none' 
              : 'bg-white text-slate-800 rounded-tl-none border border-slate-100'
          }`}>
            {message.image && (
              <img src={message.image} alt="Uploaded" className="max-w-xs rounded-lg mb-3 shadow-md" />
            )}
            <div className="whitespace-pre-wrap">{message.content}</div>
          </div>
          
          {message.sources && message.sources.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Sources:</span>
              {message.sources.map((source, idx) => (
                <a 
                  key={idx} 
                  href={source.uri} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full transition-colors"
                >
                  {source.title}
                </a>
              ))}
            </div>
          )}

          <span className="mt-1.5 text-[10px] text-slate-400">
            {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>
    </div>
  );
};
