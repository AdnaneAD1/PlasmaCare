import { supabase } from './supabase';

// Types pour les notifications
export interface PushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface Notification {
  id: string;
  title: string;
  body: string;
  icon?: string;
  data?: any;
  tag?: string;
  timestamp: number;
  read: boolean;
}

// Classe pour gérer les notifications
export class NotificationManager {
  private static instance: NotificationManager;
  private swRegistration: ServiceWorkerRegistration | null = null;
  private publicVapidKey = 'BHtNE1nG5kz47mqfEiQHbwwL31HQaJVwmQK4FDNEjbpuwak7bE8Ts18TrrEKDA3wdgHY9HrFY3xdKIhcS5BtXm4';

  private constructor() {
    this.init();
  }

  public static getInstance(): NotificationManager {
    if (!NotificationManager.instance) {
      NotificationManager.instance = new NotificationManager();
    }
    return NotificationManager.instance;
  }

  private async init() {
    try {
      if (!('serviceWorker' in navigator)) {
        throw new Error('Service Worker non supporté');
      }

      // Vérifier si un Service Worker est déjà enregistré
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length > 0) {
        this.swRegistration = registrations[0];
        console.log('Service Worker déjà enregistré');
        return;
      }

      // Enregistrer le Service Worker
      this.swRegistration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
      });
      console.log('Service Worker enregistré avec succès');

      // Attendre que le Service Worker soit activé
      if (this.swRegistration.installing) {
        await new Promise<void>((resolve) => {
          if (!this.swRegistration) return resolve();
          this.swRegistration.addEventListener('activate', () => resolve());
        });
      }
    } catch (error) {
      console.error('Erreur lors de l\'initialisation du Service Worker:', error);
      throw error;
    }
  }

  public async requestPermission(): Promise<boolean> {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Erreur lors de la demande de permission:', error);
      return false;
    }
  }

  public async subscribeToPushNotifications(): Promise<void> {
    try {
      if (!this.swRegistration) {
        await this.init();
      }

      if (!this.swRegistration) {
        throw new Error('Service Worker non enregistré');
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        throw new Error('Permission refusée');
      }

      // Vérifier si une souscription existe déjà
      const existingSubscription = await this.swRegistration.pushManager.getSubscription();
      if (existingSubscription) {
        console.log('Souscription existante trouvée');
        return;
      }

      console.log('Création d\'une nouvelle souscription...');
      const subscription = await this.swRegistration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(this.publicVapidKey)
      });

      console.log('Souscription créée:', subscription);

      // Enregistrer la souscription dans la base de données
      const { error } = await supabase
        .from('push_subscriptions')
        .insert([
          {
            user_id: (await supabase.auth.getUser()).data.user?.id,
            subscription: subscription.toJSON()
          }
        ]);

      if (error) throw error;

      // Envoyer une notification de test
      await fetch('http://localhost:3002/send-test-notification', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription,
          notification: {
            title: 'Notifications activées !',
            body: 'Vous recevrez désormais des rappels pour vos produits.',
            icon: '/logo192.png'
          }
        })
      });

    } catch (error: any) {
      console.error('Erreur lors de la souscription aux notifications:', error);
      throw error;
    }
  }

  public async unsubscribe(): Promise<boolean> {
    try {
      if (!this.swRegistration) {
        throw new Error('Service Worker non enregistré');
      }

      const subscription = await this.swRegistration.pushManager.getSubscription();
      if (subscription) {
        await subscription.unsubscribe();

        // Supprimer la souscription de Supabase
        const { error } = await supabase
          .from('push_subscriptions')
          .delete()
          .eq('subscription->endpoint', subscription.endpoint);

        if (error) throw error;

        return true;
      }
      return false;
    } catch (error) {
      console.error('Erreur lors de la désinscription:', error);
      return false;
    }
  }

  public async getNotifications(): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .order('timestamp', { ascending: false });

      if (error) throw error;
      return data as Notification[];
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error);
      return [];
    }
  }

  public async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Erreur lors du marquage de la notification comme lue:', error);
      return false;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
}

// Hook React pour utiliser les notifications
export function useNotifications() {
  const notificationManager = NotificationManager.getInstance();

  return {
    requestPermission: () => notificationManager.requestPermission(),
    subscribeToPushNotifications: () => notificationManager.subscribeToPushNotifications(),
    unsubscribe: () => notificationManager.unsubscribe(),
    getNotifications: () => notificationManager.getNotifications(),
    markAsRead: (id: string) => notificationManager.markAsRead(id)
  };
}