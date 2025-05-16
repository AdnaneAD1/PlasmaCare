import './globals.css'
import { Inter } from 'next/font/google'
import DebugProvider from '@/components/debug/DebugProvider'

const inter = Inter({ subsets: ['latin'] })
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const metadata = {
  title: 'PlasmaCare',
  description: 'Plateforme de soins esthétiques',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
          // Script pour gérer la redirection sur iOS
          (function() {
            if (typeof window !== 'undefined') {
              // Vérifier s'il y a une redirection en attente
              if (localStorage.getItem('pendingRedirect') === 'true') {
                // Effacer le flag de redirection
                localStorage.removeItem('pendingRedirect');
                
                // Déterminer la page de redirection
                const path = localStorage.getItem('userRole') === 'admin' ? '/admin' : '/dashboard';
                
                // Rediriger l'utilisateur
                setTimeout(function() {
                  window.location = path;
                }, 100);
              }
            }
          })();
        ` }} />
      </head>
      <body className={inter.className}>
        <DebugProvider>
          {children}
        </DebugProvider>
      </body>
    </html>
  )
}
