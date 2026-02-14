import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/Providers';

export const metadata: Metadata = {
  title: {
    default: 'Miraluna - Agregador de Inmuebles en Valencia y Costa Blanca',
    template: '%s | Miraluna',
  },
  description:
    'Agregador de propiedades en Valencia y Costa Blanca. Encuentra casas, pisos, parcelas y oportunidades de inversión de múltiples fuentes en un solo lugar. Demo de plataforma inmobiliaria.',
  keywords: [
    'valencia',
    'inmobiliaria valencia',
    'real estate',
    'costa blanca',
    'propiedades',
    'casas',
    'pisos',
    'parcelas',
    'inversión',
    'españa',
    'agregador inmobiliario',
    'property aggregator',
    'mediterranean',
    'comunidad valenciana',
  ],
  authors: [{ name: 'Miraluna' }],
  creator: 'Miraluna',
  publisher: 'Miraluna',
  openGraph: {
    title: 'Miraluna - Agregador de Inmuebles en Valencia y Costa Blanca',
    description:
      'Encuentra tu propiedad ideal en Valencia. Agregador de casas, apartamentos, parcelas y oportunidades de inversión en Costa Blanca.',
    siteName: 'Miraluna',
    locale: 'es_ES',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Miraluna - Agregador de Inmuebles en Valencia',
    description: 'Encuentra tu propiedad ideal en Valencia y Costa Blanca',
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
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="scroll-smooth">
      <head>
        <meta name="color-scheme" content="dark" />
      </head>
      <body className="font-sans antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}
