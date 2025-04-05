import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { sendDiagnosisEmail } from '../../lib/email';
import { Alert } from '../ui/Alert';
import { LoadingSpinner } from '../ui/LoadingSpinner';

interface DiagnosisFormProps {
  onSuccess?: (data: any) => void;
}

export function DiagnosisForm({ onSuccess }: DiagnosisFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    skinType: '' as 'normal' | 'sec' | 'gras' | 'mixte',
    hairType: '',
    concerns: [] as string[],
    allergies: [] as string[],
    medicalHistory: '',
    currentProducts: [] as string[]
  });

  const HAIR_TYPES = [
    { value: '1a', label: 'Type 1A - Cheveux raides' },
    { value: '1b', label: 'Type 1B - Cheveux raides avec texture' },
    { value: '1c', label: 'Type 1C - Cheveux raides avec volume' },
    { value: '2a', label: 'Type 2A - Cheveux ondulés légers' },
    { value: '2b', label: 'Type 2B - Cheveux ondulés définis' },
    { value: '2c', label: 'Type 2C - Cheveux ondulés larges' },
    { value: '3a', label: 'Type 3A - Boucles légères' },
    { value: '3b', label: 'Type 3B - Boucles moyennes' },
    { value: '3c', label: 'Type 3C - Boucles serrées' },
    { value: '4a', label: 'Type 4A - Cheveux crépus légers' },
    { value: '4b', label: 'Type 4B - Cheveux crépus moyens' },
    { value: '4c', label: 'Type 4C - Cheveux crépus serrés' }
  ];

  const CONCERNS = [
    { value: 'alopecie', label: 'Alopécie de traction' },
    { value: 'blepharochalasis', label: 'Blépharochalasis' },
    { value: 'chute', label: 'Chute de cheveux' },
    { value: 'secheresse', label: 'Sécheresse' },
    { value: 'demangeaisons', label: 'Démangeaisons' }
  ];

  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.skinType || !formData.hairType || formData.concerns.length === 0) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    try {
      setIsLoading(true);

      // Vérifier l'authentification
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Utilisateur non authentifié');

      // Récupérer les informations de l'utilisateur
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('first_name, last_name')
        .eq('id', user.id)
        .single();

      if (userError) throw userError;

      // Sauvegarder le diagnostic
      const { data: diagnosisData, error: diagnosisError } = await supabase
        .from('diagnoses')
        .insert({
          user_id: user.id,
          skin_type: formData.skinType,
          hair_type: formData.hairType,
          concerns: formData.concerns,
          allergies: formData.allergies,
          medical_history: formData.medicalHistory,
          current_products: formData.currentProducts
        })
        .select()
        .single();

      if (diagnosisError) throw diagnosisError;

      // Envoyer l'email à l'admin
      await sendDiagnosisEmail({
        userId: user.id,
        userName: `${userData.first_name} ${userData.last_name}`,
        skinType: formData.skinType,
        hairType: formData.hairType,
        concerns: formData.concerns,
        allergies: formData.allergies,
        medicalHistory: formData.medicalHistory,
        currentProducts: formData.currentProducts
      });

      onSuccess?.(diagnosisData);
      
      // Rediriger vers le dashboard avec un message de succès
      navigate('/dashboard', { 
        state: { 
          success: 'Votre diagnostic a été envoyé avec succès ! Nous vous contacterons bientôt avec nos recommandations.'
        }
      });

    } catch (err: any) {
      console.error('Erreur lors de la soumission du diagnostic:', err);
      setError('Une erreur est survenue lors de l\'envoi du diagnostic. Veuillez réessayer.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkinTypeChange = (type: 'normal' | 'sec' | 'gras' | 'mixte') => {
    setFormData(prev => ({ ...prev, skinType: type }));
  };

  const handleHairTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFormData(prev => ({ ...prev, hairType: e.target.value }));
  };

  const handleConcernToggle = (concern: string) => {
    setFormData(prev => ({
      ...prev,
      concerns: prev.concerns.includes(concern)
        ? prev.concerns.filter(c => c !== concern)
        : [...prev.concerns, concern]
    }));
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className="text-lg font-semibold mb-4">Type de peau</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {['normal', 'sec', 'gras', 'mixte'].map((type) => (
            <label
              key={type}
              className={`
                relative flex items-center justify-center p-4 rounded-xl border-2 cursor-pointer
                ${formData.skinType === type ? 'border-primary bg-primary/5' : 'border-gray-200'}
              `}
            >
              <input
                type="radio"
                name="skinType"
                value={type}
                checked={formData.skinType === type}
                onChange={() => handleSkinTypeChange(type as 'normal' | 'sec' | 'gras' | 'mixte')}
                className="sr-only"
              />
              <span className="capitalize">{type}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Type de cheveux</h3>
        <select
          value={formData.hairType}
          onChange={handleHairTypeChange}
          className="input"
        >
          <option value="">Sélectionnez un type</option>
          {HAIR_TYPES.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Problèmes rencontrés</h3>
        <div className="grid md:grid-cols-2 gap-4">
          {CONCERNS.map(({ value, label }) => (
            <label
              key={value}
              className={`
                relative flex items-center p-4 rounded-xl border-2 cursor-pointer
                ${formData.concerns.includes(value) ? 'border-primary bg-primary/5' : 'border-gray-200'}
              `}
            >
              <input
                type="checkbox"
                checked={formData.concerns.includes(value)}
                onChange={() => handleConcernToggle(value)}
                className="sr-only"
              />
              <span>{label}</span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-4">Antécédents médicaux</h3>
        <textarea
          name="medicalHistory"
          value={formData.medicalHistory}
          onChange={handleTextChange}
          className="input h-32"
          placeholder="Décrivez vos antécédents médicaux pertinents..."
        />
      </div>

      {error && <Alert type="error">{error}</Alert>}

      <button
        type="submit"
        disabled={isLoading}
        className="btn-primary w-full"
      >
        {isLoading ? <LoadingSpinner /> : 'Envoyer mon diagnostic'}
      </button>
    </form>
  );
}