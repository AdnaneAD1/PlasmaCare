import React from 'react';

interface EmailPreviewProps {
  appointment: {
    user_first_name: string;
    user_last_name: string;
    appointment_date: string;
    treatment_name: string;
    treatment_duration: number;
    treatment_price: number;
    location?: string;
    user_email: string;
  };
  onClose: () => void;
}

export function EmailPreview({ appointment, onClose }: EmailPreviewProps) {
  const appointmentDate = new Date(appointment.appointment_date);
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-auto">
        <div className="sticky top-0 bg-white p-4 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Aperçu de l'email de confirmation</h3>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>
        
        <div className="p-4">
          <div className="mb-4 bg-gray-100 p-3 rounded-lg">
            <p><strong>À:</strong> {appointment.user_email}</p>
            <p><strong>Sujet:</strong> Confirmation de votre rendez-vous chez PlasmaCare</p>
          </div>
          
          <div className="border rounded-lg overflow-hidden">
            {/* Email Header */}
            <div className="bg-primary text-white p-4 text-center">
              <h1 className="text-xl font-bold">PlasmaCare</h1>
              <p>Votre rendez-vous est confirmé</p>
            </div>
            
            {/* Email Content */}
            <div className="p-4 bg-gray-50">
              <p>Bonjour {appointment.user_first_name} {appointment.user_last_name},</p>
              
              <p className="my-4">Nous avons le plaisir de vous confirmer votre rendez-vous chez PlasmaCare.</p>
              
              <div className="bg-white rounded-lg p-4 my-4 border-l-4 border-primary">
                <h3 className="font-semibold mb-2">Détails du rendez-vous :</h3>
                <p><strong>Date :</strong> {appointmentDate.toLocaleDateString()}</p>
                <p><strong>Heure :</strong> {appointmentDate.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                <p><strong>Traitement :</strong> {appointment.treatment_name}</p>
                <p><strong>Durée :</strong> {appointment.treatment_duration} minutes</p>
                <p><strong>Prix :</strong> {appointment.treatment_price} €</p>
                <p><strong>Lieu :</strong> {appointment.location || 'Cabinet Principal'}</p>
              </div>
              
              <p className="my-4">Si vous avez des questions ou si vous souhaitez modifier votre rendez-vous, n'hésitez pas à nous contacter par téléphone au 01 23 45 67 89 ou par email à contact@plasmacare.com.</p>
              
              <p className="my-4">Nous vous remercions de votre confiance et nous nous réjouissons de vous accueillir prochainement.</p>
              
              <p>Cordialement,<br/>L'équipe PlasmaCare</p>
              
              <div className="text-center mt-6">
                <button className="bg-primary text-white px-4 py-2 rounded-lg">
                  Gérer mes rendez-vous
                </button>
              </div>
            </div>
            
            {/* Email Footer */}
            <div className="p-4 text-center text-sm text-gray-500 border-t">
              <p>PlasmaCare - 123 Avenue des Soins, 75000 Paris</p>
              <p>© 2025 PlasmaCare. Tous droits réservés.</p>
            </div>
          </div>
          
          <div className="mt-4 bg-blue-50 p-3 rounded-lg text-sm text-blue-700">
            <p>
              <strong>Note:</strong> Cet email sera envoyé via Mailtrap en mode test. 
              Vous pouvez consulter les emails envoyés dans votre boîte de réception Mailtrap.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}