'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Trophy, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useState, useEffect } from 'react';

export default function HeroSection() {
    const [timeLeft, setTimeLeft] = useState(43);

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft((prev) => (prev > 0 ? prev - 1 : 59));
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <section className="relative w-full min-h-[90vh] flex items-center justify-center overflow-hidden pt-20 pb-16">
            {/* Dynamic Background */}
            <div className="absolute inset-0 bg-zinc-950 -z-20" />
            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-yellow-900 via-zinc-950 to-zinc-950 -z-10" />

            {/* Subtle glow effects */}
            <motion.div animate={{ opacity: [0.3, 0.5, 0.3] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
                className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-yellow-500/10 blur-[150px] rounded-full -z-10 translate-x-1/3 -translate-y-1/3 pointer-events-none" />
            <motion.div animate={{ opacity: [0.2, 0.4, 0.2] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
                className="absolute bottom-0 left-0 w-[40vw] h-[40vw] bg-amber-600/10 blur-[130px] rounded-full -z-10 -translate-x-1/3 translate-y-1/3 pointer-events-none" />

            <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center z-10">

                {/* Left Typography */}
                {/* Left Typography - ZERO ANIMATION FOR MAXIMUM LCP SCORE */}
                <div className="max-w-2xl">

                    <div className="hidden sm:inline-flex items-center space-x-2 bg-white/[0.03] border border-white/10 px-4 py-2 rounded-full mb-8 backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm font-medium tracking-wide text-gray-300">Bidora Escrow guarantees every transaction</span>
                    </div>

                    <h1 className="text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black leading-[1.1] tracking-tighter text-white mb-6 drop-shadow-2xl">
                        WHERE RARE<br className="hidden xs:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-amber-600 drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                            LANDS.
                        </span>
                    </h1>

                    <p className="text-lg text-gray-400 font-light leading-relaxed mb-10 max-w-xl">
                        Hunt. Bid. Win. Only verified kicks. Only Bidora.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <Link href="#live-auctions"
                            className="w-full sm:w-auto bg-gradient-to-b from-yellow-400 to-yellow-500 text-zinc-950 px-8 py-4 flex items-center justify-center space-x-3 transition-all hover:-translate-y-1 active:scale-95 shadow-[0_10px_40px_-5px_rgba(250,204,21,0.5)] hover:shadow-[0_20px_50px_-5px_rgba(250,204,21,0.8)] border border-yellow-300 rounded-2xl font-black text-lg">
                            <span>JOIN THE HUNT</span>
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link href="/dashboard?tab=listings"
                            className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white border border-white/40 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:border-white/60 transition-all text-center">
                            LIST YOUR KICKS
                        </Link>
                    </div>

                </div>

                {/* Right Hero Image Card - NO ANIMATION FOR INSTANT LCP PAINT */}
                <div className="relative hidden lg:block mx-auto w-full max-w-md perspective-1000">
                    <div className="relative w-full aspect-[4/5] rounded-[2rem] overflow-hidden bg-black/40 backdrop-blur-2xl p-3 border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] group transition-transform duration-700 hover:scale-[1.02]">
                        <div className="relative w-full h-full rounded-2xl overflow-hidden">
                            <Image
                                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop"
                                alt="Nike Air Jordan 1 Retro High Chicago live auction India"
                                fill
                                priority
                                className="object-cover select-none"
                                sizes="(max-width: 1024px) 100vw, 400px"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                            <div className="absolute top-4 left-4 bg-zinc-900/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-[10px] font-black tracking-widest flex items-center shadow-2xl border border-white/10">
                                <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                                LIVE NOW
                            </div>

                            <div className="absolute bottom-0 left-0 w-full p-6">
                                <div className="flex justify-between items-end mb-4">
                                    <div>
                                        <h3 className="text-2xl font-bold text-white mb-1">Air Jordan 1 Retro High</h3>
                                        <p className="text-gray-300 font-medium text-sm">Chicago Colourway · Size 10</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-yellow-400 font-bold uppercase tracking-widest mb-1">Current Bid</p>
                                        <p className="text-3xl font-black text-white">₹12,400</p>
                                    </div>
                                </div>

                                <div className="w-full bg-white/10 backdrop-blur-md rounded-xl p-3 flex justify-between items-center border border-white/10">
                                    <div className="flex -space-x-2">
                                        <div className="relative w-8 h-8 rounded-full border-2 border-zinc-900 overflow-hidden">
                                            <Image src="https://i.pravatar.cc/100?img=1" fill alt="Bidder" className="object-cover" />
                                        </div>
                                        <div className="relative w-8 h-8 rounded-full border-2 border-zinc-900 overflow-hidden">
                                            <Image src="https://i.pravatar.cc/100?img=2" fill alt="Bidder" className="object-cover" />
                                        </div>
                                        <div className="relative w-8 h-8 rounded-full border-2 border-zinc-900 overflow-hidden">
                                            <Image src="https://i.pravatar.cc/100?img=3" fill alt="Bidder" className="object-cover" />
                                        </div>
                                    </div>
                                    <p className="text-sm font-bold text-red-400">
                                        00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft} Remaining
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
