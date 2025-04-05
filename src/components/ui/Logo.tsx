import React from 'react';
import { Sparkles } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center gap-2 text-primary">
      <Sparkles className="w-6 h-6" />
      <span className="font-semibold text-xl">PlasmaCare</span>
    </div>
  );
}