import React from 'react';
import { DiagnosisForm } from '../components/diagnosis/DiagnosisForm';

export function Diagnosis() {
  const handleDiagnosisSuccess = (result: any) => {
    // Rediriger vers la page des recommandations avec les résultats
    console.log('Diagnostic result:', result);
  };

  return (
    <div className="py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold mb-6">
            Diagnostic Beauté
            <span className="gradient-text block mt-2">Personnalisé</span>
          </h1>
          <p className="text-lg text-gray-600">
            Répondez à quelques questions pour obtenir des recommandations de soins adaptées à vos besoins spécifiques.
          </p>
        </div>

        <div className="bg-white rounded-3xl shadow-xl p-8">
          <DiagnosisForm onSuccess={handleDiagnosisSuccess} />
        </div>
      </div>
    </div>
  );
}