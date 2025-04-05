import { supabase } from './supabase';

interface DiagnosisEmailData {
  userId: string;
  userName: string;
  skinType: string;
  hairType: string;
  concerns: string[];
  allergies: string[];
  medicalHistory: string;
  currentProducts: string[];
}

export async function sendDiagnosisEmail(data: DiagnosisEmailData): Promise<void> {
  try {
    // Récupérer l'email de l'admin depuis les paramètres
    const { data: settings, error: settingsError } = await supabase
      .from('admin_settings')
      .select('notification_email')
      .single();

    if (settingsError) throw settingsError;
    if (!settings?.notification_email) {
      throw new Error('Email de notification non configuré');
    }

    // Créer le contenu de l'email
    const emailContent = `
      Nouveau diagnostic reçu

      Patient: ${data.userName}
      ID: ${data.userId}
      Date: ${new Date().toLocaleDateString('fr-FR')}

      Détails du diagnostic:
      - Type de peau: ${data.skinType}
      - Type de cheveux: ${data.hairType}
      
      Préoccupations:
      ${data.concerns.map(concern => `- ${concern}`).join('\n')}
      
      Allergies:
      ${data.allergies.length > 0 ? data.allergies.map(allergy => `- ${allergy}`).join('\n') : 'Aucune allergie signalée'}
      
      Antécédents médicaux:
      ${data.medicalHistory || 'Aucun antécédent signalé'}
      
      Produits actuellement utilisés:
      ${data.currentProducts.length > 0 ? data.currentProducts.map(product => `- ${product}`).join('\n') : 'Aucun produit signalé'}
    `;

    // Envoyer l'email via Supabase Edge Function
    const { error: emailError } = await supabase.functions.invoke('send-email', {
      body: {
        to: settings.notification_email,
        subject: `Nouveau diagnostic - Patient ${data.userName}`,
        content: emailContent
      }
    });

    if (emailError) throw emailError;

  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    throw error;
  }
}
