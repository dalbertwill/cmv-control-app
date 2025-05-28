import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { Providers } from '@/components/providers/providers';
import { Toaster } from '@/components/ui/toast';
import '@/styles/globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'CMV Control - Sistema de Controle de CMV',
    template: '%s | CMV Control',
  },
  description: 'Sistema inteligente para controle de CMV e gestão de custos em restaurantes',
  keywords: [
    'CMV',
    'controle de custos',
    'restaurante',
    'gestão',
    'ficha técnica',
    'receitas',
    'custos',
    'margem',
    'rentabilidade',
  ],
  authors: [
    {
      name: 'CMV Control Team',
      url: 'https://cmvcontrol.app',
    },
  ],
  creator: 'CMV Control Team',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'pt_BR',
    url: '/',
    title: 'CMV Control - Sistema de Controle de CMV',
    description: 'Sistema inteligente para controle de CMV e gestão de custos em restaurantes',
    siteName: 'CMV Control',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'CMV Control',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CMV Control - Sistema de Controle de CMV',
    description: 'Sistema inteligente para controle de CMV e gestão de custos em restaurantes',
    images: ['/images/og-image.png'],
    creator: '@cmvcontrol',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' }],
    shortcut: '/favicon.ico',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'CMV Control',
    startupImage: [
      {
        url: '/icons/icon-512x512.png',
        media:
          '(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)',
      },
    ],
  },
  formatDetection: {
    telephone: false,
    date: false,
    address: false,
    email: false,
  },
  category: 'business',
  classification: 'Restaurant Management System',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
  colorScheme: 'light dark',
  viewportFit: 'cover',
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt-BR" className={inter.variable} suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for performance */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* DNS prefetch for external resources */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />

        {/* Critical CSS for font loading */}
        <link
          rel="preload"
          href="/fonts/inter-var.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />

        {/* PWA theme color */}
        <meta name="theme-color" content="#3B82F6" />
        <meta name="msapplication-TileColor" content="#3B82F6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />

        {/* iOS specific */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="CMV Control" />

        {/* Android specific */}
        <meta name="mobile-web-app-capable" content="yes" />

        {/* Disable automatic phone number detection */}
        <meta name="format-detection" content="telephone=no" />

        {/* Performance hints */}
        <link rel="preload" as="image" href="/icons/icon-192x192.png" />
      </head>
      <body className={`font-sans antialiased ${inter.variable}`}>
        <Providers>
          {children}
          <Toaster />
        </Providers>

        {/* Service Worker registration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                window.addEventListener('load', function() {
                  navigator.serviceWorker.register('/sw.js').then(function(registration) {
                    console.log('SW registered: ', registration);
                  }).catch(function(registrationError) {
                    console.log('SW registration failed: ', registrationError);
                  });
                });
              }
            `,
          }}
        />

        {/* Performance monitoring */}
        {process.env.NODE_ENV === 'production' && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                // Web Vitals tracking
                function vitals(metric) {
                  // Track to analytics service
                  if (window.gtag) {
                    gtag('event', metric.name, {
                      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
                      event_category: 'Web Vitals',
                      event_label: metric.id,
                      non_interaction: true,
                    });
                  }
                }
                
                // Load Web Vitals
                import('https://unpkg.com/web-vitals@3/dist/web-vitals.js').then(({ getCLS, getFID, getFCP, getLCP, getTTFB }) => {
                  getCLS(vitals);
                  getFID(vitals);
                  getFCP(vitals);
                  getLCP(vitals);
                  getTTFB(vitals);
                });
              `,
            }}
          />
        )}
      </body>
    </html>
  );
}
