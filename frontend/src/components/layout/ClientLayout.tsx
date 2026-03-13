'use client';

import React, { useEffect } from 'react';
import { AuthProvider } from '@/store/AuthContext';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';


const LiveNotificationToast = dynamic(() => import('@/components/LiveNotificationToast'), { ssr: false });
const Footer = dynamic(() => import('@/components/layout/Footer'), { ssr: true });
const Navbar = dynamic(() => import('@/components/layout/Navbar'), { ssr: true });
const InstallAppPrompt = dynamic(() => import('@/components/InstallAppPrompt'), { ssr: false });

function SplashScreen() {
    return (
        <motion.div 
            initial={{ opacity: 1 }}
            animate={{ opacity: 0 }}
            transition={{ duration: 0.8, delay: 2, ease: "easeInOut" }}
            onAnimationComplete={() => {
                document.body.style.overflow = 'auto';
            }}
            className="fixed inset-0 z-[1000] bg-zinc-950 flex flex-col items-center justify-center"
        >
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="relative"
            >
                <div className="text-6xl font-black tracking-tighter text-white">
                    BI<span className="text-yellow-400">DORA</span>
                </div>
                <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 1.5, delay: 0.5, ease: "easeInOut" }}
                    className="h-1 bg-yellow-400 mt-2 rounded-full"
                />
            </motion.div>
            <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="text-gray-500 text-xs font-bold uppercase tracking-[0.3em] mt-8"
            >
                Where Rare Lands
            </motion.p>
        </motion.div>
    );
}


export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const [showSplash, setShowSplash] = React.useState(false);

    useEffect(() => {
        const hasShown = localStorage.getItem('bidora_splash_v1');
        if (!hasShown) {
            setShowSplash(true);
            document.body.style.overflow = 'hidden';
            localStorage.setItem('bidora_splash_v1', 'true');
            setTimeout(() => {
                setShowSplash(false);
                document.body.style.overflow = 'auto';
            }, 3000);
        }

        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js')
                .then(reg => console.log('✅ ServiceWorker registered', reg.scope))
                .catch(err => console.error('❌ ServiceWorker registration failed: ', err));
        }
    }, []);

    return (
        <AuthProvider>
            <AnimatePresence>
                {showSplash && <SplashScreen />}
            </AnimatePresence>
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
