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
const messaging = getMessaging(app);

export const generateToken = async () => {
    const permission = await Notification.requestPermission();
    console.log(permission);

    if (permission === "granted") {
        const token = await getToken(messaging, {
            vapidKey: "BLHczeDVpTU_4CoJ0NslIsnM3-7jA6yNKZWm1FuWU-KEma8ZV_oipRdijuBToX7c46mak9Gs3Ih9XD0oa3EsI80"
        });
        console.log(token);
    }
};