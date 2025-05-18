'use client';

import { useEffect } from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

export default function PayPalButton({ amount, onSuccess, onError, onCancel }) {
  // Configuration initiale de PayPal
  const initialOptions = {
    "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || 'test',
    currency: "EUR",
    intent: "capture",
  };

  useEffect(() => {
    // Log pour vérifier que le montant est correctement passé
    console.log('PayPal amount:', amount);
  }, [amount]);

  return (
    <PayPalScriptProvider options={initialOptions}>
      <PayPalButtons
        style={{
          color: "blue",
          shape: "rect",
          label: "pay",
          height: 40,
        }}
        createOrder={(data, actions) => {
          return actions.order.create({
            purchase_units: [
              {
                amount: {
                  value: amount.toString(),
                  currency_code: "EUR"
                },
                description: "Réservation de traitement(s) PlasmaCare"
              },
            ],
          });
        }}
        onApprove={(data, actions) => {
          return actions.order.capture().then((details) => {
            console.log('Transaction completed by', details.payer.name.given_name);
            console.log('Transaction details:', details);
            onSuccess(details);
          });
        }}
        onCancel={(data) => {
          console.log('Transaction cancelled:', data);
          onCancel(data);
        }}
        onError={(err) => {
          console.error('PayPal error:', err);
          onError(err);
        }}
      />
    </PayPalScriptProvider>
  );
}
