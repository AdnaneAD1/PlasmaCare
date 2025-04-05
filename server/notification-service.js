import express from 'express';
import cors from 'cors';
import webpush from 'web-push';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
import cron from 'node-cron';

dotenv.config();

const app = express();
const PORT = process.env.NOTIFICATION_SERVICE_PORT || 3002;

// Configuration VAPID pour Web Push
const VAPID_PUBLIC_KEY = 'BHtNE1nG5kz47mqfEiQHbwwL31HQaJVwmQK4FDNEjbpuwak7bE8Ts18TrrEKDA3wdgHY9HrFY3xdKIhcS5BtXm4';
const VAPID_PRIVATE_KEY = 'dDsS_6o5dN9MhNpGPuj-gI-bO8u_QSgGYycMF_yeOiA';
const VAPID_SUBJECT = 'mailto:contact@plasmacare.com';

webpush.setVapidDetails(
  VAPID_SUBJECT,
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
);

// Middleware
app.use(cors());
app.use(express.json());

// Initialisation de Supabase
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Fonction pour envoyer une notification
async function sendNotification(userId, notification) {
  try {
    // Récupérer la souscription de l'utilisateur
    const { data: subscriptionData, error: subscriptionError } = await supabase
      .from('push_subscriptions')
      .select('subscription')
      .eq('user_id', userId)
      .single();

    if (subscriptionError) throw subscriptionError;
    if (!subscriptionData) return;

    // Enregistrer la notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert([{
        user_id: userId,
        title: notification.title,
        body: notification.body,
        icon: notification.icon,
        data: notification.data,
        tag: notification.tag,
        timestamp: new Date().getTime(),
        read: false
      }]);

    if (notificationError) throw notificationError;

    // Envoyer la notification push
    await webpush.sendNotification(
      subscriptionData.subscription,
      JSON.stringify(notification)
    );
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification:', error);
  }
}

// Fonction pour vérifier et envoyer les rappels de produits
async function checkProductReminders() {
  try {
    const now = new Date();
    const currentTime = now.toTimeString().split(' ')[0];
    
    // Récupérer les rappels pour l'heure actuelle
    const { data: reminders, error } = await supabase
      .from('product_reminders')
      .select(`
        *,
        products (name, usage_instructions),
        users (raw_user_meta_data->first_name)
      `)
      .eq('reminder_time', currentTime)
      .gte('start_date', now.toISOString().split('T')[0])
      .lte('end_date', now.toISOString().split('T')[0]);

    if (error) throw error;

    // Envoyer une notification pour chaque rappel
    for (const reminder of reminders) {
      await sendNotification(reminder.user_id, {
        title: 'Rappel de produit',
        body: `N'oubliez pas de prendre votre ${reminder.products.name}.\n${reminder.products.usage_instructions}`,
        icon: '/icon-192x192.png',
        tag: `product-reminder-${reminder.id}`,
        data: {
          url: '/dashboard/treatments'
        }
      });
    }
  } catch (error) {
    console.error('Erreur lors de la vérification des rappels:', error);
  }
}

// Planifier les vérifications des rappels
cron.schedule('0 8,12,20 * * *', checkProductReminders);

// Route pour envoyer une notification manuelle
app.post('/send-notification', async (req, res) => {
  try {
    const { userId, notification } = req.body;
    await sendNotification(userId, notification);
    
    res.status(200).json({
      success: true,
      message: 'Notification envoyée avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de la notification',
      error: error.message
    });
  }
});

// Route pour envoyer une notification de test
app.post('/send-test-notification', async (req, res) => {
  try {
    const { subscription, notification } = req.body;

    await webpush.sendNotification(
      subscription,
      JSON.stringify(notification)
    );

    res.status(200).json({ message: 'Notification de test envoyée avec succès' });
  } catch (error) {
    console.error('Erreur lors de l\'envoi de la notification de test:', error);
    res.status(500).json({ error: error.message });
  }
});

// Route de test
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Service de notifications opérationnel' });
});

// Démarrer le serveur
app.listen(PORT, () => {
  console.log(`Service de notifications démarré sur le port ${PORT}`);
  console.log(`Test de santé disponible sur http://localhost:${PORT}/health`);
  console.log('Rappels de produits planifiés pour 8h, 12h et 20h');
});