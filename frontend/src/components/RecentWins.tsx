'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const recentWins = [
    { name: 'Arjun M.', city: 'Mumbai', item: 'Nike Air Jordan 1 Retro High', price: '₹12,400', time: '2 mins ago', emoji: '🔥' },
    { name: 'Priya K.', city: 'Pune', item: 'Adidas Yeezy Boost 350', price: '₹8,900', time: '7 mins ago', emoji: '👟' },
    { name: 'Rohit S.', city: 'Bangalore', item: 'New Balance 550 White', price: '₹6,200', time: '12 mins ago', emoji: '⚡' },
    { name: 'Sneha D.', city: 'Delhi', item: 'Off-White x Nike Dunk Low', price: '₹31,000', time: '18 mins ago', emoji: '🏆' },
    { name: 'Karan P.', city: 'Mumbai', item: 'Travis Scott Air Max 1', price: '₹44,500', time: '25 mins ago', emoji: '🔥' },
    { name: 'Meera R.', city: 'Chennai', item: 'Jordan 4 Retro Black Cat', price: '₹15,800', time: '31 mins ago', emoji: '👑' },
];

// Duplicate for seamless infinite scroll
const allWins = [...recentWins, ...recentWins];

function WinCard({ win }: { win: typeof recentWins[0] }) {
    return (
        <div className="relative flex-shrink-0 w-64 bg-zinc-900/60 backdrop-blur-xl border border-white/10 rounded-2xl p-5 hover:border-yellow-400/30 hover:bg-zinc-800/60 transition-all duration-300 group overflow-hidden">
            {/* Subtle hover glow */}
            <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />

            {/* Live dot */}
            <div className="absolute top-3 right-3 flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
            </div>

            <div className="relative z-10">
                <p className="text-2xl mb-3">{win.emoji}</p>
                <p className="text-white font-bold text-sm leading-tight mb-0.5">
                    {win.name} <span className="text-gray-500 font-medium">· {win.city}</span>
                </p>
                <p className="text-gray-400 text-xs mb-3 leading-snug line-clamp-2">{win.item}</p>
                <div className="flex items-center justify-between">
                    <p className="text-yellow-400 font-black text-lg">{win.price}</p>
                    <p className="text-gray-600 text-[10px] font-medium uppercase tracking-wider">{win.time}</p>
                </div>
                <p className="text-[9px] text-green-400 font-bold uppercase tracking-widest mt-2">WON ✓</p>
            </div>
        </div>
    );
}

export default function RecentWins() {
    const trackRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const track = trackRef.current;
        if (!track) return;

        let animation: Animation | null = null;

        const startAnimation = () => {
            // Each card is w-64 (256px) + gap-4 (16px) = 272px. Original set = 6 cards.
            const singleSetWidth = recentWins.length * 272;

            animation = track.animate(
                [
                    { transform: 'translateX(0px)' },
                    { transform: `translateX(-${singleSetWidth}px)` },
                ],
                {
                    duration: 28000,
                    iterations: Infinity,
                    easing: 'linear',
                }
            );
        };

        startAnimation();

        // Pause on hover
        const handleMouseEnter = () => animation?.pause();
        const handleMouseLeave = () => animation?.play();
        track.addEventListener('mouseenter', handleMouseEnter);
        track.addEventListener('mouseleave', handleMouseLeave);

        return () => {
            animation?.cancel();
            track.removeEventListener('mouseenter', handleMouseEnter);
            track.removeEventListener('mouseleave', handleMouseLeave);
        };
    }, []);

    return (
        <section className="py-16 relative overflow-hidden">
            {/* Ambient glows */}
            <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-96 h-96 bg-yellow-500/5 blur-[120px] rounded-full pointer-events-none" />
            <div className="absolute top-1/2 right-1/4 -translate-y-1/2 w-96 h-96 bg-green-500/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="container mx-auto px-6 mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.6 }}
                >
                    <p className="text-yellow-400 text-xs font-bold uppercase tracking-[0.2em] mb-2">Community</p>
                    <h2 className="text-2xl md:text-3xl font-black tracking-tight text-white">
                        🏆 LATEST WINS <span className="text-gray-500 font-light text-xl">— Real people. Real deals.</span>
                    </h2>
                </motion.div>
            </div>

            {/* Fade edges */}
            <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-r from-zinc-950 to-transparent z-10 pointer-events-none" />
                <div className="absolute right-0 top-0 bottom-0 w-16 md:w-32 bg-gradient-to-l from-zinc-950 to-transparent z-10 pointer-events-none" />

                {/* Scrolling track */}
                <div className="overflow-hidden">
                    <div
                        ref={trackRef}
                        className="flex gap-4 w-max py-4 px-6"
                    >
                        {allWins.map((win, i) => (
                            <WinCard key={i} win={win} />
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
