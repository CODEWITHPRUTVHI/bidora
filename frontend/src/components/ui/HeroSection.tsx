'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Trophy, ShieldCheck, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

export default function HeroSection() {
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
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                    className="max-w-2xl"
                >
                    <div className="inline-flex items-center space-x-2 bg-white/[0.03] border border-white/10 px-4 py-2 rounded-full mb-8 backdrop-blur-md">
                        <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-sm font-medium tracking-wide text-gray-300">Bidora Escrow guarantees every transaction</span>
                    </div>

                    <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black leading-[1.1] tracking-tighter text-white mb-6 drop-shadow-2xl">
                        WHERE RARE<br className="hidden xs:block" />
                        <span className="text-transparent bg-clip-text bg-gradient-to-b from-yellow-300 to-amber-600 drop-shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                            LANDS.
                        </span>
                    </h1>

                    <p className="text-lg text-gray-400 font-light leading-relaxed mb-10 max-w-xl">
                        India&apos;s home for sneakerheads who hunt, bid, and win. Only verified. Only real. Only Bidora.
                    </p>

                    <div className="flex flex-col sm:flex-row items-center gap-4">
                        <Link href="#live-auctions"
                            className="w-full sm:w-auto bg-gradient-to-b from-yellow-400 to-yellow-500 text-zinc-950 px-8 py-4 flex items-center justify-center space-x-3 transition-all hover:-translate-y-1 active:scale-95 shadow-[0_10px_40px_-5px_rgba(250,204,21,0.5)] hover:shadow-[0_20px_50px_-5px_rgba(250,204,21,0.8)] border border-yellow-300 rounded-2xl font-black text-lg">
                            <span>JOIN THE HUNT</span>
                            <ArrowRight className="w-5 h-5" />
                        </Link>
                        <Link href="/dashboard?tab=listings"
                            className="w-full sm:w-auto px-8 py-4 rounded-xl font-bold text-white border border-white/20 bg-white/5 backdrop-blur-md hover:bg-white/10 transition-all text-center">
                            LIST YOUR KICKS
                        </Link>
                    </div>

                </motion.div>

                {/* Right Hero Image Card */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="relative hidden lg:block mx-auto w-full max-w-md perspective-1000"
                >
                    <div className="relative w-full aspect-[4/5] rounded-[2rem] overflow-hidden bg-black/40 backdrop-blur-2xl p-3 border border-white/10 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.8)] group transition-transform duration-700 hover:scale-[1.02]">
                        <div className="relative w-full h-full rounded-2xl overflow-hidden">
                            <Image
                                src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop"
                                alt="Nike Air Jordan Sneakers"
                                fill
                                priority
                                className="object-cover select-none"
                                sizes="(max-width: 1024px) 100vw, 400px"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                            <div className="absolute top-4 left-4 bg-red-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-bold tracking-widest flex items-center shadow-lg shadow-red-500/20">
                                <span className="w-2 h-2 rounded-full bg-white mr-2 animate-pulse" />
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
                                        00:43 Remaining
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Micro Interaction Element */}
                    <motion.div
                        animate={{ y: [0, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 5, ease: 'easeInOut' }}
                        className="absolute -bottom-6 -left-10 bg-zinc-900/80 backdrop-blur-2xl border border-white/10 p-4 rounded-2xl flex items-center space-x-4 shadow-[0_15px_40px_-10px_rgba(0,0,0,0.8)]"
                    >
                        <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-yellow-400/50 shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                            <Image src="https://i.pravatar.cc/100?img=4" fill className="object-cover" alt="" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 mb-0.5 font-medium">New bid placed</p>
                            <p className="text-sm font-bold text-white"><span className="text-yellow-400">Arjun M.</span> bid ₹12,400</p>
                        </div>
                    </motion.div>
                </motion.div>

            </div>
        </section>
    );
}
