'use client';

import React from 'react';
import { AuthProvider } from '@/store/AuthContext';
import dynamic from 'next/dynamic';

const LiveNotificationToast = dynamic(() => import('@/components/LiveNotificationToast'), { ssr: false });
const Footer = dynamic(() => import('@/components/layout/Footer'), { ssr: true });
const Navbar = dynamic(() => import('@/components/layout/Navbar'), { ssr: true });
const InstallAppPrompt = dynamic(() => import('@/components/InstallAppPrompt'), { ssr: false });

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    return (
        <AuthProvider>
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
