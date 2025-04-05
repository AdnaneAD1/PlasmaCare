// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getMessaging, getToken } from "firebase/messaging";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
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

// Initialiser messaging seulement si le navigateur supporte le service worker
let messaging = null;
if ('serviceWorker' in navigator && 'Notification' in window) {
    messaging = getMessaging(app);
}

export const generateToken = async () => {
    try {
        if (!messaging) {
            throw new Error('Les notifications push ne sont pas supportées sur ce navigateur');
        }

        const permission = await Notification.requestPermission();
        console.log('Permission:', permission);

        if (permission !== "granted") {
            throw new Error('Permission refusée pour les notifications');
        }

        // Vérifier si un token existe déjà
        const currentToken = await getToken(messaging, { 
            vapidKey: "BLHczeDVpTU_4CoJ0NslIsnM3-7jA6yNKZWm1FuWU-KEma8ZV_oipRdijuBToX7c46mak9Gs3Ih9XD0oa3EsI80" 
        });

        if (!currentToken) {
            throw new Error('Impossible de générer le token');
        }

        console.log('Token généré:', currentToken);
        return currentToken;
    } catch (error) {
        console.error('Erreur lors de la génération du token:', error);
        throw error;
    }
};