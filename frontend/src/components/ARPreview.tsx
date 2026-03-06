'use client';

import React, { useState } from 'react';
import Script from 'next/script';
import { Cuboid, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ARPreview() {
    const [isOpen, setIsOpen] = useState(false);

    // Provide a premium default model for the demonstration. 
    // In production, this would be `auction.modelUrl` etc.
    const demoModelUrl = 'https://modelviewer.dev/shared-assets/models/Astronaut.glb';

    return (
        <>
            {/* Minimalist Floating Entry Button */}
            <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setIsOpen(true)}
                className="absolute top-6 left-6 p-4 rounded-3xl bg-black/60 backdrop-blur-3xl border border-blue-500/30 hover:bg-blue-500/20 hover:border-blue-500 transition-all shadow-[0_0_20px_rgba(59,130,246,0.3)] text-blue-400 group z-20 flex items-center gap-3"
            >
                <div className="relative">
                    <Cuboid className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping" />
                </div>
                <span className="text-[10px] font-black tracking-[0.2em] uppercase hidden md:block">3D & AR Preview</span>
            </motion.button>

            {/* Immersive Overlay */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="fixed inset-0 z-[9999] bg-zinc-950/90 backdrop-blur-3xl flex items-center justify-center p-4 sm:p-10"
                    >
                        {/* Inject the Google Model Viewer Web Component Script */}
                        <Script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js" />

                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute top-8 right-8 p-4 rounded-full bg-white/5 hover:bg-red-500/20 text-white hover:text-red-400 transition-colors z-[10001] border border-white/10"
                        >
                            <X className="w-6 h-6" />
                        </button>

                        <div className="w-full h-full max-w-7xl max-h-[85vh] rounded-[3rem] overflow-hidden relative shadow-[0_0_150px_rgba(59,130,246,0.15)] border-2 border-white/10 bg-gradient-to-b from-zinc-900 to-black">

                            {/* @ts-ignore : model-viewer is a web component not natively typed in React */}
                            <model-viewer
                                src={demoModelUrl}
                                alt="A 3D model preview of the item"
                                ar={true}
                                ar-modes="webxr scene-viewer quick-look"
                                camera-controls={true}
                                auto-rotate={true}
                                style={{
                                    width: '100%',
                                    height: '100%',
                                    backgroundColor: 'transparent'
                                }}
                            >
                                <div className="absolute bottom-12 left-1/2 -translate-x-1/2 text-center pointer-events-none w-full px-4">
                                    <p className="text-white text-xs font-black uppercase tracking-[0.4em] opacity-40 mb-6 group-hover:opacity-100 transition-opacity drop-shadow-lg">
                                        Interactive 3D Orbit
                                    </p>
                                    <button
                                        slot="ar-button"
                                        className="pointer-events-auto mx-auto bg-blue-500 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest shadow-[0_0_40px_rgba(59,130,246,0.5)] hover:bg-blue-400 hover:scale-105 transition-all flex items-center gap-3"
                                    >
                                        <Cuboid className="w-5 h-5" />
                                        Launch in AR
                                    </button>
                                </div>

                                {/* Custom loading spinner slot */}
                                <div slot="progress-bar" className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                                    <div className="flex flex-col items-center">
                                        <div className="w-16 h-16 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mb-4 shadow-[0_0_15px_rgba(59,130,246,0.5)]" />
                                        <span className="text-blue-400 text-xs font-black tracking-widest uppercase">Loading Matrix...</span>
                                    </div>
                                </div>
                                {/* @ts-ignore */}
                            </model-viewer>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}

// Tell TypeScript to ignore the custom web component element
declare global {
    namespace JSX {
        interface IntrinsicElements {
            'model-viewer': React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement> & {
                src?: string;
                alt?: string;
                ar?: boolean;
                'ar-modes'?: string;
                'camera-controls'?: boolean;
                'auto-rotate'?: boolean;
            };
        }
    }
}
