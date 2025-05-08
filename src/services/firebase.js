'use client';
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import axios from '@/lib/axios'

const firebaseConfig = {
    apiKey: "AIzaSyA0B9EDV_MpBcQIamX3TsY4TghGSZ-7i54",
    authDomain: "plasmacare-ab253.firebaseapp.com",
    projectId: "plasmacare-ab253",
    storageBucket: "plasmacare-ab253.firebasestorage.app",
    messagingSenderId: "244331453375",
    appId: "1:244331453375:web:004be44b72cf1e6e31df0a"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const messaging = getMessaging(app);

export const generateToken = async () => {
    try {
        const permission = await Notification.requestPermission();
        console.log('Permission de notification:', permission);
        
        if (permission === "granted") {
            const token = await getToken(messaging, {
                vapidKey: "BLHczeDVpTU_4CoJ0NslIsnM3-7jA6yNKZWm1FuWU-KEma8ZV_oipRdijuBToX7c46mak9Gs3Ih9XD0oa3EsI80"
            });
            
            if (token) {
                // Envoyer le token au backend
                try {
                    await axios.post('/api/notifications/token', { fcm_token: token });
                } catch (apiError) {
                    console.error('Erreur lors de la sauvegarde du token:', apiError);
                }
                
                return token;
            } else {
                console.warn('Aucun token FCM généré');
                return null;
            }
        } else {
            console.warn('Permission de notification refusée');
            return null;
        }
    } catch (error) {
        console.error('Erreur lors de la génération du token:', error);
        throw error;
    }
};

// Écouter les notifications en premier plan
export const onForegroundMessage = () => {
    onMessage(messaging, (payload) => {
        // Créer une notification native
        if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
            const { title, body } = payload.notification;
            const options = {
                body,
                data: payload.data || {},
                actions: [
                    {
                        action: 'open',
                        title: 'Voir les détails'
                    }
                ],
                requireInteraction: true, // La notification reste jusqu'à ce que l'utilisateur interagisse
                vibrate: [200, 100, 200] // Vibration pour mobile
            };

            navigator.serviceWorker.ready
                .then(registration => registration.showNotification(title, options))
                .catch(error => console.error('Erreur lors de l\'affichage de la notification:', error));
        }
    });
};

// Écouter les notifications en arrière-plan
export const onBackgroundMessage = (messaging) => {
    return new Promise((resolve, reject) => {
        navigator.serviceWorker.ready.then((registration) => {
            messaging.onBackgroundMessage((payload) => {
                registration.showNotification(payload.notification.title, {
                    body: payload.notification.body,
                    data: payload.data || {},
                    actions: [
                        {
                            action: 'open',
                            title: 'Voir les détails'
                        }
                    ]
                });
                
                resolve(payload);
            });
        }).catch(reject);
    });
};

// Initialiser les notifications
export const initializeNotifications = async () => {
    try {
        // Vérifier si les notifications sont supportées
        if (!('Notification' in window)) {
            console.warn('Ce navigateur ne supporte pas les notifications de bureau');
            return null;
        }

        // Vérifier si le service worker est supporté
        if (!('serviceWorker' in navigator)) {
            console.warn('Ce navigateur ne supporte pas les service workers');
            return null;
        }

        // Générer et enregistrer le token
        const token = await generateToken();
        if (token) {
            // Configurer les écouteurs de notifications
            onForegroundMessage();
            // Les notifications en arrière-plan sont gérées par le service worker
        }
        return token;
    } catch (error) {
        console.error('Erreur lors de l\'initialisation des notifications:', error);
        return null;
    }
};