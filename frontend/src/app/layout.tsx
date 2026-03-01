import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/store/AuthContext';
import dynamic from 'next/dynamic';

const LiveNotificationToast = dynamic(() => import('@/components/LiveNotificationToast'), { ssr: false });
const Footer = dynamic(() => import('@/components/layout/Footer'), { ssr: true });
const Navbar = dynamic(() => import('@/components/layout/Navbar'), { ssr: true });

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export const metadata: Metadata = {
  title: 'Bidora | Global Live Social Auctions',
  description: 'Bidora is a premium real-time auction marketplace for verified luxury and collectibles.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark h-full">
      <body className={`${inter.className} antialiased min-h-screen flex flex-col pt-16 overflow-x-hidden w-full`}>
        <AuthProvider>
          <Navbar />
          <main className="flex-grow">
            {children}
          </main>
          <Footer />
          {/* Global real-time notification toasts */}
          <LiveNotificationToast />
        </AuthProvider>
      </body>
    </html>
  );
}
