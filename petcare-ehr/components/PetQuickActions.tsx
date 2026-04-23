
import React from 'react';

const ACTIONS = [
  { icon: '🦴', label: 'Toxic Food Check', prompt: 'List common foods that are toxic to dogs and cats.' },
  { icon: '🏥', label: 'Emergency Signs', prompt: 'What are common signs that my pet needs an emergency vet visit?' },
  { icon: '🐕', label: 'Puppy Training', prompt: 'Give me 3 tips for crate training a new puppy.' },
  { icon: '🐈', label: 'Cat Hydration', prompt: 'How can I encourage my cat to drink more water?' }
];

interface PetQuickActionsProps {
  onSelect: (prompt: string) => void;
}

export const PetQuickActions: React.FC<PetQuickActionsProps> = ({ onSelect }) => {
  return (
    <div className="grid grid-cols-2 gap-3 mt-4 mb-2">
      {ACTIONS.map((action, i) => (
        <button
          key={i}
          onClick={() => onSelect(action.prompt)}
          className="flex flex-col items-center justify-center p-3 bg-white border border-slate-200 rounded-xl hover:border-emerald-400 hover:bg-emerald-50 transition-all text-center group"
        >
          <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">{action.icon}</span>
          <span className="text-xs font-semibold text-slate-600">{action.label}</span>
        </button>
      ))}
    </div>
  );
};
