'use client'

import { Calendar, Clock, RefreshCw, Check, Clock4, X, Plus, CreditCard, Package, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Script from 'next/script';
import { useAppointments } from '../../../hooks/useAppointments';
import { useTreatments } from '../../../hooks/useTreatments';
import { useState, useEffect } from 'react';
import { EmptyState } from '@/components/ui/EmptyState';
import { loadStripe } from '@stripe/stripe-js';
import { PayPalButtons, PayPalScriptProvider } from '@paypal/react-paypal-js';
import axios from '@/lib/axios';

// Pré-chargement de Stripe (uniquement côté client)
const getStripe = () => {
  if (typeof window !== 'undefined') {
    return loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || 'pk_test_placeholder');
  }
  return null;
};

export default function Appointments() {
  const { appointments, isLoading: appointmentsLoading, error: appointmentsError, updateAppointmentStatus, refreshAppointments, createAppointment } = useAppointments();
  const { treatments, isLoading: treatmentsLoading, error: treatmentsError } = useTreatments();
  
  const [updatingId, setUpdatingId] = useState(null);
  
  // États pour le formulaire de rendez-vous
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);
  const [currentStep, setCurrentStep] = useState(1); // Commence par la sélection des traitements
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [selectedTreatments, setSelectedTreatments] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [availableTimes, setAvailableTimes] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // États pour Calendly
  const [isCalendlyLoaded, setIsCalendlyLoaded] = useState(false);
  const [showCalendly, setShowCalendly] = useState(false);

  // Fonctions pour Calendly
  useEffect(() => {
    if (window.Calendly && showCalendly) {
      setIsCalendlyLoaded(true);
      initCalendly();
    }
  }, [showCalendly]);

  const initCalendly = () => {
    if (window.Calendly) {
      const container = document.querySelector('.calendly-container');
      if (container) {
        container.innerHTML = '';
      }
      
      window.Calendly.initInlineWidget({
        url: 'https://calendly.com/sidiamadouadnane4?hide_landing_page_details=1&hide_gdpr_banner=1&primary_color=f6a667',
        parentElement: container,
        prefill: {},
        utm: {}
      });
    }
  };

  const handleCalendlyLoad = () => {
    setIsCalendlyLoaded(true);
    if (showCalendly) {
      initCalendly();
    }
  };

  const reloadCalendly = () => {
    initCalendly();
  };

  // Générer les jours du mois actuel pour le calendrier
  const getDaysInMonth = (year, month) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getMonthDays = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    
    // Ajuster pour que la semaine commence le lundi (0 = lundi, 6 = dimanche)
    const adjustedFirstDay = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    
    const days = [];
    
    // Jours du mois précédent pour remplir la première semaine
    const prevMonthDays = getDaysInMonth(year, month - 1);
    for (let i = adjustedFirstDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        month: month - 1,
        year,
        isCurrentMonth: false
      });
    }
    
    // Jours du mois actuel
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        month,
        year,
        isCurrentMonth: true
      });
    }
    
    // Jours du mois suivant pour compléter la dernière semaine
    const totalDaysShown = Math.ceil((adjustedFirstDay + daysInMonth) / 7) * 7;
    const nextMonthDays = totalDaysShown - adjustedFirstDay - daysInMonth;
    for (let i = 1; i <= nextMonthDays; i++) {
      days.push({
        day: i,
        month: month + 1,
        year,
        isCurrentMonth: false
      });
    }
    
    return days;
  };

  // Fonction utilitaire pour formater une date en YYYY-MM-DD de manière cohérente
  const formatDateForAPI = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth() + 1; // +1 car getMonth() retourne 0-11
    const day = date.getDate();
    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  };
  
  // Générer les créneaux horaires disponibles en fonction des traitements sélectionnés
  const generateTimeSlots = async (date) => {
    if (!date || selectedTreatments.length === 0) {
      return [];
    }
    
    try {
      // Appel à notre nouvelle API pour obtenir les créneaux disponibles
      // Utiliser notre fonction de formatage cohérente
      const formattedDate = formatDateForAPI(date);
      console.log('Date envoyée à l\'API pour les créneaux:', formattedDate);
      
      const response = await axios.post('/api/appointment-slots', {
        date: formattedDate,
        treatment_ids: selectedTreatments
      });
      
      return response.data.available_slots;
    } catch (error) {
      console.error('Erreur lors de la récupération des créneaux disponibles:', error);
      return [];
    }
  };

  // Formater la date pour l'affichage
  const formatDate = (date) => {
    if (!date) return '';
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  };

  // Formater le mois pour l'affichage
  const formatMonth = (date) => {
    const options = { month: 'long', year: 'numeric' };
    return date.toLocaleDateString('fr-FR', options);
  };

  // Vérifier si une date est aujourd'hui
  const isToday = (day, month, year) => {
    const today = new Date();
    return day === today.getDate() && 
           month === today.getMonth() && 
           year === today.getFullYear();
  };

  // Vérifier si une date est dans le passé
  const isPastDate = (day, month, year) => {
    const today = new Date();
    const date = new Date(year, month, day);
    return date < new Date(today.getFullYear(), today.getMonth(), today.getDate());
  };

  // Naviguer au mois précédent
  const goToPreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  // Naviguer au mois suivant
  const goToNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  // Sélectionner une date
  const handleDateSelect = (day, month, year) => {
    if (isPastDate(day, month, year)) return;
    
    // Créer un objet Date directement avec les valeurs correctes
    // Remarque importante: month est déjà au format JavaScript (0-11)
    // donc nous n'avons pas besoin de soustraire 1
    const newSelectedDate = new Date(year, month, day, 12, 0, 0);
    
    console.log(`Sélection de date: jour=${day}, mois=${month} (${month+1} en format humain), année=${year}`);
    console.log('Date créée:', newSelectedDate);
    console.log('Date formattée pour API:', formatDateForAPI(newSelectedDate));
    
    // Mettre à jour l'état immédiatement (priorité élevée)
    setSelectedDate(newSelectedDate);
    setSelectedTime(null); // Réinitialiser l'heure sélectionnée
    
    // Afficher un indicateur de chargement pour les créneaux
    setAvailableTimes([]);
    
    // Générer les créneaux horaires disponibles pour cette date
    // Utiliser un setTimeout de 0ms pour s'assurer que l'état de la date est mis à jour en premier
    setTimeout(async () => {
      const slots = await generateTimeSlots(newSelectedDate);
      setAvailableTimes(slots);
    }, 0);
  };

  // Sélectionner un créneau horaire
  const handleTimeSelect = (time) => {
    setSelectedTime(time);
  };

  // Basculer la sélection d'un traitement
  const toggleTreatment = (treatmentId) => {
    setSelectedTreatments(prev => {
      const isSelected = prev.some(t => t === treatmentId);
      if (isSelected) {
        return prev.filter(t => t !== treatmentId);
      } else {
        return [...prev, treatmentId];
      }
    });
  };

  // Calculer le total des traitements sélectionnés
  const calculateTotal = () => {
    if (!treatments) return 0;
    return selectedTreatments.reduce((total, treatmentId) => {
      const treatment = treatments.find(t => t.id === treatmentId);
      return total + (treatment ? parseFloat(treatment.price) : 0);
    }, 0);
  };

  // Passer à l'étape suivante du formulaire
  const goToNextStep = () => {
    if (currentStep === 1 && selectedTreatments.length === 0) {
      alert('Veuillez sélectionner au moins un traitement');
      return;
    }
    
    if (currentStep === 2 && (!selectedDate || !selectedTime)) {
      alert('Veuillez sélectionner une date et une heure');
      return;
    }
    
    setCurrentStep(currentStep + 1);
  };

  // Revenir à l'étape précédente du formulaire
  const goToPreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  // Gérer le paiement Stripe
  const handleStripePayment = async () => {
    setIsProcessingPayment(true);
    
    try {
      // Ici, vous feriez un appel API pour créer une session de paiement Stripe
      // Pour l'exemple, nous simulons un paiement réussi après 2 secondes
      const stripe = await getStripe();
      if (!stripe) {
        throw new Error("Stripe n'a pas pu être chargé");
      }
      
      await new Promise(resolve => setTimeout(resolve, 2000));
      await handleAppointmentSubmit('stripe');
    } catch (error) {
      console.error('Erreur lors du paiement Stripe:', error);
      alert('Une erreur est survenue lors du paiement');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  // Gérer le paiement PayPal
  const handlePayPalApprove = async (data, actions) => {
    try {
      await actions.order.capture();
      await handleAppointmentSubmit('paypal');
    } catch (error) {
      console.error('Erreur lors du paiement PayPal:', error);
      alert('Une erreur est survenue lors du paiement');
    }
  };

  // Soumettre le rendez-vous après paiement
  const handleAppointmentSubmit = async (paymentProvider) => {
    setIsSubmitting(true);
    
    try {
      // Préparer les données du rendez-vous
      // Utiliser notre fonction de formatage cohérente
      const formattedDate = formatDateForAPI(selectedDate);
      
      console.log('Date du rendez-vous envoyée au backend (formattée manuellement):', formattedDate);
      console.log('Date sélectionnée (objet):', selectedDate);
      
      const appointmentData = {
        date: formattedDate,
        time: selectedTime,
        treatment_ids: selectedTreatments,
        payment_method: paymentProvider,
        payment_status: 'completed'
      };
      
      // Appel API pour créer le rendez-vous avec notre nouvelle API de réservation
      const response = await axios.post('/api/appointment-reservation', appointmentData);
      
      // Réinitialiser le formulaire et rafraîchir les rendez-vous
      setShowAppointmentForm(false);
      setCurrentStep(1);
      setSelectedDate(null);
      setSelectedTime(null);
      setSelectedTreatments([]);
      setPaymentMethod(null);
      refreshAppointments();
      
      alert('Votre rendez-vous a été confirmé avec succès !');
    } catch (error) {
      console.error('Erreur lors de la création du rendez-vous:', error);
      
      // Afficher un message d'erreur plus précis si disponible
      if (error.response && error.response.data && error.response.data.message) {
        alert(`Erreur: ${error.response.data.message}`);
      } else {
        alert('Une erreur est survenue lors de la création du rendez-vous');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      setUpdatingId(id);
      await updateAppointmentStatus(id, newStatus);
    } catch (error) {
      console.error('Erreur lors de la mise à jour du statut:', error);
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const translateStatus = (status) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmé';
      case 'pending':
        return 'En attente';
      case 'cancelled':
        return 'Annulé';
      default:
        return status;
    }
  };

  const isLoading = appointmentsLoading || treatmentsLoading;
  const error = appointmentsError || treatmentsError;

  if (isLoading) {
    return <div className="flex items-center justify-center py-12">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
    </div>;
  }

  if (error) {
    return <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Mes rendez-vous</h1>

      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Prendre un rendez-vous</h2>
            {showCalendly && isCalendlyLoaded && (
              <button
                onClick={reloadCalendly}
                className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <RefreshCw className="w-4 h-4" />
                Recharger le calendrier
              </button>
            )}
          </div>
        </div>
        
        {!showAppointmentForm && !showCalendly ? (
          <div className="p-16 flex flex-col items-center justify-center bg-gray-50">
            <div className="flex gap-4 mb-6">
              <button
                onClick={() => setShowAppointmentForm(true)}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-5 h-5" />
                Prendre un rendez-vous
              </button>
              <button
                onClick={() => setShowCalendly(true)}
                className="flex items-center gap-2 px-6 py-3 border border-primary text-primary rounded-lg hover:bg-primary/10 transition-colors"
              >
                <Calendar className="w-5 h-5" />
                Utiliser Calendly
              </button>
            </div>
            <p className="text-sm text-gray-600">
              Choisissez comment vous souhaitez prendre rendez-vous
            </p>
          </div>
        ) : showCalendly ? (
          <div className="relative w-full" style={{ height: '700px' }}>
            <div className="calendly-container absolute inset-0" />
            {!isCalendlyLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-sm text-gray-600">Chargement du calendrier...</p>
                </div>
              </div>
            )}
            
            <Script
              src="https://assets.calendly.com/assets/external/widget.js"
              strategy="lazyOnload"
              async
              onLoad={handleCalendlyLoad}
            />
          </div>
        ) : (
          <div className="p-6">
            {/* Formulaire de rendez-vous multi-étapes */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">
                  {currentStep === 1 && 'Sélectionnez vos traitements'}
                  {currentStep === 2 && 'Réserver un rendez-vous'}
                  {currentStep === 3 && 'Méthode de paiement'}
                </h3>
                <button
                  onClick={() => setShowAppointmentForm(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Indicateur d'étape */}
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center w-full">
                  <div className="relative flex items-center justify-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= 1 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>1</div>
                    <div className="absolute -bottom-6 w-max text-xs font-medium text-gray-500">Traitements</div>
                  </div>
                  <div className={`flex-1 h-1 ${currentStep >= 2 ? 'bg-primary' : 'bg-gray-200'}`}></div>
                  <div className="relative flex items-center justify-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= 2 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>2</div>
                    <div className="absolute -bottom-6 w-max text-xs font-medium text-gray-500">Date & Heure</div>
                  </div>
                  <div className={`flex-1 h-1 ${currentStep >= 3 ? 'bg-primary' : 'bg-gray-200'}`}></div>
                  <div className="relative flex items-center justify-center">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${currentStep >= 3 ? 'bg-primary text-white' : 'bg-gray-200 text-gray-600'}`}>3</div>
                    <div className="absolute -bottom-6 w-max text-xs font-medium text-gray-500">Paiement</div>
                  </div>
                </div>
              </div>
              
              {/* Étape 1: Sélection des traitements */}
              {currentStep === 1 && (
                <div className="mt-10">
                  <h4 className="font-medium mb-4 flex items-center">
                    <Package className="w-5 h-5 mr-2 text-primary" />
                    Sélectionnez vos traitements
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {treatments?.map((treatment) => {
                      const isSelected = selectedTreatments.includes(treatment.id);
                      
                      return (
                        <div 
                          key={treatment.id}
                          className={`
                            border rounded-lg p-4 cursor-pointer transition-colors
                            ${isSelected ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}
                          `}
                          onClick={() => toggleTreatment(treatment.id)}
                        >
                          <div className="flex items-start">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              className="mt-1 mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                            />
                            <div>
                              <h5 className="font-medium">{treatment.name}</h5>
                              <div className="flex items-center mt-1 text-xs text-gray-600">
                                <Clock className="w-3 h-3 mr-1" />
                                <span>{treatment.duration} min</span>
                              </div>
                              <p className="text-sm text-gray-500 mt-1">{treatment.description || 'Aucune description disponible'}</p>
                              <p className="text-primary font-medium mt-2">{treatment.price} €</p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  
                  <div className="mt-6 bg-gray-50 p-4 rounded-lg">
                    <h5 className="font-medium mb-2">Traitements sélectionnés</h5>
                    
                    {selectedTreatments.length > 0 ? (
                      <div className="space-y-2">
                        {selectedTreatments.map((treatmentId) => {
                          const treatment = treatments.find(t => t.id === treatmentId);
                          if (!treatment) return null;
                          
                          return (
                            <div key={treatmentId} className="flex justify-between items-center">
                              <div>
                                <span>{treatment.name}</span>
                                <span className="text-xs text-gray-500 ml-2">({treatment.duration} min)</span>
                              </div>
                              <span className="font-medium">{treatment.price} €</span>
                            </div>
                          );
                        })}
                        
                        <div className="border-t pt-2 mt-2 flex justify-between items-center font-medium">
                          <span>Total</span>
                          <span className="text-primary">{calculateTotal().toFixed(2)} €</span>
                        </div>
                      </div>
                    ) : (
                      <p className="text-gray-500">Aucun traitement sélectionné</p>
                    )}
                  </div>
                </div>
              )}
              
              {/* Étape 2: Sélection de la date et de l'heure */}
              {currentStep === 2 && (
                <div className="mt-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Calendrier */}
                    <div>
                      <h4 className="font-medium mb-4 flex items-center">
                        <Calendar className="w-5 h-5 mr-2 text-primary" />
                        Date du rendez-vous
                      </h4>
                      
                      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                        <div className="flex items-center justify-between p-4 border-b">
                          <button 
                            onClick={goToPreviousMonth}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                          </button>
                          <span className="font-medium">{formatMonth(currentMonth)}</span>
                          <button 
                            onClick={goToNextMonth}
                            className="p-1 rounded-full hover:bg-gray-100"
                          >
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                          </button>
                        </div>
                        
                        <div className="p-4">
                          <div className="grid grid-cols-7 gap-1 mb-2">
                            {['L', 'M', 'M', 'J', 'V', 'S', 'D'].map((day, index) => (
                              <div key={index} className="text-center text-sm font-medium text-gray-500">{day}</div>
                            ))}
                          </div>
                          
                          <div className="grid grid-cols-7 gap-1">
                            {getMonthDays(currentMonth).map((day, index) => {
                              const isSelected = selectedDate && 
                                selectedDate.getDate() === day.day && 
                                selectedDate.getMonth() === day.month && 
                                selectedDate.getFullYear() === day.year;
                              
                              const isPast = isPastDate(day.day, day.month, day.year);
                              const isTodayDate = isToday(day.day, day.month, day.year);
                              
                              return (
                                <button
                                  key={index}
                                  onClick={() => handleDateSelect(day.day, day.month, day.year)}
                                  disabled={isPast}
                                  className={`
                                    h-10 rounded-lg flex items-center justify-center text-sm font-medium
                                    ${!day.isCurrentMonth ? 'text-gray-400 font-normal' : 'text-gray-700'}
                                    ${isSelected ? 'bg-primary text-white shadow-lg font-bold scale-110 z-10 transition-all duration-150' : ''}
                                    ${isTodayDate && !isSelected ? 'bg-primary-50 text-primary-700 ring-1 ring-primary-400' : ''}
                                    ${isPast ? 'cursor-not-allowed opacity-50' : 'hover:bg-gray-50'}
                                  `}
                                >
                                  {day.day}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      
                      {selectedDate && (
                        <div className="mt-4 text-sm text-gray-600">
                          Date sélectionnée: <span className="font-medium">{formatDate(selectedDate)}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* Sélection de l'heure */}
                    <div>
                      <h4 className="font-medium mb-4 flex items-center">
                        <Clock className="w-5 h-5 mr-2 text-primary" />
                        Heure du rendez-vous
                      </h4>
                      
                      {selectedDate ? (
                        <div className="grid grid-cols-4 gap-2">
                          {availableTimes.map((time, index) => {
                            const isSelected = time === selectedTime;
                            
                            return (
                              <button
                                key={index}
                                onClick={() => handleTimeSelect(time)}
                                className={`
                                  py-2 px-3 rounded-lg text-sm font-medium
                                  ${isSelected ? 'bg-primary text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}
                                `}
                              >
                                {time}
                              </button>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-8 text-center text-gray-500">
                          Veuillez d'abord sélectionner une date
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              {/* Étape 3: Paiement */}
              {currentStep === 3 && (
                <div className="mt-10">
                  <h4 className="font-medium mb-4 flex items-center">
                    <CreditCard className="w-5 h-5 mr-2 text-primary" />
                    Méthode de paiement
                  </h4>
                  
                  <div className="space-y-4">
                    <div className="bg-gray-50 p-4 rounded-lg mb-6">
                      <h5 className="font-medium mb-2">Récapitulatif de la commande</h5>
                      
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between">
                          <span>Date:</span>
                          <span className="font-medium">{formatDate(selectedDate)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Heure:</span>
                          <span className="font-medium">{selectedTime}</span>
                        </div>
                        <div className="border-t pt-2 mt-2">
                          <div className="font-medium mb-2">Traitements:</div>
                          {selectedTreatments.map((treatmentId) => {
                            const treatment = treatments.find(t => t.id === treatmentId);
                            if (!treatment) return null;
                            
                            return (
                              <div key={treatmentId} className="flex justify-between items-center">
                                <span>{treatment.name}</span>
                                <span>{treatment.price} €</span>
                              </div>
                            );
                          })}
                        </div>
                        
                        <div className="border-t pt-2 mt-2 flex justify-between items-center font-medium">
                          <span>Total à payer:</span>
                          <span className="text-primary text-lg">{calculateTotal().toFixed(2)} €</span>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div 
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${paymentMethod === 'stripe' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}
                        onClick={() => setPaymentMethod('stripe')}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            checked={paymentMethod === 'stripe'}
                            onChange={() => {}}
                            className="mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300"
                          />
                          <div className="flex items-center">
                            <span className="font-medium mr-2">Carte bancaire (Stripe)</span>
                          </div>
                        </div>
                      </div>
                      
                      <div 
                        className={`border rounded-lg p-4 cursor-pointer transition-colors ${paymentMethod === 'paypal' ? 'border-primary bg-primary/5' : 'border-gray-200 hover:border-gray-300'}`}
                        onClick={() => setPaymentMethod('paypal')}
                      >
                        <div className="flex items-center">
                          <input
                            type="radio"
                            checked={paymentMethod === 'paypal'}
                            onChange={() => {}}
                            className="mr-3 h-4 w-4 text-primary focus:ring-primary border-gray-300"
                          />
                          <div className="flex items-center">
                            <span className="font-medium mr-2">PayPal</span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {paymentMethod === 'stripe' && (
                      <div className="mt-4">
                        <button
                          onClick={handleStripePayment}
                          disabled={isProcessingPayment}
                          className="w-full py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                        >
                          {isProcessingPayment ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                              Traitement en cours...
                            </>
                          ) : (
                            <>Payer {calculateTotal().toFixed(2)} €</>
                          )}
                        </button>
                      </div>
                    )}
                    
                    {paymentMethod === 'paypal' && (
                      <div className="mt-4">
                        <PayPalScriptProvider options={{ 
                          'client-id': process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
                          currency: 'EUR',
                          intent: 'capture',
                          'disable-funding': 'credit,card'
                        }}>
                          <PayPalButtons
                            createOrder={(data, actions) => {
                              return actions.order.create({
                                purchase_units: [
                                  {
                                    amount: {
                                      value: calculateTotal().toFixed(2),
                                      currency_code: 'EUR'
                                    },
                                    description: `Rendez-vous du ${formatDate(selectedDate)} à ${selectedTime}`
                                  },
                                ],
                              });
                            }}
                            onApprove={handlePayPalApprove}
                            style={{ layout: 'horizontal' }}
                          />
                        </PayPalScriptProvider>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Boutons de navigation */}
              <div className="flex justify-between mt-8">
                {currentStep > 1 ? (
                  <button
                    onClick={goToPreviousStep}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Précédent
                  </button>
                ) : (
                  <button
                    onClick={() => setShowAppointmentForm(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                  >
                    Annuler
                  </button>
                )}
                
                {currentStep < 3 && (
                  <button
                    onClick={goToNextStep}
                    className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 flex items-center"
                  >
                    Suivant
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {appointments.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm">
          <h2 className="text-xl font-semibold p-6 border-b">Rendez-vous prévus</h2>
          <div className="grid divide-y">
            {appointments.map((appointment) => (
              <div key={appointment.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex flex-col">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{appointment.date}</span>
                      </div>
                      <div className="flex items-center space-x-2 mt-1">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <span>{appointment.time}</span>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-medium">{appointment.title}</h3>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(appointment.status)}`}>
                      {translateStatus(appointment.status)}
                    </span>
                    <div className="flex gap-1">
                      {appointment.status !== 'confirmed' && (
                        <button
                          onClick={() => handleStatusUpdate(appointment.id, 'confirmed')}
                          disabled={updatingId === appointment.id}
                          className="p-1 text-green-600 hover:bg-green-50 rounded-full"
                          title="Confirmer"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      {appointment.status !== 'pending' && (
                        <button
                          onClick={() => handleStatusUpdate(appointment.id, 'pending')}
                          disabled={updatingId === appointment.id}
                          className="p-1 text-yellow-600 hover:bg-yellow-50 rounded-full"
                          title="Mettre en attente"
                        >
                          <Clock4 className="w-4 h-4" />
                        </button>
                      )}
                      {appointment.status !== 'cancelled' && (
                        <button
                          onClick={() => handleStatusUpdate(appointment.id, 'cancelled')}
                          disabled={updatingId === appointment.id}
                          className="p-1 text-red-600 hover:bg-red-50 rounded-full"
                          title="Annuler"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <EmptyState
          icon={Calendar}
          title="Aucun rendez-vous"
          description="Vous n'avez pas encore de rendez-vous prévu. Cliquez sur le bouton ci-dessus pour prendre un rendez-vous."
          actionLabel="Prendre un rendez-vous"
          onAction={() => setShowAppointmentForm(true)}
        />
      )}
    </div>
  );
}
