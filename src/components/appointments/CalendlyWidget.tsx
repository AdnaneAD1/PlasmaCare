import { useEffect } from 'react';

interface CalendlyWidgetProps {
  url: string;
  primaryColor?: string;
  height?: number;
}

export function CalendlyWidget({ url, primaryColor = 'b97a56', height = 700 }: CalendlyWidgetProps) {
  useEffect(() => {
    // Charger le script Calendly
    const script = document.createElement('script');
    script.src = 'https://assets.calendly.com/assets/external/widget.js';
    script.async = true;
    document.body.appendChild(script);

    return () => {
      // Nettoyer le script lors du démontage du composant
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div 
      className="calendly-inline-widget" 
      data-url={`${url}?primary_color=${primaryColor}`}
      style={{ minWidth: 320, height }}
    />
  );
}
