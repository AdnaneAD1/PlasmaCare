'use client';

import { useState, useEffect } from 'react';
import { Calendar, Clock, CreditCard, X } from 'lucide-react';
import { useAppointments } from '@/hooks/useAppointments';
import { LoadingButton } from '@/components/ui/LoadingButton';

export function AppointmentForm({ isOpen, onClose, onSuccess }) {
  const { createAppointment } = useAppointments();
  const [step, setStep] = useState(1); // 1: Form, 2: Payment, 3: Confirmation
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [formData, setFormData] = useState({
    date: '',
    time: '',
    treatmentId: '',
    notes: ''
  });
  const [treatments, setTreatments] = useState([]);
  const [selectedTreatment, setSelectedTreatment] = useState(null);

  // Fetch treatments
  useEffect(() => {
    const fetchTreatments = async () => {
      try {
        // Temporarily using the hardcoded treatments from the treatments page
        // In a real app, you would fetch this from the API
        const treatmentsData = [
          {
            id: 1,
            title: "Traitement Anti-âge Plasma",
            description: "Réduction visible des rides et ridules grâce à notre technologie plasma de pointe.",
            duration: "60 min",
            price: 250,
            priceFormatted: "250€",
            rating: 4.9,
          },
          {
            id: 2,
            title: "Lifting Non-chirurgical",
            description: "Raffermissement cutané et amélioration de l'élasticité sans chirurgie.",
            duration: "45 min",
            price: 200,
            priceFormatted: "200€",
            rating: 4.8,
          },
          {
            id: 3,
            title: "Traitement des Taches Pigmentaires",
            description: "Uniformisation du teint et réduction des taches brunes.",
            duration: "30 min",
            price: 180,
            priceFormatted: "180€",
            rating: 4.7,
          }
        ];
        setTreatments(treatmentsData);
      } catch (error) {
        console.error('Erreur lors du chargement des traitements:', error);
        setError('Impossible de charger les traitements disponibles.');
      }
    };

    if (isOpen) {
      fetchTreatments();
    }
  }, [isOpen]);

  // Generate available times when date changes
  useEffect(() => {
    if (formData.date) {
      // In a real app, you would fetch available times from the API
      // For now, we'll generate some times between 9am and 5pm
      const times = [];
      for (let hour = 9; hour <= 17; hour++) {
        times.push(`${hour}:00`);
        if (hour < 17) {
          times.push(`${hour}:30`);
        }
      }
      setAvailableTimes(times);
    }
  }, [formData.date]);

  // Update selected treatment when treatmentId changes
  useEffect(() => {
    if (formData.treatmentId) {
      const treatment = treatments.find(t => t.id === parseInt(formData.treatmentId));
      setSelectedTreatment(treatment);
    } else {
      setSelectedTreatment(null);
    }
  }, [formData.treatmentId, treatments]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // Validate form
    if (!formData.date) return setError('Veuillez sélectionner une date');
    if (!formData.time) return setError('Veuillez sélectionner une heure');
    if (!formData.treatmentId) return setError('Veuillez sélectionner un traitement');

    // Move to payment step
    setStep(2);
  };

  const handlePayment = async (paymentMethod) => {
    setIsLoading(true);
    try {
      // In a real app, you would process the payment with Stripe or PayPal
      // For now, we'll simulate a successful payment
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create appointment
      const appointmentData = {
        ...formData,
        status: 'pending',
        paymentStatus: 'paid',
        paymentMethod,
      };

      const result = await createAppointment(appointmentData);
      if (result.success) {
        setStep(3); // Move to confirmation step
      } else {
        setError(result.error || 'Une erreur est survenue lors de la création du rendez-vous.');
        setStep(1); // Go back to form
      }
    } catch (error) {
      console.error('Erreur lors du paiement:', error);
      setError('Le paiement a échoué. Veuillez réessayer.');
      setStep(1); // Go back to form
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (step === 3) {
      // If we're on the confirmation step, call onSuccess
      onSuccess && onSuccess();
    }
    // Reset form
    setFormData({
      date: '',
      time: '',
      treatmentId: '',
      notes: ''
    });
    setStep(1);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {step === 1 && 'Prendre un rendez-vous'}
            {step === 2 && 'Paiement'}
            {step === 3 && 'Confirmation'}
          </h2>
          <button 
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-gray-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Traitement
                  </label>
                  <select
                    name="treatmentId"
                    value={formData.treatmentId}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    required
                  >
                    <option value="">Sélectionner un traitement</option>
                    {treatments.map(treatment => (
                      <option key={treatment.id} value={treatment.id}>
                        {treatment.title} - {treatment.priceFormatted}
                      </option>
                    ))}
                  </select>
                </div>

                {selectedTreatment && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h3 className="font-medium">{selectedTreatment.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{selectedTreatment.description}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-gray-400" />
                        {selectedTreatment.duration}
                      </span>
                      <span className="font-bold text-primary">{selectedTreatment.priceFormatted}</span>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="date"
                      name="date"
                      value={formData.date}
                      onChange={handleChange}
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full rounded-lg border border-gray-300 pl-10 px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                      required
                    />
                  </div>
                </div>

                {formData.date && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Heure
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {availableTimes.map(time => (
                        <button
                          key={time}
                          type="button"
                          className={`py-2 px-3 rounded-lg border text-sm ${formData.time === time ? 'bg-primary text-white border-primary' : 'border-gray-300 hover:border-primary'}`}
                          onClick={() => setFormData(prev => ({ ...prev, time }))}
                        >
                          {time}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (optionnel)
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows="3"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:ring-2 focus:ring-primary/20 focus:border-primary"
                    placeholder="Informations supplémentaires ou questions..."
                  ></textarea>
                </div>
              </div>

              <div className="mt-6">
                <button
                  type="submit"
                  className="w-full py-2 px-4 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Continuer vers le paiement
                </button>
              </div>
            </form>
          )}

          {step === 2 && selectedTreatment && (
            <div>
              <div className="mb-6 p-4 border rounded-lg">
                <h3 className="font-medium">Résumé de la réservation</h3>
                <div className="mt-2 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Traitement:</span>
                    <span className="font-medium">{selectedTreatment.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Date:</span>
                    <span className="font-medium">{new Date(formData.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Heure:</span>
                    <span className="font-medium">{formData.time}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-gray-800 font-medium">Total à payer:</span>
                    <span className="font-bold text-primary">{selectedTreatment.priceFormatted}</span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h3 className="font-medium">Choisissez votre méthode de paiement</h3>
                <LoadingButton
                  onClick={() => handlePayment('stripe')}
                  isLoading={isLoading && formData.paymentMethod === 'stripe'}
                  className="w-full py-3 bg-[#6772e5] text-white rounded-lg hover:bg-[#6772e5]/90 transition-colors flex items-center justify-center"
                >
                  <CreditCard className="w-5 h-5 mr-2" />
                  Payer par Carte Bancaire
                </LoadingButton>
                <LoadingButton
                  onClick={() => handlePayment('paypal')}
                  isLoading={isLoading && formData.paymentMethod === 'paypal'}
                  className="w-full py-3 bg-[#0070ba] text-white rounded-lg hover:bg-[#0070ba]/90 transition-colors flex items-center justify-center"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c-.013.076-.026.175-.041.254-.59 3.025-2.568 4.643-5.774 4.643h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106c-.056.353.181.669.534.669h4.605c.524 0 .968-.382 1.05-.9l.524-3.32c.083-.519.527-.9 1.051-.9h.664c4.299 0 7.665-1.747 8.647-6.798.364-1.874.196-3.443-.293-4.114z"/>
                  </svg>
                  Payer avec PayPal
                </LoadingButton>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-medium mb-2">Rendez-vous confirmé !</h3>
              <p className="text-gray-600 mb-6">
                Votre rendez-vous a été réservé avec succès. Un email de confirmation a été envoyé à votre adresse email.
              </p>
              <button
                onClick={handleClose}
                className="py-2 px-6 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                Fermer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
