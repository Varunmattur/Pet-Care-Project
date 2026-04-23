
import React from 'react';
export const PetQuickActions: React.FC<{ onSelect: (p: string) => void }> = ({ onSelect }) => (
  <div className="grid grid-cols-2 gap-2">
    {['Toxic foods for dogs', 'Kitten training tips', 'Signs of pet dehydration', 'Safe human foods'].map(q => (
      <button key={q} onClick={() => onSelect(q)} className="p-3 border rounded-lg text-xs text-slate-600 hover:bg-emerald-50 text-left">{q}</button>
    ))}
  </div>
);
