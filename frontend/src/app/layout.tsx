import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from '@/components/layout/ClientLayout';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Bidora — Buy and Sell Rare Sneakers Online India | Live Sneaker Auctions',
  description: 'India\'s most trusted live sneaker auction platform. Buy verified Air Jordans, Yeezys, Nike Dunks and rare kicks. 100% escrow protection. 12,000+ collectors. Bid now on Bidora.',
  alternates: {
    canonical: 'https://bidora.me',
  },
  openGraph: {
    title: 'Bidora — Where Rare Lands | India\'s Sneaker Auction Platform',
    description: 'Hunt, bid, and win verified rare sneakers. Only real. Only Bidora.',
    url: 'https://bidora.me',
    siteName: 'Bidora',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&h=630&auto=format&fit=crop',
        width: 1200,
        height: 630,
        alt: 'Bidora — Buy and Sell Rare Sneakers Online India',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bidora — Where Rare Lands | India\'s Sneaker Auction Platform',
    description: 'Hunt, bid, and win verified rare sneakers. Only real. Only Bidora.',
    images: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1200&h=630&auto=format&fit=crop'],
  },
  keywords: [
    'sneaker auction India',
    'buy rare sneakers India',
    'sell sneakers online India',
    'sneaker resell India',
    'buy Air Jordan India',
    'buy Yeezy India',
    'Nike Dunk buy India',
    'sneaker marketplace India',
    'verified sneakers India',
    'live auction India sneakers',
    'online auction platform India',
    'bid on sneakers India',
    'rare sneakers online India',
    'sneaker drops India',
    'limited edition sneakers India'
  ],
  verification: {
    google: 'orzF6xEuoPFrSWF-L7JStyUjL0QInR_VnpxD_O7N1oU',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <head>
        {/* Google Analytics 4 */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX'}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID || 'G-XXXXXXXXXX'}', {
              page_path: window.location.pathname,
            });
          `}
        </Script>
      </head>
      <body className={`${inter.className} antialiased min-h-screen flex flex-col pt-16 overflow-x-hidden w-full`}>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': 'https://bidora.me/#organization',
                  'name': 'Bidora',
                  'url': 'https://bidora.me',
                  'logo': 'https://bidora.me/favicon.ico',
                  'description': 'India\'s most trusted live sneaker auction platform.',
                  'address': {
                    '@type': 'PostalAddress',
                    'addressLocality': 'Mumbai',
                    'addressRegion': 'Maharashtra',
                    'addressCountry': 'IN'
                  },
                  'sameAs': [
                    'https://www.instagram.com/bidora.me',
                    'https://twitter.com/bidora_me',
                    'https://discord.gg/bidora'
                  ]
                },
                {
                  '@type': 'WebSite',
                  '@id': 'https://bidora.me/#website',
                  'url': 'https://bidora.me',
                  'name': 'Bidora — Buy and Sell Rare Sneakers India',
                  'publisher': { '@id': 'https://bidora.me/#organization' },
                  'potentialAction': {
                    '@type': 'SearchAction',
                    'target': 'https://bidora.me/search?q={search_term_string}',
                    'query-input': 'required name=search_term_string'
                  }
                },
                {
                  '@type': 'FAQPage',
                  'mainEntity': [
                    {
                      '@type': 'Question',
                      'name': 'How does Bidora work?',
                      'acceptedAnswer': {
                        '@type': 'Answer',
                        'text': 'Bidora is a live auction platform where users can bid on rare sneakers. The highest bidder at the end of the auction wins the item. All transactions are protected by Bidora Escrow.'
                      }
                    },
                    {
                      '@type': 'Question',
                      'name': 'Is Bidora safe for buying sneakers in India?',
                      'acceptedAnswer': {
                        '@type': 'Answer',
                        'text': 'Yes, Bidora is 100% safe. We use an escrow system that holds your funds securely until you receive and verify your sneakers.'
                      }
                    },
                    {
                      '@type': 'Question',
                      'name': 'How do I know if sneakers on Bidora are authentic?',
                      'acceptedAnswer': {
                        '@type': 'Answer',
                        'text': 'All sneakers are listed by verified sellers and undergo a rigorous authentication process before funds are released to the seller.'
                      }
                    }
                  ]
                }
              ]
            })
          }}
        />
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
