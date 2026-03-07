import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ClientLayout from '@/components/layout/ClientLayout';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Bidora — India\'s Live Sneaker Auction Platform | Bid, Win, Flex',
  description: 'India\'s most trusted live sneaker auction platform. Bid on verified Air Jordans, Yeezys, Dunks and more. Zero fraud. 100% escrow. Join 12,000+ collectors hunting on Bidora.',
  openGraph: {
    title: 'Bidora — Where Rare Lands',
    description: 'India\'s home for rare sneaker auctions. Every item verified. Every rupee protected.',
    siteName: 'Bidora',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Bidora — Where Rare Lands',
    description: 'India\'s home for rare sneaker auctions. Every item verified. Every rupee protected.',
  },
  keywords: ['sneaker auction India', 'live sneaker auction', 'buy sneakers India', 'Air Jordan auction', 'Yeezy auction', 'verified sneakers', 'Bidora'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className={`${inter.className} antialiased min-h-screen flex flex-col pt-16 overflow-x-hidden w-full`}>
        <ClientLayout>
          {children}
        </ClientLayout>
      </body>
    </html>
  );
}
