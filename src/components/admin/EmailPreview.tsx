import React, { useState } from 'react';
import { X } from 'lucide-react';

interface EmailPreviewProps {
  appointment: {
    id: string;
    appointment_date: string;
    status: string;
    user: {
      first_name: string;
      last_name: string;
      email: string;
    };
    treatment: {
      name: string;
      duration: number;
      price: number;
    };
  };
  onClose: () => void;
}

export function EmailPreview({ appointment, onClose }: EmailPreviewProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<'confirmed' | 'cancelled' | 'created'>('confirmed');

  const templates = {
    confirmed: {
      subject: 'Votre rendez-vous est confirmé',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #b97A56; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">PlasmaCare</h1>
            <p>Votre rendez-vous est confirmé</p>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Bonjour ${appointment.user.first_name},</p>
            
            <p>Nous avons le plaisir de vous confirmer votre rendez-vous chez PlasmaCare.</p>
            
            <div style="background-color: white; border-radius: 5px; padding: 15px; margin: 20px 0; border-left: 4px solid #b97A56;">
              <h3>Détails du rendez-vous :</h3>
              <p><strong>Date :</strong> ${new Date(appointment.appointment_date).toLocaleDateString('fr-FR')}</p>
              <p><strong>Heure :</strong> ${new Date(appointment.appointment_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
              <p><strong>Traitement :</strong> ${appointment.treatment.name}</p>
              <p><strong>Durée :</strong> ${appointment.treatment.duration} minutes</p>
              <p><strong>Prix :</strong> ${appointment.treatment.price} €</p>
            </div>
            
            <p>Si vous avez des questions ou si vous souhaitez modifier votre rendez-vous, n'hésitez pas à nous contacter.</p>
            
            <p>Cordialement,<br>L'équipe PlasmaCare</p>
          </div>
          
          <div style="text-align: center; padding: 20px; font-size: 12px; color: #666;">
            <p>PlasmaCare - 123 Avenue des Soins, 75000 Paris</p>
            <p>© 2025 PlasmaCare. Tous droits réservés.</p>
          </div>
        </div>
      `
    },
    cancelled: {
      subject: 'Votre rendez-vous a été annulé',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #dc2626; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">PlasmaCare</h1>
            <p>Annulation de rendez-vous</p>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Bonjour ${appointment.user.first_name},</p>
            
            <p>Nous vous informons que votre rendez-vous a été annulé :</p>
            
            <div style="background-color: white; border-radius: 5px; padding: 15px; margin: 20px 0; border-left: 4px solid #dc2626;">
              <p><strong>Date :</strong> ${new Date(appointment.appointment_date).toLocaleDateString('fr-FR')}</p>
              <p><strong>Heure :</strong> ${new Date(appointment.appointment_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
              <p><strong>Traitement :</strong> ${appointment.treatment.name}</p>
            </div>
            
            <p>N'hésitez pas à reprendre rendez-vous en ligne ou à nous contacter pour plus d'informations.</p>
            
            <p>Cordialement,<br>L'équipe PlasmaCare</p>
          </div>
        </div>
      `
    },
    created: {
      subject: 'Nouveau rendez-vous créé',
      content: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background-color: #0891b2; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">PlasmaCare</h1>
            <p>Nouveau rendez-vous</p>
          </div>
          
          <div style="padding: 20px; background-color: #f9f9f9;">
            <p>Bonjour ${appointment.user.first_name},</p>
            
            <p>Nous avons bien reçu votre demande de rendez-vous :</p>
            
            <div style="background-color: white; border-radius: 5px; padding: 15px; margin: 20px 0; border-left: 4px solid #0891b2;">
              <p><strong>Date :</strong> ${new Date(appointment.appointment_date).toLocaleDateString('fr-FR')}</p>
              <p><strong>Heure :</strong> ${new Date(appointment.appointment_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
              <p><strong>Traitement :</strong> ${appointment.treatment.name}</p>
              <p><strong>Durée :</strong> ${appointment.treatment.duration} minutes</p>
            </div>
            
            <p>Nous vous confirmerons le rendez-vous très prochainement.</p>
            
            <p>Cordialement,<br>L'équipe PlasmaCare</p>
          </div>
        </div>
      `
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Prévisualisation de l'email</h2>
            <p className="text-sm text-gray-500">
              Pour : {appointment.user.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b">
          <div className="flex gap-4">
            <button
              onClick={() => setSelectedTemplate('confirmed')}
              className={`px-4 py-2 rounded ${
                selectedTemplate === 'confirmed'
                  ? 'bg-green-100 text-green-700'
                  : 'hover:bg-gray-100'
              }`}
            >
              Confirmation
            </button>
            <button
              onClick={() => setSelectedTemplate('cancelled')}
              className={`px-4 py-2 rounded ${
                selectedTemplate === 'cancelled'
                  ? 'bg-red-100 text-red-700'
                  : 'hover:bg-gray-100'
              }`}
            >
              Annulation
            </button>
            <button
              onClick={() => setSelectedTemplate('created')}
              className={`px-4 py-2 rounded ${
                selectedTemplate === 'created'
                  ? 'bg-blue-100 text-blue-700'
                  : 'hover:bg-gray-100'
              }`}
            >
              Création
            </button>
          </div>
        </div>

        <div className="p-4">
          <div className="mb-4">
            <h3 className="font-medium">Sujet :</h3>
            <p className="text-gray-700">{templates[selectedTemplate].subject}</p>
          </div>

          <div>
            <h3 className="font-medium mb-2">Contenu :</h3>
            <div
              className="border rounded-lg p-4 bg-gray-50 overflow-auto max-h-[60vh]"
              dangerouslySetInnerHTML={{ __html: templates[selectedTemplate].content }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
