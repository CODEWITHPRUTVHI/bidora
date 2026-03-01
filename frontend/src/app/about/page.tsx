'use client';

import { User, ShieldCheck, Trophy, Sparkles, MessageSquare, Target, Code, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';

const FadeIn = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => (
    <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, margin: "-100px" }}
        transition={{
            duration: 1.2,
            delay,
            ease: [0.16, 1, 0.3, 1],
            scale: { type: "spring", stiffness: 100, damping: 20 }
        }}
    >
        {children}
    </motion.div>
);

export default function AboutPage() {
    return (
        <div className="min-h-screen bg-[#050505] pt-32 pb-32 relative overflow-hidden text-white selection:bg-yellow-500/30">
            {/* Ambient Backgrounds - More Cinematic */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[60vw] h-[60vw] bg-yellow-500/[0.03] blur-[150px] rounded-full" />
                <div className="absolute bottom-[20%] left-[-10%] w-[50vw] h-[50vw] bg-blue-500/[0.03] blur-[150px] rounded-full" />
                <div className="absolute top-[40%] left-[30%] w-[30vw] h-[30vw] bg-purple-500/[0.02] blur-[120px] rounded-full" />
            </div>

            <div className="container mx-auto px-6 max-w-7xl relative z-10">
                {/* Header Section */}
                <FadeIn>
                    <div className="text-center mb-24">
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-400/10 border border-yellow-400/20 rounded-full mb-8 backdrop-blur-md"
                        >
                            <Sparkles className="w-4 h-4 text-yellow-400" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400">The Future of Auctions</span>
                        </motion.div>
                        <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[0.9] drop-shadow-2xl">
                            ARCHITECTING <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-amber-600">
                                ABSOLUTE TRUST.
                            </span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-400 leading-relaxed max-w-2xl mx-auto font-light">
                            Bidora is not just an auction house. It is a high-speed, escrow-secured engine designed for the world's most valuable collectibles.
                        </p>
                    </div>
                </FadeIn>

                {/* Founder Section - The "Box" and Premium Look */}
                <div className="relative mb-32">
                    {/* Large Background Box */}
                    <div className="absolute inset-0 bg-zinc-900/20 border border-white/5 rounded-[4rem] -z-10 backdrop-blur-3xl" />

                    <div className="grid lg:grid-cols-12 gap-12 items-center p-8 md:p-16 lg:p-20">
                        {/* Image Box */}
                        <div className="lg:col-span-5 relative">
                            <FadeIn delay={0.2}>
                                <div className="relative aspect-[4/5] rounded-[3rem] overflow-hidden group shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] border border-white/10">
                                    <Image
                                        src="/ceo_pruthviraj_chavan_portrait.png" // Updated to generated png
                                        alt="Pruthviraj Chavan"
                                        fill
                                        className="object-cover transition-transform duration-1000 group-hover:scale-105"
                                        onError={(e) => {
                                            (e.target as any).src = "https://images.unsplash.com/photo-1519085185750-74071727339a?w=800&q=80";
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />

                                    {/* Stats overlay boxes */}
                                    <motion.div
                                        initial={{ x: 30, opacity: 0 }}
                                        whileInView={{ x: 0, opacity: 1 }}
                                        className="absolute top-10 -right-8 bg-zinc-950/80 backdrop-blur-2xl border border-white/10 p-5 rounded-2xl shadow-2xl hidden md:block"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-yellow-400 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(250,204,21,0.4)]">
                                                <Target className="w-5 h-5 text-black" />
                                            </div>
                                            <div>
                                                <p className="text-gray-400 text-[9px] font-black uppercase tracking-widest">Visionary</p>
                                                <p className="text-white font-black text-sm">Founded 2024</p>
                                            </div>
                                        </div>
                                    </motion.div>
                                </div>
                            </FadeIn>
                        </div>

                        {/* Content Box */}
                        <div className="lg:col-span-7 space-y-10">
                            <FadeIn delay={0.3}>
                                <div className="inline-block px-4 py-1 bg-yellow-400 text-black font-black text-[10px] uppercase tracking-[0.2em] rounded-md mb-4 shadow-lg">
                                    FOUNDER & CEO
                                </div>
                                <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-6 leading-tight">
                                    PRUTHVIRAJ <br />CHAVAN
                                </h2>
                                <div className="space-y-6 text-gray-400 text-lg md:text-xl font-light leading-relaxed">
                                    <p>
                                        "The traditional auction model is built on outdated tech and fragile trust. At Bidora, we've replaced uncertainty with <span className="text-white font-bold italic underline decoration-yellow-400/50">mathematical certainty</span>."
                                    </p>
                                    <p>
                                        As an engineer first and a collector second, I realized that the only way to solve fraud was to integrate the financial layer directly into the bidding engine. Every RUPEE you see on Bidora is real, locked in escrow before the gavel drops.
                                    </p>
                                    <p className="text-yellow-400/60 font-medium italic">
                                        "We are building the definitive global standard for rapid, secure luxury exchange."
                                    </p>
                                </div>

                                <div className="pt-10 flex flex-wrap gap-6">
                                    {[
                                        { icon: Code, label: "Core Architect" },
                                        { icon: Cpu, label: "System Design" },
                                        { icon: ShieldCheck, label: "Escrow Logic" }
                                    ].map((feat, i) => (
                                        <div key={i} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl transition-colors hover:border-yellow-400/30">
                                            <feat.icon className="w-4 h-4 text-yellow-400" />
                                            <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">{feat.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </FadeIn>
                        </div>
                    </div>
                </div>

                {/* Our Values / Grid Boxes */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {[
                        {
                            icon: ShieldCheck,
                            title: "Zero-Risk Protocol",
                            desc: "Funds are verified and held in escrow instantly. No fake bids. No payment delays.",
                            color: "group-hover:text-green-400",
                            bg: "bg-green-500/5"
                        },
                        {
                            icon: Trophy,
                            title: "Verified Excellence",
                            desc: "Only elite sellers with proven track records can list items. Every item is hand-vetted.",
                            color: "group-hover:text-yellow-400",
                            bg: "bg-yellow-500/5"
                        },
                        {
                            icon: MessageSquare,
                            title: "Direct Support",
                            desc: "Our concierge team is available 24/7 to facilitate high-value deliveries and disputes.",
                            color: "group-hover:text-blue-400",
                            bg: "bg-blue-500/5"
                        }
                    ].map((value, i) => (
                        <FadeIn key={i} delay={0.1 * i}>
                            <div className={`group h-full p-10 bg-zinc-900/40 border border-white/10 rounded-[2.5rem] hover:bg-zinc-900/60 hover:border-white/20 transition-all duration-500 relative overflow-hidden`}>
                                <div className={`absolute top-0 right-0 w-32 h-32 ${value.bg} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`} />
                                <div className="w-14 h-14 bg-white/5 rounded-2xl flex items-center justify-center mb-8 border border-white/10 group-hover:scale-110 transition-transform duration-500">
                                    <value.icon className={`w-7 h-7 text-gray-400 transition-colors duration-500 ${value.color}`} />
                                </div>
                                <h3 className="text-2xl font-black text-white mb-4 tracking-tight">{value.title}</h3>
                                <p className="text-gray-500 leading-relaxed font-medium">
                                    {value.desc}
                                </p>
                            </div>
                        </FadeIn>
                    ))}
                </div>

                {/* CTA Box */}
                <FadeIn delay={0.4}>
                    <div className="mt-32 p-12 md:p-20 bg-gradient-to-br from-yellow-400/20 to-zinc-950 border border-yellow-400/20 rounded-[4rem] text-center relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-400/10 via-transparent to-transparent opacity-50" />
                        <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-8 relative z-10">
                            READY TO OWN <br /> THE EXTRAORDINARY?
                        </h2>
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 relative z-10">
                            <Link href="/auth" className="w-full sm:w-auto px-10 py-5 bg-yellow-400 text-black font-black uppercase tracking-wider rounded-2xl hover:scale-105 transition-all shadow-2xl">
                                Join Now
                            </Link>
                            <Link href="/search" className="w-full sm:w-auto px-10 py-5 bg-white/5 border border-white/10 text-white font-black uppercase tracking-wider rounded-2xl hover:bg-white/10 transition-all">
                                Explore Live
                            </Link>
                        </div>
                    </div>
                </FadeIn>
            </div>
        </div>
    );
}

