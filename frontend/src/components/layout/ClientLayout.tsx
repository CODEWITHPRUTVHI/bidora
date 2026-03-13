'use client';

import React, { useEffect } from 'react';
import { AuthProvider } from '@/store/AuthContext';
import dynamic from 'next/dynamic';

const LiveNotificationToast = dynamic(() => import('@/components/LiveNotificationToast'), { ssr: false });
const Footer = dynamic(() => import('@/components/layout/Footer'), { ssr: true });
const Navbar = dynamic(() => import('@/components/layout/Navbar'), { ssr: true });
const InstallAppPrompt = dynamic(() => import('@/components/InstallAppPrompt'), { ssr: false });
const SplashScreen = dynamic(() => import('@/components/SplashScreen'), { ssr: false });

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    useEffect(() => {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('✅ ServiceWorker registered', reg.scope))
                .catch(err => console.error('❌ ServiceWorker registration failed: ', err));
        }
    }, []);

    return (
        <AuthProvider>
            <SplashScreen />
            <Navbar />
            <main className="flex-grow">
                {children}
            </main>
            <Footer />
            <LiveNotificationToast />
            <InstallAppPrompt />
        </AuthProvider>
    );
}
