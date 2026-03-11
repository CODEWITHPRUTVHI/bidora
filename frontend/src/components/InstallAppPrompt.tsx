'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';
import Image from 'next/image';

export default function InstallAppPrompt() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showPrompt, setShowPrompt] = useState(false);
    const [isIos, setIsIos] = useState(false);

    useEffect(() => {
        const _isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
        setIsIos(_isIos);
        
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        
        // Don't show if already installed (PWA open)
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
        
        const dismissed = localStorage.getItem('bidora_pwa_dismissed');

        if (isMobile && !isStandalone && !dismissed) {
            if (_isIos) {
                // iOS doesn't reliably fire beforeinstallprompt. Just show it directly.
                setShowPrompt(true);
            }
        }
        
        const handleBeforeInstallPrompt = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setDeferredPrompt(e);
            
            // Only show custom prompt if it's a mobile device (optional, but matching user request)
            if (isMobile) {
                // Check if user dismissed it recently (optional check, but good ux)
                const dismissed = localStorage.getItem('bidora_pwa_dismissed');
                if (!dismissed) {
                    setShowPrompt(true);
                }
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // If they already installed it
        window.addEventListener('appinstalled', () => {
            setShowPrompt(false);
            setDeferredPrompt(null);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (isIos) {
            alert('To install on iPhone/iPad:\n1. Tap the Share button at the bottom\n2. Scroll down and tap "Add to Home Screen"');
            return;
        }

        if (!deferredPrompt) return;
        
        // Show the install prompt
        deferredPrompt.prompt();
        
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        if (outcome === 'accepted') {
            console.log('User accepted the install prompt');
        } else {
            console.log('User dismissed the install prompt');
        }
        
        setDeferredPrompt(null);
        setShowPrompt(false);
    };

    const handleDismiss = () => {
        setShowPrompt(false);
        localStorage.setItem('bidora_pwa_dismissed', 'true');
    };

    return (
        <AnimatePresence>
            {showPrompt && (
                <motion.div
                    initial={{ y: 200, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 200, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    className="fixed bottom-4 left-4 right-4 z-[9999] md:hidden"
                >
                    <div className="bg-[#111] border border-white/10 rounded-2xl shadow-2xl p-4 flex items-center gap-4 relative overflow-hidden backdrop-blur-xl">
                        {/* Decorative glow */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 blur-[50px] rounded-full pointer-events-none" />
                        
                        {/* Icon */}
                        <div className="w-12 h-12 bg-yellow-400 rounded-xl flex items-center justify-center flex-shrink-0">
                            <span className="text-[#111] font-black tracking-tighter text-sm">B</span>
                        </div>

                        {/* Content */}
                        <div className="flex-1">
                            <h4 className="text-white font-bold text-sm">Add Bidora to Home Screen</h4>
                            <p className="text-gray-400 text-xs mt-0.5">Get faster bids and push notifications</p>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handleInstallClick}
                                className="bg-yellow-400 hover:bg-yellow-500 text-black px-4 py-1.5 rounded-lg text-xs font-bold transition-colors whitespace-nowrap"
                            >
                                Install 
                            </button>
                            <button
                                onClick={handleDismiss}
                                className="text-gray-500 hover:text-white px-4 py-1.5 text-xs transition-colors whitespace-nowrap"
                            >
                                Not Now
                            </button>
                        </div>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
