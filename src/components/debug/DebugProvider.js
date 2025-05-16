'use client';

import { useState } from 'react';
import MobileDebugger from './MobileDebugger';

export default function DebugProvider({ children }) {
  const [debugEnabled, setDebugEnabled] = useState(false);
  
  // Activer le débogage avec un geste spécifique (triple tap dans le coin supérieur gauche)
  const handleDebugActivation = () => {
    // Vérifier si on est en production ou en développement
    const isDev = process.env.NODE_ENV === 'development';
    
    // Activer le débogage
    setDebugEnabled(true);
    console.info('Mode débogage activé');
  };
  
  return (
    <div 
      className="min-h-screen"
      onTouchStart={(e) => {
        // Activer le débogage si on touche le coin supérieur gauche
        if (e.touches[0].clientX < 50 && e.touches[0].clientY < 50) {
          // Utiliser un compteur dans localStorage pour détecter un triple tap
          const now = Date.now();
          const lastTap = parseInt(localStorage.getItem('lastTapTime') || '0');
          const tapCount = parseInt(localStorage.getItem('tapCount') || '0');
          
          // Réinitialiser le compteur si plus de 500ms se sont écoulées
          if (now - lastTap > 500) {
            localStorage.setItem('tapCount', '1');
          } else {
            localStorage.setItem('tapCount', (tapCount + 1).toString());
          }
          
          localStorage.setItem('lastTapTime', now.toString());
          
          // Activer le débogage après 3 taps
          if (parseInt(localStorage.getItem('tapCount')) >= 3) {
            handleDebugActivation();
            localStorage.setItem('tapCount', '0');
          }
        }
      }}
    >
      {children}
      <MobileDebugger enabled={debugEnabled} />
    </div>
  );
}
