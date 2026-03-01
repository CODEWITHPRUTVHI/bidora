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
    const [angle, setAngle] = useState(0); // 0 to 360
    const containerRef = useRef<HTMLDivElement>(null);

    const isDragging = useRef(false);

    useEffect(() => {
        if (status === 'done') {
            const timer = setTimeout(() => {
                setStatus('idle');
                setAngle(0);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (disabled || confirming || status === 'done') return;
        isDragging.current = true;
        updateAngle(e);
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current) return;
        updateAngle(e);
    };

    const handlePointerUp = () => {
        if (!isDragging.current) return;
        isDragging.current = false;

        if (angle > 330) {
            setAngle(360);
            setStatus('done');
            onConfirm();
        } else {
            setAngle(0);
            setStatus('idle');
        }
    };

    const updateAngle = (e: React.PointerEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        // Calculate angle from center
        const rad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        let deg = rad * (180 / Math.PI) + 90; // Offset so 0 is top
        if (deg < 0) deg += 360;

        // We want to force a clockwise swipe from top
        // If they jump too far, keep it at bounds
        if (status === 'idle' && deg < 45) {
            setStatus('swiping');
            setAngle(deg);
        } else if (status === 'swiping') {
            // Check if moving backwards too much
            if (deg > angle || (angle > 300 && deg < 60)) {
                setAngle(deg);
            }
        }
    };

    if (disabled) {
        return (
            <div className="w-48 h-48 mx-auto rounded-full bg-white/5 border border-white/10 flex flex-col items-center justify-center text-gray-600 text-xs font-bold text-center p-6 cursor-not-allowed opacity-50">
                <Zap className="w-6 h-6 mb-2 opacity-30" />
                AUCTION<br />NOT LIVE
            </div>
        );
    }

    const perimeter = 2 * Math.PI * 70; // radius = 70
    const strokeDashoffset = perimeter - (angle / 360) * perimeter;

    return (
        <div className="flex flex-col items-center justify-center py-8">
            <div
                ref={containerRef}
                className="relative w-52 h-52 flex items-center justify-center select-none"
            >
                {/* Background Ring */}
                <svg className="absolute inset-0 w-full h-full -rotate-90">
                    <circle
                        cx="104"
                        cy="104"
                        r="70"
                        className="fill-none stroke-white/5 stroke-[12]"
                    />
                    {/* Active Progress Ring */}
                    <motion.circle
                        cx="104"
                        cy="104"
                        r="70"
                        className="fill-none stroke-yellow-400/80 stroke-[12] transition-all duration-75"
                        style={{
                            strokeDasharray: perimeter,
                            strokeDashoffset: strokeDashoffset,
                            strokeLinecap: 'round',
                            filter: 'drop-shadow(0 0 8px rgba(250,204,21,0.4))'
                        }}
                    />
                </svg>

                {/* Inner Button Content */}
                <div className="z-10 w-32 h-32 rounded-full bg-zinc-900 border border-white/10 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                    <AnimatePresence mode="wait">
                        {confirming ? (
                            <motion.span
                                key="loader"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="w-8 h-8 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"
                            />
                        ) : status === 'done' ? (
                            <motion.div
                                key="success"
                                initial={{ scale: 0 }} animate={{ scale: 1 }}
                                className="flex flex-col items-center text-green-400"
                            >
                                <CheckCircle2 className="w-10 h-10 mb-1" />
                                <span className="text-[10px] font-black uppercase tracking-widest">PLACED</span>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="label"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="text-center px-4 cursor-grab active:cursor-grabbing"
                                onPointerDown={handlePointerDown}
                                onPointerMove={handlePointerMove}
                                onPointerUp={handlePointerUp}
                                onPointerCancel={handlePointerUp}
                            >
                                <ChevronRight className="w-8 h-8 text-yellow-400 mx-auto mb-1 animate-pulse" />
                                <span className="text-[10px] font-black text-white leading-tight block uppercase tracking-tighter">
                                    SWIPE RING<br />TO CONFIRM
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Handle / Bead */}
                {status !== 'done' && !confirming && (
                    <motion.div
                        className="absolute w-8 h-8 bg-yellow-400 rounded-full shadow-[0_0_20px_rgba(250,204,21,0.6)] cursor-pointer z-20 flex items-center justify-center border-2 border-white/20 left-1/2 top-1/2"
                        initial={false}
                        animate={{
                            x: Math.cos((angle - 90) * (Math.PI / 180)) * 70 - 16, // -16 to offset the 32px width (w-8)
                            y: Math.sin((angle - 90) * (Math.PI / 180)) * 70 - 16,
                        }}
                    >
                        <Zap className="w-4 h-4 text-black fill-current" />
                    </motion.div>
                )}
            </div>

            <p className="mt-6 text-yellow-400/60 text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
                {label}
            </p>
        </div>
    );
}
