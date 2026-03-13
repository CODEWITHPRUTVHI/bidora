'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function SplashScreen() {
    const [isVisible, setIsVisible] = useState(true);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(false);
        }, 2200); // Slightly longer for better impression
        return () => clearTimeout(timer);
    }, []);

    return (
        <AnimatePresence>
            {isVisible && (
                <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ 
                        opacity: 0,
                        scale: 1.1,
                        filter: 'blur(10px)',
                        transition: { duration: 0.8, ease: [0.43, 0.13, 0.23, 0.96] }
                    }}
                    className="fixed inset-0 z-[9999] flex items-center justify-center bg-black overflow-hidden"
                >
                    {/* Dynamic Background Elements */}
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1.5 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120vw] h-[120vw] bg-yellow-400/10 blur-[180px] rounded-full" 
                    />
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1.2 }}
                        transition={{ duration: 2 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80vw] h-[80vw] bg-blue-500/5 blur-[150px] rounded-full" 
                    />

                    <div className="relative flex flex-col items-center">
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0, y: 40 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                            className="relative"
                        >
                            <h1 className="text-7xl sm:text-9xl font-black tracking-tighter text-white">
                                BIDORA<span className="text-yellow-400">.</span>
                            </h1>
                            
                            {/* Signature Animated Sweep */}
                            <motion.div 
                                initial={{ scaleX: 0 }}
                                animate={{ scaleX: 1 }}
                                transition={{ delay: 0.6, duration: 1, ease: "easeInOut" }}
                                className="h-[2px] bg-gradient-to-r from-transparent via-yellow-400 to-transparent mt-2 origin-center"
                            />
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 1, duration: 0.6 }}
                            className="flex flex-col items-center mt-8 space-y-4"
                        >
                            <span className="text-gray-400 text-[10px] sm:text-xs uppercase tracking-[0.6em] font-black">
                                Where Rare Lands
                            </span>
                            
                            {/* Elegant Loading bar */}
                            <div className="w-48 h-[1px] bg-white/10 relative overflow-hidden">
                                <motion.div 
                                    initial={{ left: '-100%' }}
                                    animate={{ left: '100%' }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                    className="absolute inset-0 bg-yellow-400/50"
                                />
                            </div>
                        </motion.div>
                    </div>

                    {/* Scanlight effect */}
                    <motion.div
                        initial={{ top: '-20%' }}
                        animate={{ top: '120%' }}
                        transition={{ duration: 2, ease: "easeInOut" }}
                        className="absolute left-0 right-0 h-[10vh] bg-gradient-to-b from-transparent via-yellow-400/10 to-transparent pointer-events-none"
                    />
                </motion.div>
            )}
        </AnimatePresence>
    );
}
