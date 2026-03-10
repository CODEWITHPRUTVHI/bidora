'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronRight, CheckCircle2, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Props {
    label: string;
    onConfirm: () => void;
    disabled?: boolean;
    confirming?: boolean;
}

export default function SwipeToBid({ label, onConfirm, disabled, confirming }: Props) {
    const [status, setStatus] = useState<'idle' | 'swiping' | 'done'>('idle');
    const [progress, setProgress] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);

    useEffect(() => {
        if (status === 'done') {
            const timer = setTimeout(() => {
                setStatus('idle');
                setProgress(0);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (disabled || confirming || status === 'done') return;
        isDragging.current = true;
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current || !containerRef.current) return;
        
        const rect = containerRef.current.getBoundingClientRect();
        const handleWidth = 64; // w-16
        const trackWidth = rect.width - handleWidth;
        
        let x = e.clientX - rect.left - handleWidth / 2;
        x = Math.max(0, Math.min(x, trackWidth));
        
        const newProgress = (x / trackWidth) * 100;
        setProgress(newProgress);
        setStatus('swiping');

        if (newProgress > 95) {
            isDragging.current = false;
            setProgress(100);
            setStatus('done');
            if (typeof window !== 'undefined' && window.navigator.vibrate) {
                window.navigator.vibrate([20, 10, 30]);
            }
            onConfirm();
        }
    };

    const handlePointerUp = () => {
        if (!isDragging.current) return;
        isDragging.current = false;
        
        if (progress < 100) {
            setProgress(0);
            setStatus('idle');
        }
    };

    return (
        <div className="w-full max-w-md mx-auto py-2">
            <div 
                ref={containerRef}
                className={`relative h-20 bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-[1.5rem] overflow-hidden select-none touch-none ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                {/* Background Text & Animation */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <AnimatePresence mode="wait">
                        {confirming ? (
                            <motion.div 
                                key="confirming"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex items-center gap-2"
                            >
                                <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                                <span className="text-yellow-400 font-black text-xs uppercase tracking-widest">Processing Bid...</span>
                            </motion.div>
                        ) : status === 'done' ? (
                            <motion.div 
                                key="done"
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-2 text-green-400"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="font-black text-xs uppercase tracking-widest">Bid Placed Successfully</span>
                            </motion.div>
                        ) : (
                            <motion.div 
                                key="idle"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex flex-col items-center gap-1"
                            >
                                <span className="text-gray-400 font-black text-xs uppercase tracking-widest opacity-80">
                                    {label}
                                </span>
                                <div className="flex gap-1">
                                    {[0, 1, 2].map((i) => (
                                        <motion.div
                                            key={i}
                                            animate={{ opacity: [0.2, 1, 0.2] }}
                                            transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }}
                                            className="w-1 h-1 rounded-full bg-yellow-400/50"
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Progress Track Highlight */}
                <div 
                    className="absolute inset-y-0 left-0 bg-gradient-to-r from-yellow-400/20 to-yellow-400/5 pointer-events-none transition-all duration-75"
                    style={{ width: `${progress}%` }}
                />

                {/* Draggable Handle */}
                {!confirming && status !== 'done' && !disabled && (
                    <motion.div
                        className="absolute top-2 bottom-2 left-2 w-16 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(250,204,21,0.4)] z-10 border border-white/20"
                        style={{ x: `${progress}%`, marginLeft: `-${(progress / 100) * 64}px` }}
                        layoutId="handle"
                    >
                        <div className="flex -space-x-1">
                            <ChevronRight className="w-6 h-6 text-black opacity-30" />
                            <ChevronRight className="w-6 h-6 text-black opacity-60" />
                            <ChevronRight className="w-6 h-6 text-black" />
                        </div>
                    </motion.div>
                )}

                {/* Success State Handle */}
                {(confirming || status === 'done') && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute inset-y-2 right-2 w-16 bg-green-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.4)] z-10 border border-white/20"
                    >
                        <Zap className="w-6 h-6 text-white fill-white" />
                    </motion.div>
                )}
            </div>
        </div>
    );
}
