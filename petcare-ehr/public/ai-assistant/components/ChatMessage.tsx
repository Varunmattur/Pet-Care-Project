
import React from 'react';
import { Message } from '../types';

export const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] p-4 rounded-2xl ${isUser ? 'bg-emerald-100 text-emerald-900 rounded-tr-none' : 'bg-slate-100 text-slate-800 rounded-tl-none'}`}>
        <p className="text-sm">{message.content}</p>
        {message.sources && (
          <div className="mt-2 flex gap-1">
            {message.sources.map((s, i) => (
              <a key={i} href={s.uri} target="_blank" className="text-[10px] text-emerald-600 underline">{s.title}</a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
