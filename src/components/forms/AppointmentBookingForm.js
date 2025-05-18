'use client';

import { useState, useEffect, useCallback } from 'react';
import { Calendar, Clock, CreditCard, Check, X } from 'lucide-react';
import { useTreatments } from '@/hooks/useTreatments';
import { useReservation } from '@/hooks/useReservation';
import { format, addDays, parse, isWithinInterval, addMinutes } from 'date-fns';
import { fr } from 'date-fns/locale';
import PayPalButton from '@/components/payment/PayPalButton';
import StripePayment from '@/components/payment/StripePayment';

export default function AppointmentBookingForm({ onClose, existingAppointments = [] }) {
  // États pour les différentes étapes du formulaire
  const [step, setStep] = useState(1); // 1: Traitements, 2: Date et heure, 3: Paiement, 4: Confirmation
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedTreatments, setSelectedTreatments] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  
  // Récupération des traitements disponibles
  const { treatments = [], error: treatmentsError, loading } = useTreatments();
  
  // Log pour vérifier la récupération des traitements
  useEffect(() => {
    console.log('Traitements disponibles:', treatments);
  }, [treatments]);
  
  // Rendre les messages d'erreur et de succès éphémères
  useEffect(() => {
    // Si un message d'erreur est affiché, le faire disparaître après 5 secondes
    if (error) {
      const timer = setTimeout(() => {
        setError('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error]);
  
  // Effet pour les messages de succès
  useEffect(() => {
    // Si un message de succès est affiché, le faire disparaître après 10 secondes
    if (isSuccess && step !== 4) { // Ne pas faire disparaître le message final de confirmation
      const timer = setTimeout(() => {
        setIsSuccess(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [isSuccess, step]);
  
  // Génération du calendrier
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  
  // Calcul du total
  const totalPrice = selectedTreatments.reduce((sum, treatmentId) => {
    const treatment = treatments.find(t => t.id === treatmentId);
    return sum + (treatment ? parseFloat(treatment.price) : 0);
  }, 0);
  
  // Utilisation du hook useReservation
  const { 
    isLoadingSlots, 
    slotsError, 
    totalDuration,
    createPaymentIntent,
    createReservation,
    isCreatingReservation,
    reservationError,
    getAvailableTimeSlots
  } = useReservation();
  
  // Fonction pour charger les créneaux disponibles
  const loadAvailableTimeSlots = useCallback(async (date) => {
    if (!date || selectedTreatments.length === 0) {
      setAvailableTimeSlots([]);
      return;
    }
    
    try {
      setIsLoading(true);
      const data = await getAvailableTimeSlots(date, selectedTreatments);
      
      if (data && data.available_time_slots) {
        setAvailableTimeSlots(data.available_time_slots);
        
        // Réinitialiser l'heure sélectionnée si elle n'est plus disponible
        if (selectedTime && !data.available_time_slots.includes(selectedTime)) {
          setSelectedTime('');
        }
      }
    } catch (error) {
      console.error('Erreur lors du chargement des créneaux:', error);
      setError('Impossible de charger les créneaux disponibles');
      setAvailableTimeSlots([]);
    } finally {
      setIsLoading(false);
    }
  }, [selectedTreatments, selectedTime, getAvailableTimeSlots]);

  // Gestion des traitements sélectionnés
  const toggleTreatment = (treatmentId) => {
    setSelectedTreatments(prev => {
      if (prev.includes(treatmentId)) {
        return prev.filter(id => id !== treatmentId);
      } else {
        return [...prev, treatmentId];
      }
    });
  };
  
  // Navigation entre les étapes
  const nextStep = () => {
    if (step === 1 && selectedTreatments.length === 0) {
      setError('Veuillez sélectionner au moins un traitement');
      return;
    }
    
    if (step === 2 && (!selectedDate || !selectedTime)) {
      setError('Veuillez sélectionner une date et une heure');
      return;
    }
    
    if (step === 3 && !paymentMethod) {
      setError('Veuillez sélectionner une méthode de paiement');
      return;
    }
    
    setError('');
    setStep(prev => prev + 1);
  };
  
  const prevStep = () => {
    setStep(prev => prev - 1);
  };
  
  // Gestion des paiements
  const [paymentStatus, setPaymentStatus] = useState(null);

  // Gestion du paiement PayPal
  const handlePayPalSuccess = (details) => {
    console.log('Paiement PayPal réussi:', details);
    setPaymentStatus('success');
    processPaymentSuccess(details);
  };

  const handlePayPalError = (error) => {
    console.error('Erreur PayPal:', error);
    setPaymentStatus('error');
    setError('Une erreur est survenue lors du paiement. Veuillez réessayer.');
    setIsLoading(false);
  };

  const handlePayPalCancel = () => {
    console.log('Paiement PayPal annulé');
    setPaymentStatus('cancelled');
    setError('Le paiement a été annulé.');
    setIsLoading(false);
  };
  
  // Gestion du paiement Stripe
  const handleStripeSuccess = (paymentDetails) => {
    console.log('Paiement Stripe réussi:', paymentDetails);
    setPaymentStatus('success');
    processPaymentSuccess(paymentDetails);
  };

  const handleStripeError = (error) => {
    console.error('Erreur Stripe:', error);
    setPaymentStatus('error');
    setError('Une erreur est survenue lors du paiement. Veuillez réessayer.');
    setIsLoading(false);
  };

  // Traitement après un paiement réussi
  const processPaymentSuccess = (paymentDetails) => {
    setIsLoading(true);
    setError('');
    
    // Préparation des données du rendez-vous pour l'API
    const reservationData = {
      date: selectedDate,
      time: selectedTime,
      treatments: selectedTreatments.map(id => {
        const treatment = treatments.find(t => t.id === id);
        return {
          id,
          name: treatment ? treatment.name : '',
          price: treatment ? treatment.price : 0
        };
      }),
      total_price: totalPrice,
      payment_method: paymentMethod,
      payment_id: paymentDetails.id || paymentDetails.orderID,
      payment_status: paymentDetails.status || 'completed',
      payment_details: paymentDetails,
      notes: ''
    };
    
    console.log('Données de réservation:', reservationData);
    
    // Appel API pour sauvegarder le rendez-vous
    createReservation(reservationData)
      .then(response => {
        console.log('Réservation créée avec succès:', response);
        setIsSuccess(true);
      })
      .catch(error => {
        console.error('Erreur lors de la création de la réservation:', error);
        setError('Une erreur est survenue lors de la création de la réservation. Veuillez réessayer.');
      })
      .finally(() => {
        setIsLoading(false);
      });
  };

  // Soumission du formulaire pour les paiements par carte
  const handleSubmit = () => {
    if (paymentMethod === 'paypal' || paymentMethod === 'stripe') {
      // Les paiements PayPal et Stripe sont gérés par leurs composants respectifs
      return;
    }
    
    // Pour d'autres méthodes de paiement (si ajoutées à l'avenir)
    setIsLoading(true);
    // Simulation pour le moment
    setTimeout(() => {
      processPaymentSuccess({
        id: 'other_payment_' + Date.now(),
        status: 'COMPLETED',
        create_time: new Date().toISOString()
      });
    }, 2000);
  };
  
  // Charger les créneaux lorsque l'utilisateur passe à l'étape 2
  useEffect(() => {
    if (step === 2 && selectedDate && selectedTreatments.length > 0) {
      loadAvailableTimeSlots(selectedDate);
    }
  }, [step, selectedDate, selectedTreatments.length, loadAvailableTimeSlots]);
  
  // Génération du calendrier
  const generateCalendar = () => {
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const lastDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    
    const days = [];
    const dayOfWeek = firstDayOfMonth.getDay() || 7; // Ajustement pour que lundi soit le premier jour
    
    // Jours du mois précédent
    for (let i = 1; i < dayOfWeek; i++) {
      days.push({ day: null, isCurrentMonth: false });
    }
    
    // Jours du mois actuel
    for (let day = 1; day <= lastDayOfMonth.getDate(); day++) {
      const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
      days.push({
        day,
        date: format(date, 'yyyy-MM-dd'),
        isCurrentMonth: true,
        isToday: format(date, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd'),
        isSelected: format(date, 'yyyy-MM-dd') === selectedDate,
        isPast: date < new Date() && format(date, 'yyyy-MM-dd') !== format(new Date(), 'yyyy-MM-dd')
      });
    }
    
    return days;
  };
  
  const calendar = generateCalendar();
  // Navigation dans le calendrier
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  // Gestion du changement de date
  const handleDateChange = (date) => {
    setSelectedDate(date);
    setSelectedTime(''); // Réinitialiser l'heure sélectionnée
    loadAvailableTimeSlots(date);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[90vh] overflow-auto">
        {/* En-tête */}
        <div className="p-6 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {step === 1 && 'Sélectionnez vos traitements'}
            {step === 2 && 'Choisissez une date et heure'}
            {step === 3 && 'Méthode de paiement'}
            {step === 4 && (isSuccess ? 'Réservation confirmée' : 'Confirmation')}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        {/* Contenu */}
        <div className="p-6">
          {/* Messages d'erreur */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4 flex justify-between items-center">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-red-500 hover:text-red-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* Messages de succès (hors étape finale) */}
          {isSuccess && step !== 4 && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-4 flex justify-between items-center">
              <span>Opération réussie!</span>
              <button onClick={() => setIsSuccess(false)} className="text-green-500 hover:text-green-700">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          
          {/* Étape 1: Sélection des traitements */}
          {step === 1 && (
            <div>
              {loading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : treatmentsError ? (
                <p className="text-red-500">Erreur lors du chargement des traitements</p>
              ) : treatments.length === 0 ? (
                <p className="text-gray-500">Aucun traitement disponible</p>
              ) : (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {treatments.map(treatment => (
                      <div 
                        key={treatment.id}
                        className={`
                          border rounded-lg p-4 cursor-pointer
                          ${selectedTreatments.includes(treatment.id) ? 'border-primary bg-primary/5' : 'hover:border-gray-300'}
                        `}
                        onClick={() => toggleTreatment(treatment.id)}
                      >
                        <div className="flex items-start">
                          <div className="flex-1">
                            <h3 className="font-medium text-primary">{treatment.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">{treatment.description}</p>
                            <div className="flex items-center mt-2 text-sm text-gray-600">
                              <Clock className="w-4 h-4 mr-1" />
                              <span>{treatment.duration} min</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end">
                            <span className="font-semibold text-primary">{treatment.price} €</span>
                            <div className={`
                              mt-2 w-5 h-5 rounded-md flex items-center justify-center
                              ${selectedTreatments.includes(treatment.id) ? 'bg-primary text-white' : 'border border-gray-300'}
                            `}>
                              {selectedTreatments.includes(treatment.id) && <Check className="w-3 h-3" />}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {selectedTreatments.length > 0 && (
                    <div className="border-t pt-4">
                      <h3 className="font-medium mb-2">Traitements sélectionnés</h3>
                      <div className="space-y-2">
                        {selectedTreatments.map(treatmentId => {
                          const treatment = treatments.find(t => t.id === treatmentId);
                          return treatment ? (
                            <div key={treatment.id} className="flex justify-between">
                              <span>{treatment.name}</span>
                              <span>{treatment.price} €</span>
                            </div>
                          ) : null;
                        })}
                        <div className="flex justify-between font-semibold pt-2 border-t">
                          <span>Total</span>
                          <span className="text-primary">{totalPrice.toFixed(2)} €</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Étape 2: Date et heure */}
          {step === 2 && (
            <div>
              <h3 className="text-lg font-medium mb-4 text-primary">
                {selectedDate && format(parse(selectedDate, 'yyyy-MM-dd', new Date()), 'EEEE d MMMM yyyy', { locale: fr })}
              </h3>
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-full">&lt;</button>
                  <h3 className="text-lg font-medium">
                    {format(currentMonth, 'MMMM yyyy', { locale: fr })}
                  </h3>
                  <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-full">&gt;</button>
                </div>
                
                <div className="grid grid-cols-7 gap-1 text-center">
                  {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
                    <div key={index} className="py-2 text-sm font-medium text-gray-500">
                      {day}
                    </div>
                  ))}
                  
                  {calendar.map((day, index) => (
                    <button
                      key={index}
                      onClick={() => day.isCurrentMonth && !day.isPast && handleDateChange(day.date)}
                      disabled={!day.isCurrentMonth || day.isPast}
                      className={`
                        py-2 rounded-full text-sm
                        ${!day.isCurrentMonth ? 'text-gray-300' : ''}
                        ${day.isPast ? 'text-gray-300 cursor-not-allowed' : ''}
                        ${day.isSelected ? 'bg-primary text-white' : ''}
                        ${day.isToday && !day.isSelected ? 'border border-primary text-primary' : ''}
                        ${day.isCurrentMonth && !day.isPast && !day.isSelected && !day.isToday ? 'hover:bg-gray-100' : ''}
                      `}
                    >
                      {day.day}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">
                  Heure du rendez-vous
                </h3>
                
                {isLoadingSlots ? (
                  <div className="flex flex-col items-center justify-center py-6">
                    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mb-4"></div>
                    <p className="text-gray-500">Chargement des créneaux disponibles...</p>
                  </div>
                ) : slotsError ? (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md">
                    <p>Impossible de charger les créneaux disponibles.</p>
                    <p className="text-sm mt-1">{slotsError}</p>
                    <button 
                      onClick={() => loadAvailableTimeSlots(selectedDate)}
                      className="mt-2 text-sm text-primary hover:underline"
                    >
                      Réessayer
                    </button>
                  </div>
                ) : availableTimeSlots.length > 0 ? (
                  <div className="grid grid-cols-4 gap-2">
                    {availableTimeSlots.map((time, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedTime(time)}
                        className={`
                          py-2 px-4 border rounded-lg text-center
                          ${selectedTime === time ? 'bg-primary text-white border-primary' : 'hover:bg-gray-50'}
                        `}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-gray-500">Aucun créneau disponible pour cette date.</p>
                    <p className="text-sm text-gray-500 mt-1">Veuillez sélectionner une autre date.</p>
                  </div>
                )}
              </div>
            </div>
          )}
          
          {/* Étape 3: Paiement */}
          {step === 3 && (
            <div>
              <div className="mb-6">
                <h3 className="text-lg font-medium mb-4">Récapitulatif</h3>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <Calendar className="w-4 h-4 text-gray-500" />
                    <span>{format(parse(selectedDate, 'yyyy-MM-dd', new Date()), 'dd MMMM yyyy', { locale: fr })}</span>
                  </div>
                  <div className="flex items-center space-x-2 mb-4">
                    <Clock className="w-4 h-4 text-gray-500" />
                    <span>{selectedTime}</span>
                  </div>
                  
                  <div className="border-t pt-2">
                    {selectedTreatments.map(treatmentId => {
                      const treatment = treatments.find(t => t.id === treatmentId);
                      return treatment ? (
                        <div key={treatment.id} className="flex justify-between py-1">
                          <span>{treatment.name}</span>
                          <span>{treatment.price} €</span>
                        </div>
                      ) : null;
                    })}
                    <div className="flex justify-between font-semibold pt-2 border-t mt-2">
                      <span>Total</span>
                      <span>{totalPrice.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="text-lg font-medium mb-4">Méthode de paiement</h3>
                <div className="space-y-3">
                  <div 
                    className={`
                      border rounded-lg p-4 cursor-pointer flex items-center
                      ${paymentMethod === 'paypal' ? 'border-primary bg-primary/5' : 'hover:border-gray-300'}
                    `}
                    onClick={() => setPaymentMethod('paypal')}
                  >
                    <div className="w-6 h-6 mr-3 flex items-center justify-center">
                      <div className={`w-4 h-4 rounded-full border ${paymentMethod === 'paypal' ? 'border-4 border-primary' : 'border-gray-300'}`}></div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">PayPal</h4>
                    </div>
                    <div className="w-10 h-10 bg-blue-600 rounded-md flex items-center justify-center text-white font-bold">P</div>
                  </div>
                  
                  <div 
                    className={`
                      border rounded-lg p-4 cursor-pointer flex items-center
                      ${paymentMethod === 'stripe' ? 'border-primary bg-primary/5' : 'hover:border-gray-300'}
                    `}
                    onClick={() => setPaymentMethod('stripe')}
                  >
                    <div className="w-6 h-6 mr-3 flex items-center justify-center">
                      <div className={`w-4 h-4 rounded-full border ${paymentMethod === 'stripe' ? 'border-4 border-primary' : 'border-gray-300'}`}></div>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-medium">Carte bancaire (Stripe)</h4>
                    </div>
                    <div className="w-10 h-10 bg-purple-600 rounded-md flex items-center justify-center text-white">
                      <CreditCard className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* Étape 4: Confirmation */}
          {step === 4 && (
            <div className="text-center py-8">
              {isLoading ? (
                <div>
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-lg">Traitement de votre paiement...</p>
                </div>
              ) : isSuccess ? (
                <div>
                  <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold mt-4">Réservation confirmée !</h3>
                  <p className="text-gray-600 mt-2">
                    Votre rendez-vous a été réservé avec succès pour le {format(parse(selectedDate, 'yyyy-MM-dd', new Date()), 'dd MMMM yyyy', { locale: fr })} à {selectedTime}.
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    Un email de confirmation vous a été envoyé.
                  </p>
                  <button 
                    onClick={onClose}
                    className="mt-6 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                  >
                    Fermer
                  </button>
                </div>
              ) : (
                <div>
                  {paymentMethod === 'paypal' ? (
                    <div>
                      <p className="text-lg mb-4">Cliquez sur le bouton PayPal ci-dessous pour finaliser votre paiement.</p>
                      <div className="mt-4">
                        <PayPalButton 
                          amount={totalPrice} 
                          onSuccess={handlePayPalSuccess} 
                          onError={handlePayPalError} 
                          onCancel={handlePayPalCancel} 
                        />
                      </div>
                    </div>
                  ) : paymentMethod === 'stripe' ? (
                    <div>
                      <p className="text-lg mb-4">Complétez les informations de votre carte ci-dessous pour finaliser votre paiement.</p>
                      <div className="mt-4">
                        <StripePayment 
                          amount={totalPrice} 
                          onSuccess={handleStripeSuccess} 
                          onError={handleStripeError} 
                        />
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-lg">Cliquez sur &quot;Confirmer et payer&quot; pour finaliser votre réservation.</p>
                      <p className="text-gray-500 mt-2">Vous serez débité de {totalPrice.toFixed(2)} €.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Pied de page avec boutons de navigation */}
        {(!isSuccess && step !== 4) || (step === 4 && !isLoading && !isSuccess) ? (
          <div className="p-6 border-t flex justify-between">
            {step > 1 ? (
              <button 
                onClick={prevStep}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50"
              >
                Retour
              </button>
            ) : (
              <div></div>
            )}
            
            {step < 4 ? (
              <button 
                onClick={nextStep}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
              >
                Continuer
              </button>
            ) : (
              <button 
                onClick={handleSubmit}
                className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
                disabled={isLoading}
              >
                Confirmer et payer
              </button>
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
