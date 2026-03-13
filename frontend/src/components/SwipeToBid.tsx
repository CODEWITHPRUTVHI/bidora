'use client';

import { useState, useRef, useEffect } from 'react';
import { ChevronRight, CheckCircle2, Zap, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence, useMotionValue, useTransform } from 'framer-motion';

interface Props {
    label: string;
    onConfirm: () => void;
    disabled?: boolean;
    confirming?: boolean;
}

export default function SwipeToBid({ label, onConfirm, disabled, confirming }: Props) {
    const [status, setStatus] = useState<'idle' | 'swiping' | 'done'>('idle');
    const containerRef = useRef<HTMLDivElement>(null);
    const x = useMotionValue(0);
    
    // Calculate drag constraints based on container width
    const [dragWidth, setDragWidth] = useState(0);

    useEffect(() => {
        if (containerRef.current) {
            setDragWidth(containerRef.current.offsetWidth - 72); // 64 (handle) + 8 (padding)
        }
    }, []);

    const opacity = useTransform(x, [0, dragWidth * 0.5], [1, 0]);
    const scale = useTransform(x, [0, dragWidth], [1, 1.05]);
    const bgOpacity = useTransform(x, [0, dragWidth], [0.1, 0.3]);

    useEffect(() => {
        if (status === 'done') {
            const timer = setTimeout(() => {
                setStatus('idle');
                x.set(0);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [status, x]);

    const handleDragEnd = (_: any, info: any) => {
        if (info.offset.x >= dragWidth - 10) {
            setStatus('done');
            if (typeof window !== 'undefined' && window.navigator.vibrate) {
                window.navigator.vibrate([20, 10, 30]);
            }
            onConfirm();
        } else {
            setStatus('idle');
        }
    };

    return (
        <div className="w-full max-w-md mx-auto py-2">
            <div 
                ref={containerRef}
                className={`relative h-20 bg-zinc-900 border border-white/10 rounded-[1.5rem] overflow-hidden select-none touch-none flex items-center p-2 ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : 'cursor-pointer'}`}
            >
                {/* Background Text */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <AnimatePresence mode="wait">
                        {confirming ? (
                            <motion.div 
                                key="confirming"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="flex items-center gap-3"
                            >
                                <div className="w-4 h-4 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin" />
                                <span className="text-yellow-400 font-black text-xs uppercase tracking-[0.2em]">Placing Bid...</span>
                            </motion.div>
                        ) : status === 'done' ? (
                            <motion.div 
                                key="done"
                                initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-2 text-green-400"
                            >
                                <CheckCircle2 className="w-5 h-5" />
                                <span className="font-black text-xs uppercase tracking-[0.2em]">Success</span>
                            </motion.div>
                        ) : (
                            <motion.div 
                                style={{ opacity }}
                                className="flex flex-col items-center gap-1"
                            >
                                <span className="text-gray-400 font-black text-[10px] uppercase tracking-[0.3em]">
                                    {label}
                                </span>
                                <div className="flex gap-2">
                                     <ArrowRight className="w-3 h-3 text-yellow-400/50 animate-pulse" />
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Progress Track Highlight */}
                <motion.div 
                    className="absolute inset-y-0 left-0 bg-yellow-400 pointer-events-none"
                    style={{ width: x, opacity: bgOpacity }}
                />

                {/* Draggable Handle */}
                {!confirming && status !== 'done' && !disabled && (
                    <motion.div
                        drag="x"
                        dragConstraints={{ left: 0, right: dragWidth }}
                        dragElastic={0.1}
                        style={{ x }}
                        onDragStart={() => setStatus('swiping')}
                        onDragEnd={handleDragEnd}
                        className="relative w-16 h-16 bg-yellow-400 rounded-2xl flex items-center justify-center shadow-[0_0_25px_rgba(250,204,21,0.4)] z-10 border border-white/20 active:scale-95 transition-transform"
                    >
                        <div className="flex -space-x-1">
                            <ChevronRight className="w-6 h-6 text-black opacity-30" />
                            <ChevronRight className="w-6 h-6 text-black opacity-60" />
                            <ChevronRight className="w-6 h-6 text-black" />
                        </div>
                    </motion.div>
                )}

                {/* Confirming State */}
                {(confirming || status === 'done') && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute right-2 w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.4)] z-10 border border-white/20"
                    >
                        <Zap className="w-6 h-6 text-white fill-white" />
                    </motion.div>
                )}
            </div>
        </div>
    );
}
