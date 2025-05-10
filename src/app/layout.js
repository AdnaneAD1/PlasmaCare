import './globals.css'
import { Inter } from 'next/font/google'

const inter = Inter({ subsets: ['latin'] })
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const metadata = {
  title: 'KriolaCare',
  description: 'Plateforme de don de plasma',
  openGraph: {
    title: 'KriolaCare',
    description: 'Plateforme de don de plasma pour sauver des vies',
    url: 'http://app.kriolaplasma.com',
    type: 'website',
    images: [
      {
        url: 'http://app.kriolaplasma.com/_next/image?url=%2Fkriola-removebg.png&w=256&q=75',
        width: 1200,
        height: 630,
        alt: 'KriolaCare Logo',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@KriolaCare',
    title: 'KriolaCare',
    description: 'Plateforme de don de plasma pour sauver des vies',
    image: 'http://app.kriolaplasma.com/_next/image?url=%2Fkriola-removebg.png&w=256&q=75',
  },
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
      <body className={inter.className}>{children}</body>
    </html>
  )
}
