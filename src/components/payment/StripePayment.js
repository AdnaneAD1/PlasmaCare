'use client';

import { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import {
  CardElement,
  Elements,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useReservation } from '@/hooks/useReservation';

// Chargement de Stripe avec la clé publique
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'pk_test_TYooMQauvdEDq54NiTphI7jx');

// Options pour l'élément de carte
const cardElementOptions = {
  style: {
    base: {
      fontSize: '16px',
      color: '#424770',
      '::placeholder': {
        color: '#aab7c4',
      },
      iconColor: '#666EE8',
    },
    invalid: {
      color: '#9e2146',
      iconColor: '#fa755a',
    },
  },
  hidePostalCode: true,
};

// Composant de formulaire de carte bancaire
const CheckoutForm = ({ amount, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [clientSecret, setClientSecret] = useState('');
  
  // Utiliser le hook de réservation pour créer l'intention de paiement
  const { createPaymentIntent, isCreatingPaymentIntent, paymentIntentError } = useReservation();

  // Créer l'intention de paiement au chargement du composant
  useEffect(() => {
    const initializePaymentIntent = async () => {
      if (amount > 0) {
        try {
          const secret = await createPaymentIntent(amount);
          setClientSecret(secret);
        } catch (error) {
          console.error('Erreur lors de la création de l\'intention de paiement:', error);
          setErrorMessage('Impossible de préparer le paiement. Veuillez réessayer.');
        }
      }
    };
    
    initializePaymentIntent();
  }, [amount, createPaymentIntent]);
  
  // Afficher les erreurs de l'intention de paiement
  useEffect(() => {
    if (paymentIntentError) {
      setErrorMessage(paymentIntentError);
    }
  }, [paymentIntentError]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!stripe || !elements || !clientSecret) {
      // Stripe.js n'est pas encore chargé ou pas de client secret
      setErrorMessage('Impossible de traiter le paiement pour le moment. Veuillez réessayer.');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      // Confirmer le paiement avec le client secret
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: elements.getElement(CardElement),
          billing_details: {
            name: 'Client PlasmaCare', // Vous pouvez rendre ceci dynamique si nécessaire
            email: '', // Optionnel, peut être ajouté dynamiquement
          },
        }
      });
      
      console.log('Résultat du paiement Stripe:', result);

      if (result.error) {
        // Erreur lors du paiement
        setErrorMessage(result.error.message);
        onError(result.error);
      } else if (result.paymentIntent.status === 'succeeded') {
        // Paiement réussi
        onSuccess({
          id: result.paymentIntent.id,
          status: result.paymentIntent.status,
          create_time: new Date().toISOString(),
          payment_method: 'stripe'
        });
      }
    } catch (error) {
      setErrorMessage('Une erreur est survenue lors du traitement du paiement.');
      onError(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Détails de la carte
        </label>
        <div className="p-4 border rounded-md">
          <CardElement options={cardElementOptions} />
        </div>
      </div>
      
      {errorMessage && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-4">
          <p className="text-sm">{errorMessage}</p>
        </div>
      )}
      
      <div className="flex items-center mb-4 text-sm text-gray-600">
        <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
        </svg>
        <span>Paiement sécurisé par Stripe</span>
      </div>
      
      <button
        type="submit"
        disabled={!stripe || !clientSecret || loading || isCreatingPaymentIntent}
        className={`
          w-full px-4 py-2 bg-primary text-white rounded-md
          ${(!stripe || !clientSecret || loading || isCreatingPaymentIntent) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary/90'}
        `}
      >
        {loading ? 'Traitement en cours...' : 
         isCreatingPaymentIntent ? 'Préparation du paiement...' : 
         !clientSecret ? 'Chargement...' : 
         `Payer ${amount.toFixed(2)} €`}
      </button>
    </form>
  );
};

// Composant principal qui encapsule le formulaire avec le provider Stripe
export default function StripePayment({ amount, onSuccess, onError }) {
  return (
    <Elements stripe={stripePromise}>
      <CheckoutForm amount={amount} onSuccess={onSuccess} onError={onError} />
    </Elements>
  );
}
