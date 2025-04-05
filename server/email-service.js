import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
const PORT = process.env.EMAIL_SERVICE_PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

// Configuration de Nodemailer
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.EMAIL_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Initialisation de Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Templates d'emails
const emailTemplates = {
  appointmentConfirmed: (appointment, user, treatment) => ({
    subject: 'Votre rendez-vous est confirmé',
    html: `
      <h2>Votre rendez-vous est confirmé !</h2>
      <p>Bonjour ${user.first_name},</p>
      <p>Nous avons le plaisir de vous confirmer votre rendez-vous :</p>
      <ul>
        <li>Date : ${new Date(appointment.appointment_date).toLocaleDateString('fr-FR')}</li>
        <li>Heure : ${new Date(appointment.appointment_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</li>
        <li>Traitement : ${treatment.name}</li>
        <li>Durée : ${treatment.duration} minutes</li>
      </ul>
      <p>À bientôt !</p>
    `
  }),

  appointmentCancelled: (appointment, user) => ({
    subject: 'Votre rendez-vous a été annulé',
    html: `
      <h2>Annulation de rendez-vous</h2>
      <p>Bonjour ${user.first_name},</p>
      <p>Nous vous informons que votre rendez-vous du ${new Date(appointment.appointment_date).toLocaleDateString('fr-FR')} 
         à ${new Date(appointment.appointment_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })} 
         a été annulé.</p>
      <p>N'hésitez pas à reprendre rendez-vous.</p>
    `
  }),

  appointmentCreated: (appointment, user, treatment) => ({
    subject: 'Nouveau rendez-vous créé',
    html: `
      <h2>Votre rendez-vous a été créé</h2>
      <p>Bonjour ${user.first_name},</p>
      <p>Nous avons bien reçu votre demande de rendez-vous :</p>
      <ul>
        <li>Date : ${new Date(appointment.appointment_date).toLocaleDateString('fr-FR')}</li>
        <li>Heure : ${new Date(appointment.appointment_date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</li>
        <li>Traitement : ${treatment.name}</li>
        <li>Durée : ${treatment.duration} minutes</li>
      </ul>
      <p>Nous vous confirmerons le rendez-vous très prochainement.</p>
    `
  })
};

// Route pour envoyer un email
app.post('/send-email', async (req, res) => {
  try {
    const { appointmentId, type } = req.body;

    // Récupérer les informations du rendez-vous
    const { data: appointment, error: appointmentError } = await supabase
      .from('appointments')
      .select('*')
      .eq('id', appointmentId)
      .single();

    if (appointmentError) throw appointmentError;

    // Récupérer les informations de l'utilisateur
    const { data: userData, error: userError } = await supabase
      .from('users_view')
      .select('*')
      .eq('id', appointment.user_id)
      .single();

    if (userError) throw userError;

    // Récupérer les informations du traitement
    const { data: treatment, error: treatmentError } = await supabase
      .from('treatments')
      .select('*')
      .eq('id', appointment.treatment_id)
      .single();

    if (treatmentError) throw treatmentError;

    // Sélectionner le template approprié
    const template = emailTemplates[type](appointment, userData, treatment);

    // Envoyer l'email
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || '"PlasmaCare" <contact@plasmacare.com>',
      to: userData.email,
      subject: template.subject,
      html: template.html
    });

    res.status(200).json({
      success: true,
      message: 'Email envoyé avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de l\'email:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de l\'email',
      error: error.message
    });
  }
});

// Route de test pour vérifier que le service fonctionne
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Service d\'emails opérationnel' });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Service d'emails démarré sur le port ${PORT}`);
  console.log(`Test de santé disponible sur http://localhost:${PORT}/health`);
});