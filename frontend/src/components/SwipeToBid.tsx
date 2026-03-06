'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { ChevronRight, CheckCircle2, Zap, ArrowRight, Lock } from 'lucide-react';
import { motion, AnimatePresence, useSpring, useTransform } from 'framer-motion';

interface Props {
    label: string;
    onConfirm: () => void;
    disabled?: boolean;
    confirming?: boolean;
}

export default function SwipeToBid({ label, onConfirm, disabled, confirming }: Props) {
    const [status, setStatus] = useState<'idle' | 'swiping' | 'done'>('idle');
    const [angle, setAngle] = useState(0);
    const containerRef = useRef<HTMLDivElement>(null);
    const isDragging = useRef(false);
    const lastVibratedAngle = useRef(0);

    const springConfig = { damping: 25, stiffness: 300 };
    const springAngle = useSpring(0, springConfig);

    useEffect(() => {
        springAngle.set(angle);
    }, [angle, springAngle]);

    useEffect(() => {
        if (status === 'done') {
            const timer = setTimeout(() => {
                setStatus('idle');
                setAngle(0);
                lastVibratedAngle.current = 0;
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [status]);

    const triggerHaptic = (pattern: number | number[]) => {
        if (typeof window !== 'undefined' && window.navigator.vibrate) {
            window.navigator.vibrate(pattern);
        }
    };

    const updateAngle = useCallback((e: PointerEvent | React.PointerEvent) => {
        if (!containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;

        const rad = Math.atan2(e.clientY - centerY, e.clientX - centerX);
        let deg = (rad * 180) / Math.PI + 90;
        if (deg < 0) deg += 360;

        // Logic to prevent "skipping" backwards or jumping to finish
        if (status === 'idle') {
            if (deg < 45 || deg > 315) {
                setStatus('swiping');
                setAngle(deg > 315 ? 0 : deg);
                triggerHaptic(10);
            }
        } else if (status === 'swiping') {
            // High-precision tracking
            setAngle(deg);

            // Haptic ticks every 45 degrees for tactical feel
            const floor45 = Math.floor(deg / 45) * 45;
            if (floor45 !== lastVibratedAngle.current && deg > 0) {
                triggerHaptic(5);
                lastVibratedAngle.current = floor45;
            }
        }
    }, [status]);

    const handlePointerDown = (e: React.PointerEvent) => {
        if (disabled || confirming || status === 'done') return;
        isDragging.current = true;
        updateAngle(e);
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    };

    const handlePointerMove = (e: React.PointerEvent) => {
        if (!isDragging.current) return;
        updateAngle(e);
    };

    const handlePointerUp = () => {
        if (!isDragging.current) return;
        isDragging.current = false;

        if (angle > 320 || angle < 10 && status === 'swiping') {
            setAngle(360);
            setStatus('done');
            triggerHaptic([30, 20, 50]);
            onConfirm();
        } else {
            setAngle(0);
            setStatus('idle');
            lastVibratedAngle.current = 0;
        }
    };

    if (disabled) {
        return (
            <div className="w-52 h-52 mx-auto rounded-full bg-zinc-900/50 border border-white/5 flex flex-col items-center justify-center text-gray-700 text-[10px] font-black uppercase tracking-widest text-center p-6 cursor-not-allowed grayscale">
                <Lock className="w-6 h-6 mb-3 opacity-20" />
                Wait for Live<br />Auction
            </div>
        );
    }

    const radius = 80;
    const perimeter = 2 * Math.PI * radius;
    const dashOffset = useTransform(springAngle, [0, 360], [perimeter, 0]);

    return (
        <div className="flex flex-col items-center justify-center py-4">
            <div
                ref={containerRef}
                className="relative w-64 h-64 flex items-center justify-center select-none touch-none"
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
            >
                {/* Visual Glow Layer */}
                <motion.div
                    className="absolute inset-0 bg-yellow-400/5 rounded-full blur-3xl pointer-events-none"
                    animate={{ opacity: status === 'swiping' ? 1 : 0, scale: status === 'swiping' ? 1.2 : 1 }}
                />

                {/* SVG Ring Container */}
                <svg className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none">
                    {/* Background Track */}
                    <circle
                        cx="128"
                        cy="128"
                        r={radius}
                        className="fill-none stroke-white/5 stroke-[16]"
                    />
                    {/* Active Progress */}
                    <motion.circle
                        cx="128"
                        cy="128"
                        r={radius}
                        className="fill-none stroke-yellow-400 stroke-[16]"
                        style={{
                            strokeDasharray: perimeter,
                            strokeDashoffset: dashOffset,
                            strokeLinecap: 'round',
                            filter: 'drop-shadow(0 0 12px rgba(250,204,21,0.5))'
                        }}
                    />
                </svg>

                {/* Center Control Hub */}
                <div className="z-10 w-40 h-40 rounded-full bg-zinc-950 border border-white/10 flex flex-col items-center justify-center shadow-[0_0_50px_rgba(0,0,0,0.8)] relative group overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />

                    <AnimatePresence mode="wait">
                        {confirming ? (
                            <motion.div
                                key="loader"
                                initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                                className="flex flex-col items-center"
                            >
                                <Loader2 className="w-10 h-10 text-yellow-400 animate-spin mb-2" />
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Verifying</span>
                            </motion.div>
                        ) : status === 'done' ? (
                            <motion.div
                                key="success"
                                initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, 10, -10, 0] }}
                                className="flex flex-col items-center text-green-400"
                            >
                                <CheckCircle2 className="w-14 h-14 mb-2 filter drop-shadow-[0_0_10px_rgba(34,197,94,0.5)]" />
                                <span className="text-[10px] font-black uppercase tracking-widest">BID PLACED!</span>
                            </motion.div>
                        ) : (
                            <motion.div
                                key="prompt"
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                className="text-center"
                            >
                                <Zap className={`w-10 h-10 mx-auto mb-2 transition-all duration-300 ${status === 'swiping' ? 'text-yellow-400 scale-125' : 'text-gray-600 opacity-50'}`} />
                                <span className="text-[10px] font-black text-white leading-tight block uppercase tracking-[0.2em]">
                                    {status === 'swiping' ? 'Finish Ring' : 'Swipe Handle'}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Completion Target Visual */}
                    <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1.5 h-6 bg-white/10 rounded-full" />
                </div>

                {/* The Magnetic Handle / Bead */}
                {status !== 'done' && !confirming && (
                    <motion.div
                        className="absolute w-12 h-12 bg-yellow-400 rounded-full shadow-[0_0_30px_rgba(250,204,21,0.8)] cursor-grab active:cursor-grabbing z-20 flex items-center justify-center border-4 border-white/30"
                        style={{
                            left: '50%',
                            top: '50%',
                            translateX: useTransform(springAngle, a => Math.cos((a - 90) * (Math.PI / 180)) * radius - 24),
                            translateY: useTransform(springAngle, a => Math.sin((a - 90) * (Math.PI / 180)) * radius - 24),
                        }}
                    >
                        <ArrowRight className={`w-6 h-6 text-black transition-transform duration-300`} style={{ transform: `rotate(${angle}deg)` }} />
                    </motion.div>
                )}
            </div>

            <div className="mt-8 text-center space-y-2">
                <p className="text-yellow-400 font-black text-[11px] uppercase tracking-[0.3em] drop-shadow-[0_0_5px_rgba(250,204,21,0.3)] animate-pulse">
                    {label}
                </p>
                <div className="flex gap-1 justify-center opacity-30">
                    {[...Array(3)].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{ opacity: [0.2, 1, 0.2] }}
                            transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }}
                            className="w-1.5 h-1.5 rounded-full bg-white"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}

// Minimal Loader for internal use
function Loader2(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
        </svg>
    )
}
