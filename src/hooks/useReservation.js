import { useState, useCallback } from 'react';
import axios from '@/lib/axios';
import { useAuth } from './auth';

export function useReservation() {
  const { user } = useAuth();
  const [availableSlots, setAvailableSlots] = useState([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [slotsError, setSlotsError] = useState(null);
  const [totalDuration, setTotalDuration] = useState(0);
  const [isCreatingReservation, setIsCreatingReservation] = useState(false);
  const [reservationError, setReservationError] = useState(null);
  const [paymentIntent, setPaymentIntent] = useState(null);
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false);
  const [paymentIntentError, setPaymentIntentError] = useState(null);

  /**
   * Récupère les créneaux disponibles pour une date et des traitements donnés
   * @param {string} date - Date au format YYYY-MM-DD
   * @param {Array} treatmentIds - Tableau des IDs des traitements sélectionnés
   */
  const getAvailableTimeSlots = useCallback(async (date, treatmentIds) => {
    if (!date || !treatmentIds || treatmentIds.length === 0) {
      setAvailableSlots([]);
      return;
    }

    setIsLoadingSlots(true);
    setSlotsError(null);

    try {
      const response = await axios.post('/api/appointment/available-slots', {
        date,
        treatment_ids: treatmentIds
      });

      setAvailableSlots(response.data.available_time_slots);
      setTotalDuration(response.data.total_duration);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération des créneaux disponibles:', error);
      setSlotsError(
        error.response?.data?.message ||
        error.response?.data?.errors ||
        'Une erreur est survenue lors de la récupération des créneaux disponibles.'
      );
      setAvailableSlots([]);
      throw error;
    } finally {
      setIsLoadingSlots(false);
    }
  }, []);

  /**
   * Crée une intention de paiement Stripe
   * @param {number} amount - Montant du paiement en euros
   */
  const createPaymentIntent = useCallback(async (amount) => {
    setIsCreatingPaymentIntent(true);
    setPaymentIntentError(null);

    try {
      const response = await axios.post('/api/appointment/stripe/create-payment-intent', {
        amount,
        currency: 'EUR'
      });

      setPaymentIntent(response.data.clientSecret);
      return response.data.clientSecret;
    } catch (error) {
      console.error('Erreur lors de la création de l\'intention de paiement:', error);
      setPaymentIntentError(
        error.response?.data?.message ||
        error.response?.data?.errors ||
        'Une erreur est survenue lors de la préparation du paiement.'
      );
      throw error;
    } finally {
      setIsCreatingPaymentIntent(false);
    }
  }, []);

  /**
   * Vérifie le statut d'un paiement
   * @param {string} paymentId - ID du paiement
   * @param {string} paymentMethod - Méthode de paiement (paypal ou stripe)
   */
  const checkPaymentStatus = useCallback(async (paymentId, paymentMethod) => {
    try {
      const response = await axios.post('/api/appointment/check-payment', {
        payment_id: paymentId,
        payment_method: paymentMethod
      });

      return response.data;
    } catch (error) {
      console.error('Erreur lors de la vérification du statut du paiement:', error);
      throw error;
    }
  }, []);

  /**
   * Crée une réservation avec paiement
   * @param {Object} reservationData - Données de la réservation
   */
  const createReservation = useCallback(async (reservationData) => {
    setIsCreatingReservation(true);
    setReservationError(null);

    try {
      const response = await axios.post('/api/appointment/reservation', reservationData);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la création de la réservation:', error);
      setReservationError(
        error.response?.data?.message ||
        error.response?.data?.errors ||
        'Une erreur est survenue lors de la création de la réservation.'
      );
      throw error;
    } finally {
      setIsCreatingReservation(false);
    }
  }, []);

  return {
    // États
    availableSlots,
    isLoadingSlots,
    slotsError,
    totalDuration,
    isCreatingReservation,
    reservationError,
    paymentIntent,
    isCreatingPaymentIntent,
    paymentIntentError,

    // Méthodes
    getAvailableTimeSlots,
    createPaymentIntent,
    checkPaymentStatus,
    createReservation
  };
}
