import useSWR from 'swr'
import axios from '@/lib/axios'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithEmailAndPassword } from "firebase/auth";
import { firebaseAuth } from "@/lib/firebase";



// Fonction pour traduire les messages d'erreur en français
const translateErrors = (errors) => {
    const translations = {
        // Messages d'erreur généraux
        'The email field is required.': 'Le champ email est requis.',
        'The password field is required.': 'Le champ mot de passe est requis.',
        'These credentials do not match our records.': 'Ces identifiants ne correspondent pas à nos enregistrements.',
        'The provided password is incorrect.': 'Le mot de passe fourni est incorrect.',
        'The email must be a valid email address.': 'L\'email doit être une adresse email valide.',
        'The password must be at least 8 characters.': 'Le mot de passe doit contenir au moins 8 caractères.',
        'The password confirmation does not match.': 'La confirmation du mot de passe ne correspond pas.',
        'The email has already been taken.': 'Cette adresse email est déjà utilisée.',
        'The name field is required.': 'Le champ nom est requis.',
        'The password confirmation field is required.': 'La confirmation du mot de passe est requise.',
        'The terms must be accepted.': 'Les conditions d\'utilisation doivent être acceptées.',
    };

    if (!errors) return {};

    const translatedErrors = {};
    Object.keys(errors).forEach(key => {
        translatedErrors[key] = errors[key].map(message => {
            return translations[message] || message;
        });
    });

    return translatedErrors;
};

export function isIOS() {
    return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}

// Fonction pour traduire les messages de succès en français
export const translateStatus = (status) => {
    const translations = {
        // Messages de succès
        'We have emailed your password reset link.': 'Nous avons envoyé un lien de réinitialisation de mot de passe à votre adresse email.',
        'Your password has been reset!': 'Votre mot de passe a été réinitialisé !',
        'A new verification link has been sent to the email address you provided during registration.': 'Un nouveau lien de vérification a été envoyé à l\'adresse email que vous avez fournie lors de l\'inscription.',
        'Your email has been verified.': 'Votre adresse email a été vérifiée.',
        'Your password has been updated.': 'Votre mot de passe a été mis à jour.',
        'Your profile has been updated.': 'Votre profil a été mis à jour.',
    };

    return translations[status] || status;
};

