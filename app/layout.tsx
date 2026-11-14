import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
import { fontVariables } from './fonts';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ScrollIndicator } from '@/components/layout/ScrollIndicator';
import { RevealObserver } from '@/components/layout/RevealObserver';
import '@/styles/tokens.css';
import '@/styles/globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://cloudin.pro'),
  icons: {
    shortcut: '/wp-content/themes/hub/favicon.png',
    icon: [
      { url: '/wp-content/uploads/2024/04/favicon-1-150x150.png', sizes: '32x32' },
      { url: '/wp-content/uploads/2024/04/favicon-1.png', sizes: '192x192' },
    ],
    apple: '/wp-content/uploads/2024/04/favicon-1.png',
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'apple-mobile-web-app-capable': 'yes',
    'msapplication-TileImage': 'https://cloudin.pro/wp-content/uploads/2024/04/favicon-1.png',
  },
};

export const viewport: Viewport = { width: 'device-width', initialScale: 1 };

const GA_ID = 'G-LC74SXTVHY';
// Asistente de Olabrain (widget de chat), en todas las páginas a petición del cliente (ver NOTAS.md, punto 41)
const OLABRAIN_AGENT = '3c1d7f49-2af6-4648-b673-9a4aa6cfd09f';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={fontVariables}>
      <body>
        <a className="skip-link" href="#primary-nav">Skip to primary navigation</a>
        <a className="skip-link" href="#lqd-site-content">Skip to content</a>
        <div id="wrap">
          <Header />
          <ScrollIndicator />
          <main id="lqd-site-content">{children}</main>
          <Footer />
        </div>
        <RevealObserver />
        {/* Google Analytics 4: mismo ID y misma configuración que el original */}
        <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
        <Script id="gtag-init" strategy="afterInteractive">
          {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');`}
        </Script>
        {/* se carga cuando el navegador está libre: no retrasa la carga de la página */}
        <Script src="https://app.olabrain.com/widget.js" data-agent={OLABRAIN_AGENT} strategy="lazyOnload" />
      </body>
    </html>
  );
}
