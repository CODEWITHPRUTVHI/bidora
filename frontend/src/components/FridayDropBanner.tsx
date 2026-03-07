'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

function getNextFridayIST(): Date {
    // Get current time in IST (UTC+5:30)
    const now = new Date();
    const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
    const istMs = utcMs + 5.5 * 3600000;
    const ist = new Date(istMs);

    // Find next Friday 8 PM IST
    const dayOfWeek = ist.getDay(); // 0=Sun, 5=Fri
    let daysUntilFriday = (5 - dayOfWeek + 7) % 7;

    // If it's already Friday, check if 8 PM has passed
    if (daysUntilFriday === 0 && ist.getHours() >= 20) {
        daysUntilFriday = 7; // next Friday
    }

    const nextFridayIST = new Date(istMs);
    nextFridayIST.setDate(nextFridayIST.getDate() + daysUntilFriday);
    nextFridayIST.setHours(20, 0, 0, 0);

    // Convert back to UTC for countdown calculation
    const nextFridayUTC = new Date(nextFridayIST.getTime() - 5.5 * 3600000);
    return nextFridayUTC;
}

interface TimeLeft {
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
}

function CountdownBox({ value, label }: { value: number; label: string }) {
    return (
        <div className="flex flex-col items-center">
            <div className="bg-black/30 border border-white/10 backdrop-blur-md rounded-xl px-3 py-2 sm:px-4 sm:py-3 min-w-[52px] sm:min-w-[64px] text-center">
                <span className="text-xl sm:text-3xl font-black text-white tabular-nums">
                    {String(value).padStart(2, '0')}
                </span>
            </div>
            <span className="text-white/50 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mt-1">{label}</span>
        </div>
    );
}

export default function FridayDropBanner() {
    const [timeLeft, setTimeLeft] = useState<TimeLeft>({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        const tick = () => {
            const target = getNextFridayIST();
            const diff = target.getTime() - Date.now();

            if (diff <= 0) {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
                return;
            }

            const days = Math.floor(diff / (1000 * 60 * 60 * 24));
            const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((diff % (1000 * 60)) / 1000);

            setTimeLeft({ days, hours, minutes, seconds });
        };

        tick();
        const id = setInterval(tick, 1000);
        return () => clearInterval(id);
    }, []);

    return (
        <motion.section
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden"
        >
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#1a1a2e] via-[#16213e] to-[#E63946]" />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40" />

            {/* Animated particles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {[...Array(6)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-white/20 rounded-full"
                        animate={{
                            y: [0, -100, 0],
                            x: [0, Math.sin(i * 45) * 30, 0],
                            opacity: [0, 1, 0],
                        }}
                        transition={{
                            duration: 3 + i * 0.5,
                            repeat: Infinity,
                            delay: i * 0.4,
                            ease: 'easeInOut',
                        }}
                        style={{
                            left: `${10 + i * 15}%`,
                            bottom: '10%',
                        }}
                    />
                ))}
            </div>

            <div className="relative z-10 container mx-auto px-6 py-8 md:py-10">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">

                    {/* Left: Text content */}
                    <div className="text-center md:text-left">
                        <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 rounded-full px-3 py-1 mb-4 backdrop-blur-sm">
                            <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
                            <span className="text-white/80 text-[10px] font-bold uppercase tracking-widest">Weekly Event</span>
                        </div>

                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-black text-white tracking-tight mb-1">
                            BIDORA FRIDAY DROPS
                        </h2>
                        <p className="text-white/70 text-sm mb-1">Every Friday at 8:00 PM IST</p>
                        <p className="text-white/60 text-xs max-w-xs mx-auto md:mx-0 mb-6">
                            One ultra-rare sneaker. One live auction. One winner.
                        </p>

                        <a
                            href="#"
                            className="inline-flex items-center gap-2 bg-white text-zinc-950 px-6 py-3 rounded-xl font-black text-sm hover:-translate-y-0.5 hover:shadow-[0_10px_30px_rgba(255,255,255,0.2)] transition-all duration-300"
                        >
                            JOIN THE WAITLIST
                            <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>

                    {/* Right: Countdown */}
                    <div className="flex flex-col items-center gap-3">
                        <p className="text-white/50 text-[10px] font-bold uppercase tracking-widest">Next Drop In</p>
                        <div className="flex items-start gap-2 sm:gap-3">
                            <CountdownBox value={timeLeft.days} label="Days" />
                            <span className="text-white/40 text-2xl font-black mt-2">:</span>
                            <CountdownBox value={timeLeft.hours} label="Hours" />
                            <span className="text-white/40 text-2xl font-black mt-2">:</span>
                            <CountdownBox value={timeLeft.minutes} label="Mins" />
                            <span className="text-white/40 text-2xl font-black mt-2">:</span>
                            <CountdownBox value={timeLeft.seconds} label="Secs" />
                        </div>
                    </div>

                </div>
            </div>
        </motion.section>
    );
}