export const useAuth = ({ middleware, redirectIfAuthenticated } = {}) => {
    const router = useRouter()

    const { data: user, error, mutate } = useSWR('/api/user', () =>
        axios
            .get('/api/user')
            .then(res => res.data)
            .catch(error => {
                if (error.response.status !== 409) throw error

                router.push('/verify-email')
            }),
    )

    const csrf = () => axios.get('/sanctum/csrf-cookie')

    const register = async ({ setErrors, ...props }) => {
        try {
            console.log('Démarrage du processus d\'inscription...');
            console.log('Données d\'inscription:', props);

            await csrf();
            console.log('Jeton CSRF obtenu');

            setErrors([]);

            const response = await axios.post('/register', props);
            console.log('Réponse d\'inscription:', response.data);

            await mutate();
            return response.data;
        } catch (error) {
            console.error('Erreur d\'inscription:', error.response || error);

            if (error.response?.status === 422) {
                setErrors(translateErrors(error.response.data.errors));
            } else {
                setErrors({
                    general: ['Une erreur est survenue lors de l\'inscription. Veuillez réessayer.']
                });
            }

            throw error;
        }
    }

    const login = async ({ setErrors, setStatus, ...props }) => {
        try {
            await csrf()

            setErrors([])
            setStatus(null)

            const response = await axios.post('/login', props)

            // Stocker le rôle de l'utilisateur pour la redirection
            if (response.data && response.data.user && response.data.user.role) {
                localStorage.setItem('userRole', response.data.user.role);
            }

            await mutate()

            // Redirection basée sur le rôle de l'utilisateur
            const userRole = response.data?.user?.role || localStorage.getItem('userRole')
            if (userRole === 'admin') {
                window.location.href = '/admin'
            } else {
                window.location.href = redirectIfAuthenticated || '/dashboard'
            }

            return true  // Connexion réussie
        } catch (error) {
            if (error.response?.status === 422) {
                setErrors(translateErrors(error.response.data.errors))
            } else {
                console.error('Erreur de connexion:', error)
                setErrors({ general: ['Une erreur est survenue lors de la connexion.'] })
            }

            return false  // Connexion échouée
        }
    }

    const googleLogin = async () => {
        try {
            const { data } = await axios.get('/api/auth/google/redirect')
            window.location.href = data.url
        } catch (error) {
            console.error('Erreur lors de la redirection vers Google:', error)
        }
    }

    const handleGoogleCallback = async (code) => {
        try {
            const { data } = await axios.post('/api/auth/google/callback', { code })
            if (data.token) {
                localStorage.setItem('token', data.token)
                await mutate()
                return true
            }
            return false
        } catch (error) {
            console.error('Erreur lors de la connexion avec Google:', error)
            return false
        }
    }

    const forgotPassword = async ({ setErrors, setStatus, email }) => {
        await csrf()

        setErrors([])
        setStatus(null)

        axios
            .post('/forgot-password', { email })
            .then(response => setStatus(response.data.status))
            .catch(error => {
                if (error.response.status !== 422) throw error

                setErrors(translateErrors(error.response.data.errors))
            })
    }

    const resetPassword = async ({ setErrors, setStatus, token, ...props }) => {
        await csrf()

        setErrors([])
        setStatus(null)

        axios
            .post('/reset-password', { token, ...props })
            .then(response => {
                router.push('/login?reset=' + btoa(response.data.status))
            })
            .catch(error => {
                if (error.response.status !== 422) throw error

                setErrors(translateErrors(error.response.data.errors))
            })
    }

    const resendEmailVerification = ({ setStatus }) => {
        axios
            .post('/email/verification-notification')
            .then(response => setStatus(response.data.status))
    }

    const logout = async () => {
        if (!error) {
            await axios.post('/logout')
            localStorage.removeItem('token')
            mutate()
        }

        window.location.pathname = '/login'
    }

    async function loginWithFirebase(email, password) {
        // 1. Authentification Firebase
        const userCredential = await signInWithEmailAndPassword(firebaseAuth, email, password);
        const user = userCredential.user;
        const idToken = await user.getIdToken();

        // 2. Appel à l’API Laravel pour obtenir le token Sanctum
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/firebase-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
        });

        if (!response.ok) throw new Error("Erreur lors de l'authentification backend");
        const { token, user: backendUser } = await response.json();

        // 3. Stocke le token Sanctum pour les requêtes futures (localStorage ou cookie)
        localStorage.setItem("sanctumToken", token);

        // 4. Mets à jour le contexte utilisateur si tu utilises un provider React
        // setUser(backendUser); etc.

        return backendUser;
    }

    async function registerWithFirebase({ email, password, firstName, lastName }) {
        // 1. Créer le compte Firebase
        const userCredential = await createUserWithEmailAndPassword(firebaseAuth, email, password);
        const user = userCredential.user;

        // 2. Mettre à jour le nom/prénom dans le profil Firebase (optionnel mais conseillé)
        await updateProfile(user, {
            displayName: `${firstName} ${lastName}`,
        });

        // 3. Récupérer le idToken
        const idToken = await user.getIdToken();

        // 4. Appeler l’API Laravel pour synchroniser et obtenir le token Sanctum
        const response = await fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL}/api/auth/firebase-login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ idToken }),
        });

        if (!response.ok) throw new Error("Erreur lors de l'inscription backend");
        const { token, user: backendUser } = await response.json();

        // 5. Stocker le token Sanctum
        localStorage.setItem("sanctumToken", token);

        // 6. Mets à jour le contexte utilisateur si besoin
        // setUser(backendUser);

        return backendUser;
    }

    useEffect(() => {
        // Détecter iOS/Safari
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
        const baseUrl = window.location.origin;

        if (middleware === 'guest' && redirectIfAuthenticated && user) {
            if (isIOS) {
                window.location.replace(baseUrl + redirectIfAuthenticated);
            } else {
                window.location.pathname = redirectIfAuthenticated;
            }
        }

        // if (middleware === 'auth' && (user && !user.email_verified_at)) {
        //     if (isIOS) {
        //         window.location.replace(baseUrl + '/verify-email');
        //     } else {
        //         window.location.pathname = '/verify-email';
        //     }
        // }

        if (window.location.pathname === '/verify-email' && user) {
            if (isIOS) {
                window.location.replace(baseUrl + redirectIfAuthenticated || '/dashboard');
            } else {
                window.location.pathname = redirectIfAuthenticated || '/dashboard';
            }
        }

        if (middleware === 'auth' && error) logout();
    }, [user, error, middleware, redirectIfAuthenticated, router, logout])

    return {
        user,
        register,
        registerWithFirebase,
        login,
        googleLogin,
        handleGoogleCallback,
        forgotPassword,
        resetPassword,
        resendEmailVerification,
        logout,
        loginWithFirebase
    }
}
